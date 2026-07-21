import type { EquipItem } from '../types.js';

/** 裝備資料表。固定屬性加成，Phase 2 不做強化/耐久。 */
export const EQUIPMENT: readonly EquipItem[] = [
  // 武器
  {
    id: 'wooden_sword',
    name: '木劍',
    slot: 'weapon',
    description: '練武場常見的木劍，聊勝於無。',
    price: 20,
    bonus: { nei: 1 },
  },
  {
    id: 'iron_sword',
    name: '精鋼劍',
    slot: 'weapon',
    description: '鋒利耐用的好劍。',
    price: 120,
    bonus: { nei: 3, shen: 1 },
  },
  {
    id: 'green_blade',
    name: '青鋒劍',
    slot: 'weapon',
    description: '削鐵如泥的名劍。',
    price: 400,
    bonus: { nei: 6, shen: 2 },
  },
  // 防具
  {
    id: 'cloth_robe',
    name: '粗布衣',
    slot: 'armor',
    description: '尋常布衣，略擋風寒。',
    price: 15,
    bonus: { gen: 1 },
  },
  {
    id: 'leather_armor',
    name: '皮甲',
    slot: 'armor',
    description: '韌性十足的皮製護甲。',
    price: 100,
    bonus: { gen: 3 },
  },
  {
    id: 'soft_armor',
    name: '軟蝟甲',
    slot: 'armor',
    description: '刀槍不入的江湖珍品。',
    price: 450,
    bonus: { gen: 5, shen: 2 },
  },
] as const;

export function getEquipItem(id: string): EquipItem | undefined {
  return EQUIPMENT.find((e) => e.id === id);
}
