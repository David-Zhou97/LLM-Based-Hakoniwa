export interface StoryMetadata {
  title: string;
  author: string;
  genre: string;
  estimated_playtime_minutes: number;
  language: string;
  content_rating: string;
}

export interface VariableSchema {
  type: 'boolean' | 'string' | 'integer' | 'number';
  default: unknown;
  enum?: string[];
  min?: number;
  max?: number;
}

export interface ScoringSchema {
  range: [number, number];
  default: number;
}

export interface EndingDefinition {
  id: string;
  garden: string;
  condition: string;
  priority: number;
}

export interface StoryConfig {
  primary_model: string;
  evaluator_model: string;
  lorebook_token_budget: number;
  chat_history_token_budget: number;
  scan_depth: number;
  max_turns_per_garden: number;
}

export interface StoryDefinition {
  story_id: string;
  version: string;
  metadata: StoryMetadata;
  global_system_prompt: string;
  default_config: StoryConfig;
  variables_schema: Record<string, VariableSchema>;
  scoring_matrix_schema: Record<string, ScoringSchema>;
  narrative_flag_effects: Record<string, Record<string, number>>;
  start_garden: string;
  gardens: Record<string, string>;
  endings: EndingDefinition[];
}
