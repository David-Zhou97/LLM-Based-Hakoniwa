import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
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

  // Initialize story loader — resolve relative to this file's directory
  const storiesPath = path.resolve(__dirname, config.storiesPath);
  const storyLoader = new StoryLoader(storiesPath);
  console.log(`Stories path: ${storiesPath}`);

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
    console.error(`Looked in: ${path.join(storiesPath, defaultStoryId, 'story.json')}`);
    process.exit(1);
  }

  // Initialize game engine
  const gardenManager = new GardenManager(primaryLLM, evaluatorLLM);
  gardenManager.loadStory(story, gardens);

  // Initialize session store
  const sessionStore = new MemoryStore();

  // Setup REST routes
  app.use(createRoutes(storyLoader));

  // Serve frontend static files only if the build exists (production mode)
  const frontendBuildPath = path.resolve(__dirname, '../../frontend/dist');
  const frontendIndexPath = path.join(frontendBuildPath, 'index.html');

  if (fs.existsSync(frontendIndexPath)) {
    console.log(`Serving frontend from: ${frontendBuildPath}`);
    app.use(express.static(frontendBuildPath));
    app.get('*', (_req, res) => {
      res.sendFile(frontendIndexPath);
    });
  } else {
    console.log(`Frontend build not found at ${frontendBuildPath}`);
    console.log(`In development, run the frontend separately: cd frontend && npm run dev`);
  }

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
    console.log(`\nNIWA server running on http://localhost:${config.port}`);
    console.log(`WebSocket listening on ws://localhost:${config.port}`);
    if (!fs.existsSync(frontendIndexPath)) {
      console.log(`\nOpen http://localhost:5173 in your browser (Vite dev server)`);
    } else {
      console.log(`\nOpen http://localhost:${config.port} in your browser`);
    }
  });
}

main().catch(console.error);
