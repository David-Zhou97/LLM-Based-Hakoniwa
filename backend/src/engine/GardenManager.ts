import { GardenDefinition, LorebookEntry } from '../../../shared/types/garden.js';
import { SessionState, ChatMessage, PlayerChoice } from '../../../shared/types/session.js';
import { StoryDefinition } from '../../../shared/types/story.js';
import { LLMProvider } from '../llm/LLMProvider.js';
import { PromptBuilder } from '../llm/PromptBuilder.js';
import { LorebookEngine } from './LorebookEngine.js';
import { DialogueEvaluator, EvaluatorResult } from './DialogueEvaluator.js';
import { TransferEngine, TransferEvent } from './TransferEngine.js';
import { EndingResolver } from './EndingResolver.js';
import { ScoringMatrix } from './ScoringMatrix.js';
import { ConditionParser } from './ConditionParser.js';

export interface TurnResult {
  npcMessage: string;
  choices: PlayerChoice[];
  events: TransferEvent[];
  evaluatorResult?: EvaluatorResult;
  endingTriggered?: {
    ending_id: string;
    ending_garden: string;
  };
}

export interface GardenTransitionResult {
  gardenDisplay: {
    name: string;
    description: string;
    illustration?: string;
  };
  openingMessage: string;
  choices: PlayerChoice[];
  availablePassages: Array<{ id: string; label: string }>;
}

export class GardenManager {
  private primaryLLM: LLMProvider;
  private evaluatorLLM: LLMProvider;
  private lorebookEngine: LorebookEngine;
  private dialogueEvaluator: DialogueEvaluator;
  private transferEngine: TransferEngine;
  private endingResolver: EndingResolver;
  private conditionParser: ConditionParser;

  private gardens: Map<string, GardenDefinition> = new Map();
  private story!: StoryDefinition;
  private promptBuilder!: PromptBuilder;

  constructor(primaryLLM: LLMProvider, evaluatorLLM: LLMProvider) {
    this.primaryLLM = primaryLLM;
    this.evaluatorLLM = evaluatorLLM;
    this.lorebookEngine = new LorebookEngine();
    this.dialogueEvaluator = new DialogueEvaluator(evaluatorLLM);
    this.transferEngine = new TransferEngine();
    this.endingResolver = new EndingResolver();
    this.conditionParser = new ConditionParser();
  }

  loadStory(story: StoryDefinition, gardens: Map<string, GardenDefinition>) {
    this.story = story;
    this.gardens = gardens;
    this.promptBuilder = new PromptBuilder(story.global_system_prompt);
  }

  getGarden(gardenId: string): GardenDefinition | undefined {
    return this.gardens.get(gardenId);
  }

  /**
   * Initialize a new session for a story.
   */
  createSession(sessionId: string): SessionState {
    const variables: Record<string, unknown> = {};
    for (const [key, schema] of Object.entries(this.story.variables_schema)) {
      variables[key] = schema.default;
    }

    return {
      session_id: sessionId,
      story_id: this.story.story_id,
      current_garden: this.story.start_garden,
      visited_gardens: [this.story.start_garden],
      turn_count_global: 0,
      turn_count_garden: 0,
      variables,
      scoring_matrix: ScoringMatrix.initialize(this.story.scoring_matrix_schema),
      unlocked_passages: [],
      closed_passages: [],
      chat_histories: {},
      evaluator_log: [],
    };
  }

  /**
   * Enter a garden and generate the opening message.
   */
  async enterGarden(
    gardenId: string,
    session: SessionState
  ): Promise<GardenTransitionResult> {
    const garden = this.gardens.get(gardenId);
    if (!garden) throw new Error(`Garden not found: ${gardenId}`);

    // Apply on_enter rules
    const dynamicEntries = this.getOnEnterEntries(garden, session);

    // Get constant lorebook entries for the opener
    const activeEntries = this.lorebookEngine.getActiveEntries(
      garden.lorebook,
      [],
      this.story.default_config.scan_depth
    );

    // Build system prompt
    const systemPrompt = this.promptBuilder.buildSystemPrompt(
      garden,
      activeEntries,
      dynamicEntries
    );

    // Generate opening message
    let openingMessage: string;
    let choices: string[];

    if (garden.scripted_opener) {
      openingMessage = garden.scripted_opener;
      // Generate choices for scripted opener
      const response = await this.primaryLLM.generate({
        system: systemPrompt,
        messages: [
          { role: 'user', content: `[The NPC greets the player with the following dialogue:]\n\n${openingMessage}\n\n[SYSTEM: Generate exactly 3 response choices for the player based on the NPC's opening. Format each on a new line: [CHOICE_1] ..., [CHOICE_2] ..., [CHOICE_3] ...]` },
        ],
        maxTokens: 256,
      });
      const parsed = PromptBuilder.parseChoicesFromResponse(response.content);
      choices = parsed.choices;
    } else {
      const response = await this.primaryLLM.generate({
        system: systemPrompt,
        messages: [
          { role: 'user', content: '[The player has just arrived at this location. Generate the NPC\'s opening greeting/reaction and 3 choices for the player.]' },
        ],
      });
      const parsed = PromptBuilder.parseChoicesFromResponse(response.content);
      openingMessage = parsed.npcMessage;
      choices = parsed.choices;
    }

    // Initialize chat history for this garden
    session.chat_histories[gardenId] = [
      { role: 'npc', content: openingMessage, timestamp: Date.now() },
    ];

    // Evaluate initial passages
    const availablePassages = this.transferEngine.getAvailablePassages(garden, session);
    session.unlocked_passages = availablePassages.map(p => p.id);

    // Build player choices (3 dialogue choices)
    const playerChoices: PlayerChoice[] = choices.map((text, i) => ({
      id: `choice_${i}`,
      text,
      type: 'dialogue' as const,
    }));

    return {
      gardenDisplay: {
        name: garden.display.name,
        description: garden.display.description,
        illustration: garden.display.illustration,
      },
      openingMessage,
      choices: playerChoices,
      availablePassages: availablePassages.map(p => ({ id: p.id, label: p.label })),
    };
  }

