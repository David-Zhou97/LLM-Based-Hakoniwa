import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GardenManager } from '../engine/GardenManager.js';
import { SessionStore } from '../state/SessionStore.js';
import { EndingResolver } from '../engine/EndingResolver.js';
import { StoryDefinition } from '../../../shared/types/story.js';
import { GardenDefinition } from '../../../shared/types/garden.js';

export function setupSocketHandlers(
  io: Server,
  gardenManager: GardenManager,
  sessionStore: SessionStore,
  story: StoryDefinition,
  gardens: Map<string, GardenDefinition>
) {
  const endingResolver = new EndingResolver();

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    let currentSessionId: string | null = null;

    socket.on('start_game', async (data: { story_id: string }) => {
      try {
        const sessionId = uuidv4();
        currentSessionId = sessionId;

        // Create new session
        const session = gardenManager.createSession(sessionId);
        await sessionStore.set(sessionId, session);

        // Enter the starting garden
        const result = await gardenManager.enterGarden(story.start_garden, session);
        await sessionStore.set(sessionId, session);

        // Send garden loaded event
        socket.emit('garden_loaded', {
          type: 'garden_loaded',
          session_id: sessionId,
          garden_id: story.start_garden,
          display: result.gardenDisplay,
          passages: result.availablePassages,
        });

        // Send opening NPC message with choices
        socket.emit('npc_message', {
          type: 'npc_message',
          message: result.openingMessage,
          choices: result.choices,
        });
      } catch (error) {
        console.error('Failed to start game:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    socket.on('player_message', async (data: { choice_id: string; message: string }) => {
      if (!currentSessionId) {
        socket.emit('error', { message: 'No active session' });
        return;
      }

      try {
        const session = await sessionStore.get(currentSessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Process the turn
        const result = await gardenManager.processTurn(data.message, session);
        await sessionStore.set(currentSessionId, session);

        // Send NPC response with new choices
        socket.emit('npc_message', {
          type: 'npc_message',
          message: result.npcMessage,
          choices: result.choices,
        });

        // Send any transfer events
        for (const event of result.events) {
          socket.emit(event.type, {
            type: event.type,
            ...event.payload,
          });
        }

        // Check if we should present ending
        if (result.endingTriggered) {
          const endingGarden = gardens.get(result.endingTriggered.ending_garden);
          socket.emit('ending_triggered', {
            type: 'ending_triggered',
            ending_id: result.endingTriggered.ending_id,
            ending_title: endingGarden?.display.name || result.endingTriggered.ending_id,
            epilogue: endingGarden?.display.description || '',
            scoring_summary: session.scoring_matrix,
          });
        }
      } catch (error) {
        console.error('Failed to process message:', error);
        socket.emit('error', { message: 'Failed to process message' });
      }
    });

    socket.on('navigate_passage', async (data: { passage_id: string }) => {
      if (!currentSessionId) {
        socket.emit('error', { message: 'No active session' });
        return;
      }

      try {
        const session = await sessionStore.get(currentSessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Navigate to new garden
        const result = await gardenManager.navigatePassage(data.passage_id, session);

        // Check if this is a terminal (ending) garden
        const isEnding = endingResolver.isTerminalGarden(
          session.current_garden,
          story.endings
        );

        await sessionStore.set(currentSessionId, session);

        // Send garden loaded event
        socket.emit('garden_loaded', {
          type: 'garden_loaded',
          garden_id: session.current_garden,
          display: result.gardenDisplay,
          passages: result.availablePassages,
        });

        // Send opening NPC message with choices
        socket.emit('npc_message', {
          type: 'npc_message',
          message: result.openingMessage,
          choices: result.choices,
        });

        // If it's an ending garden, trigger ending resolution after a few turns
        if (isEnding) {
          const ending = gardenManager.checkForEnding(session);
          if (ending) {
            const endingGarden = gardens.get(ending.garden);
            // Delay ending to let player experience the final scene
            setTimeout(() => {
              socket.emit('ending_triggered', {
                type: 'ending_triggered',
                ending_id: ending.ending_id,
                ending_title: endingGarden?.display.name || ending.ending_id,
                epilogue: endingGarden?.display.description || '',
                scoring_summary: session.scoring_matrix,
              });
            }, 500);
          }
        }
      } catch (error) {
        console.error('Failed to navigate:', error);
        socket.emit('error', { message: 'Failed to navigate passage' });
      }
    });

    socket.on('restart_story', async () => {
      if (currentSessionId) {
        await sessionStore.delete(currentSessionId);
      }
      currentSessionId = null;
      socket.emit('game_reset', { type: 'game_reset' });
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
