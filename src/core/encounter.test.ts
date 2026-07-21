import { describe, it, expect } from 'vitest';
import { resolveEncounter, canChoose } from './encounter.js';
import { getEncounterNode } from './data/encounters.js';
import { createCharacter } from './rules.js';
import { getSect } from './data/sects.js';
import type { Character, EncounterNode } from './types.js';

const shaolin = getSect('shaolin')!;
const rich = (): Character => ({ ...createCharacter('王林', shaolin), silver: 500 });

const scholarStart = getEncounterNode('scholar_start')!;

describe('canChoose', () => {
  it('銀兩足夠可選', () => {
    expect(canChoose(rich(), scholarStart.options[0]!)).toBe(true); // 需 50 銀
  });
  it('銀兩不足不可選', () => {
    const poor: Character = { ...rich(), silver: 10 };
    expect(canChoose(poor, scholarStart.options[0]!)).toBe(false);
  });
});

describe('resolveEncounter：不同選擇不同結果（Done When）', () => {
  it('選項1（解囊）進入下一節點 scholar_help', () => {
    const out = resolveEncounter(rich(), scholarStart, 0);
    expect(out.nextNodeId).toBe('scholar_help');
    expect(out.battleEnemyId).toBeNull();
  });

  it('選項2（拒絕）直接結束', () => {
    const out = resolveEncounter(rich(), scholarStart, 1);
    expect(out.nextNodeId).toBeNull();
    expect(out.battleEnemyId).toBeNull();
    expect(out.text).toContain('搖頭');
  });

  it('選項3（盤問）進入 scholar_suspect', () => {
    const out = resolveEncounter(rich(), scholarStart, 2);
    expect(out.nextNodeId).toBe('scholar_suspect');
  });

  it('scholar_suspect 導向戰鬥', () => {
    const node = getEncounterNode('scholar_suspect')!;
    const out = resolveEncounter(rich(), node, 0);
    expect(out.battleEnemyId).toBe('bandit_chief');
  });

  it('reward 結果套用獎懲（scholar_help 收禮：散銀得悟性聲望）', () => {
    const node = getEncounterNode('scholar_help')!;
    const c = rich();
    const out = resolveEncounter(c, node, 0);
    expect(out.character.silver).toBe(c.silver - 50);
    expect(out.character.fame).toBe(c.fame + 20);
    expect(out.character.attrs.wu).toBe(c.attrs.wu + 2);
  });

  it('reward 給道具進背包', () => {
    const node = getEncounterNode('temple_investigate')!;
    const out = resolveEncounter(rich(), node, 0); // 打開包袱得 iron_sword
    expect(out.character.inventory).toContain('iron_sword');
  });
});

describe('Edge Cases', () => {
  it('資源不足的選項被拒', () => {
    const poor: Character = { ...rich(), silver: 10 };
    expect(() => resolveEncounter(poor, scholarStart, 0)).toThrow('條件不足');
  });

  it('無效選項 index 拋錯', () => {
    expect(() => resolveEncounter(rich(), scholarStart, 99)).toThrow('無效');
  });

  it('指向不存在節點時安全結束（不 crash）', () => {
    const badNode: EncounterNode = {
      id: 'bad',
      title: '壞節點',
      text: '',
      options: [{ label: '走', result: { kind: 'next', nodeId: 'does_not_exist' } }],
    };
    const out = resolveEncounter(rich(), badNode, 0);
    expect(out.nextNodeId).toBeNull(); // 安全結束
  });

  it('銀兩不會扣成負數', () => {
    const node = getEncounterNode('scholar_help')!; // silver -50
    const c: Character = { ...rich(), silver: 20 };
    const out = resolveEncounter(c, node, 0);
    expect(out.character.silver).toBeGreaterThanOrEqual(0);
  });

  it('純函式：不改動原角色', () => {
    const c = rich();
    const snap = JSON.stringify(c);
    resolveEncounter(c, getEncounterNode('scholar_help')!, 0);
    expect(JSON.stringify(c)).toBe(snap);
  });
});
