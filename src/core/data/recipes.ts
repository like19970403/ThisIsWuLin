import type { Recipe } from '../types.js';

/** 鑄造配方：消耗材料 + 銀兩 → 產出既有裝備（見 equipment.ts）。 */
export const RECIPES: readonly Recipe[] = [
  {
    id: 'craft_green_blade',
    name: '鑄・青鋒劍',
    output: 'green_blade',
    cost: 200,
    materials: { iron: 3, jade: 1 },
  },
  {
    id: 'craft_soft_armor',
    name: '製・軟蝟甲',
    output: 'soft_armor',
    cost: 200,
    materials: { leather: 3, silk: 1 },
  },
  {
    id: 'craft_dragon_sabre',
    name: '鑄・屠龍刀',
    output: 'dragon_sabre',
    cost: 1500,
    materials: { cold_iron: 3, jade: 2 },
  },
  {
    id: 'craft_heaven_sword',
    name: '鑄・倚天劍',
    output: 'heaven_sword',
    cost: 1500,
    materials: { cold_iron: 3, silk: 2 },
  },
  {
    id: 'craft_golden_armor',
    name: '製・金絲軟甲',
    output: 'golden_armor',
    cost: 1200,
    materials: { gold_thread: 3, silk: 2 },
  },
] as const;

export function getRecipe(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id);
}
