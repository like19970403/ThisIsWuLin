import type { EncounterNode } from '../types.js';

/**
 * 奇遇連鎖劇情。每個 node 有選項，選項導向 reward/battle/next/end。
 * 由 events 的特殊事件觸發進入（起始 node id）。
 */
export const ENCOUNTERS: readonly EncounterNode[] = [
  // ─── 劇情一：落難書生 ───
  {
    id: 'scholar_start',
    title: '路遇落難書生',
    text: '山道旁一名書生衣衫襤褸，向你求助，說盤纏被劫，欲借些銀兩。',
    options: [
      {
        label: '慷慨解囊（贈 50 銀）',
        reqSilver: 50,
        result: { kind: 'next', nodeId: 'scholar_help' },
      },
      {
        label: '婉言拒絕',
        result: { kind: 'end', text: '你搖頭離去，書生嘆息目送。' },
      },
      {
        label: '起疑盤問',
        result: { kind: 'next', nodeId: 'scholar_suspect' },
      },
    ],
  },
  {
    id: 'scholar_help',
    title: '善有善報',
    text: '書生千恩萬謝，臨別取出一卷舊書相贈：「這是家傳心得，聊表謝意。」',
    options: [
      {
        label: '收下謝禮',
        result: { kind: 'reward', silver: -50, fame: 20, attr: { wu: 2 }, text: '你散去 50 銀，卻得書生贈書，悟性精進，聲名遠播。' },
      },
    ],
  },
  {
    id: 'scholar_suspect',
    title: '識破詭計',
    text: '你冷眼盤問，書生神色慌張——原來是夥同山賊設局的餌！話音未落，數名賊人殺出。',
    options: [
      {
        label: '拔劍應戰',
        result: { kind: 'battle', enemyId: 'bandit_chief', text: '你識破陷阱，先發制人！' },
      },
    ],
  },

  // ─── 劇情二：古廟怪聲 ───
  {
    id: 'temple_start',
    title: '荒廟夜宿',
    text: '夜色深沉，你於荒廟歇腳，忽聞後殿傳來窸窣怪聲。',
    options: [
      {
        label: '前往查看',
        result: { kind: 'next', nodeId: 'temple_investigate' },
      },
      {
        label: '充耳不聞，繼續歇息',
        result: { kind: 'reward', stamina: 40, text: '你不理會怪聲，安然睡去，體力恢復。' },
      },
    ],
  },
  {
    id: 'temple_investigate',
    title: '密室藏珍',
    text: '後殿神像後竟有暗格，內藏一個蒙塵的包袱。',
    options: [
      {
        label: '打開包袱',
        result: { kind: 'reward', itemId: 'iron_sword', silver: 80, text: '包袱中是一柄好劍與些許碎銀，先人遺澤，就此有緣。' },
      },
      {
        label: '不取不義之財，就地離開',
        result: { kind: 'reward', fame: 15, text: '你不動分毫，心懷坦蕩，江湖傳為美談。' },
      },
    ],
  },
] as const;

export function getEncounterNode(id: string): EncounterNode | undefined {
  return ENCOUNTERS.find((n) => n.id === id);
}

/** 可由闖蕩觸發的奇遇起始節點 id。 */
export const ENCOUNTER_STARTS: readonly string[] = ['scholar_start', 'temple_start'];
