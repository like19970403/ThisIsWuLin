import type { Attributes, Character, Enemy, Sect } from './types.js';
import { randInt, weightedPick, type Rng } from './rng.js';

/** 收斂到 [min, max]，永不越界（SPEC-001 Edge Case：數值不得為負/溢位）。 */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

const BASE_ATTRS: Attributes = { gen: 5, wu: 5, shen: 5, nei: 5 };

function addAttrs(a: Attributes, b: Partial<Attributes>): Attributes {
  return {
    gen: a.gen + (b.gen ?? 0),
    wu: a.wu + (b.wu ?? 0),
    shen: a.shen + (b.shen ?? 0),
    nei: a.nei + (b.nei ?? 0),
  };
}

/** 依門派建立新角色。純函式，同輸入同輸出。 */
export function createCharacter(name: string, sect: Sect): Character {
  const trimmed = name.trim();
  if (trimmed.length === 0) throw new Error('角色姓名不可為空');
  const attrs = addAttrs(BASE_ATTRS, sect.attrBonus);
  const maxHp = 20 + attrs.gen * 5;
  const maxStamina = 100;
  return {
    name: trimmed,
    sectId: sect.id,
    attrs,
    stamina: maxStamina,
    maxStamina,
    hp: maxHp,
    maxHp,
    silver: 0,
    fame: 0,
    // Phase 2 成長欄位
    level: 1,
    exp: 0,
    learnedSkillIds: [],
    equippedSkillIds: [],
    equipment: { weapon: null, armor: null },
    inventory: [],
    // Phase 2b
    consumables: {},
    titles: [],
  };
}

/** 練功消耗的體力。 */
export const TRAIN_STAMINA_COST = 20;
/** 闖蕩消耗的體力。 */
export const ROAM_STAMINA_COST = 15;

/**
 * 練功：消耗體力，依悟性隨機提升一項屬性。
 * 回傳新角色狀態 + 提升了哪一項（供敘事）。純函式（RNG 注入）。
 */
export function train(char: Character, rng: Rng): { character: Character; gainedAttr: keyof Attributes; gain: number } {
  if (char.stamina < TRAIN_STAMINA_COST) {
    throw new Error('體力不足，無法練功');
  }
  const keys: (keyof Attributes)[] = ['gen', 'wu', 'shen', 'nei'];
  const idx = randInt(rng, 0, keys.length - 1);
  const attr = keys[idx]!;
  // 悟性越高，練功收益越好
  const gain = 1 + Math.floor(char.attrs.wu / 5);
  const newAttrs = { ...char.attrs, [attr]: char.attrs[attr] + gain };
  const character: Character = {
    ...char,
    attrs: newAttrs,
    stamina: clamp(char.stamina - TRAIN_STAMINA_COST, 0, char.maxStamina),
  };
  return { character, gainedAttr: attr, gain };
}

/** 休息：恢復體力與部分氣血。 */
export function rest(char: Character): Character {
  return {
    ...char,
    stamina: char.maxStamina,
    hp: clamp(char.hp + Math.floor(char.maxHp * 0.5), 0, char.maxHp),
  };
}

/** 綜合戰力（用於決定出手先後與傷害）。 */
export function combatPower(attrs: Attributes): number {
  return attrs.gen + attrs.wu + attrs.shen + attrs.nei;
}

export interface BattleRound {
  attacker: 'player' | 'enemy';
  damage: number;
  playerHp: number;
  enemyHp: number;
}

export interface BattleResult {
  win: boolean;
  rounds: BattleRound[];
  /** 戰後玩家氣血（勝負皆更新） */
  playerHpAfter: number;
}

/**
 * 回合制切磋結算。純函式：給定玩家、敵人、RNG，輸出完整回合序列與勝負。
 * 身法高者先手；每次傷害 = 攻方戰力/5 ± 隨機浮動，收斂不為負。
 * 這是 SPEC-001 Done When 要求「戰鬥結算為純函式且有單元測試」的核心。
 */
export interface BattleOpts {
  /** 玩家有效屬性（含功法被動+裝備）。省略則用 char.attrs。 */
  playerAttrs?: Attributes;
  /** 已裝備功法的總傷害倍率（額外傷害）。省略為 0。 */
  skillMultiplier?: number;
}

export function resolveBattle(char: Character, enemy: Enemy, rng: Rng, opts: BattleOpts = {}): BattleResult {
  let playerHp = char.hp;
  let enemyHp = enemy.hp;
  const rounds: BattleRound[] = [];

  const pAttrs = opts.playerAttrs ?? char.attrs;
  const skillMult = opts.skillMultiplier ?? 0;

  const playerFirst = pAttrs.shen >= enemy.attrs.shen;
  const pPower = combatPower(pAttrs);
  const ePower = combatPower(enemy.attrs);

  const hit = (power: number, mult = 0): number => {
    const base = Math.max(1, Math.floor(power / 5));
    const swing = randInt(rng, -1, 2); // -1..+2 浮動
    // 功法額外傷害：以內力為基底乘上倍率
    const skillDmg = Math.floor(pAttrs.nei * mult);
    return Math.max(1, base + swing + skillDmg);
  };

  // 安全上限，避免任何情況下的無限迴圈
  const MAX_ROUNDS = 100;
  let turn = 0;
  let playerTurn = playerFirst;

  while (playerHp > 0 && enemyHp > 0 && turn < MAX_ROUNDS) {
    if (playerTurn) {
      const dmg = hit(pPower, skillMult);
      enemyHp = clamp(enemyHp - dmg, 0, enemy.hp);
      rounds.push({ attacker: 'player', damage: dmg, playerHp, enemyHp });
    } else {
      const dmg = hit(ePower);
      playerHp = clamp(playerHp - dmg, 0, char.maxHp);
      rounds.push({ attacker: 'enemy', damage: dmg, playerHp, enemyHp });
    }
    playerTurn = !playerTurn;
    turn += 1;
  }

  return { win: enemyHp <= 0 && playerHp > 0, rounds, playerHpAfter: playerHp };
}

/** 從事件表依權重抽一個事件 id。 */
export function pickEvent<T extends { weight: number }>(events: readonly T[], rng: Rng): T {
  if (events.length === 0) throw new Error('事件表為空');
  return weightedPick(rng, events, (e) => e.weight);
}
