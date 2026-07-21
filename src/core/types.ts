// 核心型別定義 — 遊戲邏輯與 UI/AI 皆依賴此處，不依賴任何框架。

/** 角色四大屬性。數值型皮膚可換，語意固定。 */
export interface Attributes {
  /** 根骨：影響體力與傷害承受 */
  gen: number;
  /** 悟性：影響練功效率 */
  wu: number;
  /** 身法：影響出手先後與閃避 */
  shen: number;
  /** 內力：招式威力來源 */
  nei: number;
}

/** 門派定義（資料表驅動，見 data/sects.ts）。 */
export interface Sect {
  id: string;
  name: string;
  description: string;
  /** 建角時套用的屬性加成 */
  attrBonus: Partial<Attributes>;
}

/** 裝備欄位。Phase 2 先只有武器與防具兩欄。 */
export interface Equipment {
  weapon: string | null;
  armor: string | null;
}

/** 一名角色的完整狀態。這就是存檔的核心。 */
export interface Character {
  name: string;
  sectId: string;
  attrs: Attributes;
  /** 體力：行動消耗，歸零僅能休息 */
  stamina: number;
  maxStamina: number;
  /** 氣血：戰鬥中的生命值 */
  hp: number;
  maxHp: number;
  silver: number;
  /** 聲望：江湖名聲 */
  fame: number;

  // ─── Phase 2：成長 ───
  /** 等級 */
  level: number;
  /** 當前經驗值（達門檻升級後歸零累計） */
  exp: number;
  /** 已學會的功法 id */
  learnedSkillIds: string[];
  /** 已裝備上陣的功法 id（受上限約束） */
  equippedSkillIds: string[];
  /** 穿戴中的裝備 */
  equipment: Equipment;
  /** 背包：持有但未穿戴的裝備 id */
  inventory: string[];
}

/** 功法定義（資料表驅動）。Phase 2：被動屬性加成 + 戰鬥發動的傷害倍率。 */
export interface Skill {
  id: string;
  name: string;
  description: string;
  /** 學習所需最低等級 */
  reqLevel: number;
  /** 學習花費銀兩 */
  cost: number;
  /** 被動：裝備後永久附加的屬性 */
  passive: Partial<Attributes>;
  /** 主動：戰鬥中每回合的額外傷害倍率（以內力為基底），0 表示純被動 */
  damageMultiplier: number;
}

/** 裝備種類。 */
export type EquipSlot = 'weapon' | 'armor';

/** 裝備定義（資料表驅動）。固定屬性加成，Phase 2 不做強化。 */
export interface EquipItem {
  id: string;
  name: string;
  slot: EquipSlot;
  description: string;
  /** 售價（商店購買 / 估值） */
  price: number;
  /** 穿戴後附加的屬性 */
  bonus: Partial<Attributes>;
}

/** 敵人定義（資料表驅動）。 */
export interface Enemy {
  id: string;
  name: string;
  attrs: Attributes;
  hp: number;
  /** 擊敗後獎勵 */
  reward: { silver: number; fame: number };
}

/** 玩家可執行的行動種類。 */
export type ActionKind = 'train' | 'roam' | 'rest';

/** 隨機事件的結果種類。 */
export type EventOutcomeKind = 'battle' | 'fortune' | 'loot' | 'shop' | 'nothing';

/** 隨機事件定義（資料表驅動）。 */
export interface GameEvent {
  id: string;
  /** 觸發權重，越大越常出現 */
  weight: number;
  outcome:
    | { kind: 'battle'; enemyId: string }
    | { kind: 'fortune'; silver?: number; fame?: number; attr?: Partial<Attributes> }
    | { kind: 'loot'; itemId: string }
    | { kind: 'shop'; itemIds: string[] }
    | { kind: 'nothing' };
  /** 給 Narrator 的事件標題，作為敘事骨架 */
  title: string;
}

/**
 * 傳給 Narrator 的結構化情境。
 * Narrator 只依此產生文字皮膚，不改變任何遊戲數值。
 */
export interface SceneContext {
  character: Pick<Character, 'name' | 'sectId'>;
  action: ActionKind;
  /** 這一回合實際發生了什麼（由遊戲邏輯決定，非 AI 決定） */
  event: {
    title: string;
    kind: EventOutcomeKind;
    /** 人類可讀的結果摘要，例如「切磋獲勝，獲得銀兩×50」 */
    summary: string;
  };
}

/** 敘事供應器介面 — 遊戲邏輯只認這個，不認是哪家 AI（ADR-001 §決策.5）。 */
export interface Narrator {
  narrate(context: SceneContext): Promise<string>;
}
