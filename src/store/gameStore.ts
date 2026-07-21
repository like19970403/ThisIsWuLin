import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type Character,
  type Narrator,
  createCharacter,
  getSect,
  doTrain,
  doRest,
  doRoam,
  narrateTurn,
  mathRng,
  TRAIN_STAMINA_COST,
  ROAM_STAMINA_COST,
  TemplateNarrator,
  SAVE_VERSION,
  migrateCharacter,
  learnSkill,
  equipSkill,
  unequipSkill,
  equipItem,
  unequipItem,
  buyItem,
  type EquipSlot,
} from '../core/index.js';

export { SAVE_VERSION };

export interface LogEntry {
  id: number;
  /** 給玩家看的敘事文字（由 Narrator 產生） */
  text: string;
  /** 結構化結果摘要（永遠可用，不依賴 Narrator） */
  summary: string;
}

interface GameState {
  version: number;
  character: Character | null;
  log: LogEntry[];
  /** 行動處理中 → 用來 disable 按鈕，避免連點重複結算（Edge Case） */
  busy: boolean;
  /** 一次性提示訊息（體力不足、匯入失敗等） */
  notice: string | null;
  /** 目前開啟的商店可購買裝備 id（null = 未開商店）（Phase 2） */
  shopItems: string[] | null;
}

interface GameActions {
  createCharacter: (name: string, sectId: string) => boolean;
  train: () => Promise<void>;
  roam: () => Promise<void>;
  rest: () => void;
  clearNotice: () => void;
  exportSave: () => string;
  importSave: (json: string) => boolean;
  resetGame: () => void;
  /** 可否執行需要體力的行動 */
  canAct: (cost: number) => boolean;
  // ─── Phase 2 ───
  learn: (skillId: string) => void;
  toggleSkill: (skillId: string) => void;
  equip: (itemId: string) => void;
  unequip: (slot: EquipSlot) => void;
  buy: (itemId: string) => void;
  closeShop: () => void;
}

/** 共用：套用一個可能 throw 的角色變換，失敗轉 notice。 */
function tryMutate(
  set: (p: Partial<GameState>) => void,
  get: () => GameState & GameActions,
  fn: (c: Character) => Character,
): void {
  const c = get().character;
  if (!c) return;
  try {
    set({ character: fn(c), notice: null });
  } catch (e) {
    set({ notice: e instanceof Error ? e.message : '操作失敗。' });
  }
}

// Narrator 為模組層級可替換依賴（ADR-001：可插拔）。
// Phase 1 固定 TemplateNarrator；Phase 3 只需在此換成 ClaudeNarrator。
let narrator: Narrator = new TemplateNarrator();
export function setNarrator(n: Narrator): void {
  narrator = n;
}

let logCounter = 0;
function nextLogId(): number {
  logCounter += 1;
  return logCounter;
}

