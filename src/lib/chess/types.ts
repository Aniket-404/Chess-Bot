// Chess-related TypeScript types and interfaces
// This file contains all chess-specific type definitions

import type { Chess, Square, PieceSymbol, Color } from 'chess.js';

// Enhanced Move interface based on chess.js Move type
export interface ChessMove {
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
  san: string;
  lan: string;
  piece: PieceSymbol;
  color: Color;
  flags: string;
  captured?: PieceSymbol;
}

// Game state interface for managing chess game
export interface GameState {
  fen: string;
  turn: Color;
  moves: ChessMove[];
  history: string[];
  inCheck: boolean;
  inCheckmate: boolean;
  inStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  halfmoveClock: number;
  fullmoveNumber: number;
}

// Position interface for board squares
export interface Position {
  square: Square;
  piece: PieceSymbol | null;
}

// Engine analysis interface
export interface EngineAnalysis {
  bestMove: string;
  evaluation: number;
  depth: number;
  principalVariation: string[];
  nodes?: number;
  time?: number;
}

// ELO settings for engine difficulty
export interface ELOSettings {
  rating: number;
  depth: number;
  skillLevel: number;
  thinkingTime?: number;
}

// Move validation result
export interface MoveValidationResult {
  isValid: boolean;
  move?: ChessMove;
  error?: string;
}

// Game configuration
export interface ChessGameConfig {
  startingPosition?: string; // FEN string
  enableHistory?: boolean;
  maxHistoryLength?: number;
}

// Move input types
export type MoveInput = string | { from: Square; to: Square; promotion?: string };

// Game result types
export type GameResult = 'ongoing' | 'white-wins' | 'black-wins' | 'draw' | 'stalemate';

// Export chess.js types for convenience
export type { Chess, Square, PieceSymbol, Color };
