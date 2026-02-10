export interface ChatMessage {
  id: string;
  role: 'player' | 'npc' | 'system';
  content: string;
  timestamp: number;
}

export interface PlayerChoice {
  id: string;
  text: string;
  type: 'dialogue' | 'action' | 'navigate';
  passage_id?: string;
}

export interface GardenDisplay {
  name: string;
  description: string;
  illustration?: string;
}

export interface Passage {
  id: string;
  label: string;
  is_new?: boolean;
}

export interface ScoringDimension {
  value: number;
  range: [number, number];
}

export interface GameState {
  phase: 'title' | 'playing' | 'ending' | 'loading';
  sessionId: string | null;
  gardenId: string | null;
  gardenDisplay: GardenDisplay | null;
  messages: ChatMessage[];
  choices: PlayerChoice[];
  passages: Passage[];
  isWaitingForResponse: boolean;
  ending: {
    id: string;
    title: string;
    epilogue: string;
    scores: Record<string, ScoringDimension>;
  } | null;
  error: string | null;
}

export const initialGameState: GameState = {
  phase: 'title',
  sessionId: null,
  gardenId: null,
  gardenDisplay: null,
  messages: [],
  choices: [],
  passages: [],
  isWaitingForResponse: false,
  ending: null,
  error: null,
};
