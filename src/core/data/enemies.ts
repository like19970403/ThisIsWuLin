import type { Enemy } from '../types.js';

/** 敵人資料表。 */
export const ENEMIES: readonly Enemy[] = [
  {
    id: 'bandit',
    name: '山賊',
    attrs: { gen: 4, wu: 2, shen: 3, nei: 2 },
    hp: 30,
    reward: { silver: 50, fame: 5 },
  },
  {
    id: 'rival_disciple',
    name: '他派弟子',
    attrs: { gen: 5, wu: 4, shen: 5, nei: 4 },
    hp: 45,
    reward: { silver: 30, fame: 12 },
  },
  {
    id: 'wolf',
    name: '惡狼',
    attrs: { gen: 3, wu: 1, shen: 6, nei: 1 },
    hp: 22,
    reward: { silver: 10, fame: 3 },
  },
] as const;

export function getEnemy(id: string): Enemy | undefined {
  return ENEMIES.find((e) => e.id === id);
}
