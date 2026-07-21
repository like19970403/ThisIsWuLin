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
  // ─── Phase 2 新增 ───
  {
    id: 'bandit_chief_fight',
    weight: 8,
    title: '賊窩尋仇',
    outcome: { kind: 'battle', enemyId: 'bandit_chief' },
  },
  {
    id: 'cultist_ambush',
    weight: 7,
    title: '邪教作亂',
    outcome: { kind: 'battle', enemyId: 'evil_cultist' },
  },
  {
    id: 'lone_swordsman',
    weight: 4,
    title: '劍客邀戰',
    outcome: { kind: 'battle', enemyId: 'sword_master' },
  },
  {
    id: 'drop_sword',
    weight: 8,
    title: '拾得遺物',
    outcome: { kind: 'loot', itemId: 'iron_sword' },
  },
  {
    id: 'drop_armor',
    weight: 6,
    title: '荒屋探寶',
    outcome: { kind: 'loot', itemId: 'leather_armor' },
  },
  {
    id: 'town_market',
    weight: 12,
    title: '路過集鎮',
    outcome: { kind: 'shop', itemIds: ['wooden_sword', 'iron_sword', 'cloth_robe', 'leather_armor', 'rusty_knife', 'straw_hat'] },
  },
  // ─── 內容大擴充 ───
  {
    id: 'poison_fight',
    weight: 6,
    title: '毒霧瀰漫',
    outcome: { kind: 'battle', enemyId: 'poison_master' },
  },
  {
    id: 'blade_gang_fight',
    weight: 8,
    title: '刀幫尋釁',
    outcome: { kind: 'battle', enemyId: 'blade_gang' },
  },
  {
    id: 'ronin_duel',
    weight: 5,
    title: '浪人挑戰',
    outcome: { kind: 'battle', enemyId: 'ronin' },
  },
  {
    id: 'demon_lord_fight',
    weight: 2,
    title: '魔教夜襲',
    outcome: { kind: 'battle', enemyId: 'demon_lord' },
  },
  {
    id: 'sword_saint_duel',
    weight: 2,
    title: '劍聖論劍',
    outcome: { kind: 'battle', enemyId: 'sword_saint' },
  },
  {
    id: 'big_market',
    weight: 8,
    title: '繁華大城',
    outcome: { kind: 'shop', itemIds: ['green_blade', 'soft_armor', 'silk_robe', 'plum_spear', 'soft_whip', 'monk_robe'] },
  },
  {
    id: 'drop_rare_weapon',
    weight: 3,
    title: '古墓奇緣',
    outcome: { kind: 'loot', itemId: 'green_blade' },
  },
  {
    id: 'drop_rare_armor',
    weight: 3,
    title: '寶庫遺珍',
    outcome: { kind: 'loot', itemId: 'silk_robe' },
  },
  {
    id: 'wandering_master',
    weight: 4,
    title: '高人指點',
    outcome: { kind: 'fortune', attr: { wu: 2 }, fame: 5 },
  },
  {
    id: 'hidden_treasure',
    weight: 5,
    title: '荒山藏寶',
    outcome: { kind: 'fortune', silver: 120 },
  },
  {
    id: 'rescue_maiden',
    weight: 6,
    title: '英雄救美',
    outcome: { kind: 'fortune', fame: 15, silver: 30 },
  },
] as const;
