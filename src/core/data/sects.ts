import type { Sect } from '../types.js';

/** 門派資料表。新增門派只需在此加一筆，不動邏輯程式碼。 */
export const SECTS: readonly Sect[] = [
  {
    id: 'shaolin',
    name: '少林',
    description: '外功精深，根骨紮實，氣血雄厚。',
    attrBonus: { gen: 3, nei: 1 },
  },
  {
    id: 'wudang',
    name: '武當',
    description: '以柔克剛，內力綿長。',
    attrBonus: { nei: 3, shen: 1 },
  },
  {
    id: 'emei',
    name: '峨嵋',
    description: '身法輕靈，悟性出眾。',
    attrBonus: { shen: 2, wu: 2 },
  },
  {
    id: 'huashan',
    name: '華山',
    description: '劍宗氣宗兼備，內力與身法並重。',
    attrBonus: { nei: 2, shen: 1, wu: 1 },
  },
  {
    id: 'gaibang',
    name: '丐幫',
    description: '天下第一大幫，根骨紮實，人多勢眾。',
    attrBonus: { gen: 3, shen: 1 },
  },
  {
    id: 'mingjiao',
    name: '明教',
    description: '光明頂上，內力剛猛，行事不拘。',
    attrBonus: { nei: 3, gen: 1 },
  },
  {
    id: 'xiaoyao',
    name: '逍遙派',
    description: '逍遙自在，身法悟性冠絕天下。',
    attrBonus: { shen: 2, wu: 2, nei: 1 },
  },
] as const;

export function getSect(id: string): Sect | undefined {
  return SECTS.find((s) => s.id === id);
}
