import { describe, it, expect } from 'vitest';
import { doTrain, doRest, doRoam, narrateTurn } from './turn.js';
import { createCharacter, ROAM_STAMINA_COST } from './rules.js';
import { fixedRng, seededRng } from './rng.js';
import { getSect } from './data/sects.js';
import { MockNarrator } from './narrator/mock.js';
import { TemplateNarrator } from './narrator/template.js';
import type { Character, GameEvent, Narrator, SceneContext } from './types.js';

const shaolin = getSect('shaolin')!;
const newChar = () => createCharacter('王林', shaolin);

describe('doTrain', () => {
  it('提升屬性並消耗體力，產生 scene', () => {
    const r = doTrain(newChar(), fixedRng([0]));
    expect(r.character.attrs.gen).toBeGreaterThan(newChar().attrs.gen);
    expect(r.character.stamina).toBeLessThan(newChar().stamina);
    expect(r.scene.action).toBe('train');
  });
});

describe('doRest', () => {
  it('恢復體力', () => {
    const drained: Character = { ...newChar(), stamina: 0 };
    const r = doRest(drained);
    expect(r.character.stamina).toBe(newChar().maxStamina);
  });
});

describe('doRoam', () => {
  it('消耗體力', () => {
    const r = doRoam(newChar(), seededRng(1));
    expect(r.character.stamina).toBe(newChar().stamina - ROAM_STAMINA_COST);
  });

  it('體力不足時拋錯', () => {
    const tired: Character = { ...newChar(), stamina: 5 };
    expect(() => doRoam(tired, seededRng(1))).toThrow('體力不足');
  });

  it('fortune 事件套用獎勵', () => {
    const fortuneOnly: GameEvent[] = [
      { id: 'gift', weight: 1, title: '路遇商隊', outcome: { kind: 'fortune', silver: 40 } },
    ];
    const r = doRoam(newChar(), fixedRng([0]), fortuneOnly);
    expect(r.character.silver).toBe(40);
  });

  it('battle 勝利時獲得獎勵、氣血更新', () => {
    const strong: Character = {
      ...newChar(),
      attrs: { gen: 50, wu: 50, shen: 50, nei: 50 },
      hp: 200,
      maxHp: 200,
    };
    const battleOnly: GameEvent[] = [
      { id: 'fight', weight: 1, title: '山道遇襲', outcome: { kind: 'battle', enemyId: 'bandit' } },
    ];
    const r = doRoam(strong, seededRng(2), battleOnly);
    expect(r.character.fame).toBeGreaterThan(0);
    expect(r.scene.event.kind).toBe('battle');
  });

  it('空事件表 fallback 到無事發生（Edge Case）', () => {
    const r = doRoam(newChar(), fixedRng([0]), []);
    expect(r.scene.event.kind).toBe('nothing');
    // 只扣體力，其他不變
    expect(r.character.silver).toBe(0);
  });

  it('未知 enemyId 不會 crash', () => {
    const badEvent: GameEvent[] = [
      { id: 'ghost', weight: 1, title: '鬼影', outcome: { kind: 'battle', enemyId: 'does_not_exist' } },
    ];
    const r = doRoam(newChar(), fixedRng([0]), badEvent);
    expect(r.scene.event.kind).toBe('nothing');
  });
});

// ─── 核心驗證：Narrator 可插拔 ───
describe('Narrator 可插拔（ADR-001 成功指標）', () => {
  it('切換不同 Narrator，遊戲邏輯結果完全相同', async () => {
    const battleOnly: GameEvent[] = [
      { id: 'fight', weight: 1, title: '山道遇襲', outcome: { kind: 'battle', enemyId: 'bandit' } },
    ];
    // 同 seed 跑兩次，只換 Narrator
    const rA = doRoam(newChar(), seededRng(99), battleOnly);
    const rB = doRoam(newChar(), seededRng(99), battleOnly);

    // 遊戲狀態（數值判定）與 Narrator 無關 → 兩者相等
    expect(rA.character).toEqual(rB.character);

    // 但敘事文字可以完全不同
    const mock = new MockNarrator('固定敘事');
    const template = new TemplateNarrator(seededRng(1));
    const textMock = await narrateTurn(rA, mock);
    const textTemplate = await narrateTurn(rB, template);

    expect(textMock).toBe('固定敘事');
    expect(textTemplate).not.toBe(textMock);
    // Mock 有收到與遊戲邏輯一致的 scene
    expect(mock.received[0]!.event.summary).toBe(rA.scene.event.summary);
  });

  it('Narrator 拋錯時降級回 summary，不影響遊戲', async () => {
    const throwing: Narrator = {
      narrate(_ctx: SceneContext): Promise<string> {
        return Promise.reject(new Error('API 掛了'));
      },
    };
    const r = doTrain(newChar(), fixedRng([0]));
    const text = await narrateTurn(r, throwing);
    expect(text).toBe(r.scene.event.summary); // 降級成功
  });
});

describe('TemplateNarrator', () => {
  it('離線產生含角色名與事件標題的文字', async () => {
    const r = doTrain(newChar(), fixedRng([0]));
    const text = await new TemplateNarrator(seededRng(1)).narrate(r.scene);
    expect(text).toContain('王林');
    expect(text).toContain(r.scene.event.title);
  });
});