  /**
   * Process a player's chosen dialogue option and generate the NPC response.
   */
  async processTurn(
    playerMessage: string,
    session: SessionState
  ): Promise<TurnResult> {
    const garden = this.gardens.get(session.current_garden);
    if (!garden) throw new Error(`Garden not found: ${session.current_garden}`);

    // Increment turn counts
    session.turn_count_global++;
    session.turn_count_garden++;

    // Get chat history for current garden
    const chatHistory = session.chat_histories[session.current_garden] || [];

    // Add player message to history
    chatHistory.push({
      role: 'player',
      content: playerMessage,
      timestamp: Date.now(),
    });

    // Get dynamic on_enter entries
    const dynamicEntries = this.getOnEnterEntries(garden, session);

    // Get active lorebook entries (including triggered ones based on recent messages)
    const activeEntries = this.lorebookEngine.getActiveEntries(
      garden.lorebook,
      chatHistory,
      this.story.default_config.scan_depth
    );

    // Build system prompt
    const systemPrompt = this.promptBuilder.buildSystemPrompt(
      garden,
      activeEntries,
      dynamicEntries
    );

    // Build messages
    const messages = this.promptBuilder.buildMessages(chatHistory);

    // Generate NPC response
    const response = await this.primaryLLM.generate({
      system: systemPrompt,
      messages,
    });

    // Parse response to extract NPC message and choices
    const parsed = PromptBuilder.parseChoicesFromResponse(response.content);

    // Add NPC response to history
    chatHistory.push({
      role: 'npc',
      content: parsed.npcMessage,
      timestamp: Date.now(),
    });

    session.chat_histories[session.current_garden] = chatHistory;

    // Run dialogue evaluator asynchronously
    let evaluatorResult: EvaluatorResult | undefined;
    let events: TransferEvent[] = [];

    try {
      // Build recent history summary
      const recentSummary = chatHistory
        .slice(-6)
        .map(m => `${m.role}: ${m.content.substring(0, 100)}`)
        .join('\n');

      evaluatorResult = await this.dialogueEvaluator.evaluate(
        garden.garden_id,
        garden.evaluators,
        playerMessage,
        parsed.npcMessage,
        session,
        recentSummary
      );

      // Process evaluator results through transfer engine
      const transferResult = this.transferEngine.processEvaluatorResults(
        evaluatorResult,
        garden,
        this.story,
        session
      );

      // Update session from transfer engine
      Object.assign(session, transferResult.updatedSession);
      events = transferResult.events;
    } catch (error) {
      console.error('Evaluator/transfer processing failed:', error);
    }

    // Build player choices - 3 dialogue options
    const playerChoices: PlayerChoice[] = parsed.choices.map((text, i) => ({
      id: `choice_${i}`,
      text,
      type: 'dialogue' as const,
    }));

    // Check for ending condition
    let endingTriggered: TurnResult['endingTriggered'] | undefined;
    const ending = this.endingResolver.resolve(this.story.endings, session);
    if (ending && this.endingResolver.isTerminalGarden(session.current_garden, this.story.endings)) {
      endingTriggered = {
        ending_id: ending.id,
        ending_garden: ending.garden,
      };
    }

    return {
      npcMessage: parsed.npcMessage,
      choices: playerChoices,
      events,
      evaluatorResult,
      endingTriggered,
    };
  }

  /**
   * Navigate to a new garden via a passage.
   */
  async navigatePassage(
    passageId: string,
    session: SessionState
  ): Promise<GardenTransitionResult> {
    const currentGarden = this.gardens.get(session.current_garden);
    if (!currentGarden) throw new Error(`Current garden not found: ${session.current_garden}`);

    const passage = currentGarden.passages.find(p => p.id === passageId);
    if (!passage) throw new Error(`Passage not found: ${passageId}`);

    // Verify condition is met
    if (!this.conditionParser.evaluate(passage.condition, session)) {
      throw new Error(`Passage condition not met: ${passageId}`);
    }

    // Update session
    session.current_garden = passage.to;
    session.turn_count_garden = 0;
    if (!session.visited_gardens.includes(passage.to)) {
      session.visited_gardens.push(passage.to);
    }
    session.unlocked_passages = [];

    // Enter the new garden
    return this.enterGarden(passage.to, session);
  }

  /**
   * Check if current garden is an ending garden and resolve ending.
   */
  checkForEnding(session: SessionState): { ending_id: string; garden: string } | null {
    const ending = this.endingResolver.resolve(this.story.endings, session);
    if (ending) {
      return { ending_id: ending.id, garden: ending.garden };
    }
    return null;
  }

  private getOnEnterEntries(garden: GardenDefinition, session: SessionState): string[] {
    const entries: string[] = [];
    if (garden.on_enter?.inject_from_vars) {
      for (const rule of garden.on_enter.inject_from_vars) {
        if (this.conditionParser.evaluate(rule.condition, session)) {
          entries.push(rule.content);
        }
      }
    }
    return entries;
  }
}
