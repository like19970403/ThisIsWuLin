import type { Narrator, SceneContext } from '../types.js';
import { getSect } from '../data/sects.js';
import { seededRng, weightedPick, type Rng } from '../rng.js';

/**
 * 純模板敘事器 — 離線、零成本、零依賴。Phase 1 預設實作。
 * 依情境從詞庫組句，不呼叫任何外部服務（ADR-001 §決策.5）。
 */
export class TemplateNarrator implements Narrator {
  private readonly rng: Rng;

  /** 可注入 RNG 以利測試；預設用固定 seed 讓輸出穩定可重現。 */
  constructor(rng: Rng = seededRng(1)) {
    this.rng = rng;
  }

  narrate(context: SceneContext): Promise<string> {
    return Promise.resolve(this.compose(context));
  }

  private compose(ctx: SceneContext): string {
    const sect = getSect(ctx.character.sectId);
    const who = `${ctx.character.name}${sect ? `（${sect.name}）` : ''}`;

    const openers: Record<SceneContext['action'], string[]> = {
      train: ['潛心苦修', '閉關練功', '打坐運氣'],
      roam: ['行走江湖', '仗劍遠遊', '踏上旅途'],
      rest: ['尋一處客棧歇腳', '就地調息', '安然入眠'],
    };
    const opener = pick(this.rng, openers[ctx.action]);

    const { title, summary } = ctx.event;
    return `${who}${opener}，忽逢「${title}」。${summary}`;
  }
}

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return weightedPick(rng, arr, () => 1);
}
