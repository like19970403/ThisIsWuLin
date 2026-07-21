import type { Character } from './types.js';
import { clamp } from './rules.js';
import { TITLE_CONDITIONS } from './data/titles.js';

/** 存檔 schema 版本。1→2（Phase 2 成長）→3（Phase 2b 消耗品/稱號）。 */
export const SAVE_VERSION = 3;

export const MAX_LEVEL = 30;

/** 升到「下一級」所需經驗：隨等級遞增。 */
export function expToNext(level: number): number {
  return 20 + (level - 1) * 15;
}

export interface LevelUpResult {
  character: Character;
  /** 這次獲得經驗後升了幾級（可能連升） */
  levelsGained: number;
}

/**
 * 獲得經驗並結算升級（可連升多級）。純函式。
 * 每升一級：屬性上限微幅提升（各 +1）、氣血上限提升、回滿氣血與體力。
 */
export function gainExp(char: Character, amount: number): LevelUpResult {
  if (amount < 0) throw new Error('經驗不可為負');
  let c: Character = { ...char, exp: char.exp + amount };
  let levelsGained = 0;

  while (c.level < MAX_LEVEL && c.exp >= expToNext(c.level)) {
    c = applyLevelUp({ ...c, exp: c.exp - expToNext(c.level) });
    levelsGained += 1;
  }

  // 已滿級：經驗封頂，不再累積溢出
  if (c.level >= MAX_LEVEL) {
    c = { ...c, exp: 0 };
  }
  return { character: c, levelsGained };
}

function applyLevelUp(char: Character): Character {
  const attrs = {
    gen: char.attrs.gen + 1,
    wu: char.attrs.wu + 1,
    shen: char.attrs.shen + 1,
    nei: char.attrs.nei + 1,
  };
  const maxHp = 20 + attrs.gen * 5;
  return {
    ...char,
    level: char.level + 1,
    attrs,
    maxHp,
    hp: maxHp, // 升級回滿
    stamina: char.maxStamina,
  };
}

/**
 * 把任意版本的存檔角色物件遷移到當前 schema。
 * 只「補欄位」不刪除既有欄位（SPEC-002 Rollback：確保回滾後舊版仍可讀）。
 * 冪等：對已是 v2 的資料重跑不改變結果。
 */
export function migrateCharacter(raw: unknown): Character | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  // 最低限度合法性：必須有 name 與 attrs
  if (typeof r.name !== 'string' || typeof r.attrs !== 'object' || r.attrs === null) {
    return null;
  }

  const attrs = r.attrs as Character['attrs'];
  const maxStamina = numOr(r.maxStamina, 100);
  const maxHp = numOr(r.maxHp, 20 + numOr(attrs.gen, 5) * 5);

  return {
    name: r.name,
    sectId: typeof r.sectId === 'string' ? r.sectId : '',
    attrs: {
      gen: numOr(attrs.gen, 5),
      wu: numOr(attrs.wu, 5),
      shen: numOr(attrs.shen, 5),
      nei: numOr(attrs.nei, 5),
    },
    stamina: clamp(numOr(r.stamina, maxStamina), 0, maxStamina),
    maxStamina,
    hp: clamp(numOr(r.hp, maxHp), 0, maxHp),
    maxHp,
    silver: numOr(r.silver, 0),
    fame: numOr(r.fame, 0),
    // Phase 2 欄位：v1 存檔沒有 → 補預設；v2 存檔已有 → 沿用（冪等）
    level: numOr(r.level, 1),
    exp: numOr(r.exp, 0),
    learnedSkillIds: strArr(r.learnedSkillIds),
    equippedSkillIds: strArr(r.equippedSkillIds),
    equipment: migrateEquipment(r.equipment),
    inventory: strArr(r.inventory),
    // v3 欄位：v1/v2 存檔沒有 → 補預設；v3 已有 → 沿用（冪等）
    consumables: migrateConsumables(r.consumables),
    titles: strArr(r.titles),
  };
}

/**
 * 檢查並解鎖達成條件的稱號。純函式、冪等（已解鎖的不重複加）。
 * 回傳新角色 + 這次新解鎖的稱號 id 陣列（供提示）。
 */
export function checkTitles(char: Character): { character: Character; newlyUnlocked: string[] } {
  const newlyUnlocked: string[] = [];
  for (const [id, cond] of Object.entries(TITLE_CONDITIONS)) {
    if (!char.titles.includes(id) && cond(char)) {
      newlyUnlocked.push(id);
    }
  }
  if (newlyUnlocked.length === 0) return { character: char, newlyUnlocked };
  return { character: { ...char, titles: [...char.titles, ...newlyUnlocked] }, newlyUnlocked };
}

function migrateConsumables(v: unknown): Record<string, number> {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const out: Record<string, number> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === 'number' && Number.isFinite(val) && val > 0) out[k] = Math.floor(val);
    }
    return out;
  }
  return {};
}

function numOr(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function migrateEquipment(v: unknown): Character['equipment'] {
  if (v && typeof v === 'object') {
    const e = v as Record<string, unknown>;
    return {
      weapon: typeof e.weapon === 'string' ? e.weapon : null,
      armor: typeof e.armor === 'string' ? e.armor : null,
    };
  }
  return { weapon: null, armor: null };
}
