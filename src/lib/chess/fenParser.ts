import { Chess, Move } from 'chess.js';
import { GameState, ChessMove } from './types';

/**
 * Convert chess.js Move to our ChessMove interface
 */
function convertMove(move: Move): ChessMove {
  return {
    from: move.from,
    to: move.to,
    promotion: move.promotion && ['q', 'r', 'b', 'n'].includes(move.promotion) 
      ? move.promotion as 'q' | 'r' | 'b' | 'n' 
      : undefined,
    san: move.san,
    lan: move.lan,
    piece: move.piece,
    color: move.color,
    flags: move.flags,
    captured: move.captured,
  };
}

/**
 * FEN String constants and utilities for chess position management
 */

// Standard starting position FEN
export const STARTING_POSITION_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Common test positions
export const TEST_POSITIONS = {
  STARTING: STARTING_POSITION_FEN,
  MIDDLE_GAME: 'r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
  ENDGAME: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
  CHECKMATE: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
  STALEMATE: '5bnr/4p1pq/4Qpkr/7p/7P/4P3/PPPP1PP1/RNB1KBNR b KQ - 2 10',
} as const;

/**
 * FEN validation patterns
 */
const FEN_PIECE_PATTERN = /^[rnbqkpRNBQKP1-8]+$/;
const FEN_CASTLING_PATTERN = /^(KQkq|[KQkq]{1,4}|-)$/;
const FEN_EN_PASSANT_PATTERN = /^([a-h][36]|-)$/;

/**
 * Interface for FEN parsing results
 */
export interface FenParseResult {
  isValid: boolean;
  error?: string;
  position?: string;
  activeColor?: 'w' | 'b';
  castlingRights?: string;
  enPassantTarget?: string;
  halfmoveClock?: number;
  fullmoveNumber?: number;
}

/**
 * Validate FEN string format
 */
export function validateFEN(fen: string): FenParseResult {
  if (!fen || typeof fen !== 'string') {
    return { isValid: false, error: 'FEN string is required' };
  }

  const parts = fen.trim().split(' ');
  
  if (parts.length !== 6) {
    return { isValid: false, error: 'FEN must have exactly 6 space-separated parts' };
  }

  const [position, activeColor, castling, enPassant, halfmove, fullmove] = parts;

  // Validate position part
  const ranks = position.split('/');
  if (ranks.length !== 8) {
    return { isValid: false, error: 'Position must have 8 ranks separated by /' };
  }

  for (let i = 0; i < ranks.length; i++) {
    const rank = ranks[i];
    if (!FEN_PIECE_PATTERN.test(rank)) {
      return { isValid: false, error: `Invalid characters in rank ${8 - i}` };
    }

    // Check that each rank has exactly 8 squares
    let squareCount = 0;
    for (const char of rank) {
      if (/[1-8]/.test(char)) {
        squareCount += parseInt(char);
      } else {
        squareCount += 1;
      }
    }
    
    if (squareCount !== 8) {
      return { isValid: false, error: `Rank ${8 - i} does not have exactly 8 squares` };
    }
  }

  // Validate active color
  if (activeColor !== 'w' && activeColor !== 'b') {
    return { isValid: false, error: 'Active color must be "w" or "b"' };
  }

  // Validate castling rights
  if (!FEN_CASTLING_PATTERN.test(castling)) {
    return { isValid: false, error: 'Invalid castling rights format' };
  }

  // Validate en passant target
  if (!FEN_EN_PASSANT_PATTERN.test(enPassant)) {
    return { isValid: false, error: 'Invalid en passant target square' };
  }

  // Validate halfmove clock
  const halfmoveNum = parseInt(halfmove);
  if (isNaN(halfmoveNum) || halfmoveNum < 0) {
    return { isValid: false, error: 'Halfmove clock must be a non-negative integer' };
  }

  // Validate fullmove number
  const fullmoveNum = parseInt(fullmove);
  if (isNaN(fullmoveNum) || fullmoveNum < 1) {
    return { isValid: false, error: 'Fullmove number must be a positive integer' };
  }

  return {
    isValid: true,
    position,
    activeColor: activeColor as 'w' | 'b',
    castlingRights: castling,
    enPassantTarget: enPassant,
    halfmoveClock: halfmoveNum,
    fullmoveNumber: fullmoveNum,
  };
}

/**
 * Load position from FEN string
 */
