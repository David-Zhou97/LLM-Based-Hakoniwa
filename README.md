# NIWA - Conversational Hakoniwa Game Engine

A narrative game engine that combines LLM-driven free-form dialogue with bounded, hand-crafted story spaces ("gardens"). Players converse with AI characters, and their choices, tone, and behavior are silently evaluated to unlock passages between gardens, ultimately converging toward multiple endings.

## Architecture

```
Frontend (React + Tailwind) <-> WebSocket <-> Backend (Node.js + Express)
                                                  |
                                          Garden Manager
                                          Lorebook Engine
                                          Dialogue Evaluator
                                          Transfer Engine
                                          Ending Resolver
                                                  |
                                         LLM (Claude API)
```

## Quick Start

### Prerequisites
- Node.js 18+
- An Anthropic API key

### Setup

1. Install dependencies:
```bash
npm run install:all
```

2. Configure the backend:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your ANTHROPIC_API_KEY
```

3. Start development servers:
```bash
npm run dev
```

This starts:
- Backend on http://localhost:3001
- Frontend on http://localhost:5173

### How to Play

1. Open http://localhost:5173 in your browser
2. Click "Begin Investigation" to start the mystery
3. Each turn, you'll see **3 dialogue choices** - pick one to continue the conversation
4. As you uncover information, new locations will become available in the navigation bar
5. Your approach (empathetic vs aggressive, thorough vs hasty) determines which of 4 endings you get

## Project Structure

```
niwa/
├── frontend/          # React + TypeScript + Tailwind CSS
│   └── src/
│       ├── components/  # ScenePanel, ChatArea, ChoicePanel, NavBar, etc.
│       ├── hooks/       # useSocket, useGameState
│       └── types/       # Frontend type definitions
├── backend/           # Node.js + Express + Socket.IO
│   └── src/
│       ├── api/         # REST routes + WebSocket handlers
│       ├── engine/      # GardenManager, LorebookEngine, ConditionParser,
│       │                # DialogueEvaluator, TransferEngine, ScoringMatrix,
│       │                # EndingResolver
│       ├── llm/         # LLM provider abstraction (Anthropic)
│       ├── state/       # Session store (in-memory)
│       └── story/       # Story loader + validator
├── shared/            # Shared TypeScript types
│   └── types/
├── stories/           # Story content (JSON)
│   └── murder_mystery_01/
│       ├── story.json
│       └── gardens/     # Individual garden definitions
└── tools/             # CLI utilities
```

## Included Story: "Echoes at Eleven"

A murder mystery with 6 explorable locations and 4 distinct endings:

- **Corner Cafe** - Talk to Kobayashi, the waitress who saw something that night
- **Police Station** - Detective Tanaka has information but needs convincing
- **The Lantern** - An underground bar where secrets are traded
- **Moriyama's Apartment** - The victim's ransacked home hides one last secret
- **The Confrontation** - Face the suspect with whatever you've gathered
- **4 Endings** - Justice, Dark Justice, Bittersweet, and the Hidden True Ending

## Game Mechanics

### Gardens (Scenes)
Each garden is a bounded conversational context with its own NPC, lorebook entries, and evaluation rules. The NPC's behavior shifts based on triggered keywords in the conversation.

### 3-Choice System
Instead of free-text input, each turn presents exactly 3 dialogue options:
- One empathetic/kind option
- One direct/investigative option
- One cautious/deflecting option

### Invisible Evaluation
After each turn, a lightweight LLM evaluator analyzes the conversation to detect:
- Clue discoveries
- NPC attitude shifts
- Narrative flags (empathy, intimidation, truth-finding)

### Scoring Matrix
Four dimensions tracked across the entire playthrough:
- **Truth** (0-100): How much of the mystery you uncovered
- **Morality** (-50 to 50): How ethical your methods were
- **Empathy** (0-100): How compassionate you were to NPCs
- **Danger** (0-100): How much risk you took on

### Endings
Endings are determined by your final scores:
1. **Hidden Ending** (best): All clues + high empathy
2. **Justice Ending**: High truth + positive morality
3. **Dark Ending**: High truth + negative morality
4. **Bittersweet Ending**: Low truth + high empathy

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, Socket.IO, TypeScript
- **LLM**: Claude Sonnet 4.5 (dialogue) + Claude Haiku 4.5 (evaluation)
- **State**: In-memory (upgradeable to Redis)

## Creating Your Own Story

1. Create a new directory under `stories/`
2. Define `story.json` with your world graph, variables, and endings
3. Create garden JSON files for each scene
4. Define lorebook entries, evaluators, and passages
5. Run with `STORIES_PATH` pointing to your stories directory

See `stories/murder_mystery_01/` for a complete example.
