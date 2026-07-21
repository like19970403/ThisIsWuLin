import type { GameEvent } from '../types.js';

/** 闖蕩隨機事件表。權重驅動，新增事件只需加一筆。 */
export const EVENTS: readonly GameEvent[] = [
  {
    id: 'bandit_ambush',
    weight: 30,
    title: '山道遇襲',
    outcome: { kind: 'battle', enemyId: 'bandit' },
  },
  {
    id: 'rival_challenge',
    weight: 15,
    title: '狹路相逢',
    outcome: { kind: 'battle', enemyId: 'rival_disciple' },
  },
  {
    id: 'wolf_attack',
    weight: 20,
    title: '荒野狼嚎',
    outcome: { kind: 'battle', enemyId: 'wolf' },
  },
  {
    id: 'find_silver',
    weight: 15,
    title: '路遇商隊',
    outcome: { kind: 'fortune', silver: 40 },
  },
  {
    id: 'help_villager',
    weight: 10,
    title: '仗義相助',
    outcome: { kind: 'fortune', fame: 8, silver: 10 },
  },
  {
    id: 'ancient_manual',
    weight: 5,
    title: '石壁遺篇',
    outcome: { kind: 'fortune', attr: { nei: 2 } },
  },
  {
    id: 'quiet_day',
    weight: 15,
    title: '風平浪靜',
    outcome: { kind: 'nothing' },
  },
] as const;
