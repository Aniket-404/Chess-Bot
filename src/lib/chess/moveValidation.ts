// Move validation functions
// This file contains chess move validation logic using chess.js

import { Chess } from 'chess.js';
import type { 
  ChessMove, 
  MoveValidationResult, 
  MoveInput, 
  Square,
  Color 
} from './types';

/**
 * Validate a move against the current chess position
 */
export const validateMove = (chess: Chess, move: MoveInput): MoveValidationResult => {
  try {
    // Handle different move input formats
    let moveResult: ChessMove | null = null;
    
    if (typeof move === 'string') {
      // String notation (e.g., "e4", "Nf3", "e2e4")
      moveResult = chess.move(move) as ChessMove;
    } else {
      // Object notation (e.g., {from: 'e2', to: 'e4'})
      moveResult = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion as 'q' | 'r' | 'b' | 'n' | undefined
      }) as ChessMove;
    }
    
    if (moveResult) {
      // Move was successful, now undo it to keep the original position
      chess.undo();
      return {
        isValid: true,
        move: moveResult,
      };
    } else {
      return {
        isValid: false,
        error: 'Invalid move: Move not allowed in current position'
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error validating move'
    };
  }
};

/**
 * Check if a move is legal without modifying the game state
 */
export const isLegalMove = (chess: Chess, move: MoveInput): boolean => {
  const validation = validateMove(chess, move);
  return validation.isValid;
};

/**
 * Get all legal moves for the current position
 */
export const getLegalMoves = (chess: Chess, options?: { 
  square?: Square; 
  verbose?: boolean 
}): string[] | ChessMove[] => {
  if (options?.verbose) {
    return chess.moves({ 
      square: options.square, 
      verbose: true 
    }) as ChessMove[];
  }
  
  return chess.moves({ 
    square: options?.square, 
    verbose: false 
  }) as string[];
};

/**
 * Check if the current player is in check
 */
export const isInCheck = (chess: Chess): boolean => {
  return chess.inCheck();
};

/**
 * Check if the current player is in checkmate
 */
export const isCheckmate = (chess: Chess): boolean => {
  return chess.isCheckmate();
};

/**
 * Check if the game is in stalemate
 */
export const isStalemate = (chess: Chess): boolean => {
  return chess.isStalemate();
};

/**
 * Check if the game is a draw
 */
export const isDraw = (chess: Chess): boolean => {
  return chess.isDraw();
};

/**
 * Check if the game is over
 */
export const isGameOver = (chess: Chess): boolean => {
  return chess.isGameOver();
};

/**
 * Get whose turn it is to move
 */
export const getTurn = (chess: Chess): Color => {
  return chess.turn();
};

/**
 * Get possible moves for a specific square
 */
export const getPossibleMovesForSquare = (chess: Chess, square: Square): string[] => {
  return chess.moves({ square, verbose: false });
};

/**
 * Check if a specific move puts the king in check
 */
export const moveResultsInCheck = (chess: Chess, move: MoveInput): boolean => {
  const validation = validateMove(chess, move);
  if (!validation.isValid || !validation.move) {
    return false;
  }
  
  // Make the move
  chess.move(validation.move);
  
  // Check if the moving player's king is in check (illegal move)
  const inCheck = chess.inCheck();
  
  // Undo the move
  chess.undo();
  
  return inCheck;
};

/**
 * Validate and execute a move, returning the result
 */
export const makeMove = (chess: Chess, move: MoveInput): MoveValidationResult => {
  const validation = validateMove(chess, move);
  
  if (validation.isValid && validation.move) {
    // Actually make the move this time
    const moveResult = chess.move(validation.move);
    return {
      isValid: true,
      move: moveResult as ChessMove
    };
  }
  
  return validation;
};

/**
 * Check if a move is a capture
 */
export const isCapture = (chess: Chess, move: MoveInput): boolean => {
  const validation = validateMove(chess, move);
  return validation.isValid && validation.move ? 
    validation.move.flags.includes('c') || validation.move.flags.includes('e') : 
    false;
};

/**
 * Check if a move is castling
 */
export const isCastling = (chess: Chess, move: MoveInput): boolean => {
  const validation = validateMove(chess, move);
  return validation.isValid && validation.move ? 
    validation.move.flags.includes('k') || validation.move.flags.includes('q') : 
    false;
};

/**
 * Check if a move is en passant
 */
export const isEnPassant = (chess: Chess, move: MoveInput): boolean => {
  const validation = validateMove(chess, move);
  return validation.isValid && validation.move ? 
    validation.move.flags.includes('e') : 
    false;
};

/**
 * Check if a move is a promotion
 */
export const isPromotion = (chess: Chess, move: MoveInput): boolean => {
  const validation = validateMove(chess, move);
  return validation.isValid && validation.move ? 
    validation.move.flags.includes('p') : 
    false;
};
