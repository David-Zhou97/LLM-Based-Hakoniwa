import { LorebookEntry, SelectiveLogic } from '../../../shared/types/garden.js';
import { ChatMessage } from '../../../shared/types/session.js';

export class LorebookEngine {
  /**
   * Scan recent messages for triggered lorebook entries and return all active entries.
   */
  getActiveEntries(
    allEntries: LorebookEntry[],
    recentMessages: ChatMessage[],
    scanDepth: number = 2
  ): LorebookEntry[] {
    const active: LorebookEntry[] = [];
    const activatedIds = new Set<string>();

    // Always include constant entries
    for (const entry of allEntries) {
      if (entry.type === 'constant') {
        active.push(entry);
        activatedIds.add(entry.id);
      }
    }

    // Get text from recent messages for keyword scanning
    const messagesToScan = recentMessages.slice(-scanDepth);
    const scanText = messagesToScan.map(m => m.content).join(' ');

    // Check triggered entries
    for (const entry of allEntries) {
      if (entry.type !== 'triggered' || activatedIds.has(entry.id)) continue;
      if (!entry.keys || entry.keys.length === 0) continue;

      const scanTarget = entry.case_sensitive ? scanText : scanText.toLowerCase();
      const depth = entry.scan_depth ?? scanDepth;
      const limitedMessages = recentMessages.slice(-depth);
      const limitedText = limitedMessages.map(m => m.content).join(' ');
      const textToScan = entry.case_sensitive ? limitedText : limitedText.toLowerCase();

      // Check primary keys - at least one must match
      const primaryMatch = entry.keys.some(key => {
        const k = entry.case_sensitive ? key : key.toLowerCase();
        return textToScan.includes(k);
      });

      if (!primaryMatch) continue;

      // Check selective logic with secondary keys
      if (entry.selective && entry.secondary_keys && entry.secondary_keys.length > 0) {
        const secondaryMatch = this.checkSelectiveLogic(
          entry.secondary_keys,
          textToScan,
          entry.selective_logic || 'AND_ANY',
          entry.case_sensitive || false
        );
        if (!secondaryMatch) continue;
      }

      active.push(entry);
      activatedIds.add(entry.id);
    }

    // Sort by insertion_order
    return active.sort((a, b) => {
      if (a.type === 'constant' && b.type !== 'constant') return -1;
      if (a.type !== 'constant' && b.type === 'constant') return 1;
      return (a.insertion_order ?? 0) - (b.insertion_order ?? 0);
    });
  }

  private checkSelectiveLogic(
    secondaryKeys: string[],
    text: string,
    logic: SelectiveLogic,
    caseSensitive: boolean
  ): boolean {
    const matches = secondaryKeys.map(key => {
      const k = caseSensitive ? key : key.toLowerCase();
      return text.includes(k);
    });

    switch (logic) {
      case 'AND_ANY':
        return matches.some(m => m);
      case 'AND_ALL':
        return matches.every(m => m);
      case 'NOT_ANY':
        return !matches.some(m => m);
      case 'NOT_ALL':
        return !matches.every(m => m);
      default:
        return matches.some(m => m);
    }
  }
}
