export interface GardenDisplay {
  name: string;
  description: string;
  illustration?: string;
  ambient_audio?: string;
}

export type LorebookPosition = 'before_char_defs' | 'after_char_defs' | `at_depth_${number}`;

export type SelectiveLogic = 'AND_ANY' | 'AND_ALL' | 'NOT_ANY' | 'NOT_ALL';

export interface LorebookEntry {
  id: string;
  type: 'constant' | 'triggered';
  position?: LorebookPosition;
  content: string;
  // For triggered entries
  keys?: string[];
  case_sensitive?: boolean;
  scan_depth?: number;
  selective?: boolean;
  secondary_keys?: string[];
  selective_logic?: SelectiveLogic;
  insertion_order?: number;
}

export interface EvaluatorAction {
  set_var?: Record<string, unknown>;
  increment_score?: Record<string, number>;
  unlock_passage?: string;
  close_passage?: string;
  emit_hint?: string;
}

export interface EvaluatorDefinition {
  id: string;
  description: string;
  method: 'semantic' | 'turn_count';
  threshold?: number;
  on_true: EvaluatorAction;
}

export interface PassageDefinition {
  id: string;
  to: string;
  label: string;
  condition: string;
}

export interface OnEnterRule {
  condition: string;
  entry_id: string;
  content: string;
}

export interface GardenDefinition {
  garden_id: string;
  display: GardenDisplay;
  lorebook: LorebookEntry[];
  evaluators: EvaluatorDefinition[];
  passages: PassageDefinition[];
  on_enter?: {
    inject_from_vars?: OnEnterRule[];
  };
  scripted_opener?: string;
}
