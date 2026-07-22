import type { Quest } from '../types.js';

/** 任務資料表。goal 為達成條件，reward 為繳交獎勵。 */
export const QUESTS: readonly Quest[] = [
  {
    id: 'q_first_blood',
    name: '初試身手',
    description: '闖蕩江湖，擊敗 3 名敵人。',
    goal: { kind: 'defeat', count: 3 },
    reward: { silver: 100, exp: 30 },
  },
  {
    id: 'q_bounty',
    name: '除暴安良',
    description: '擊敗 10 名敵人，為民除害。',
    goal: { kind: 'defeat', count: 10 },
    reward: { silver: 300, fame: 30, itemId: 'iron_sword' },
  },
  {
    id: 'q_veteran',
    name: '百戰之身',
    description: '擊敗 30 名敵人，威震江湖。',
    goal: { kind: 'defeat', count: 30 },
    reward: { silver: 800, fame: 80, attr: { gen: 2 } },
  },
  {
    id: 'q_grow_strong',
    name: '勤修苦練',
    description: '修煉至 5 級。',
    goal: { kind: 'reachLevel', level: 5 },
    reward: { silver: 150, exp: 50 },
  },
  {
    id: 'q_master',
    name: '一方高手',
    description: '修煉至 10 級。',
    goal: { kind: 'reachLevel', level: 10 },
    reward: { silver: 500, attr: { nei: 2 } },
  },
  {
    id: 'q_fame',
    name: '名動江湖',
    description: '聲望達到 100。',
    goal: { kind: 'reachFame', fame: 100 },
    reward: { silver: 400, itemId: 'leather_armor' },
  },
] as const;

export function getQuest(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id);
}
