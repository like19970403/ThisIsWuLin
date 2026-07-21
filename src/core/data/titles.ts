import type { Character, Title } from '../types.js';

/** 稱號解鎖條件（純函式謂詞）。與 Title 資料分離，便於測試。 */
export const TITLE_CONDITIONS: Record<string, (c: Character) => boolean> = {
  novice: (c) => c.level >= 3,
  expert: (c) => c.level >= 10,
  grandmaster: (c) => c.level >= 20,
  famous: (c) => c.fame >= 100,
  hero: (c) => c.fame >= 300,
  rich: (c) => c.silver >= 1000,
  scholar: (c) => c.learnedSkillIds.length >= 5,
  collector: (c) => c.inventory.length + (c.equipment.weapon ? 1 : 0) + (c.equipment.armor ? 1 : 0) >= 5,
};

export const TITLES: readonly Title[] = [
  { id: 'novice', name: '初入江湖', description: '達到 3 級。' },
  { id: 'expert', name: '一方高手', description: '達到 10 級。' },
  { id: 'grandmaster', name: '一代宗師', description: '達到 20 級。' },
  { id: 'famous', name: '聲名鵲起', description: '聲望達 100。' },
  { id: 'hero', name: '大俠', description: '聲望達 300。' },
  { id: 'rich', name: '富甲一方', description: '銀兩達 1000。' },
  { id: 'scholar', name: '博學多聞', description: '學會 5 門功法。' },
  { id: 'collector', name: '藏器于身', description: '持有 5 件裝備。' },
];

export function getTitle(id: string): Title | undefined {
  return TITLES.find((t) => t.id === id);
}
