import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  primaryModel: process.env.PRIMARY_MODEL || 'claude-sonnet-4-5-20250514',
  evaluatorModel: process.env.EVALUATOR_MODEL || 'claude-haiku-4-5-20250514',
  storiesPath: process.env.STORIES_PATH || '../../stories',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  maxTokensPerResponse: 1024,
  lorebookTokenBudget: 4096,
  chatHistoryTokenBudget: 8192,
  defaultScanDepth: 2,
};
