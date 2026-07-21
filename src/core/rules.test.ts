import { describe, it, expect } from 'vitest';
import {
  clamp,
  createCharacter,
  train,
  rest,
  resolveBattle,
  combatPower,
  pickEvent,
  TRAIN_STAMINA_COST,
} from './rules.js';
import { fixedRng, seededRng } from './rng.js';
import { getSect } from './data/sects.js';
import { getEnemy } from './data/enemies.js';
import { EVENTS } from './data/events.js';
import type { Character, Enemy } from './types.js';

const shaolin = getSect('shaolin')!;

describe('clamp', () => {
  it('收斂到區間內', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe('createCharacter', () => {
  it('套用門派加成', () => {
    const c = createCharacter('王林', shaolin);
    // 基礎 gen 5 + 少林 +3 = 8
    expect(c.attrs.gen).toBe(8);
    expect(c.attrs.nei).toBe(6); // 5 + 1
    expect(c.name).toBe('王林');
    expect(c.sectId).toBe('shaolin');
    expect(c.stamina).toBe(c.maxStamina);
    expect(c.hp).toBe(c.maxHp);
  });

  it('氣血由根骨決定', () => {
    const c = createCharacter('測試', shaolin);
    expect(c.maxHp).toBe(20 + c.attrs.gen * 5);
  });

  it('拒絕空白姓名（SPEC Edge Case）', () => {
    expect(() => createCharacter('   ', shaolin)).toThrow();
    expect(() => createCharacter('', shaolin)).toThrow();
  });

  it('姓名前後空白會被 trim', () => {
    expect(createCharacter('  王林  ', shaolin).name).toBe('王林');
  });
});

describe('train', () => {
  it('消耗體力並提升一項屬性', () => {
    const c = createCharacter('王林', shaolin);
    // fixedRng 回 0 → randInt(0,3) 命中第 0 項 gen
    const { character, gainedAttr, gain } = train(c, fixedRng([0]));
    expect(gainedAttr).toBe('gen');
    expect(character.attrs.gen).toBe(c.attrs.gen + gain);
    expect(character.stamina).toBe(c.stamina - TRAIN_STAMINA_COST);
    expect(gain).toBeGreaterThanOrEqual(1);
  });

  it('悟性越高練功收益越大', () => {
    const c = createCharacter('王林', shaolin);
    const highWu: Character = { ...c, attrs: { ...c.attrs, wu: 20 } };
    const { gain } = train(highWu, fixedRng([0]));
    expect(gain).toBe(1 + Math.floor(20 / 5)); // = 5
  });

  it('體力不足時拋錯（SPEC Edge Case）', () => {
    const c = createCharacter('王林', shaolin);
    const tired: Character = { ...c, stamina: 5 };
    expect(() => train(tired, fixedRng([0]))).toThrow('體力不足');
  });

  it('不改動原始角色（純函式，無 mutation）', () => {
    const c = createCharacter('王林', shaolin);
    const before = JSON.stringify(c);
    train(c, fixedRng([0]));
    expect(JSON.stringify(c)).toBe(before);
  });
});

describe('rest', () => {
  it('恢復體力至滿並回復氣血', () => {
    const c = createCharacter('王林', shaolin);
    const drained: Character = { ...c, stamina: 10, hp: 10 };
    const r = rest(drained);
    expect(r.stamina).toBe(c.maxStamina);
    expect(r.hp).toBeGreaterThan(10);
    expect(r.hp).toBeLessThanOrEqual(c.maxHp);
  });

  it('氣血不會超過上限', () => {
    const c = createCharacter('王林', shaolin);
    const nearFull: Character = { ...c, hp: c.maxHp - 1 };
    expect(rest(nearFull).hp).toBe(c.maxHp);
  });
});

describe('resolveBattle', () => {
  const bandit = getEnemy('bandit')!;

  it('強者恆勝：屬性輾壓時玩家獲勝', () => {
    const c = createCharacter('高手', shaolin);
    const strong: Character = { ...c, attrs: { gen: 50, wu: 50, shen: 50, nei: 50 }, hp: 200, maxHp: 200 };
    const result = resolveBattle(strong, bandit, seededRng(1));
    expect(result.win).toBe(true);
    expect(result.playerHpAfter).toBeGreaterThan(0);
  });

  it('弱者恆敗：屬性與氣血都極低時玩家落敗', () => {
    const c = createCharacter('弱雞', shaolin);
    const weak: Character = { ...c, attrs: { gen: 1, wu: 1, shen: 1, nei: 1 }, hp: 3, maxHp: 3 };
    const strongEnemy: Enemy = { ...bandit, attrs: { gen: 50, wu: 50, shen: 50, nei: 50 }, hp: 500 };
    const result = resolveBattle(weak, strongEnemy, seededRng(1));
    expect(result.win).toBe(false);
    expect(result.playerHpAfter).toBe(0);
  });

  it('身法高者先手', () => {
    const c = createCharacter('快手', shaolin);
    const swift: Character = { ...c, attrs: { ...c.attrs, shen: 99 } };
    const slowEnemy: Enemy = { ...bandit, attrs: { ...bandit.attrs, shen: 1 } };
    const result = resolveBattle(swift, slowEnemy, seededRng(3));
    expect(result.rounds[0]!.attacker).toBe('player');
  });

  it('氣血永不為負（SPEC Edge Case）', () => {
    const c = createCharacter('測試', shaolin);
    const result = resolveBattle(c, { ...bandit, attrs: { gen: 99, wu: 99, shen: 99, nei: 99 }, hp: 999 }, seededRng(7));
    for (const round of result.rounds) {
      expect(round.playerHp).toBeGreaterThanOrEqual(0);
      expect(round.enemyHp).toBeGreaterThanOrEqual(0);
    }
    expect(result.playerHpAfter).toBeGreaterThanOrEqual(0);
  });

  it('確定性：同 seed 同輸入 → 同結果（可測試性保證）', () => {
    const c = createCharacter('王林', shaolin);
    const r1 = resolveBattle(c, bandit, seededRng(42));
    const r2 = resolveBattle(c, bandit, seededRng(42));
    expect(r1).toEqual(r2);
  });

  it('回合數有上限，不會無限迴圈', () => {
    // 雙方傷害都極低，測試 MAX_ROUNDS 保護
    const c = createCharacter('龜', shaolin);
    const tank: Character = { ...c, attrs: { gen: 1, wu: 1, shen: 1, nei: 1 }, hp: 1000, maxHp: 1000 };
    const tankEnemy: Enemy = { ...bandit, attrs: { gen: 1, wu: 1, shen: 1, nei: 1 }, hp: 1000 };
    const result = resolveBattle(tank, tankEnemy, seededRng(1));
    expect(result.rounds.length).toBeLessThanOrEqual(100);
  });
});

describe('combatPower', () => {
  it('為四屬性之和', () => {
    expect(combatPower({ gen: 1, wu: 2, shen: 3, nei: 4 })).toBe(10);
  });
});

describe('pickEvent', () => {
  it('依權重抽事件，回傳表內元素', () => {
    const e = pickEvent(EVENTS, seededRng(5));
    expect(EVENTS).toContain(e);
  });

  it('rng 回 0 時抽到第一個事件', () => {
    const e = pickEvent(EVENTS, fixedRng([0]));
    expect(e.id).toBe(EVENTS[0]!.id);
  });

  it('空事件表拋錯（SPEC Edge Case）', () => {
    expect(() => pickEvent([], fixedRng([0]))).toThrow();
  });
});
