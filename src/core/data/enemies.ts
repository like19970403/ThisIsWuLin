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
  // ─── 進階敵人 ───
  {
    id: 'poison_master',
    name: '五毒教主',
    attrs: { gen: 8, wu: 10, shen: 12, nei: 11 },
    hp: 90,
    reward: { silver: 180, fame: 35 },
  },
  {
    id: 'blade_gang',
    name: '刀幫打手',
    attrs: { gen: 12, wu: 5, shen: 8, nei: 7 },
    hp: 80,
    reward: { silver: 120, fame: 18 },
  },
  {
    id: 'ronin',
    name: '東瀛浪人',
    attrs: { gen: 11, wu: 9, shen: 13, nei: 12 },
    hp: 110,
    reward: { silver: 220, fame: 45 },
  },
  // ─── BOSS ───
  {
    id: 'demon_lord',
    name: '魔教教主',
    attrs: { gen: 18, wu: 16, shen: 18, nei: 22 },
    hp: 200,
    reward: { silver: 800, fame: 120 },
  },
  {
    id: 'sword_saint',
    name: '劍聖',
    attrs: { gen: 16, wu: 18, shen: 22, nei: 20 },
    hp: 180,
    reward: { silver: 700, fame: 150 },
  },
] as const;

export function getEnemy(id: string): Enemy | undefined {
  return ENEMIES.find((e) => e.id === id);
}
