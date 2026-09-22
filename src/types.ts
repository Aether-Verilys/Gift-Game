export interface Choice {
  id: string;
  text: string;
  subtext?: string;
  nextNodeId: string;
  effects: {
    bond?: number;        // 羁绊 (Human & Steed)
    insight?: number;     // 哲思 (Cosmic philosophy)
    starlight?: number;   // 灵曦 (Warmth / Hope)
    voidAffinity?: number;// 虚无 (Quiet cosmic acceptance)
  };
  narration: string;      // Reflection when chosen
  sceneryShift?: 'aurora' | 'meteor_shower' | 'monolith' | 'crystal_field' | 'black_hole' | 'rings' | 'normal';
}

export interface StoryNode {
  id: string;
  chapter: string;
  title: string;
  prompt: string;        // The mid-air dilemma / observation
  speaker?: string;      // "独白" | "白马的目光" | "宇宙的低语" | "星标残响"
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

export interface PlayerStats {
  bond: number;
  insight: number;
  starlight: number;
  voidAffinity: number;
}

export interface ChronicleEntry {
  timestamp: string;
  chapter: string;
  prompt: string;
  choiceMade: string;
  reflection: string;
  statsDelta: Partial<PlayerStats>;
}

export type WalkPace = 'pause' | 'walk' | 'trot';
export type CameraView = 'normal' | 'cinematic' | 'close';
