import type { Narrator, SceneContext } from '../types.js';

/**
 * 測試用敘事器 — 回傳固定/可預期字串，或記錄收到的 context。
 * 用於驗證「遊戲邏輯不依賴 Narrator 實作」（ADR-001 成功指標）。
 */
export class MockNarrator implements Narrator {
  public readonly received: SceneContext[] = [];

  constructor(private readonly canned: string = '[mock narration]') {}

  narrate(context: SceneContext): Promise<string> {
    this.received.push(context);
    return Promise.resolve(this.canned);
  }
}
