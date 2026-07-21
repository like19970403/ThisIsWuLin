import { describe, it, expect } from 'vitest';
import { checkTitles } from './progression.js';
import { createCharacter } from './rules.js';
import { getSect } from './data/sects.js';
import { TITLES } from './data/titles.js';
import type { Character } from './types.js';

const shaolin = getSect('shaolin')!;
const base = () => createCharacter('王林', shaolin);

describe('稱號解鎖', () => {
  it('達等級門檻解鎖對應稱號', () => {
    const c: Character = { ...base(), level: 3 };
    const { character, newlyUnlocked } = checkTitles(c);
    expect(newlyUnlocked).toContain('novice');
    expect(character.titles).toContain('novice');
  });

  it('聲望達標解鎖大俠', () => {
    const c: Character = { ...base(), fame: 300 };
    const { newlyUnlocked } = checkTitles(c);
    expect(newlyUnlocked).toContain('hero');
    expect(newlyUnlocked).toContain('famous'); // 300 也滿足 famous(100)
  });

  it('條件未達不解鎖', () => {
    const { newlyUnlocked } = checkTitles(base()); // 1級、0聲望
    expect(newlyUnlocked).toEqual([]);
  });

  it('冪等：已解鎖不重複加入', () => {
    const c: Character = { ...base(), level: 20, titles: ['novice', 'expert'] };
    const { character, newlyUnlocked } = checkTitles(c);
    // grandmaster 新解鎖，但 novice/expert 不重複
    expect(newlyUnlocked).toContain('grandmaster');
    expect(newlyUnlocked).not.toContain('novice');
    // titles 無重複
    expect(character.titles.filter((t) => t === 'novice')).toHaveLength(1);
  });

  it('對已全解鎖的角色再檢查回傳空', () => {
    const allIds = TITLES.map((t) => t.id);
    const c: Character = { ...base(), level: 20, fame: 300, silver: 1000, titles: [...allIds] };
    const { newlyUnlocked } = checkTitles(c);
    expect(newlyUnlocked).toEqual([]);
  });

  it('功法數達標解鎖博學多聞', () => {
    const c: Character = { ...base(), learnedSkillIds: ['a', 'b', 'c', 'd', 'e'] };
    const { newlyUnlocked } = checkTitles(c);
    expect(newlyUnlocked).toContain('scholar');
  });

  it('純函式：不改動原角色', () => {
    const c: Character = { ...base(), level: 10 };
    const snap = JSON.stringify(c);
    checkTitles(c);
    expect(JSON.stringify(c)).toBe(snap);
  });
});
