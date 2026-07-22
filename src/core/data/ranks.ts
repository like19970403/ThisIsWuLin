import type { Rank } from '../types.js';

/**
 * 職位階級（借鏡「武林英雄」，改為單機以聲望晉升）。
 * order 遞增、reqFame 遞增，線性晉升。最低階為 order 0（初始）。
 */
export const RANKS: readonly Rank[] = [
  { id: 'wanderer', order: 0, name: '流浪者', reqFame: 0, reward: {} },
  { id: 'guest', order: 1, name: '食客', reqFame: 30, reward: { silver: 50 } },
  { id: 'warrior', order: 2, name: '武士', reqFame: 80, reward: { silver: 100, attr: { gen: 1 } } },
  { id: 'elite_warrior', order: 3, name: '精英武士', reqFame: 160, reward: { silver: 200 } },
  { id: 'captain', order: 4, name: '武士統領', reqFame: 280, reward: { silver: 300, attr: { nei: 1 } } },
  { id: 'guard', order: 5, name: '侍衛', reqFame: 450, reward: { silver: 500 } },
  { id: 'elite_guard', order: 6, name: '精英侍衛', reqFame: 700, reward: { silver: 700, attr: { shen: 2 } } },
  { id: 'commander', order: 7, name: '兵衛統領', reqFame: 1000, reward: { silver: 1000 } },
  { id: 'defender', order: 8, name: '禁衛', reqFame: 1500, reward: { silver: 1500, attr: { gen: 2, nei: 2 } } },
  { id: 'elite_defender', order: 9, name: '精英禁衛', reqFame: 2200, reward: { silver: 2000 } },
  { id: 'general', order: 10, name: '將軍', reqFame: 3200, reward: { silver: 3000, attr: { gen: 3, nei: 3, shen: 3 } } },
  { id: 'marshal', order: 11, name: '元帥', reqFame: 5000, reward: { silver: 5000, attr: { gen: 5, wu: 5, shen: 5, nei: 5 } } },
] as const;

/** 最低階（新角色初始職位）。 */
export const INITIAL_RANK_ID = 'wanderer';

export function getRank(id: string): Rank | undefined {
  return RANKS.find((r) => r.id === id);
}
