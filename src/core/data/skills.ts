import type { Skill } from '../types.js';

/** 功法資料表。passive=裝備後被動屬性；damageMultiplier=戰鬥每回合額外傷害倍率（以內力為基底）。 */
export const SKILLS: readonly Skill[] = [
  {
    id: 'basic_fist',
    name: '長拳',
    description: '江湖入門拳法，樸實無華但根基紮實。',
    reqLevel: 1,
    cost: 30,
    passive: { gen: 2 },
    damageMultiplier: 0.2,
  },
  {
    id: 'swift_blade',
    name: '追風劍法',
    description: '身法為要，出手如風。',
    reqLevel: 2,
    cost: 80,
    passive: { shen: 3 },
    damageMultiplier: 0.35,
  },
  {
    id: 'iron_body',
    name: '鐵布衫',
    description: '外功橫練，皮糙肉厚。純被動，大幅增益根骨。',
    reqLevel: 3,
    cost: 120,
    passive: { gen: 5 },
    damageMultiplier: 0,
  },
  {
    id: 'inner_flow',
    name: '吐納心法',
    description: '內息綿長，內力大進。',
    reqLevel: 3,
    cost: 150,
    passive: { nei: 5 },
    damageMultiplier: 0.15,
  },
  {
    id: 'plum_palm',
    name: '落梅神掌',
    description: '掌力剛猛，一擊定江山。',
    reqLevel: 5,
    cost: 300,
    passive: { nei: 3, gen: 2 },
    damageMultiplier: 0.6,
  },
  {
    id: 'shadow_step',
    name: '凌波微步',
    description: '身法之極致，飄忽如影。',
    reqLevel: 6,
    cost: 400,
    passive: { shen: 6, wu: 2 },
    damageMultiplier: 0.4,
  },
  {
    id: 'taiji',
    name: '太極勁',
    description: '以柔克剛，攻守兼備。內外兼修。',
    reqLevel: 8,
    cost: 600,
    passive: { nei: 4, shen: 3, gen: 3 },
    damageMultiplier: 0.5,
  },
] as const;

export function getSkill(id: string): Skill | undefined {
  return SKILLS.find((s) => s.id === id);
}

/** 每名角色最多同時裝備幾門功法上陣。 */
export const MAX_EQUIPPED_SKILLS = 3;
