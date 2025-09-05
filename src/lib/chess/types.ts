// Chess-related TypeScript types and interfaces
// This file will contain all chess-specific type definitions

export interface ChessMove {
  from: string;
  to: string;
  promotion?: string;
  san?: string;
  fen?: string;
}

export interface GameState {
  fen: string;
  turn: 'w' | 'b';
  moves: ChessMove[];
  history: string[];
  inCheck: boolean;
  inCheckmate: boolean;
  inStalemate: boolean;
}

export interface EngineAnalysis {
  bestMove: string;
  evaluation: number;
  depth: number;
  principalVariation: string[];
}

export interface ELOSettings {
  rating: number;
  depth: number;
  skillLevel: number;
}
