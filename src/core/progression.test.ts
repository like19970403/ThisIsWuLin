import { describe, it, expect } from 'vitest';
import { gainExp, expToNext, migrateCharacter, SAVE_VERSION, MAX_LEVEL } from './progression.js';
import { createCharacter } from './rules.js';
import { getSect } from './data/sects.js';
import type { Character } from './types.js';

const shaolin = getSect('shaolin')!;
const newChar = () => createCharacter('王林', shaolin);

describe('expToNext', () => {
  it('隨等級遞增', () => {
    expect(expToNext(1)).toBe(20);
    expect(expToNext(2)).toBeGreaterThan(expToNext(1));
  });
});

describe('gainExp', () => {
  it('經驗不足不升級', () => {
    const r = gainExp(newChar(), 5);
    expect(r.levelsGained).toBe(0);
    expect(r.character.level).toBe(1);
    expect(r.character.exp).toBe(5);
  });

  it('剛好達門檻升一級，屬性與氣血上限提升', () => {
    const c = newChar();
    const r = gainExp(c, expToNext(1));
    expect(r.levelsGained).toBe(1);
    expect(r.character.level).toBe(2);
    expect(r.character.attrs.gen).toBe(c.attrs.gen + 1);
    expect(r.character.maxHp).toBeGreaterThan(c.maxHp);
    expect(r.character.hp).toBe(r.character.maxHp); // 升級回滿
  });

  it('大量經驗可連升多級', () => {
    const r = gainExp(newChar(), 1000);
    expect(r.levelsGained).toBeGreaterThan(1);
    expect(r.character.level).toBeGreaterThan(2);
  });

  it('滿級後經驗封頂不溢出', () => {
    let c: Character = { ...newChar(), level: MAX_LEVEL };
    const r = gainExp(c, 99999);
    expect(r.character.level).toBe(MAX_LEVEL);
    expect(r.character.exp).toBe(0);
    expect(r.levelsGained).toBe(0);
  });

  it('負經驗拋錯', () => {
    expect(() => gainExp(newChar(), -1)).toThrow();
  });

  it('純函式：不改動原角色', () => {
    const c = newChar();
    const snapshot = JSON.stringify(c);
    gainExp(c, 100);
    expect(JSON.stringify(c)).toBe(snapshot);
  });
});

describe('migrateCharacter', () => {
  it('v1 存檔（無 Phase 2 欄位）補上預設', () => {
    const v1 = {
      name: '舊俠客',
      sectId: 'wudang',
      attrs: { gen: 8, wu: 6, shen: 7, nei: 9 },
      stamina: 50,
      maxStamina: 100,
      hp: 40,
      maxHp: 60,
      silver: 200,
      fame: 30,
    };
    const m = migrateCharacter(v1)!;
    expect(m.name).toBe('舊俠客');
    expect(m.silver).toBe(200); // 舊進度保留
    expect(m.level).toBe(1); // 新欄位補預設
    expect(m.exp).toBe(0);
    expect(m.learnedSkillIds).toEqual([]);
    expect(m.equipment).toEqual({ weapon: null, armor: null });
    expect(m.inventory).toEqual([]);
  });

  it('冪等：對已是 v2 的角色再遷移，資料不變', () => {
    const c: Character = {
      ...newChar(),
      level: 5,
      exp: 12,
      learnedSkillIds: ['s1'],
      equippedSkillIds: ['s1'],
      equipment: { weapon: 'w1', armor: null },
      inventory: ['w2'],
    };
    const once = migrateCharacter(c)!;
    const twice = migrateCharacter(once)!;
    expect(twice).toEqual(once);
    expect(twice.level).toBe(5);
    expect(twice.equipment.weapon).toBe('w1');
    expect(twice.learnedSkillIds).toEqual(['s1']);
  });

  it('損壞資料（非物件 / 缺 name）回 null（Edge Case）', () => {
    expect(migrateCharacter(null)).toBeNull();
    expect(migrateCharacter('壞')).toBeNull();
    expect(migrateCharacter({ sectId: 'x' })).toBeNull(); // 無 name
    expect(migrateCharacter({ name: 'x' })).toBeNull(); // 無 attrs
  });

  it('欄位型別錯誤時以預設值容錯', () => {
    const weird = {
      name: '怪',
      attrs: { gen: 'bad', wu: 5, shen: 5, nei: 5 },
      learnedSkillIds: 'not-array',
      level: 'NaN',
    };
    const m = migrateCharacter(weird)!;
    expect(m.attrs.gen).toBe(5); // bad → 預設
    expect(m.learnedSkillIds).toEqual([]); // 非陣列 → []
    expect(m.level).toBe(1); // 非數字 → 1
  });

  it('SAVE_VERSION 為 2', () => {
    expect(SAVE_VERSION).toBe(2);
  });
});
