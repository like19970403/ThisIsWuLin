import { describe, it, expect } from 'vitest';
import { buyConsumable, addConsumable, useConsumable } from './loadout.js';
import { createCharacter } from './rules.js';
import { getSect } from './data/sects.js';
import { getConsumable } from './data/consumables.js';
import type { Character } from './types.js';

const shaolin = getSect('shaolin')!;
const rich = (): Character => ({ ...createCharacter('王林', shaolin), silver: 5000 });

describe('消耗品：購買/獲得', () => {
  it('購買扣銀兩、數量+1', () => {
    const c = rich();
    const after = buyConsumable(c, 'pill_hp');
    expect(after.silver).toBe(c.silver - getConsumable('pill_hp')!.price);
    expect(after.consumables['pill_hp']).toBe(1);
  });

  it('重複購買數量累加', () => {
    let c = rich();
    c = buyConsumable(c, 'pill_hp');
    c = buyConsumable(c, 'pill_hp');
    expect(c.consumables['pill_hp']).toBe(2);
  });

  it('銀兩不足拒絕', () => {
    const poor: Character = { ...rich(), silver: 0 };
    expect(() => buyConsumable(poor, 'pill_hp')).toThrow('銀兩不足');
  });

  it('addConsumable 直接獲得不扣銀兩', () => {
    const c = addConsumable(rich(), 'wine', 2);
    expect(c.consumables['wine']).toBe(2);
  });
});

describe('消耗品：使用', () => {
  it('回氣血類即時生效，數量-1', () => {
    let c: Character = { ...rich(), hp: 10, maxHp: 100 };
    c = addConsumable(c, 'pill_hp'); // heal hp 30
    c = useConsumable(c, 'pill_hp');
    expect(c.hp).toBe(40);
    expect(c.consumables['pill_hp']).toBeUndefined(); // 用完移除
  });

  it('回氣血不超過上限', () => {
    let c: Character = { ...rich(), hp: 95, maxHp: 100 };
    c = addConsumable(c, 'pill_hp'); // +30
    c = useConsumable(c, 'pill_hp');
    expect(c.hp).toBe(100);
  });

  it('回體力類生效', () => {
    let c: Character = { ...rich(), stamina: 10, maxStamina: 100 };
    c = addConsumable(c, 'wine'); // stamina 60
    c = useConsumable(c, 'wine');
    expect(c.stamina).toBe(70);
  });

  it('永久加屬性類：屬性提升且重算 maxHp（人參加根骨）', () => {
    let c = rich();
    const genBefore = c.attrs.gen;
    const maxHpBefore = c.maxHp;
    c = addConsumable(c, 'ginseng'); // gen +3
    c = useConsumable(c, 'ginseng');
    expect(c.attrs.gen).toBe(genBefore + 3);
    expect(c.maxHp).toBe(maxHpBefore + 15); // 3*5
  });

  it('數量>1 時使用後遞減而非移除', () => {
    let c = addConsumable(rich(), 'pill_hp', 3);
    c = useConsumable(c, 'pill_hp');
    expect(c.consumables['pill_hp']).toBe(2);
  });

  it('數量為 0 或不存在時拒絕（Edge Case）', () => {
    expect(() => useConsumable(rich(), 'pill_hp')).toThrow('沒有這個物品');
    const zero: Character = { ...rich(), consumables: { pill_hp: 0 } };
    expect(() => useConsumable(zero, 'pill_hp')).toThrow();
  });

  it('查無此物拒絕', () => {
    const c: Character = { ...rich(), consumables: { ghost: 1 } };
    expect(() => useConsumable(c, 'ghost')).toThrow('查無此物');
  });

  it('純函式：不改動原角色', () => {
    const c = addConsumable(rich(), 'pill_hp');
    const snap = JSON.stringify(c);
    useConsumable(c, 'pill_hp');
    expect(JSON.stringify(c)).toBe(snap);
  });
});
