export interface ChatMessage {
  role: 'player' | 'npc' | 'system';
  content: string;
  timestamp: number;
}

export interface ScoringDimension {
  value: number;
  range: [number, number];
}

export interface SessionState {
  session_id: string;
  story_id: string;
  current_garden: string;
  visited_gardens: string[];
  turn_count_global: number;
  turn_count_garden: number;
  variables: Record<string, unknown>;
  scoring_matrix: Record<string, ScoringDimension>;
  unlocked_passages: string[];
  closed_passages: string[];
  chat_histories: Record<string, ChatMessage[]>;
  evaluator_log: EvaluatorLogEntry[];
}

export interface EvaluatorLogEntry {
  turn: number;
  garden: string;
  results: Record<string, boolean>;
  timestamp: string;
}

export interface PlayerChoice {
  id: string;
  text: string;
  type: 'dialogue' | 'action' | 'navigate';
  passage_id?: string;
}
