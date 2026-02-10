import { useReducer, useCallback, useEffect } from 'react';
import { GameState, initialGameState, ChatMessage, PlayerChoice, Passage } from '../types';
import { useSocket } from './useSocket';

type GameAction =
  | { type: 'START_GAME' }
  | { type: 'GARDEN_LOADED'; gardenId: string; display: GameState['gardenDisplay']; passages: Passage[]; sessionId?: string }
  | { type: 'NPC_MESSAGE'; message: string; choices: PlayerChoice[] }
  | { type: 'PLAYER_MESSAGE'; message: string }
  | { type: 'PASSAGE_AVAILABLE'; passage: Passage }
  | { type: 'PASSAGE_CLOSED'; passageId: string }
  | { type: 'NARRATIVE_HINT'; hint: string }
  | { type: 'ENDING_TRIGGERED'; ending: GameState['ending'] }
  | { type: 'SET_WAITING'; waiting: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

let messageCounter = 0;
function nextMessageId(): string {
  return `msg_${++messageCounter}_${Date.now()}`;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...initialGameState,
        phase: 'loading',
        isWaitingForResponse: true,
      };

    case 'GARDEN_LOADED':
      return {
        ...state,
        phase: 'playing',
        gardenId: action.gardenId,
        gardenDisplay: action.display,
        passages: action.passages.map(p => ({ ...p, is_new: false })),
        messages: [],
        choices: [],
        sessionId: action.sessionId || state.sessionId,
        isWaitingForResponse: true,
      };

    case 'NPC_MESSAGE': {
      const npcMsg: ChatMessage = {
        id: nextMessageId(),
        role: 'npc',
        content: action.message,
        timestamp: Date.now(),
      };
      return {
        ...state,
        messages: [...state.messages, npcMsg],
        choices: action.choices,
        isWaitingForResponse: false,
      };
    }

    case 'PLAYER_MESSAGE': {
      const playerMsg: ChatMessage = {
        id: nextMessageId(),
        role: 'player',
        content: action.message,
        timestamp: Date.now(),
      };
      return {
        ...state,
        messages: [...state.messages, playerMsg],
        choices: [],
        isWaitingForResponse: true,
      };
    }

    case 'PASSAGE_AVAILABLE': {
      const exists = state.passages.some(p => p.id === action.passage.id);
      if (exists) return state;
      return {
        ...state,
        passages: [...state.passages, { ...action.passage, is_new: true }],
      };
    }

    case 'PASSAGE_CLOSED':
      return {
        ...state,
        passages: state.passages.filter(p => p.id !== action.passageId),
      };

    case 'NARRATIVE_HINT': {
      const hintMsg: ChatMessage = {
        id: nextMessageId(),
        role: 'system',
        content: action.hint,
        timestamp: Date.now(),
      };
      return {
        ...state,
        messages: [...state.messages, hintMsg],
      };
    }

    case 'ENDING_TRIGGERED':
      return {
        ...state,
        phase: 'ending',
        ending: action.ending,
        isWaitingForResponse: false,
      };

    case 'SET_WAITING':
      return { ...state, isWaitingForResponse: action.waiting };

    case 'SET_ERROR':
      return { ...state, error: action.error, isWaitingForResponse: false };

    case 'RESET':
      return initialGameState;

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const { emit, on, off, connected } = useSocket();

  // Socket event handlers
  useEffect(() => {
    const handleGardenLoaded = (data: any) => {
      dispatch({
        type: 'GARDEN_LOADED',
        gardenId: data.garden_id,
        display: data.display,
        passages: data.passages || [],
        sessionId: data.session_id,
      });
    };

    const handleNpcMessage = (data: any) => {
      dispatch({
        type: 'NPC_MESSAGE',
        message: data.message,
        choices: data.choices || [],
      });
    };

    const handlePassageAvailable = (data: any) => {
      dispatch({
        type: 'PASSAGE_AVAILABLE',
        passage: {
          id: data.passage_id,
          label: data.label,
          is_new: data.is_new,
        },
      });
    };

    const handlePassageClosed = (data: any) => {
      dispatch({ type: 'PASSAGE_CLOSED', passageId: data.passage_id });
    };

    const handleNarrativeHint = (data: any) => {
      dispatch({ type: 'NARRATIVE_HINT', hint: data.hint });
    };

    const handleEndingTriggered = (data: any) => {
      dispatch({
        type: 'ENDING_TRIGGERED',
        ending: {
          id: data.ending_id,
          title: data.ending_title,
          epilogue: data.epilogue,
          scores: data.scoring_summary,
        },
      });
    };

    const handleError = (data: any) => {
      dispatch({ type: 'SET_ERROR', error: data.message });
    };

    const handleGameReset = () => {
      dispatch({ type: 'RESET' });
    };

    on('garden_loaded', handleGardenLoaded);
    on('npc_message', handleNpcMessage);
    on('passage_available', handlePassageAvailable);
    on('passage_closed', handlePassageClosed);
    on('narrative_hint', handleNarrativeHint);
    on('ending_triggered', handleEndingTriggered);
    on('error', handleError);
    on('game_reset', handleGameReset);

    return () => {
      off('garden_loaded', handleGardenLoaded);
      off('npc_message', handleNpcMessage);
      off('passage_available', handlePassageAvailable);
      off('passage_closed', handlePassageClosed);
      off('narrative_hint', handleNarrativeHint);
      off('ending_triggered', handleEndingTriggered);
      off('error', handleError);
      off('game_reset', handleGameReset);
    };
  }, [on, off]);

  const startGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
    emit('start_game', { story_id: 'murder_mystery_01' });
  }, [emit]);

  const sendChoice = useCallback((choice: PlayerChoice) => {
    if (choice.type === 'navigate' && choice.passage_id) {
      dispatch({ type: 'SET_WAITING', waiting: true });
      emit('navigate_passage', { passage_id: choice.passage_id });
    } else {
      dispatch({ type: 'PLAYER_MESSAGE', message: choice.text });
      emit('player_message', { choice_id: choice.id, message: choice.text });
    }
  }, [emit]);

  const navigatePassage = useCallback((passageId: string) => {
    dispatch({ type: 'SET_WAITING', waiting: true });
    emit('navigate_passage', { passage_id: passageId });
  }, [emit]);

  const restartGame = useCallback(() => {
    emit('restart_story', {});
    dispatch({ type: 'RESET' });
  }, [emit]);

  return {
    state,
    connected,
    startGame,
    sendChoice,
    navigatePassage,
    restartGame,
  };
}
