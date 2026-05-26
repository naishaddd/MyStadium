// ─── Shared Types ─────────────────────────────────────────────────────────────

export type FanLevel = 'beginner' | 'casual' | 'super_fan';

export type UserRole = 'consumer' | 'admin' | 'vendor';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface StadiumLocation {
  id: string;
  name: string;
  type: string;
  waitTime: number;
  description: string;
}
