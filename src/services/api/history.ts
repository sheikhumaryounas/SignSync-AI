import { HistoryQuery, NewSession, Page, SessionDetail, SessionSummary } from './types';

// Contract for EUC8 / SSD-6. Every call is scoped to the signed-in user (business rule 1).
// Mock now, HTTP in Phase D3.
export interface HistoryApi {
  list(accessToken: string, query?: HistoryQuery): Promise<Page<SessionSummary>>;
  get(accessToken: string, id: string): Promise<SessionDetail>;
  create(accessToken: string, session: NewSession): Promise<SessionDetail>;
  remove(accessToken: string, id: string): Promise<void>;
}

export const HISTORY_PAGE_SIZE = 10;
