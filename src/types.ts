export type CardSymbol =
  | 'star'
  | 'chariot'
  | 'hermit'
  | 'beacon'
  | 'abyss'
  | 'prism'
  | 'rings'
  | 'monolith'
  | 'fool'
  | 'world'
  | 'sun'
  | 'lovers'
  | 'watcher';

export interface EncounterData {
  id: string;
  name: string;
  theme: string;
  prompt: string;
  type:
    | 'seedling'
    | 'beacon'
    | 'hierophant'
    | 'priestess'
    | 'emperor'
    | 'monolith'
    | 'prism'
    | 'lantern'
    | 'spring'
    | 'chariot'
    | 'astrolabe'
    | 'twin_core'
    | 'gateway'
    | 'sun';
  visualHint: string;
  giftReactionOffered: string;  // Reaction when red gift is given
  giftReactionKept: string;     // Reaction when gift is kept
}

export interface TarotCardDef {
  id: string;
  numeral: string;              // e.g. "0", "Ⅰ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅸ", "Ⅹ", "ⅩⅥ", "ⅩⅦ", "ⅩⅧ", "ⅩⅨ", "ⅩⅩⅠ"
  nameEn: string;               // e.g. "THE STAR"
  nameZh: string;               // e.g. "星辰"
  keywordUpright: string;       // e.g. "GUIDANCE · 微光注照"
  keywordReversed: string;      // e.g. "INNER LIGHT · 潜渊自愈"
  archetype: 'light' | 'void' | 'fate' | 'bond' | 'creation' | 'journey';
  symbol: CardSymbol;
  encounter: EncounterData;
}

// Alias for TarotCardDef
export type TarotCardInfo = TarotCardDef;

export interface StageRecord {
  stage: number;                // 1 (起因), 2 (经过), or 3 (结果)
  stageName?: '起因' | '经过' | '结果';
  card: TarotCardDef;
  orientation: 'upright' | 'reversed';
  offeredGift: boolean;
  encounterName: string;
  encounterDesc: string;
}

export interface LLMInterpretation {
  metaphorTitle: string;
  situationReading: string;
  psychologicalInsight: string;
  selfAwareness: string;
  fallback?: boolean;
  fallbackReason?: string;
}

export type GamePhase =
  | 'card_selection'           // 选一张塔罗牌（三选一）
  | 'approaching'              // 角色走过去
  | 'encounter_decision'        // 遇到那个东西，把红色礼物给它或者不给
  | 'card_resolution'          // 给予礼物翻转塔罗的顺位或逆位
  | 'final_reading';           // 三次重复结束后，LLM生成具象比喻解读

export type WalkPace = 'pause' | 'walk' | 'trot';
export type CameraView = 'normal' | 'cinematic' | 'close';

// Player stats
export interface PlayerStats {
  bond: number;
  insight: number;
  starlight: number;
  voidAffinity: number;
}

export interface ChronicleEntry {
  timestamp: string;
  stage: number;
  card: TarotCardDef;
  orientation: 'upright' | 'reversed';
  offeredGift: boolean;
  encounterName: string;
  reflection: string;
}

// Legacy definitions for compatibility
export interface Choice {
  id: string;
  tarot?: {
    numeral: string;
    nameEn: string;
    nameZh: string;
    keyword: string;
    archetype: string;
    symbol: CardSymbol;
  };
  text: string;
  subtext?: string;
  nextNodeId: string;
  effects: Partial<PlayerStats>;
  narration: string;
  sceneryShift?: string;
}

export interface StoryNode {
  id: string;
  chapter: string;
  title: string;
  prompt: string;
  speaker?: string;
  choices: Choice[];
  isEnding?: boolean;
  endingData?: Ending;
}

export interface Ending {
  id: string;
  title: string;
  subtitle: string;
  epitaph: string;
  fullPoem: string[];
  theme: string;
}
