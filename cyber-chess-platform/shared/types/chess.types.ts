// shared/types/chess.types.ts
export enum ChessType {
  OFFICIAL = 'OFFICIAL',
  TEACHING = 'TEACHING',
  USER = 'USER',
  COMPETITION = 'COMPETITION'
}

export enum Visibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  RESTRICTED = 'RESTRICTED'
}

export enum Difficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

export interface ChessRecord {
  id: string;
  title: string;
  description?: string;
  type: ChessType;
  content: ChessGameData;
  thumbnail?: string;
  visibility: Visibility;
  tags: string[];
  rating: number;
  playCount: number;
  duration?: number;
  difficulty?: Difficulty;
  authorId: string;
  author?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChessGameData {
  gameState: GameState;
  moves: Move[];
  players: Player[];
  result?: GameResult;
  metadata?: Record<string, any>;
}

export interface GameState {
  currentRound: number;
  maxRound: number;
  layers: LayerStates;
  resources: ResourceStates;
  intelligence: Intelligence[];
  actionLog: ActionLog[];
  chainEffects: ChainEffect[];
}

export interface LayerStates {
  network: Layer;
  application: Layer;
  data: Layer;
  physical: Layer;
  personnel: Layer;
}

export interface Layer {
  name: string;
  health: number;
  maxHealth: number;
  defense: number;
}

export interface ResourceStates {
  [role: string]: Resource[];
}

export interface Resource {
  name: string;
  value: number;
  max: number;
  icon: string;
}

export interface Move {
  round: number;
  player: string;
  action: string;
  tactic: Tactic;
  result: ActionResult;
  timestamp: Date;
}

export interface Tactic {
  id: string;
  name: string;
  cost: Record<string, number>;
  desc: string;
  effect?: any;
}

export interface ActionResult {
  success: boolean;
  message: string;
  damage?: number;
  effects?: string[];
}

export interface Player {
  id: string;
  username: string;
  role: 'attacker' | 'defender' | 'monitor';
  score: number;
  resources: Resource[];
}

export interface GameResult {
  winner: string;
  loser: string;
  draw?: boolean;
  finalScore: Record<string, number>;
  duration: number;
  rounds: number;
}

export interface Intelligence {
  type: string;
  content: string;
  source: string;
  round: number;
}

export interface ActionLog {
  message: string;
  type: string;
  round: number;
  timestamp: Date;
}

export interface ChainEffect {
  type: 'cascade' | 'persistent';
  target?: string;
  duration?: number;
}

export interface ChessAnalysis {
  id: string;
  chessId: string;
  round: number;
  analysis: {
    moveQuality: 'excellent' | 'good' | 'average' | 'suboptimal' | 'poor';
    alternatives: string[];
    evaluation: number;
    threats: string[];
    opportunities: string[];
  };
  keyPoints: string[];
  suggestions: string[];
  createdAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  user?: User;
  chessId: string;
  parentId?: string;
  replies?: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Rating {
  id: string;
  score: number;
  userId: string;
  chessId: string;
  createdAt: Date;
}