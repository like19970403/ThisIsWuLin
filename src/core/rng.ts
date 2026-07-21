/**
 * 可注入的亂數來源。遊戲邏輯全部依賴此介面而非 Math.random，
 * 讓戰鬥/事件結算成為可測試的純函式（測試時注入固定序列）。
 */
export interface Rng {
  /** 回傳 [0, 1) 的浮點數 */
  next(): number;
}

/** 生產用：包裝 Math.random。 */
export const mathRng: Rng = {
  next: () => Math.random(),
};

/**
 * 確定性 RNG（mulberry32）——同一 seed 產生同一序列。
 * 用於「想要可重現但仍隨機」的場合，測試也可用它取代硬編序列。
 */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** 測試用：回傳預先排好的序列，用盡後從頭循環。 */
export function fixedRng(sequence: number[]): Rng {
  if (sequence.length === 0) throw new Error('fixedRng 序列不可為空');
  let i = 0;
  return {
    next() {
      const v = sequence[i % sequence.length]!;
      i += 1;
      return v;
    },
  };
}

/** [min, max] 閉區間整數。 */
export function randInt(rng: Rng, min: number, max: number): number {
  if (max < min) throw new Error(`randInt: max(${max}) < min(${min})`);
  return min + Math.floor(rng.next() * (max - min + 1));
}

/** 依權重挑一個元素。權重總和須 > 0。 */
export function weightedPick<T>(rng: Rng, items: readonly T[], weightOf: (item: T) => number): T {
  if (items.length === 0) throw new Error('weightedPick: items 不可為空');
  const total = items.reduce((s, it) => s + Math.max(0, weightOf(it)), 0);
  if (total <= 0) throw new Error('weightedPick: 權重總和須 > 0');
  let r = rng.next() * total;
  for (const it of items) {
    r -= Math.max(0, weightOf(it));
    if (r < 0) return it;
  }
  return items[items.length - 1]!; // 浮點誤差保底
}
