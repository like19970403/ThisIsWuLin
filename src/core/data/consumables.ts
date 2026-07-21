import type { Consumable } from '../types.js';

/** 消耗品資料表。heal=即時回復；permanentAttr=永久加屬性。 */
export const CONSUMABLES: readonly Consumable[] = [
  {
    id: 'pill_hp',
    name: '金創藥',
    description: '尋常傷藥，回復少量氣血。',
    price: 30,
    effect: { kind: 'heal', hp: 30 },
  },
  {
    id: 'pill_hp_big',
    name: '大還丹',
    description: '靈丹妙藥，大量回復氣血。',
    price: 120,
    effect: { kind: 'heal', hp: 100 },
  },
  {
    id: 'wine',
    name: '女兒紅',
    description: '陳年好酒，恢復體力、精神一振。',
    price: 40,
    effect: { kind: 'heal', stamina: 60 },
  },
  {
    id: 'dried_meat',
    name: '醬牛肉',
    description: '江湖乾糧，回復體力與少許氣血。',
    price: 25,
    effect: { kind: 'heal', hp: 15, stamina: 30 },
  },
  {
    id: 'ginseng',
    name: '千年人參',
    description: '大補元氣，永久提升根骨。',
    price: 500,
    effect: { kind: 'permanentAttr', attr: { gen: 3 } },
  },
  {
    id: 'inner_pill',
    name: '內丹',
    description: '異獸內丹，永久增進內力。',
    price: 600,
    effect: { kind: 'permanentAttr', attr: { nei: 3 } },
  },
  {
    id: 'wisdom_fruit',
    name: '慧心果',
    description: '奇珍異果，開竅增智，永久提升悟性。',
    price: 550,
    effect: { kind: 'permanentAttr', attr: { wu: 3 } },
  },
] as const;

export function getConsumable(id: string): Consumable | undefined {
  return CONSUMABLES.find((c) => c.id === id);
}
