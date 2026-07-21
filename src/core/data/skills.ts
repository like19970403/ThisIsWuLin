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
  // ─── 通用進階 ───
  {
    id: 'wandering_fist',
    name: '逍遙拳',
    description: '拳意瀟灑，攻守隨心。',
    reqLevel: 4,
    cost: 200,
    passive: { gen: 2, shen: 2 },
    damageMultiplier: 0.3,
  },
  {
    id: 'nine_yang',
    name: '九陽神功（殘卷）',
    description: '曠世內功殘篇，內力磅礴。',
    reqLevel: 10,
    cost: 800,
    passive: { nei: 8, gen: 4 },
    damageMultiplier: 0.45,
  },
  // ─── 少林專屬 ───
  {
    id: 'shaolin_dragon',
    name: '降龍伏虎',
    description: '少林剛猛外功，一掌開碑裂石。',
    reqLevel: 5,
    cost: 350,
    passive: { gen: 6, nei: 3 },
    damageMultiplier: 0.7,
    sectId: 'shaolin',
  },
  {
    id: 'shaolin_arhat',
    name: '羅漢神拳',
    description: '少林入室弟子必修，剛猛紮實。',
    reqLevel: 2,
    cost: 100,
    passive: { gen: 4 },
    damageMultiplier: 0.35,
    sectId: 'shaolin',
  },
  // ─── 武當專屬 ───
  {
    id: 'wudang_taiji_sword',
    name: '太極劍法',
    description: '武當鎮派劍法，綿裡藏針，後發先至。',
    reqLevel: 5,
    cost: 350,
    passive: { nei: 5, shen: 4 },
    damageMultiplier: 0.65,
    sectId: 'wudang',
  },
  {
    id: 'wudang_tiganggong',
    name: '梯雲縱',
    description: '武當輕功身法，飄然若仙。',
    reqLevel: 3,
    cost: 150,
    passive: { shen: 5 },
    damageMultiplier: 0.1,
    sectId: 'wudang',
  },
  // ─── 峨嵋專屬 ───
  {
    id: 'emei_needle',
    name: '峨嵋刺',
    description: '峨嵋精巧兵刃功夫，身法凌厲。',
    reqLevel: 4,
    cost: 280,
    passive: { shen: 5, wu: 3 },
    damageMultiplier: 0.55,
    sectId: 'emei',
  },
  {
    id: 'emei_heart',
    name: '峨嵋心法',
    description: '峨嵋內功心法，悟性大進。',
    reqLevel: 3,
    cost: 160,
    passive: { wu: 5, nei: 2 },
    damageMultiplier: 0.15,
    sectId: 'emei',
  },
  // ─── 華山專屬 ───
  {
    id: 'huashan_sword',
    name: '華山劍法',
    description: '華山劍宗絕學，劍走輕靈。',
    reqLevel: 5,
    cost: 350,
    passive: { nei: 4, shen: 5 },
    damageMultiplier: 0.6,
    sectId: 'huashan',
  },
  {
    id: 'huashan_qi',
    name: '紫霞神功',
    description: '華山氣宗內功，紫氣東來。',
    reqLevel: 7,
    cost: 500,
    passive: { nei: 7, wu: 3 },
    damageMultiplier: 0.4,
    sectId: 'huashan',
  },
] as const;

export function getSkill(id: string): Skill | undefined {
  return SKILLS.find((s) => s.id === id);
}

/** 某門派可見/可學的功法：通用 + 該派專屬（過濾他派絕學）。 */
export function skillsForSect(sectId: string): readonly Skill[] {
  return SKILLS.filter((s) => !s.sectId || s.sectId === sectId);
}

/** 每名角色最多同時裝備幾門功法上陣。 */
export const MAX_EQUIPPED_SKILLS = 3;
