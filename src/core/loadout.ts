import type { Attributes, Character } from './types.js';
import { getSkill, MAX_EQUIPPED_SKILLS } from './data/skills.js';
import { getEquipItem } from './data/equipment.js';
import { getConsumable } from './data/consumables.js';
import { clamp } from './rules.js';

// ─── 功法 ───

/** 學習一門功法。純函式。失敗時 throw（呼叫端捕捉轉提示）。 */
export function learnSkill(char: Character, skillId: string): Character {
  const skill = getSkill(skillId);
  if (!skill) throw new Error('查無此功法');
  if (char.learnedSkillIds.includes(skillId)) throw new Error('已學會此功法');
  // 門派專屬：外派不可學（本派絕學不外傳）
  if (skill.sectId && skill.sectId !== char.sectId) {
    throw new Error('此乃他派絕學，無緣修習');
  }
  if (char.level < skill.reqLevel) throw new Error(`需達 ${skill.reqLevel} 級方可修習`);
  if (char.silver < skill.cost) throw new Error('銀兩不足');
  return {
    ...char,
    silver: char.silver - skill.cost,
    learnedSkillIds: [...char.learnedSkillIds, skillId],
  };
}

/** 裝備一門已學功法上陣。超過上限則 throw。 */
export function equipSkill(char: Character, skillId: string): Character {
  if (!char.learnedSkillIds.includes(skillId)) throw new Error('尚未學會此功法');
  if (char.equippedSkillIds.includes(skillId)) return char; // 已裝備，無操作
  if (char.equippedSkillIds.length >= MAX_EQUIPPED_SKILLS) {
    throw new Error(`最多裝備 ${MAX_EQUIPPED_SKILLS} 門功法`);
  }
  return { ...char, equippedSkillIds: [...char.equippedSkillIds, skillId] };
}

/** 卸下一門上陣功法。 */
export function unequipSkill(char: Character, skillId: string): Character {
  return { ...char, equippedSkillIds: char.equippedSkillIds.filter((id) => id !== skillId) };
}

/** 已裝備功法的總傷害倍率（戰鬥用）。 */
export function equippedDamageMultiplier(char: Character): number {
  return char.equippedSkillIds.reduce((sum, id) => sum + (getSkill(id)?.damageMultiplier ?? 0), 0);
}

// ─── 裝備 ───

/** 穿戴一件裝備（來自背包）。替換同欄位舊裝備並退回背包。純函式。 */
export function equipItem(char: Character, itemId: string): Character {
  const item = getEquipItem(itemId);
  if (!item) throw new Error('查無此裝備');
  if (!char.inventory.includes(itemId)) throw new Error('背包中無此裝備');

  const prev = char.equipment[item.slot];
  const inventory = char.inventory.filter((id) => id !== itemId);
  if (prev) inventory.push(prev); // 舊裝備退回背包

  return {
    ...char,
    equipment: { ...char.equipment, [item.slot]: itemId },
    inventory,
  };
}

/** 卸下某欄位裝備，退回背包。 */
export function unequipItem(char: Character, slot: 'weapon' | 'armor'): Character {
  const cur = char.equipment[slot];
  if (!cur) return char;
  return {
    ...char,
    equipment: { ...char.equipment, [slot]: null },
    inventory: [...char.inventory, cur],
  };
}

/** 取得一件裝備入背包（闖蕩掉落/購買後）。 */
export function addToInventory(char: Character, itemId: string): Character {
  return { ...char, inventory: [...char.inventory, itemId] };
}

/** 於商店購買裝備：扣銀兩、入背包。銀兩不足 throw。 */
export function buyItem(char: Character, itemId: string): Character {
  const item = getEquipItem(itemId);
  if (!item) throw new Error('查無此裝備');
  if (char.silver < item.price) throw new Error('銀兩不足');
  return { ...char, silver: char.silver - item.price, inventory: [...char.inventory, itemId] };
}

// ─── 消耗品（SPEC-003）───

/** 購買消耗品：扣銀兩、數量 +1。 */
export function buyConsumable(char: Character, itemId: string): Character {
  const item = getConsumable(itemId);
  if (!item) throw new Error('查無此物');
  if (char.silver < item.price) throw new Error('銀兩不足');
  return {
    ...char,
    silver: char.silver - item.price,
    consumables: { ...char.consumables, [itemId]: (char.consumables[itemId] ?? 0) + 1 },
  };
}

/** 直接獲得消耗品（掉落/獎勵），不扣銀兩。 */
export function addConsumable(char: Character, itemId: string, count = 1): Character {
  return {
    ...char,
    consumables: { ...char.consumables, [itemId]: (char.consumables[itemId] ?? 0) + count },
  };
}

function addPartialAttr(a: Attributes, d: Partial<Attributes>): Attributes {
  return {
    gen: a.gen + (d.gen ?? 0),
    wu: a.wu + (d.wu ?? 0),
    shen: a.shen + (d.shen ?? 0),
    nei: a.nei + (d.nei ?? 0),
  };
}

/**
 * 使用一個消耗品：套用效果、數量 -1（歸零則移除）。純函式。
 * heal：即時回氣血/體力（clamp 上限）；permanentAttr：永久加屬性（重算 maxHp）。
 */
export function useConsumable(char: Character, itemId: string): Character {
  const item = getConsumable(itemId);
  if (!item) throw new Error('查無此物');
  const count = char.consumables[itemId] ?? 0;
  if (count <= 0) throw new Error('沒有這個物品');

  // 先扣數量
  const consumables = { ...char.consumables };
  if (count - 1 <= 0) delete consumables[itemId];
  else consumables[itemId] = count - 1;

  let c: Character = { ...char, consumables };

  if (item.effect.kind === 'heal') {
    if (item.effect.hp) c = { ...c, hp: clamp(c.hp + item.effect.hp, 0, c.maxHp) };
    if (item.effect.stamina) c = { ...c, stamina: clamp(c.stamina + item.effect.stamina, 0, c.maxStamina) };
  } else {
    // permanentAttr：加屬性；若動到根骨則重算 maxHp 並補滿差額
    const attrs = addPartialAttr(c.attrs, item.effect.attr);
    const maxHp = 20 + attrs.gen * 5;
    const hpGain = maxHp - c.maxHp;
    c = { ...c, attrs, maxHp, hp: clamp(c.hp + Math.max(0, hpGain), 0, maxHp) };
  }
  return c;
}

// ─── 有效屬性（基礎 + 功法被動 + 裝備加成）───

function addPartial(base: Attributes, delta: Partial<Attributes>): Attributes {
  return {
    gen: base.gen + (delta.gen ?? 0),
    wu: base.wu + (delta.wu ?? 0),
    shen: base.shen + (delta.shen ?? 0),
    nei: base.nei + (delta.nei ?? 0),
  };
}

/**
 * 計算角色的「有效屬性」＝ 基礎屬性 + 已裝備功法被動 + 穿戴裝備加成。
 * 戰鬥與戰力展示都用這個，而非 raw attrs。
 */
export function effectiveAttrs(char: Character): Attributes {
  let a = { ...char.attrs };
  for (const id of char.equippedSkillIds) {
    const s = getSkill(id);
    if (s) a = addPartial(a, s.passive);
  }
  for (const slot of ['weapon', 'armor'] as const) {
    const eid = char.equipment[slot];
    if (eid) {
      const item = getEquipItem(eid);
      if (item) a = addPartial(a, item.bonus);
    }
  }
  return a;
}
