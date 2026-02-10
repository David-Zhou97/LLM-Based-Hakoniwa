import fs from 'fs';
import path from 'path';
import { StoryDefinition } from '../../../shared/types/story.js';
import { GardenDefinition } from '../../../shared/types/garden.js';

export class StoryLoader {
  private storiesPath: string;

  constructor(storiesPath: string) {
    this.storiesPath = storiesPath;
  }

  loadStory(storyId: string): {
    story: StoryDefinition;
    gardens: Map<string, GardenDefinition>;
  } {
    const storyDir = path.resolve(this.storiesPath, storyId);
    const storyFile = path.join(storyDir, 'story.json');

    if (!fs.existsSync(storyFile)) {
      throw new Error(`Story file not found: ${storyFile}`);
    }

    const storyJson = fs.readFileSync(storyFile, 'utf-8');
    const story: StoryDefinition = JSON.parse(storyJson);

    // Load all garden definitions
    const gardens = new Map<string, GardenDefinition>();
    for (const [gardenId, gardenPath] of Object.entries(story.gardens)) {
      const fullPath = path.join(storyDir, gardenPath);
      if (!fs.existsSync(fullPath)) {
        console.warn(`Garden file not found: ${fullPath}, skipping...`);
        continue;
      }
      const gardenJson = fs.readFileSync(fullPath, 'utf-8');
      const garden: GardenDefinition = JSON.parse(gardenJson);
      gardens.set(gardenId, garden);
    }

    return { story, gardens };
  }

  listStories(): string[] {
    if (!fs.existsSync(this.storiesPath)) {
      return [];
    }
    return fs.readdirSync(this.storiesPath).filter(dir => {
      const storyFile = path.join(this.storiesPath, dir, 'story.json');
      return fs.existsSync(storyFile);
    });
  }
}
