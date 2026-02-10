import { SessionState } from '../../../shared/types/session.js';
import { SessionStore } from './SessionStore.js';

export class MemoryStore implements SessionStore {
  private sessions: Map<string, SessionState> = new Map();

  async get(sessionId: string): Promise<SessionState | null> {
    return this.sessions.get(sessionId) || null;
  }

  async set(sessionId: string, state: SessionState): Promise<void> {
    this.sessions.set(sessionId, structuredClone(state));
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async exists(sessionId: string): Promise<boolean> {
    return this.sessions.has(sessionId);
  }
}
