export type Mode = 'player' | 'tv' | 'diag';

export type KeepAwakeMethod = 'starting' | 'wakeLock' | 'video' | 'blocked' | 'failed';

export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting' | 'replaced';

export interface Player {
  id: number;
  name: string;
  emoji: string;
  taps: number;
  online: boolean;
}

/** Messages the server sends (see Game.kt). */
export type ServerMessage =
  | { t: 'welcome'; role: 'player'; token: string; resumed: boolean; player: Player }
  | { t: 'welcome'; role: 'viewer' }
  | { t: 'needJoin' }
  | { t: 'error'; message: string }
  | { t: 'tick'; n: number; st: number }
  | { t: 'state'; players: Player[]; total: number; viewers: number }
  | { t: 'pong'; id: number; c: number; s: number };
