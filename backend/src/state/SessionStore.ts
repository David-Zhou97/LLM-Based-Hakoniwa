import { SessionState } from '../../../shared/types/session.js';

export interface SessionStore {
  get(sessionId: string): Promise<SessionState | null>;
  set(sessionId: string, state: SessionState): Promise<void>;
  delete(sessionId: string): Promise<void>;
  exists(sessionId: string): Promise<boolean>;
}
