// Core chess game logic utilities
// This file contains game state management functions using chess.js

import { Chess } from 'chess.js';
import type { 
  GameState, 
  ChessMove, 
  ChessGameConfig, 
  GameResult,
  Square,
  Color 
} from './types';

/**
 * Initialize a new chess game with optional configuration
 */
export const initializeGame = (config?: ChessGameConfig): Chess => {
  const chess = new Chess();
  
  if (config?.startingPosition) {
    try {
      chess.load(config.startingPosition);
    } catch (error) {
      console.warn('Invalid starting position FEN, using default:', error);
      // Chess constructor already loads starting position
    }
  }
  
  return chess;
};

/**
 * Get comprehensive game state from chess instance
 */
export const getGameState = (chess: Chess): GameState => {
  const legalMoves = chess.moves({ verbose: true }) as ChessMove[];
  
  return {
    fen: chess.fen(),
    turn: chess.turn(),
    moves: legalMoves, // Available legal moves, not move history
    history: chess.history(),
    inCheck: chess.inCheck(),
    inCheckmate: chess.isCheckmate(),
    inStalemate: chess.isStalemate(),
    isDraw: chess.isDraw(),
    isGameOver: chess.isGameOver(),
    halfmoveClock: chess.history().length,
    fullmoveNumber: Math.ceil(chess.history().length / 2),
  };
};

/**
 * Validate current game state and position
 */
export const validateGameState = (chess: Chess): boolean => {
  try {
    // Validate FEN
    const fen = chess.fen();
    const testChess = new Chess();
    testChess.load(fen);
    
    // Additional validation checks
    const isValidPosition = !chess.isGameOver() || 
                           chess.isCheckmate() || 
                           chess.isStalemate() || 
                           chess.isDraw();
    
    return isValidPosition;
  } catch (error) {
    console.error('Game state validation failed:', error);
    return false;
  }
};

/**
 * Get all possible moves for current position
 */
export const getPossibleMoves = (chess: Chess, square?: Square): string[] => {
  if (square) {
    return chess.moves({ square, verbose: false });
  }
  return chess.moves();
};

/**
 * Get game result based on current state
 */
export const getGameResult = (chess: Chess): GameResult => {
  if (!chess.isGameOver()) {
    return 'ongoing';
  }
  
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? 'black-wins' : 'white-wins';
  }
  
  if (chess.isStalemate() || chess.isDraw()) {
    return chess.isStalemate() ? 'stalemate' : 'draw';
  }
  
  return 'draw'; // fallback
};

/**
 * Check if a square is under attack by the opponent
 */
export const isSquareAttacked = (chess: Chess, square: Square, byColor: Color): boolean => {
  return chess.isAttacked(square, byColor);
};

/**
 * Get piece on a specific square
 */
export const getPieceOnSquare = (chess: Chess, square: Square) => {
  return chess.get(square);
};

/**
 * Reset game to starting position
 */
export const resetGame = (chess: Chess): void => {
  chess.reset();
};

/**
 * Create a copy of the chess game state
 */
export const cloneGame = (chess: Chess): Chess => {
  const newGame = new Chess();
  newGame.load(chess.fen());
  return newGame;
};