const MAX_LOG = 50;

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      version: SAVE_VERSION,
      character: null,
      log: [],
      busy: false,
      notice: null,
      shopItems: null,

      canAct: (cost: number) => {
        const c = get().character;
        return !!c && !get().busy && c.stamina >= cost;
      },

      createCharacter: (name, sectId) => {
        const sect = getSect(sectId);
        if (!sect) {
          set({ notice: '請選擇一個門派。' });
          return false;
        }
        try {
          const character = createCharacter(name, sect);
          set({
            character,
            version: SAVE_VERSION,
            log: [
              {
                id: nextLogId(),
                text: `${character.name}拜入${sect.name}，江湖路自此展開。`,
                summary: '角色建立完成。',
              },
            ],
            notice: null,
          });
          return true;
        } catch (e) {
          set({ notice: e instanceof Error ? e.message : '建立角色失敗。' });
          return false;
        }
      },

      train: async () => {
        const c = get().character;
        if (!c) return;
        if (c.stamina < TRAIN_STAMINA_COST) {
          set({ notice: '體力不足，先歇息片刻吧。' });
          return;
        }
        if (get().busy) return;
        set({ busy: true });
        try {
          const result = doTrain(c, mathRng);
          const text = await narrateTurn(result, narrator);
          appendTurn(set, get, result.character, text, result.log);
        } finally {
          set({ busy: false });
        }
      },

      roam: async () => {
        const c = get().character;
        if (!c) return;
        if (c.stamina < ROAM_STAMINA_COST) {
          set({ notice: '體力不足，無法闖蕩江湖。' });
          return;
        }
        if (get().busy) return;
        set({ busy: true });
        try {
          const result = doRoam(c, mathRng);
          const text = await narrateTurn(result, narrator);
          appendTurn(set, get, result.character, text, result.log);
          // 觸發商店事件 → 開啟商店供玩家採買
          if (result.shopItemIds && result.shopItemIds.length > 0) {
            set({ shopItems: result.shopItemIds });
          }
        } finally {
          set({ busy: false });
        }
      },

      rest: () => {
        const c = get().character;
        if (!c || get().busy) return;
        const result = doRest(c);
        appendTurn(set, get, result.character, result.scene.event.summary, result.log);
      },

      clearNotice: () => set({ notice: null }),

      learn: (skillId) => tryMutate(set, get, (c) => learnSkill(c, skillId)),
      toggleSkill: (skillId) =>
        tryMutate(set, get, (c) =>
          c.equippedSkillIds.includes(skillId) ? unequipSkill(c, skillId) : equipSkill(c, skillId),
        ),
      equip: (itemId) => tryMutate(set, get, (c) => equipItem(c, itemId)),
      unequip: (slot) => tryMutate(set, get, (c) => unequipItem(c, slot)),
      buy: (itemId) => tryMutate(set, get, (c) => buyItem(c, itemId)),
      closeShop: () => set({ shopItems: null }),

      exportSave: () => {
        const { version, character, log } = get();
        return JSON.stringify({ version, character, log }, null, 2);
      },

      importSave: (json) => {
        try {
          const data = JSON.parse(json) as { version?: number; character?: unknown; log?: unknown };
          // 更高版本（未來格式）無法識別 → 拒絕，避免資料遺失
          if (typeof data.version === 'number' && data.version > SAVE_VERSION) {
            set({ notice: `存檔版本較新（v${data.version}），此版本無法讀取。` });
            return false;
          }
          // 舊版或當前版：一律經遷移補齊欄位（SPEC-002）
          const migrated = migrateCharacter(data.character);
          if (!migrated) {
            set({ notice: '存檔格式錯誤，未載入。' });
            return false;
          }
          set({
            version: SAVE_VERSION,
            character: migrated,
            log: Array.isArray(data.log) ? (data.log as LogEntry[]) : [],
            notice: '存檔已載入。',
          });
          return true;
        } catch {
          set({ notice: '存檔解析失敗，未載入。' });
          return false;
        }
      },

      resetGame: () => set({ character: null, log: [], notice: null, busy: false }),
    }),
    {
      name: 'wulin-save-v1',
      version: SAVE_VERSION,
      partialize: (s) => ({ version: s.version, character: s.character, log: s.log }),
      // localStorage 中的舊版存檔（含 Phase 1 的 v1）在 rehydrate 時自動遷移補欄位。
      migrate: (persisted: unknown) => {
        const p = (persisted ?? {}) as { character?: unknown; log?: unknown };
        return {
          version: SAVE_VERSION,
          character: migrateCharacter(p.character),
          log: Array.isArray(p.log) ? (p.log as LogEntry[]) : [],
        } as Partial<GameState>;
      },
    },
  ),
);

/** 共用：套用回合結果 + append 日誌（截斷至 MAX_LOG）。 */
function appendTurn(
  set: (partial: Partial<GameState>) => void,
  get: () => GameState,
  character: Character,
  text: string,
  summary: string,
): void {
  const entry: LogEntry = { id: nextLogId(), text, summary };
  const log = [entry, ...get().log].slice(0, MAX_LOG);
  set({ character, log });
}
