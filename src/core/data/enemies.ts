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
  {
    id: 'bandit_chief',
    name: '山賊頭目',
    attrs: { gen: 8, wu: 4, shen: 6, nei: 6 },
    hp: 70,
    reward: { silver: 150, fame: 20 },
  },
  {
    id: 'evil_cultist',
    name: '邪教弟子',
    attrs: { gen: 6, wu: 6, shen: 7, nei: 9 },
    hp: 60,
    reward: { silver: 80, fame: 25 },
  },
  {
    id: 'sword_master',
    name: '獨行劍客',
    attrs: { gen: 10, wu: 8, shen: 10, nei: 10 },
    hp: 100,
    reward: { silver: 200, fame: 40 },
  },
] as const;

export function getEnemy(id: string): Enemy | undefined {
  return ENEMIES.find((e) => e.id === id);
}
