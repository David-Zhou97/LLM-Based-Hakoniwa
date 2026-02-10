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
- An Anthropic API key ([get one here](https://console.anthropic.com/))

### Step 1: Install all dependencies

From the **project root directory**:

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Step 2: Configure your API key

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` and replace `your_api_key_here` with your actual Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### Step 3: Start the application

You have two options:

#### Option A: Development mode (two terminals)

Terminal 1 — start the backend:
```bash
cd backend
npm run dev
```

Terminal 2 — start the frontend:
```bash
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

#### Option B: Production mode (single server)

Build the frontend first, then run the backend which serves it:

```bash
cd frontend && npm run build && cd ..
cd backend && npm run dev
```

Then open **http://localhost:3001** in your browser.

### Step 4: Play

1. Open the URL from Step 3 in your browser
2. Click **"Begin Investigation"** to start the mystery
3. Each turn, you'll see **3 dialogue choices** — pick one to continue the conversation
4. As you uncover information, new locations will appear in the navigation bar at the bottom
5. Your approach (empathetic vs aggressive, thorough vs hasty) determines which of 4 endings you get

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Failed to load story` | Make sure you're running the backend from the `backend/` directory, not the project root |
| `Connecting to server...` on frontend | Make sure the backend is running on port 3001 |
| `ANTHROPIC_API_KEY` errors | Make sure you copied `.env.example` to `.env` and added your real API key |
| Frontend shows blank page | In dev mode, make sure you open `http://localhost:5173`, not `http://localhost:3001` |

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

See `stories/murder_mystery_01/` for a complete example.
