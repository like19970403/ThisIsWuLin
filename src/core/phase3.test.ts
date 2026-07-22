import { describe, it, expect } from 'vitest';
import {
  rankFor,
  promote,
  craft,
  addMaterial,
  acceptQuest,
  advanceQuests,
  claimQuest,
  isQuestComplete,
} from './phase3.js';
import { createCharacter } from './rules.js';
import { getSect } from './data/sects.js';
import { getQuest } from './data/quests.js';
import type { Character } from './types.js';

const shaolin = getSect('shaolin')!;
const base = () => createCharacter('王林', shaolin);
const rich = (): Character => ({ ...base(), silver: 5000 });

// ─── 職位晉升 ───
describe('職位晉升', () => {
  it('rankFor 依聲望回傳正確職位', () => {
    expect(rankFor(0).id).toBe('wanderer');
    expect(rankFor(30).id).toBe('guest');
    expect(rankFor(80).id).toBe('warrior');
    expect(rankFor(999999).id).toBe('marshal'); // 頂階
  });

  it('聲望達標可晉升並發獎', () => {
    const c: Character = { ...base(), fame: 80 }; // 可到武士
    const { character, promotedTo } = promote(c);
    expect(character.rankId).toBe('warrior');
    expect(promotedTo).toContain('warrior');
    // 途中發放的獎勵（食客+50、武士+100 銀）
    expect(character.silver).toBeGreaterThan(c.silver);
  });

  it('聲望不足不晉升', () => {
    const c: Character = { ...base(), fame: 10 };
    const { promotedTo } = promote(c);
    expect(promotedTo).toEqual([]);
  });

  it('連升多階：低階直接到高聲望', () => {
    const c: Character = { ...base(), fame: 300 };
    const { promotedTo } = promote(c);
    expect(promotedTo.length).toBeGreaterThan(1); // 一次補發多階
  });

  it('冪等：已在對應職位不重複晉升', () => {
    const c: Character = { ...base(), fame: 80, rankId: 'warrior' };
    const { promotedTo } = promote(c);
    expect(promotedTo).toEqual([]);
  });

  it('頂階不再晉升', () => {
    const c: Character = { ...base(), fame: 999999, rankId: 'marshal' };
    expect(promote(c).promotedTo).toEqual([]);
  });
});

// ─── 鑄造 ───
describe('鑄造', () => {
  const withMats = (): Character => {
    let c = rich();
    c = addMaterial(c, 'iron', 5);
    c = addMaterial(c, 'jade', 2);
    return c;
  };

  it('材料+銀兩足夠可鑄造，產出入背包、扣資源', () => {
    const c = withMats();
    const after = craft(c, 'craft_green_blade'); // 需 iron3 jade1 + 200銀
    expect(after.inventory).toContain('green_blade');
    expect(after.silver).toBe(c.silver - 200);
    expect(after.materials['iron']).toBe(2); // 5-3
    expect(after.materials['jade']).toBe(1); // 2-1
  });

  it('材料不足拒絕且不扣資源', () => {
    const c = rich(); // 無材料
    expect(() => craft(c, 'craft_green_blade')).toThrow('材料不足');
  });

  it('銀兩不足拒絕', () => {
    let c: Character = { ...base(), silver: 0 };
    c = addMaterial(c, 'iron', 5);
    c = addMaterial(c, 'jade', 2);
    expect(() => craft(c, 'craft_green_blade')).toThrow('銀兩不足');
  });

  it('材料用罄後移除', () => {
    let c = rich();
    c = addMaterial(c, 'iron', 3);
    c = addMaterial(c, 'jade', 1);
    const after = craft(c, 'craft_green_blade');
    expect(after.materials['iron']).toBeUndefined();
    expect(after.materials['jade']).toBeUndefined();
  });

  it('查無配方拒絕', () => {
    expect(() => craft(rich(), 'ghost_recipe')).toThrow('查無此配方');
  });
});

// ─── 任務 ───
describe('任務', () => {
  it('接受任務後建立進度', () => {
    const c = acceptQuest(base(), 'q_first_blood');
    expect(c.quests['q_first_blood']).toEqual({ accepted: true, progress: 0, claimed: false });
  });

  it('接受任務冪等', () => {
    let c = acceptQuest(base(), 'q_first_blood');
    c = { ...c, quests: { q_first_blood: { accepted: true, progress: 2, claimed: false } } };
    const again = acceptQuest(c, 'q_first_blood');
    expect(again.quests['q_first_blood']!.progress).toBe(2); // 未被重置
  });

  it('advanceQuests 推進 defeat 型任務', () => {
    let c = acceptQuest(base(), 'q_first_blood'); // 擊敗3
    c = advanceQuests(c, 'defeat');
    c = advanceQuests(c, 'defeat');
    expect(c.quests['q_first_blood']!.progress).toBe(2);
  });

  it('defeat 進度不超過目標', () => {
    let c = acceptQuest(base(), 'q_first_blood');
    for (let i = 0; i < 10; i++) c = advanceQuests(c, 'defeat');
    expect(c.quests['q_first_blood']!.progress).toBe(3); // 上限
  });

  it('isQuestComplete：defeat 達標', () => {
    let c = acceptQuest(base(), 'q_first_blood');
    for (let i = 0; i < 3; i++) c = advanceQuests(c, 'defeat');
    expect(isQuestComplete(c, getQuest('q_first_blood')!)).toBe(true);
  });

  it('isQuestComplete：reachLevel 讀角色等級', () => {
    let c = acceptQuest(base(), 'q_grow_strong'); // 5級
    expect(isQuestComplete(c, getQuest('q_grow_strong')!)).toBe(false);
    c = { ...c, level: 5 };
    expect(isQuestComplete(c, getQuest('q_grow_strong')!)).toBe(true);
  });

  it('繳交完成任務領獎', () => {
    let c = acceptQuest(rich(), 'q_first_blood');
    for (let i = 0; i < 3; i++) c = advanceQuests(c, 'defeat');
    const { character, reward } = claimQuest(c, 'q_first_blood');
    expect(character.silver).toBe(c.silver + 100);
    expect(character.quests['q_first_blood']!.claimed).toBe(true);
    expect(reward.exp).toBe(30);
  });

  it('繳交未完成任務拒絕', () => {
    const c = acceptQuest(base(), 'q_first_blood');
    expect(() => claimQuest(c, 'q_first_blood')).toThrow('尚未完成');
  });

  it('重複繳交拒絕', () => {
    let c = acceptQuest(rich(), 'q_first_blood');
    for (let i = 0; i < 3; i++) c = advanceQuests(c, 'defeat');
    c = claimQuest(c, 'q_first_blood').character;
    expect(() => claimQuest(c, 'q_first_blood')).toThrow('已領取');
  });

  it('純函式：advanceQuests 不改原角色', () => {
    const c = acceptQuest(base(), 'q_first_blood');
    const snap = JSON.stringify(c);
    advanceQuests(c, 'defeat');
    expect(JSON.stringify(c)).toBe(snap);
  });
});
