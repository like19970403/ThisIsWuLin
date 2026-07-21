import { describe, it, expect } from 'vitest';
import {
  learnSkill,
  equipSkill,
  unequipSkill,
  equippedDamageMultiplier,
  equipItem,
  unequipItem,
  addToInventory,
  buyItem,
  effectiveAttrs,
} from './loadout.js';
import { createCharacter, resolveBattle } from './rules.js';
import { getSect } from './data/sects.js';
import { getSkill, MAX_EQUIPPED_SKILLS } from './data/skills.js';
import { getEquipItem } from './data/equipment.js';
import { getEnemy } from './data/enemies.js';
import { seededRng } from './rng.js';
import type { Character } from './types.js';

const shaolin = getSect('shaolin')!;
const rich = (): Character => ({ ...createCharacter('王林', shaolin), silver: 10000, level: 10 });

describe('功法：學習', () => {
  it('學會後扣銀兩、加入已學清單', () => {
    const c = rich();
    const skill = getSkill('basic_fist')!;
    const after = learnSkill(c, 'basic_fist');
    expect(after.learnedSkillIds).toContain('basic_fist');
    expect(after.silver).toBe(c.silver - skill.cost);
  });

  it('等級不足拒絕', () => {
    const low: Character = { ...rich(), level: 1 };
    expect(() => learnSkill(low, 'plum_palm')).toThrow('級'); // reqLevel 5
  });

  it('銀兩不足拒絕且不扣資源', () => {
    const poor: Character = { ...rich(), silver: 0 };
    expect(() => learnSkill(poor, 'basic_fist')).toThrow('銀兩不足');
  });

  it('重複學習拒絕', () => {
    const c = learnSkill(rich(), 'basic_fist');
    expect(() => learnSkill(c, 'basic_fist')).toThrow('已學會');
  });

  it('查無功法拒絕', () => {
    expect(() => learnSkill(rich(), 'ghost_skill')).toThrow();
  });
});

describe('功法：裝備', () => {
  it('裝備已學功法', () => {
    let c = learnSkill(rich(), 'basic_fist');
    c = equipSkill(c, 'basic_fist');
    expect(c.equippedSkillIds).toContain('basic_fist');
  });

  it('未學不可裝備', () => {
    expect(() => equipSkill(rich(), 'basic_fist')).toThrow('尚未學會');
  });

  it('裝備數超過上限拒絕', () => {
    let c = rich();
    const ids = ['basic_fist', 'swift_blade', 'iron_body', 'inner_flow'];
    for (const id of ids) c = learnSkill(c, id);
    c = equipSkill(c, ids[0]!);
    c = equipSkill(c, ids[1]!);
    c = equipSkill(c, ids[2]!);
    expect(c.equippedSkillIds.length).toBe(MAX_EQUIPPED_SKILLS);
    expect(() => equipSkill(c, ids[3]!)).toThrow('最多');
  });

  it('卸下功法', () => {
    let c = equipSkill(learnSkill(rich(), 'basic_fist'), 'basic_fist');
    c = unequipSkill(c, 'basic_fist');
    expect(c.equippedSkillIds).not.toContain('basic_fist');
  });

  it('傷害倍率為已裝備功法之和', () => {
    let c = rich();
    c = equipSkill(learnSkill(c, 'plum_palm'), 'plum_palm');
    expect(equippedDamageMultiplier(c)).toBe(getSkill('plum_palm')!.damageMultiplier);
  });
});

describe('裝備：穿戴', () => {
  it('穿戴後屬性提升、背包移除', () => {
    let c = addToInventory(rich(), 'iron_sword');
    c = equipItem(c, 'iron_sword');
    expect(c.equipment.weapon).toBe('iron_sword');
    expect(c.inventory).not.toContain('iron_sword');
    const eff = effectiveAttrs(c);
    expect(eff.nei).toBe(c.attrs.nei + getEquipItem('iron_sword')!.bonus.nei!);
  });

  it('替換同欄位裝備，舊裝備退回背包', () => {
    let c = addToInventory(addToInventory(rich(), 'wooden_sword'), 'iron_sword');
    c = equipItem(c, 'wooden_sword');
    c = equipItem(c, 'iron_sword');
    expect(c.equipment.weapon).toBe('iron_sword');
    expect(c.inventory).toContain('wooden_sword'); // 舊的退回
  });

  it('卸下裝備退回背包', () => {
    let c = equipItem(addToInventory(rich(), 'iron_sword'), 'iron_sword');
    c = unequipItem(c, 'weapon');
    expect(c.equipment.weapon).toBeNull();
    expect(c.inventory).toContain('iron_sword');
  });

  it('背包中無此裝備拒絕', () => {
    expect(() => equipItem(rich(), 'iron_sword')).toThrow('背包');
  });
});

describe('商店：購買', () => {
  it('購買扣銀兩、入背包', () => {
    const c = rich();
    const after = buyItem(c, 'iron_sword');
    expect(after.silver).toBe(c.silver - getEquipItem('iron_sword')!.price);
    expect(after.inventory).toContain('iron_sword');
  });

  it('銀兩不足拒絕（Done When）', () => {
    const poor: Character = { ...rich(), silver: 0 };
    expect(() => buyItem(poor, 'iron_sword')).toThrow('銀兩不足');
  });
});

describe('effectiveAttrs：功法+裝備疊加', () => {
  it('基礎 + 功法被動 + 裝備加成', () => {
    let c = rich();
    c = equipSkill(learnSkill(c, 'iron_body'), 'iron_body'); // gen +5
    c = equipItem(addToInventory(c, 'leather_armor'), 'leather_armor'); // gen +3
    const eff = effectiveAttrs(c);
    expect(eff.gen).toBe(c.attrs.gen + 5 + 3);
  });

  it('移除過的裝備 id 不 crash（Edge Case）', () => {
    const c: Character = { ...rich(), equipment: { weapon: 'nonexistent', armor: null } };
    expect(() => effectiveAttrs(c)).not.toThrow();
    expect(effectiveAttrs(c).nei).toBe(c.attrs.nei); // 無效裝備不加成
  });
});

describe('戰鬥納入功法（Done When：有功法 vs 無功法結果不同）', () => {
  it('裝備高倍率功法後傷害更高', () => {
    const bandit = getEnemy('bandit')!;
    const base: Character = { ...rich(), hp: 100, maxHp: 100 };

    const noSkill = resolveBattle(base, bandit, seededRng(5), {
      playerAttrs: effectiveAttrs(base),
      skillMultiplier: equippedDamageMultiplier(base),
    });

    const withSkill = equipSkill(learnSkill(base, 'plum_palm'), 'plum_palm');
    const withSkillResult = resolveBattle(withSkill, bandit, seededRng(5), {
      playerAttrs: effectiveAttrs(withSkill),
      skillMultiplier: equippedDamageMultiplier(withSkill),
    });

    // 有落梅神掌時，玩家首次攻擊傷害應更高
    const noSkillFirstHit = noSkill.rounds.find((r) => r.attacker === 'player')!.damage;
    const withSkillFirstHit = withSkillResult.rounds.find((r) => r.attacker === 'player')!.damage;
    expect(withSkillFirstHit).toBeGreaterThan(noSkillFirstHit);
  });
});
