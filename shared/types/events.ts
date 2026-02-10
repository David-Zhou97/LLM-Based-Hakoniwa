import { GardenDisplay, PassageDefinition } from './garden';
import { ChatMessage, PlayerChoice, ScoringDimension } from './session';

// Backend -> Frontend events
export interface GardenLoadedEvent {
  type: 'garden_loaded';
  garden_id: string;
  display: GardenDisplay;
  passages: Array<{ id: string; label: string }>;
}

export interface NpcMessageEvent {
  type: 'npc_message';
  message: string;
  choices: PlayerChoice[];
}

export interface PassageAvailableEvent {
  type: 'passage_available';
  passage_id: string;
  label: string;
  is_new: boolean;
}

export interface PassageClosedEvent {
  type: 'passage_closed';
  passage_id: string;
}

export interface NarrativeHintEvent {
  type: 'narrative_hint';
  hint: string;
}

export interface EndingTriggeredEvent {
  type: 'ending_triggered';
  ending_id: string;
  ending_title: string;
  epilogue: string;
  scoring_summary: Record<string, ScoringDimension>;
}

export interface ChoicesUpdateEvent {
  type: 'choices_update';
  choices: PlayerChoice[];
}

export type ServerEvent =
  | GardenLoadedEvent
  | NpcMessageEvent
  | PassageAvailableEvent
  | PassageClosedEvent
  | NarrativeHintEvent
  | EndingTriggeredEvent
  | ChoicesUpdateEvent;

// Frontend -> Backend events
export interface PlayerMessageEvent {
  type: 'player_message';
  choice_id: string;
  message: string;
}

export interface NavigatePassageEvent {
  type: 'navigate_passage';
  passage_id: string;
}

export interface RestartStoryEvent {
  type: 'restart_story';
  story_id: string;
}

export interface StartGameEvent {
  type: 'start_game';
  story_id: string;
}

export type ClientEvent =
  | PlayerMessageEvent
  | NavigatePassageEvent
  | RestartStoryEvent
  | StartGameEvent;
