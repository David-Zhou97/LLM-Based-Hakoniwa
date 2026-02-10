import { GardenDefinition, LorebookEntry } from '../../../shared/types/garden.js';
import { ChatMessage } from '../../../shared/types/session.js';
import { LLMMessage } from './LLMProvider.js';

export class PromptBuilder {
  private globalSystemPrompt: string;

  constructor(globalSystemPrompt: string) {
    this.globalSystemPrompt = globalSystemPrompt;
  }

  buildSystemPrompt(
    garden: GardenDefinition,
    activeLorebookEntries: LorebookEntry[],
    dynamicEntries: string[]
  ): string {
    const parts: string[] = [];

    // Global narrative rules
    parts.push(this.globalSystemPrompt);
    parts.push('');

    // Before char defs entries
    const beforeChar = activeLorebookEntries.filter(e => e.position === 'before_char_defs');
    for (const entry of beforeChar) {
      parts.push(entry.content);
    }

    // Scene description
    parts.push(`[Current Scene: ${garden.display.name}]`);
    parts.push(garden.display.description);
    parts.push('');

    // After char defs entries
    const afterChar = activeLorebookEntries.filter(
      e => e.position === 'after_char_defs' || !e.position
    );
    for (const entry of afterChar) {
      parts.push(entry.content);
    }

    // Dynamic on_enter entries
    for (const entry of dynamicEntries) {
      parts.push(entry);
    }

    // Choice generation instruction
    parts.push('');
    parts.push('[CRITICAL INSTRUCTION: After your NPC response, you MUST generate exactly 3 dialogue choices for the player. Format them on new lines after your response, each prefixed with [CHOICE_1], [CHOICE_2], [CHOICE_3]. Each choice should be a natural thing the player could say or do next. Vary the choices: one empathetic/kind, one direct/investigative, one cautious/deflecting. Keep each choice under 80 characters. The choices should feel natural for the current conversation context.]');

    return parts.join('\n');
  }

  buildMessages(chatHistory: ChatMessage[]): LLMMessage[] {
    return chatHistory.map(msg => ({
      role: msg.role === 'player' ? 'user' as const : 'assistant' as const,
      content: msg.content,
    }));
  }

  static parseChoicesFromResponse(response: string): { npcMessage: string; choices: string[] } {
    const choices: string[] = [];
    let npcMessage = response;

    // Extract choices from response
    const choiceRegex = /\[CHOICE_(\d)\]\s*(.+)/g;
    let match;
    while ((match = choiceRegex.exec(response)) !== null) {
      choices.push(match[2].trim());
    }

    // Remove choice lines from NPC message
    npcMessage = response.replace(/\[CHOICE_\d\]\s*.+/g, '').trim();

    // If no choices were found in the expected format, generate defaults
    if (choices.length < 3) {
      return {
        npcMessage,
        choices: [
          "Tell me more about that.",
          "I see. What else do you know?",
          "Let's talk about something else.",
        ],
      };
    }

    return { npcMessage, choices: choices.slice(0, 3) };
  }
}
