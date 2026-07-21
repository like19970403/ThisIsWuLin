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
export type EventOutcomeKind = 'battle' | 'fortune' | 'nothing';

/** 隨機事件定義（資料表驅動）。 */
export interface GameEvent {
  id: string;
  /** 觸發權重，越大越常出現 */
  weight: number;
  outcome:
    | { kind: 'battle'; enemyId: string }
    | { kind: 'fortune'; silver?: number; fame?: number; attr?: Partial<Attributes> }
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
