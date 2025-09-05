// Algebraic notation parsing and conversion
// This file handles chess move notation parsing and conversion

import { Chess } from 'chess.js';
import type { ChessMove, MoveInput, Square } from './types';

/**
 * Parse algebraic notation and return a validated move
 */
export const parseAlgebraicNotation = (chess: Chess, notation: string): ChessMove | null => {
  try {
    // Clean and normalize the input
    const cleanNotation = sanitizeNotation(notation);
    
    if (!cleanNotation) {
      return null;
    }
    
    // Try to make the move
    const move = chess.move(cleanNotation);
    
    if (move) {
      // Undo the move to keep original position
      chess.undo();
      return move as ChessMove;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to parse algebraic notation:', notation, error);
    return null;
  }
};

/**
 * Convert a move object to standard algebraic notation (SAN)
 */
export const moveToAlgebraic = (chess: Chess, move: MoveInput): string => {
  try {
    // If it's already a string, validate and return
    if (typeof move === 'string') {
      const parsedMove = parseAlgebraicNotation(chess, move);
      return parsedMove?.san || '';
    }
    
    // Convert object move to algebraic notation
    const moveResult = chess.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion as 'q' | 'r' | 'b' | 'n' | undefined
    });
    
    if (moveResult) {
      const san = moveResult.san;
      chess.undo(); // Restore original position
      return san;
    }
    
    return '';
  } catch (error) {
    console.warn('Failed to convert move to algebraic notation:', move, error);
    return '';
  }
};

/**
 * Convert standard algebraic notation to long algebraic notation
 */
export const sanToLan = (chess: Chess, san: string): string => {
  try {
    const move = parseAlgebraicNotation(chess, san);
    return move?.lan || '';
  } catch (error) {
    console.warn('Failed to convert SAN to LAN:', san, error);
    return '';
  }
};

/**
 * Convert long algebraic notation to standard algebraic notation
 */
export const lanToSan = (chess: Chess, lan: string): string => {
  try {
    const move = parseAlgebraicNotation(chess, lan);
    return move?.san || '';
  } catch (error) {
    console.warn('Failed to convert LAN to SAN:', lan, error);
    return '';
  }
};

/**
 * Parse and validate multiple moves in algebraic notation
 */
export const parseMovesSequence = (chess: Chess, moves: string[]): ChessMove[] => {
  const parsedMoves: ChessMove[] = [];
  const tempChess = new Chess(chess.fen());
  
  for (const moveNotation of moves) {
    const move = parseAlgebraicNotation(tempChess, moveNotation);
    if (move) {
      // Actually make the move on temp board for next iteration
      tempChess.move(move);
      parsedMoves.push(move);
    } else {
      // If any move is invalid, return what we have so far
      break;
    }
  }
  
  return parsedMoves;
};

/**
 * Sanitize and normalize notation input
 */
export const sanitizeNotation = (notation: string): string => {
  if (!notation || typeof notation !== 'string') {
    return '';
  }
  
  // Remove extra whitespace and convert to lowercase for processing
  let clean = notation.trim();
  
  // Handle common notation variations
  clean = clean
    // Remove move numbers (e.g., "1.e4" -> "e4")
    .replace(/^\d+\.+\s*/, '')
    // Remove annotations (+, #, !, ?, etc. at the end)
    .replace(/[!?+#]*$/, '')
    // Standardize castling notation
    .replace(/0-0-0/g, 'O-O-O')
    .replace(/0-0/g, 'O-O')
    // Remove extra spaces
    .replace(/\s+/g, '');
  
  return clean;
};

/**
 * Check if notation represents castling
 */
export const isCastlingNotation = (notation: string): boolean => {
  const clean = sanitizeNotation(notation);
  return clean === 'O-O' || clean === 'O-O-O';
};

/**
 * Check if notation represents a capture
 */
export const isCaptureNotation = (notation: string): boolean => {
  return notation.includes('x');
};

/**
 * Check if notation represents a check
 */
export const isCheckNotation = (notation: string): boolean => {
  return notation.includes('+') && !notation.includes('#');
};

/**
 * Check if notation represents checkmate
 */
export const isCheckmateNotation = (notation: string): boolean => {
  return notation.includes('#');
};

/**
 * Extract promotion piece from notation
 */
export const extractPromotionPiece = (notation: string): string | null => {
  const promotionMatch = notation.match(/=([QRBN])/i);
  return promotionMatch ? promotionMatch[1].toLowerCase() : null;
};

/**
 * Validate algebraic notation format
 */
export const isValidNotationFormat = (notation: string): boolean => {
  const clean = sanitizeNotation(notation);
  
  if (!clean) return false;
  
  // Check for castling
  if (isCastlingNotation(clean)) {
    return true;
  }
  
  // Basic patterns for algebraic notation
  const patterns = [
    // Pawn moves: e4, exd5, e8=Q
    /^[a-h][1-8](\=[QRBN])?$/,
    /^[a-h]x[a-h][1-8](\=[QRBN])?$/,
    // Piece moves: Nf3, Nbd2, Rxe1, Qh5+, Kxe1
    /^[KQRBN][a-h]?[1-8]?x?[a-h][1-8]$/,
    // Castling
    /^O-O(-O)?$/
  ];
  
  return patterns.some(pattern => pattern.test(clean));
};

/**
 * Get move disambiguation info (for ambiguous moves)
 */
export const getDisambiguation = (chess: Chess, move: ChessMove): string => {
  const piece = move.piece.toUpperCase();
  const to = move.to;
  
  if (piece === 'P') return ''; // Pawns don't need disambiguation
  
  // Get all pieces of the same type that can move to the same square
  const possibleMoves = chess.moves({ verbose: true }) as ChessMove[];
  const samePieceMoves = possibleMoves.filter(m => 
    m.piece.toUpperCase() === piece && 
    m.to === to && 
    m.from !== move.from
  );
  
  if (samePieceMoves.length === 0) return '';
  
  // Check if file disambiguation is enough
  const sameFile = samePieceMoves.some(m => m.from[0] === move.from[0]);
  if (!sameFile) {
    return move.from[0]; // File letter
  }
  
  // Check if rank disambiguation is enough
  const sameRank = samePieceMoves.some(m => m.from[1] === move.from[1]);
  if (!sameRank) {
    return move.from[1]; // Rank number
  }
  
  // Need full square disambiguation
  return move.from;
};

/**
 * Convert move to UCI notation (for engine communication)
 */
export const moveToUci = (move: ChessMove): string => {
  let uci = move.from + move.to;
  if (move.promotion) {
    uci += move.promotion;
  }
  return uci;
};

/**
 * Parse UCI notation to move object
 */
export const parseUciNotation = (chess: Chess, uci: string): ChessMove | null => {
  try {
    if (uci.length < 4) return null;
    
    const from = uci.slice(0, 2) as Square;
    const to = uci.slice(2, 4) as Square;
    const promotion = uci.length > 4 ? uci[4] as 'q' | 'r' | 'b' | 'n' : undefined;
    
    const move = chess.move({ from, to, promotion });
    if (move) {
      chess.undo();
      return move as ChessMove;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to parse UCI notation:', uci, error);
    return null;
  }
};
