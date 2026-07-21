import type { Attributes, Character, EncounterNode, EncounterOption } from './types.js';
import { getEncounterNode } from './data/encounters.js';
import { clamp } from './rules.js';
import { addToInventory } from './loadout.js';

function addAttr(a: Attributes, d: Partial<Attributes>): Attributes {
  return {
    gen: a.gen + (d.gen ?? 0),
    wu: a.wu + (d.wu ?? 0),
    shen: a.shen + (d.shen ?? 0),
    nei: a.nei + (d.nei ?? 0),
  };
}

/** 一次奇遇選擇的結算輸出。 */
export interface EncounterOutcome {
  character: Character;
  text: string;
  /** 下一步：進入下個節點 / 結束 / 觸發戰鬥 */
  nextNodeId: string | null;
  battleEnemyId: string | null;
}

/** 某選項在當前角色狀態下是否可選（資源足夠）。 */
export function canChoose(char: Character, opt: EncounterOption): boolean {
  if (opt.reqSilver !== undefined && char.silver < opt.reqSilver) return false;
  if (opt.reqLevel !== undefined && char.level < opt.reqLevel) return false;
  return true;
}

/**
 * 解析玩家在某節點選了第 index 個選項。純函式。
 * 不足資源的選項被拒（throw）。回傳結算後角色與後續走向。
 */
export function resolveEncounter(char: Character, node: EncounterNode, optionIndex: number): EncounterOutcome {
  const opt = node.options[optionIndex];
  if (!opt) throw new Error('無效的選項');
  if (!canChoose(char, opt)) throw new Error('條件不足，無法選擇');

  const r = opt.result;
  switch (r.kind) {
    case 'reward': {
      let c = char;
      if (r.silver) c = { ...c, silver: Math.max(0, c.silver + r.silver) };
      if (r.fame) c = { ...c, fame: c.fame + r.fame };
      if (r.stamina) c = { ...c, stamina: clamp(c.stamina + r.stamina, 0, c.maxStamina) };
      if (r.attr) {
        const attrs = addAttr(c.attrs, r.attr);
        const maxHp = 20 + attrs.gen * 5;
        c = { ...c, attrs, maxHp, hp: clamp(c.hp, 0, maxHp) };
      }
      if (r.itemId) c = addToInventory(c, r.itemId);
      return { character: c, text: r.text, nextNodeId: null, battleEnemyId: null };
    }
    case 'next': {
      // 指向不存在的節點 → 安全結束（Edge Case）
      const exists = getEncounterNode(r.nodeId);
      if (!exists) {
        return { character: char, text: '故事戛然而止。', nextNodeId: null, battleEnemyId: null };
      }
      return { character: char, text: '', nextNodeId: r.nodeId, battleEnemyId: null };
    }
    case 'battle': {
      return { character: char, text: r.text, nextNodeId: null, battleEnemyId: r.enemyId };
    }
    case 'end':
    default:
      return { character: char, text: r.kind === 'end' ? r.text : '', nextNodeId: null, battleEnemyId: null };
  }
}
