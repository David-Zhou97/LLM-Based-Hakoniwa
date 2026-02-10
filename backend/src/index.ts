import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config.js';
import { AnthropicProvider } from './llm/AnthropicProvider.js';
import { GardenManager } from './engine/GardenManager.js';
import { MemoryStore } from './state/MemoryStore.js';
import { StoryLoader } from './story/StoryLoader.js';
import { createRoutes } from './api/routes.js';
import { setupSocketHandlers } from './api/socketHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const app = express();
  const httpServer = createServer(app);

  // Configure CORS
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  // Initialize LLM providers
  const primaryLLM = new AnthropicProvider(config.primaryModel);
  const evaluatorLLM = new AnthropicProvider(config.evaluatorModel);

  // Initialize story loader
  const storiesPath = path.resolve(__dirname, config.storiesPath);
  const storyLoader = new StoryLoader(storiesPath);

  // Load the default story
  const defaultStoryId = 'murder_mystery_01';
  let story, gardens;
  try {
    const loaded = storyLoader.loadStory(defaultStoryId);
    story = loaded.story;
    gardens = loaded.gardens;
    console.log(`Loaded story: ${story.metadata.title} (${gardens.size} gardens)`);
  } catch (error) {
    console.error(`Failed to load story ${defaultStoryId}:`, error);
    process.exit(1);
  }

  // Initialize game engine
  const gardenManager = new GardenManager(primaryLLM, evaluatorLLM);
  gardenManager.loadStory(story, gardens);

  // Initialize session store
  const sessionStore = new MemoryStore();

  // Setup REST routes
  app.use(createRoutes(storyLoader));

  // Serve frontend static files in production
  const frontendBuildPath = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendBuildPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });

  // Setup WebSocket
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  setupSocketHandlers(io, gardenManager, sessionStore, story, gardens);

  // Start server
  httpServer.listen(config.port, () => {
    console.log(`NIWA server running on http://localhost:${config.port}`);
    console.log(`WebSocket listening on ws://localhost:${config.port}`);
  });
}

main().catch(console.error);
