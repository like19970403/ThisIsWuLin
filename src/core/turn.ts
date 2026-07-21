import type { Attributes, Character, Narrator, SceneContext, GameEvent } from './types.js';
import { clamp, train, rest, resolveBattle, pickEvent, ROAM_STAMINA_COST } from './rules.js';
import { getEnemy } from './data/enemies.js';
import { getEquipItem } from './data/equipment.js';
import { EVENTS } from './data/events.js';
import { gainExp } from './progression.js';
import { effectiveAttrs, equippedDamageMultiplier, addToInventory } from './loadout.js';
import type { Rng } from './rng.js';

/** 練功獲得的經驗。 */
export const TRAIN_EXP = 8;

/** 一回合的完整結果：新角色狀態 + 給 UI 的日誌 + 敘事情境（尚未套皮膚）。 */
export interface TurnResult {
  character: Character;
  scene: SceneContext;
  /** 結構化結果，UI 可直接顯示，不依賴 Narrator */
  log: string;
  /** 這回合升了幾級（0 表示沒升） */
  levelsGained?: number;
  /** 若觸發商店事件，這裡是可購買的裝備 id 清單（供 UI 開商店） */
  shopItemIds?: string[];
}

/** 套用經驗並在有升級時把「升級」附加到 summary。回傳新角色與升級數。 */
function withExp(char: Character, exp: number, summary: string): { character: Character; summary: string; levelsGained: number } {
  const { character, levelsGained } = gainExp(char, exp);
  const s = levelsGained > 0 ? `${summary}（升至 ${character.level} 級！）` : summary;
  return { character, summary: s, levelsGained };
}

function applyAttr(attrs: Attributes, delta: Partial<Attributes>): Attributes {
  return {
    gen: attrs.gen + (delta.gen ?? 0),
    wu: attrs.wu + (delta.wu ?? 0),
    shen: attrs.shen + (delta.shen ?? 0),
    nei: attrs.nei + (delta.nei ?? 0),
  };
}

/**
 * 執行「練功」一回合。純函式：數值由此決定，Narrator 只事後套皮膚。
 */
export function doTrain(char: Character, rng: Rng): TurnResult {
  const { character: trained, gainedAttr, gain } = train(char, rng);
  const attrName = { gen: '根骨', wu: '悟性', shen: '身法', nei: '內力' }[gainedAttr];
  const base = `勤修不輟，${attrName}提升了 ${gain} 點。`;
  const { character, summary, levelsGained } = withExp(trained, TRAIN_EXP, base);
  return {
    character,
    log: summary,
    levelsGained,
    scene: {
      character: { name: char.name, sectId: char.sectId },
      action: 'train',
      event: { title: '苦修有成', kind: 'nothing', summary },
    },
  };
}

/** 執行「休息」一回合。 */
export function doRest(char: Character): TurnResult {
  const character = rest(char);
  const summary = '養精蓄銳，體力已然恢復。';
  return {
    character,
    log: summary,
    scene: {
      character: { name: char.name, sectId: char.sectId },
      action: 'rest',
      event: { title: '休養生息', kind: 'nothing', summary },
    },
  };
}

/**
 * 執行「闖蕩」一回合：抽事件 → 若戰鬥則結算 → 套用獎懲。純函式。
 * @param events 可注入事件表（預設用內建表，測試可傳空/自訂）
 */
export function doRoam(
  char: Character,
  rng: Rng,
  events: readonly GameEvent[] = EVENTS,
): TurnResult {
  if (char.stamina < ROAM_STAMINA_COST) {
    throw new Error('體力不足，無法闖蕩');
  }
  let c: Character = { ...char, stamina: clamp(char.stamina - ROAM_STAMINA_COST, 0, char.maxStamina) };
  let levelsGained = 0;
  let shopItemIds: string[] | undefined;

  // 事件表為空 → fallback 到「無事發生」（SPEC Edge Case）
  const event: GameEvent =
    events.length > 0
      ? pickEvent(events, rng)
      : { id: 'fallback', weight: 1, title: '風平浪靜', outcome: { kind: 'nothing' } };

  let summary: string;
  let kind: SceneContext['event']['kind'];

  switch (event.outcome.kind) {
    case 'battle': {
      kind = 'battle';
      const enemy = getEnemy(event.outcome.enemyId);
      if (!enemy) {
        summary = '敵蹤已杳，虛驚一場。';
        kind = 'nothing';
        break;
      }
      const battle = resolveBattle(c, enemy, rng, {
        playerAttrs: effectiveAttrs(c),
        skillMultiplier: equippedDamageMultiplier(c),
      });
      c = { ...c, hp: battle.playerHpAfter };
      if (battle.win) {
        c = {
          ...c,
          silver: c.silver + enemy.reward.silver,
          fame: c.fame + enemy.reward.fame,
        };
        // 戰鬥經驗 = 敵人氣血/2 + 聲望獎勵（強敵給更多經驗）
        const exp = Math.floor(enemy.hp / 2) + enemy.reward.fame;
        const base = `與${enemy.name}激鬥 ${battle.rounds.length} 回合，力克強敵！獲銀兩 ${enemy.reward.silver}、聲望 ${enemy.reward.fame}。`;
        const r = withExp(c, exp, base);
        c = r.character;
        summary = r.summary;
        levelsGained = r.levelsGained;
      } else {
        summary = `與${enemy.name}激鬥 ${battle.rounds.length} 回合，力有未逮，負傷而退。`;
      }
      break;
    }
    case 'fortune': {
      kind = 'fortune';
      const f = event.outcome;
      const parts: string[] = [];
      if (f.silver) {
        c = { ...c, silver: c.silver + f.silver };
        parts.push(`銀兩 +${f.silver}`);
      }
      if (f.fame) {
        c = { ...c, fame: c.fame + f.fame };
        parts.push(`聲望 +${f.fame}`);
      }
      if (f.attr) {
        c = { ...c, attrs: applyAttr(c.attrs, f.attr) };
        parts.push('偶得心法，屬性精進');
      }
      summary = parts.length > 0 ? `福緣不淺：${parts.join('、')}。` : '雖有奇遇，卻無所得。';
      break;
    }
    case 'loot': {
      kind = 'loot';
      const item = getEquipItem(event.outcome.itemId);
      if (item) {
        c = addToInventory(c, item.id);
        summary = `意外之喜：拾得「${item.name}」，已收入行囊。`;
      } else {
        kind = 'nothing';
        summary = '似有寶物，卻已不知所蹤。';
      }
      break;
    }
    case 'shop': {
      kind = 'shop';
      shopItemIds = event.outcome.itemIds.filter((id) => getEquipItem(id));
      summary = shopItemIds.length > 0 ? '前方集鎮熱鬧，攤販林立，可採買一番。' : '集鎮蕭條，無貨可購。';
      if (shopItemIds.length === 0) kind = 'nothing';
      break;
    }
    case 'nothing':
    default:
      kind = 'nothing';
      summary = '此行波瀾不驚，平安而歸。';
      break;
  }

  return {
    character: c,
    log: summary,
    shopItemIds,
    levelsGained,
    scene: {
      character: { name: char.name, sectId: char.sectId },
      action: 'roam',
      event: { title: event.title, kind, summary },
    },
  };
}

/**
 * 便利函式：跑完一回合後，用給定 Narrator 產生敘事文字。
 * 若 Narrator 失敗，降級回結構化 summary（ADR-001：失敗自動降級）。
 */
export async function narrateTurn(result: TurnResult, narrator: Narrator): Promise<string> {
  try {
    return await narrator.narrate(result.scene);
  } catch {
    return result.scene.event.summary;
  }
}
