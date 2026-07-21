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
  buyConsumable,
  useConsumable,
  checkTitles,
  getTitle,
  resolveEncounter,
  getEncounterNode,
  ENCOUNTER_STARTS,
  type EquipSlot,
  type EncounterNode,
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
  /** 進行中的奇遇節點（null = 無）（Phase 2b） */
  pendingEncounter: EncounterNode | null;
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
  // ─── Phase 2b ───
  buyConsumableItem: (itemId: string) => void;
  useConsumableItem: (itemId: string) => void;
  chooseEncounter: (optionIndex: number) => void;
  closeEncounter: () => void;
}

/** 共用：套用一個可能 throw 的角色變換，失敗轉 notice。變換後自動檢查稱號解鎖。 */
function tryMutate(
  set: (p: Partial<GameState>) => void,
  get: () => GameState & GameActions,
  fn: (c: Character) => Character,
): void {
  const c = get().character;
  if (!c) return;
  try {
    const { character, notice } = applyTitles(fn(c));
    set({ character, notice });
  } catch (e) {
    set({ notice: e instanceof Error ? e.message : '操作失敗。' });
  }
}

/** 套用角色變換後檢查稱號解鎖；有新稱號則產生提示。 */
function applyTitles(char: Character): { character: Character; notice: string | null } {
  const { character, newlyUnlocked } = checkTitles(char);
  if (newlyUnlocked.length === 0) return { character, notice: null };
  const names = newlyUnlocked.map((id) => getTitle(id)?.name ?? id).join('、');
  return { character, notice: `獲得稱號：${names}！` };
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
      pendingEncounter: null,

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
          } else if (mathRng.next() < 0.18) {
            // 一定機率觸發奇遇連鎖劇情
            const startId = ENCOUNTER_STARTS[Math.floor(mathRng.next() * ENCOUNTER_STARTS.length)]!;
            const node = getEncounterNode(startId);
            if (node) set({ pendingEncounter: node });
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

      buyConsumableItem: (itemId) => tryMutate(set, get, (c) => buyConsumable(c, itemId)),
      useConsumableItem: (itemId) => tryMutate(set, get, (c) => useConsumable(c, itemId)),

      chooseEncounter: (optionIndex) => {
        const c = get().character;
        const node = get().pendingEncounter;
        if (!c || !node) return;
        try {
          const out = resolveEncounter(c, node, optionIndex);
          const { character } = applyTitles(out.character);
          // 決定後續：進下一節點 / 觸發戰鬥 / 結束
          if (out.nextNodeId) {
            const next = getEncounterNode(out.nextNodeId);
            set({ character, pendingEncounter: next ?? null });
            if (out.text) appendLog(set, get, out.text);
          } else if (out.battleEnemyId) {
            // 奇遇引發戰鬥：結束奇遇，記錄引言（戰鬥結算沿用 doRoam 太重，這裡簡化為敘事提示）
            set({ character, pendingEncounter: null });
            appendLog(set, get, out.text || '一場惡鬥就此展開。');
          } else {
            set({ character, pendingEncounter: null });
            if (out.text) appendLog(set, get, out.text);
          }
        } catch (e) {
          set({ notice: e instanceof Error ? e.message : '選擇失敗。' });
        }
      },
      closeEncounter: () => set({ pendingEncounter: null }),

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
  rawCharacter: Character,
  text: string,
  summary: string,
): void {
  // 回合結束後檢查稱號解鎖
  const { character, notice } = applyTitles(rawCharacter);
  const entry: LogEntry = { id: nextLogId(), text, summary };
  const log = [entry, ...get().log].slice(0, MAX_LOG);
  set({ character, log, ...(notice ? { notice } : {}) });
}

/** 只追加一條日誌，不改角色（奇遇敘事用）。 */
function appendLog(
  set: (partial: Partial<GameState>) => void,
  get: () => GameState,
  text: string,
): void {
  const entry: LogEntry = { id: nextLogId(), text, summary: text };
  set({ log: [entry, ...get().log].slice(0, MAX_LOG) });
}
