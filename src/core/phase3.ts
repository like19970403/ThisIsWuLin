import type { Attributes, Character, Quest } from './types.js';
import { RANKS, getRank } from './data/ranks.js';
import { getRecipe } from './data/recipes.js';
import { QUESTS, getQuest } from './data/quests.js';
import { clamp } from './rules.js';
import { addToInventory } from './loadout.js';

function addAttr(a: Attributes, d: Partial<Attributes>): Attributes {
  return {
    gen: a.gen + (d.gen ?? 0),
    wu: a.wu + (d.wu ?? 0),
    shen: a.shen + (d.shen ?? 0),
    nei: a.nei + (d.nei ?? 0),
  };
}

/** 套用屬性增益並在動到根骨時重算 maxHp。 */
function applyAttrReward(c: Character, attr: Partial<Attributes>): Character {
  const attrs = addAttr(c.attrs, attr);
  const maxHp = 20 + attrs.gen * 5;
  return { ...c, attrs, maxHp, hp: clamp(c.hp, 0, maxHp) };
}

// ─── 職位晉升 ───

/** 依聲望，回傳角色「應得」的最高職位（線性階級）。 */
export function rankFor(fame: number): (typeof RANKS)[number] {
  let best = RANKS[0]!;
  for (const r of RANKS) {
    if (fame >= r.reqFame && r.order > best.order) best = r;
  }
  return best;
}

export interface PromoteResult {
  character: Character;
  /** 這次晉升到的職位 id 陣列（可能連升；空陣列 = 未晉升） */
  promotedTo: string[];
}

/**
 * 依當前聲望晉升職位（可連升多階），逐階發放晉升獎勵。純函式、冪等。
 */
export function promote(char: Character): PromoteResult {
  const target = rankFor(char.fame);
  const current = getRank(char.rankId) ?? RANKS[0]!;
  if (target.order <= current.order) return { character: char, promotedTo: [] };

  let c = char;
  const promotedTo: string[] = [];
  // 逐階發獎（current+1 ... target）
  for (const r of RANKS) {
    if (r.order > current.order && r.order <= target.order) {
      if (r.reward.silver) c = { ...c, silver: c.silver + r.reward.silver };
      if (r.reward.attr) c = applyAttrReward(c, r.reward.attr);
      if (r.reward.itemId) c = addToInventory(c, r.reward.itemId);
      promotedTo.push(r.id);
    }
  }
  c = { ...c, rankId: target.id };
  return { character: c, promotedTo };
}

// ─── 鑄造 ───

/** 鑄造一件裝備：檢查材料+銀兩，扣除後產出入背包。純函式。失敗 throw。 */
export function craft(char: Character, recipeId: string): Character {
  const recipe = getRecipe(recipeId);
  if (!recipe) throw new Error('查無此配方');
  if (char.silver < recipe.cost) throw new Error('銀兩不足');
  // 檢查材料
  for (const [mid, need] of Object.entries(recipe.materials)) {
    if ((char.materials[mid] ?? 0) < need) throw new Error('材料不足');
  }
  // 扣材料
  const materials = { ...char.materials };
  for (const [mid, need] of Object.entries(recipe.materials)) {
    const left = (materials[mid] ?? 0) - need;
    if (left <= 0) delete materials[mid];
    else materials[mid] = left;
  }
  return addToInventory({ ...char, silver: char.silver - recipe.cost, materials }, recipe.output);
}

/** 取得材料入庫（掉落/購買）。 */
export function addMaterial(char: Character, materialId: string, count = 1): Character {
  return { ...char, materials: { ...char.materials, [materialId]: (char.materials[materialId] ?? 0) + count } };
}

// ─── 任務 ───

function goalTarget(q: Quest): number {
  switch (q.goal.kind) {
    case 'defeat':
      return q.goal.count;
    case 'reachLevel':
      return q.goal.level;
    case 'reachFame':
      return q.goal.fame;
  }
}

/** 任務是否已達成（依 progress 與角色狀態）。 */
export function isQuestComplete(char: Character, quest: Quest): boolean {
  const st = char.quests[quest.id];
  if (!st?.accepted) return false;
  switch (quest.goal.kind) {
    case 'defeat':
      return st.progress >= quest.goal.count;
    case 'reachLevel':
      return char.level >= quest.goal.level;
    case 'reachFame':
      return char.fame >= quest.goal.fame;
  }
}

/** 接受任務。冪等（已接受不重複）。 */
export function acceptQuest(char: Character, questId: string): Character {
  const q = getQuest(questId);
  if (!q) throw new Error('查無此任務');
  if (char.quests[questId]?.accepted) return char;
  return {
    ...char,
    quests: { ...char.quests, [questId]: { accepted: true, progress: 0, claimed: false } },
  };
}

/**
 * 推進所有進行中任務的進度。純函式。
 * event: 'defeat' 時所有 defeat 型任務 +1。reachLevel/reachFame 型不需 progress（讀角色狀態）。
 */
export function advanceQuests(char: Character, event: 'defeat'): Character {
  const quests = { ...char.quests };
  let changed = false;
  for (const q of QUESTS) {
    const st = quests[q.id];
    if (!st?.accepted || st.claimed) continue;
    if (q.goal.kind === 'defeat' && event === 'defeat' && st.progress < q.goal.count) {
      quests[q.id] = { ...st, progress: st.progress + 1 };
      changed = true;
    }
  }
  return changed ? { ...char, quests } : char;
}

export interface ClaimResult {
  character: Character;
  reward: Quest['reward'];
}

/** 繳交已完成任務領獎。未完成/已領則 throw。 */
export function claimQuest(char: Character, questId: string): ClaimResult {
  const q = getQuest(questId);
  if (!q) throw new Error('查無此任務');
  const st = char.quests[questId];
  if (!st?.accepted) throw new Error('尚未接受此任務');
  if (st.claimed) throw new Error('已領取獎勵');
  if (!isQuestComplete(char, q)) throw new Error('任務尚未完成');

  let c = char;
  const r = q.reward;
  if (r.silver) c = { ...c, silver: c.silver + r.silver };
  if (r.fame) c = { ...c, fame: c.fame + r.fame };
  if (r.attr) c = applyAttrReward(c, r.attr);
  if (r.itemId) c = addToInventory(c, r.itemId);
  // exp 交由呼叫端用 gainExp 處理（避免循環相依）；這裡標記已領
  c = { ...c, quests: { ...c.quests, [questId]: { ...st, claimed: true } } };
  return { character: c, reward: r };
}

/** 便利：計算某任務的進度顯示（current/target）。 */
export function questProgress(char: Character, quest: Quest): { current: number; target: number } {
  const st = char.quests[quest.id];
  const target = goalTarget(quest);
  let current = st?.progress ?? 0;
  if (quest.goal.kind === 'reachLevel') current = Math.min(char.level, target);
  if (quest.goal.kind === 'reachFame') current = Math.min(char.fame, target);
  return { current, target };
}