export function loadFEN(fen: string): Chess {
  const validation = validateFEN(fen);
  
  if (!validation.isValid) {
    throw new Error(`Invalid FEN: ${validation.error}`);
  }

  try {
    const chess = new Chess(fen);
    return chess;
  } catch (error) {
    throw new Error(`Failed to load FEN: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get FEN string from Chess instance
 */
export function getFEN(chess: Chess): string {
  return chess.fen();
}

/**
 * Load position from FEN and get game state
 */
export function loadPositionFromFEN(fen: string): GameState {
  const chess = loadFEN(fen);
  
  // Get detailed moves with chess.js Move objects
  const detailedMoves = chess.moves({ verbose: true });
  const convertedMoves = detailedMoves.map(convertMove);
  
  return {
    fen: chess.fen(),
    turn: chess.turn(),
    moves: convertedMoves,
    history: chess.history(),
    inCheck: chess.isCheck(),
    inCheckmate: chess.isCheckmate(),
    inStalemate: chess.isStalemate(),
    isDraw: chess.isDraw(),
    isGameOver: chess.isGameOver(),
    halfmoveClock: chess.history({ verbose: true }).length,
    fullmoveNumber: Math.ceil((chess.history().length + 1) / 2),
  };
}

/**
 * Compare two FEN positions (ignoring move counters)
 */
export function comparePositions(fen1: string, fen2: string): boolean {
  try {
    const parts1 = fen1.split(' ');
    const parts2 = fen2.split(' ');
    
    if (parts1.length < 4 || parts2.length < 4) {
      return false;
    }
    
    // Compare position, active color, castling rights, and en passant
    // Ignore halfmove clock and fullmove number
    return (
      parts1[0] === parts2[0] && // position
      parts1[1] === parts2[1] && // active color
      parts1[2] === parts2[2] && // castling rights
      parts1[3] === parts2[3]    // en passant target
    );
  } catch {
    return false;
  }
}

/**
 * Get position key (FEN without move counters) for repetition detection
 */
export function getPositionKey(fen: string): string {
  const parts = fen.split(' ');
  if (parts.length < 4) {
    throw new Error('Invalid FEN string');
  }
  
  // Return position, active color, castling rights, and en passant
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
}

/**
 * Reset to starting position
 */
export function resetToStartingPosition(): Chess {
  return new Chess();
}

/**
 * Load a preset test position
 */
export function loadTestPosition(positionName: keyof typeof TEST_POSITIONS): Chess {
  return loadFEN(TEST_POSITIONS[positionName]);
}

/**
 * Check if FEN represents starting position
 */
export function isStartingPosition(fen: string): boolean {
  return comparePositions(fen, STARTING_POSITION_FEN);
}

/**
 * Sanitize FEN string (trim whitespace and normalize)
 */
export function sanitizeFEN(fen: string): string {
  return fen.trim().replace(/\s+/g, ' ');
}

/**
 * Get position info from FEN
 */
export function getPositionInfo(fen: string): {
  activeColor: 'white' | 'black';
  castlingRights: {
    whiteKingside: boolean;
    whiteQueenside: boolean;
    blackKingside: boolean;
    blackQueenside: boolean;
  };
  enPassantTarget: string | null;
  halfmoveClock: number;
  fullmoveNumber: number;
} {
  const validation = validateFEN(fen);
  
  if (!validation.isValid) {
    throw new Error(`Invalid FEN: ${validation.error}`);
  }

  const castling = validation.castlingRights!;
  
  return {
    activeColor: validation.activeColor === 'w' ? 'white' : 'black',
    castlingRights: {
      whiteKingside: castling.includes('K'),
      whiteQueenside: castling.includes('Q'),
      blackKingside: castling.includes('k'),
      blackQueenside: castling.includes('q'),
    },
    enPassantTarget: validation.enPassantTarget === '-' ? null : validation.enPassantTarget!,
    halfmoveClock: validation.halfmoveClock!,
    fullmoveNumber: validation.fullmoveNumber!,
  };
}

/**
 * Create FEN from position parts
 */
export function createFEN(
  position: string,
  activeColor: 'w' | 'b',
  castlingRights: string,
  enPassantTarget: string,
  halfmoveClock: number = 0,
  fullmoveNumber: number = 1
): string {
  const fen = `${position} ${activeColor} ${castlingRights} ${enPassantTarget} ${halfmoveClock} ${fullmoveNumber}`;
  
  const validation = validateFEN(fen);
  if (!validation.isValid) {
    throw new Error(`Invalid FEN parts: ${validation.error}`);
  }
  
  return fen;
}
