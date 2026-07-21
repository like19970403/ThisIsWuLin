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
} from '../core/index.js';

/** 存檔 schema 版本 —— 版本不符時拒絕載入（SPEC-001 Edge Case）。 */
export const SAVE_VERSION = 1;

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

      exportSave: () => {
        const { version, character, log } = get();
        return JSON.stringify({ version, character, log }, null, 2);
      },

      importSave: (json) => {
        try {
          const data = JSON.parse(json) as Partial<GameState>;
          if (data.version !== SAVE_VERSION) {
            set({ notice: `存檔版本不符（需 v${SAVE_VERSION}），未載入。` });
            return false;
          }
          if (!data.character || typeof data.character.name !== 'string') {
            set({ notice: '存檔格式錯誤，未載入。' });
            return false;
          }
          set({
            version: SAVE_VERSION,
            character: data.character,
            log: Array.isArray(data.log) ? data.log : [],
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
