// shared/types/game.types.ts
export interface GameSession {
  id: string;
  roomId: string;
  players: GamePlayer[];
  state: GameState;
  status: 'waiting' | 'playing' | 'paused' | 'ended';
  mode: 'single' | 'multi' | 'ai';
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

export interface GamePlayer {
  userId: string;
  username: string;
  role: 'attacker' | 'defender' | 'monitor';
  isReady: boolean;
  isHost: boolean;
  score: number;
  resources: Resource[];
  connectionStatus: 'connected' | 'disconnected';
}

export interface GameAction {
  playerId: string;
  tacticId: string;
  targetLayer?: string;
  timestamp: Date;
}

export interface GameRecord {
  id: string;
  userId: string;
  chessId?: string;
  role: string;
  result: 'victory' | 'defeat' | 'draw';
  score: number;
  rounds: number;
  duration: number;
  gameData: ChessGameData;
  statistics: GameStatistics;
  createdAt: Date;
}

export interface GameStatistics {
  damageDealt: number;
  damageReceived: number;
  resourcesUsed: Record<string, number>;
  tacticsUsed: Record<string, number>;
  successfulActions: number;
  failedActions: number;
  criticalHits: number;
  defensesBreached: number;
}