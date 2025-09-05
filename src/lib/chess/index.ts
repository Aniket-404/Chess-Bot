// Chess library main export file
// This file provides a clean interface to all chess functionality

// Main engine
export { 
  ChessEngine, 
  ChessEngineUtils, 
  ChessEngineError, 
  ChessEngineErrorType,
  createChessEngine 
} from './chessEngine';

// Types
export type { 
  ChessMove, 
  GameState, 
  MoveValidationResult, 
  GameResult, 
  MoveInput,
  ChessGameConfig,
  Position,
  EngineAnalysis,
  ELOSettings 
} from './types';

// Game logic
export { 
  initializeGame, 
  getGameState, 
  validateGameState 
} from './gameLogic';

// Move validation
export { 
  validateMove, 
  isLegalMove, 
  makeMove 
} from './moveValidation';

// Algebraic notation
export { 
  parseAlgebraicNotation,
  moveToAlgebraic,
  sanToLan,
  lanToSan,
  parseMovesSequence,
  moveToUci,
  parseUciNotation,
  sanitizeNotation,
  isValidNotationFormat,
  isCastlingNotation,
  isCaptureNotation,
  isCheckNotation,
  isCheckmateNotation,
  extractPromotionPiece,
  getDisambiguation
} from './algebraicNotation';

// FEN handling
export { 
  validateFEN,
  loadFEN,
  getFEN,
  loadPositionFromFEN,
  comparePositions,
  getPositionKey,
  resetToStartingPosition,
  loadTestPosition as loadTestPositionFromFen,
  isStartingPosition,
  sanitizeFEN,
  getPositionInfo,
  createFEN,
  STARTING_POSITION_FEN,
  TEST_POSITIONS
} from './fenParser';

// Move history
export { 
  MoveHistory,
  createMoveHistory,
  createMoveHistoryFromPGN
} from './moveHistory';

// Move history types
export type { 
  MoveHistoryEntry, 
  SerializedMoveHistory 
} from './moveHistory';

// FEN types
export type { 
  FenParseResult 
} from './fenParser';

// Engine types
export type { 
  ChessEngineConfig, 
  EngineOperationResult 
} from './chessEngine';

// Re-export chess.js types for convenience
export type { Chess, Square, PieceSymbol, Color } from 'chess.js';

// Import for use in utility functions
import { ChessEngine, ChessEngineUtils } from './chessEngine';
import { TEST_POSITIONS } from './fenParser';

/**
 * Quick start functions for common use cases
 */

/**
 * Create a new chess game with default settings
 */
export function createNewGame() {
  return new ChessEngine();
}

/**
 * Create a chess game from FEN position
 */
export function createGameFromFEN(fen: string) {
  return new ChessEngine(fen);
}

/**
 * Create a chess game from PGN
 */
export function createGameFromPGN(pgn: string, startingFen?: string) {
  const engine = new ChessEngine(startingFen);
  engine.loadPGN(pgn);
  return engine;
}

/**
 * Load a test position for analysis or practice
 */
export function loadTestPosition(positionName: keyof typeof TEST_POSITIONS) {
  return ChessEngineUtils.createFromTestPosition(positionName);
}

/**
 * Create an engine with enhanced error reporting
 */
export function createDevelopmentEngine() {
  return ChessEngineUtils.createWithLogging();
}

/**
 * Chess library version and metadata
 */
export const CHESS_LIB_VERSION = '1.0.0';
export const SUPPORTED_FEATURES = [
  'Move validation',
  'Algebraic notation parsing',
  'FEN handling',
  'Move history with undo/redo',
  'PGN import/export',
  'Position analysis',
  'Game state management',
  'Error handling',
  'TypeScript support'
] as const;
