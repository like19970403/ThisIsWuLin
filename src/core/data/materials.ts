import type { Material } from '../types.js';

/** 鑄造材料。由闖蕩掉落 / 商店購買取得。 */
export const MATERIALS: readonly Material[] = [
  { id: 'iron', name: '精鐵', description: '鑄造兵器的基礎材料。' },
  { id: 'cold_iron', name: '玄鐵', description: '罕見的鑄劍聖品，堅硬異常。' },
  { id: 'leather', name: '獸皮', description: '製作防具的常見材料。' },
  { id: 'silk', name: '天蠶絲', description: '輕韌無比，上乘防具用料。' },
  { id: 'jade', name: '寒玉', description: '蘊含靈氣的美玉，可強化兵器。' },
  { id: 'gold_thread', name: '金絲', description: '皇家御用，編織軟甲之用。' },
] as const;

export function getMaterial(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id);
}
