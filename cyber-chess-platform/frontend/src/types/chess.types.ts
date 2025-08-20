// frontend/src/types/chess.types.ts
export interface ChessRecord {
  id: string;
  title: string;
  description?: string;
  scenario: any;
  players: {
    attacker: {
      id: string;
      username: string;
      avatar?: string;
    };
    defender: {
      id: string;
      username: string;
      avatar?: string;
    };
    monitor?: {
      id: string;
      username: string;
      avatar?: string;
    };
  };
  winner: 'attacker' | 'defender' | 'draw';
  rounds: number;
  duration: number;
  moves: GameMove[];
  finalScores: RITEScores;
  createdAt: string;
  updatedAt: string;
  rating?: number;
  tags?: string[];
}

export interface GameMove {
  round: number;
  player: string;
  role: 'attacker' | 'defender';
  action: string;
  actionName: string;
  target?: string;
  success: boolean;
  description: string;
  impact?: Partial<RITEScores>;
  timestamp: string;
}

export interface RITEScores {
  trust: number;
  risk: number;
  incident: number;
  loss: number;
  overall?: number;
}