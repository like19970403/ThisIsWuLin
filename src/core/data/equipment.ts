import type { EquipItem } from '../types.js';

/** 裝備資料表。固定屬性加成，Phase 2 不做強化/耐久。rarity 影響 UI 顏色與掉落感受。 */
export const EQUIPMENT: readonly EquipItem[] = [
  // ─── 武器 ───
  {
    id: 'wooden_sword',
    name: '木劍',
    slot: 'weapon',
    description: '練武場常見的木劍，聊勝於無。',
    price: 20,
    bonus: { nei: 1 },
    rarity: 'common',
  },
  {
    id: 'iron_sword',
    name: '精鋼劍',
    slot: 'weapon',
    description: '鋒利耐用的好劍。',
    price: 120,
    bonus: { nei: 3, shen: 1 },
    rarity: 'fine',
  },
  {
    id: 'green_blade',
    name: '青鋒劍',
    slot: 'weapon',
    description: '削鐵如泥的名劍。',
    price: 400,
    bonus: { nei: 6, shen: 2 },
    rarity: 'rare',
  },
  {
    id: 'plum_spear',
    name: '梅花槍',
    slot: 'weapon',
    description: '槍出如梅綻，剛柔並濟。',
    price: 260,
    bonus: { nei: 4, gen: 2 },
    rarity: 'fine',
  },
  {
    id: 'soft_whip',
    name: '軟劍',
    slot: 'weapon',
    description: '藏於腰間，出手詭譎難防。',
    price: 320,
    bonus: { shen: 5, nei: 2 },
    rarity: 'rare',
  },
  {
    id: 'dragon_sabre',
    name: '屠龍刀',
    slot: 'weapon',
    description: '武林至尊，寶刀屠龍。號令天下，莫敢不從。',
    price: 2000,
    bonus: { nei: 12, gen: 6, shen: 3 },
    rarity: 'legendary',
  },
  {
    id: 'heaven_sword',
    name: '倚天劍',
    slot: 'weapon',
    description: '倚天不出，誰與爭鋒。',
    price: 2000,
    bonus: { nei: 10, shen: 8, wu: 3 },
    rarity: 'legendary',
  },
  // ─── 防具 ───
  {
    id: 'cloth_robe',
    name: '粗布衣',
    slot: 'armor',
    description: '尋常布衣，略擋風寒。',
    price: 15,
    bonus: { gen: 1 },
    rarity: 'common',
  },
  {
    id: 'leather_armor',
    name: '皮甲',
    slot: 'armor',
    description: '韌性十足的皮製護甲。',
    price: 100,
    bonus: { gen: 3 },
    rarity: 'fine',
  },
  {
    id: 'soft_armor',
    name: '軟蝟甲',
    slot: 'armor',
    description: '刀槍不入的江湖珍品。',
    price: 450,
    bonus: { gen: 5, shen: 2 },
    rarity: 'rare',
  },
  {
    id: 'silk_robe',
    name: '天蠶寶衣',
    slot: 'armor',
    description: '天蠶絲織就，輕若無物而堅逾精鋼。',
    price: 600,
    bonus: { gen: 4, shen: 3, nei: 2 },
    rarity: 'rare',
  },
  {
    id: 'monk_robe',
    name: '百衲衣',
    slot: 'armor',
    description: '高僧穿戴，內蘊護體真氣。',
    price: 280,
    bonus: { gen: 4, nei: 2 },
    rarity: 'fine',
  },
  {
    id: 'golden_armor',
    name: '金絲軟甲',
    slot: 'armor',
    description: '皇家御製，金絲織就，水火不侵。',
    price: 1800,
    bonus: { gen: 8, shen: 4, nei: 3 },
    rarity: 'legendary',
  },
  // ─── 入門裝備 ───
  {
    id: 'rusty_knife',
    name: '銹鐵刀',
    slot: 'weapon',
    description: '鏽跡斑斑，勉強能用。',
    price: 10,
    bonus: { nei: 1 },
    rarity: 'common',
  },
  {
    id: 'straw_hat',
    name: '斗笠蓑衣',
    slot: 'armor',
    description: '行走江湖遮風避雨。',
    price: 12,
    bonus: { shen: 1 },
    rarity: 'common',
  },
] as const;

export function getEquipItem(id: string): EquipItem | undefined {
  return EQUIPMENT.find((e) => e.id === id);
}

/** 稀有度的中文名與顏色（UI 用）。 */
export const RARITY_META: Record<string, { label: string; color: string }> = {
  common: { label: '普通', color: 'text-stone-300' },
  fine: { label: '精良', color: 'text-sky-400' },
  rare: { label: '稀有', color: 'text-purple-400' },
  legendary: { label: '傳奇', color: 'text-amber-400' },
};

export function rarityMeta(rarity: string | undefined) {
  return RARITY_META[rarity ?? 'common'] ?? RARITY_META.common!;
}
