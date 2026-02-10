import { Router } from 'express';
import { StoryLoader } from '../story/StoryLoader.js';

export function createRoutes(storyLoader: StoryLoader): Router {
  const router = Router();

  router.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  router.get('/api/stories', (_req, res) => {
    try {
      const stories = storyLoader.listStories();
      res.json({ stories });
    } catch (error) {
      res.status(500).json({ error: 'Failed to list stories' });
    }
  });

  router.get('/api/stories/:storyId', (req, res) => {
    try {
      const { story } = storyLoader.loadStory(req.params.storyId);
      res.json({
        story_id: story.story_id,
        metadata: story.metadata,
        start_garden: story.start_garden,
      });
    } catch (error) {
      res.status(404).json({ error: 'Story not found' });
    }
  });

  return router;
}
