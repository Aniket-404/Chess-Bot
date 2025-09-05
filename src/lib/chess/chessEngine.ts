import { Chess, Move } from 'chess.js';
import { ChessMove, GameState, GameResult, MoveInput } from './types';
import { getGameState } from './gameLogic';
import { sanitizeNotation } from './algebraicNotation';
import { 
  validateFEN, 
  STARTING_POSITION_FEN,
  TEST_POSITIONS 
} from './fenParser';
import { MoveHistory, createMoveHistory, MoveHistoryEntry } from './moveHistory';

/**
 * Chess engine error types
 */
export enum ChessEngineErrorType {
  INVALID_MOVE = 'INVALID_MOVE',
  INVALID_FEN = 'INVALID_FEN',
  INVALID_NOTATION = 'INVALID_NOTATION',
  GAME_OVER = 'GAME_OVER',
  ILLEGAL_POSITION = 'ILLEGAL_POSITION',
  HISTORY_ERROR = 'HISTORY_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Chess engine error class
 */
export class ChessEngineError extends Error {
  public readonly type: ChessEngineErrorType;
  public readonly context?: unknown;

  constructor(type: ChessEngineErrorType, message: string, context?: unknown) {
    super(message);
    this.name = 'ChessEngineError';
    this.type = type;
    this.context = context;
  }
}

/**
 * Engine configuration options
 */
export interface ChessEngineConfig {
  enableHistory?: boolean;
  maxHistoryLength?: number;
  enableLogging?: boolean;
  validateMoves?: boolean;
  strictMode?: boolean;
}

/**
 * Engine operation result
 */
export interface EngineOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: ChessEngineError;
  warnings?: string[];
}

/**
 * Main chess engine class integrating all functionality
 */
export class ChessEngine {
  private chess: Chess;
  private history: MoveHistory | null = null;
  private config: Required<ChessEngineConfig>;
  private logger: (message: string, level: 'info' | 'warn' | 'error') => void;

  constructor(
    startingPosition: string = STARTING_POSITION_FEN,
    config: ChessEngineConfig = {}
  ) {
    // Set default configuration
    this.config = {
      enableHistory: true,
      maxHistoryLength: 1000,
      enableLogging: false,
      validateMoves: true,
      strictMode: false,
      ...config
    };

    // Setup logger
    this.logger = this.config.enableLogging 
      ? (message: string, level: 'info' | 'warn' | 'error') => {
          console[level](`[ChessEngine] ${message}`);
        }
      : () => {}; // No-op if logging disabled

    try {
      // Initialize chess instance
      this.chess = new Chess(startingPosition);
      
      // Initialize history if enabled
      if (this.config.enableHistory) {
        this.history = createMoveHistory(
          this.chess, 
          startingPosition, 
          this.config.maxHistoryLength
        );
      }

      this.logger('Chess engine initialized successfully', 'info');
    } catch (error) {
      const message = `Failed to initialize chess engine: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger(message, 'error');
      throw new ChessEngineError(
        ChessEngineErrorType.INVALID_FEN,
        message,
        { startingPosition, error }
      );
    }
  }

  /**
   * Make a move on the board
   */
  makeMove(moveInput: MoveInput): EngineOperationResult<MoveHistoryEntry> {
    try {
      this.logger(`Attempting to make move: ${JSON.stringify(moveInput)}`, 'info');

      // Check if game is already over
      if (this.chess.isGameOver()) {
        const error = new ChessEngineError(
          ChessEngineErrorType.GAME_OVER,
          'Cannot make move: game is already over',
          { gameState: this.getGameState().data }
        );
        return { success: false, error };
      }

      let move: Move | null = null;

      // Handle different input types
      if (typeof moveInput === 'string') {
        // Parse algebraic notation
        const parseResult = this.parseMove(moveInput);
        if (!parseResult.success) {
          return { success: false, error: parseResult.error };
        }
        move = parseResult.data!;
      } else {
        // Handle move object
        try {
          move = this.chess.move(moveInput);
        } catch (error) {
          const chessError = new ChessEngineError(
            ChessEngineErrorType.INVALID_MOVE,
            `Invalid move object: ${error instanceof Error ? error.message : 'Unknown error'}`,
            { moveInput, error }
          );
          return { success: false, error: chessError };
        }
      }

      if (!move) {
        const error = new ChessEngineError(
          ChessEngineErrorType.INVALID_MOVE,
          'Move validation failed',
          { moveInput }
        );
        return { success: false, error };
      }

      // Add to history if enabled
      let historyEntry: MoveHistoryEntry | undefined;
      if (this.history) {
        historyEntry = this.history.addMove(move);
      }

      this.logger(`Move made successfully: ${move.san}`, 'info');

      return { 
        success: true, 
        data: historyEntry || this.createMoveHistoryEntry(move)
      };

    } catch (error) {
      const chessError = new ChessEngineError(
        ChessEngineErrorType.UNKNOWN_ERROR,
        `Unexpected error making move: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { moveInput, error }
      );
      this.logger(chessError.message, 'error');
      return { success: false, error: chessError };
    }
  }

  /**
   * Parse algebraic notation move
   */
  parseMove(notation: string): EngineOperationResult<Move> {
    try {
      const sanitized = sanitizeNotation(notation);
      const move = this.chess.move(sanitized);
      
      if (!move) {
        const error = new ChessEngineError(
          ChessEngineErrorType.INVALID_NOTATION,
          `Invalid algebraic notation: ${notation}`,
          { notation, sanitized }
        );
        return { success: false, error };
      }

      return { success: true, data: move };
    } catch (error) {
      const chessError = new ChessEngineError(
        ChessEngineErrorType.INVALID_NOTATION,
        `Failed to parse notation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { notation, error }
      );
      return { success: false, error: chessError };
    }
  }

  /**
   * Get current game state
   */
  getGameState(): EngineOperationResult<GameState> {
    try {
      const state = getGameState(this.chess);
      return { success: true, data: state };
    } catch (error) {
      const chessError = new ChessEngineError(
        ChessEngineErrorType.VALIDATION_ERROR,
        `Failed to get game state: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error }
      );
      return { success: false, error: chessError };
    }
  }

  /**
   * Get current FEN string
   */
  getFEN(): string {
    return this.chess.fen();
  }

  /**
   * Load position from FEN
   */
  loadFEN(fen: string): EngineOperationResult<GameState> {
    try {
      this.logger(`Loading FEN: ${fen}`, 'info');

      // Validate FEN first
      const validation = validateFEN(fen);
      if (!validation.isValid) {
        const error = new ChessEngineError(
          ChessEngineErrorType.INVALID_FEN,
          `Invalid FEN: ${validation.error}`,
          { fen, validation }
        );
        return { success: false, error };
      }

      // Load the position
      this.chess.load(fen);

      // Reset history if enabled
      if (this.history) {
        this.history.clearHistory();
      }

      const gameState = this.getGameState();
      if (gameState.success) {
        this.logger('FEN loaded successfully', 'info');
      }

      return gameState;
    } catch (error) {
      const chessError = new ChessEngineError(
        ChessEngineErrorType.INVALID_FEN,
        `Failed to load FEN: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { fen, error }
      );
      this.logger(chessError.message, 'error');
      return { success: false, error: chessError };
    }
  }

  /**
   * Get legal moves for current position
   */
  getLegalMoves(): EngineOperationResult<ChessMove[]> {
    try {
      const moves = this.chess.moves({ verbose: true });
      const convertedMoves = moves.map(this.convertMove);
      return { success: true, data: convertedMoves };
    } catch (error) {
      const chessError = new ChessEngineError(
        ChessEngineErrorType.VALIDATION_ERROR,
        `Failed to get legal moves: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error }
      );
      return { success: false, error: chessError };
    }
  }

  /**
   * Check if a move is legal
   */
  isMoveLegal(moveInput: MoveInput): EngineOperationResult<boolean> {
    try {
      // Create a copy to test the move
      const testChess = new Chess(this.chess.fen());
      
      let move: Move | null = null;
      
      if (typeof moveInput === 'string') {
        const sanitized = sanitizeNotation(moveInput);
        move = testChess.move(sanitized);
      } else {
        move = testChess.move(moveInput);
      }

      return { success: true, data: move !== null };
    } catch {
      // If error occurs, move is not legal
      return { success: true, data: false };
    }
  }

  /**
   * Undo last move
   */
  undoMove(): EngineOperationResult<boolean> {
    if (!this.history) {
      const error = new ChessEngineError(
        ChessEngineErrorType.HISTORY_ERROR,
        'History is not enabled',
        { config: this.config }
      );
      return { success: false, error };
    }

    try {
      const result = this.history.undo();
      if (result) {
        this.logger('Move undone successfully', 'info');
      } else {
        this.logger('No move to undo', 'warn');
      }
      return { success: true, data: result };
    } catch (error) {
      const chessError = new ChessEngineError(
        ChessEngineErrorType.HISTORY_ERROR,
        `Failed to undo move: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error }
      );
      this.logger(chessError.message, 'error');
      return { success: false, error: chessError };
    }
  }

  /**
   * Redo next move
   */
  redoMove(): EngineOperationResult<boolean> {
    if (!this.history) {
      const error = new ChessEngineError(
        ChessEngineErrorType.HISTORY_ERROR,
        'History is not enabled',
        { config: this.config }
      );
      return { success: false, error };
    }

    try {
      const result = this.history.redo();
      if (result) {
        this.logger('Move redone successfully', 'info');
      } else {
        this.logger('No move to redo', 'warn');
      }
      return { success: true, data: result };
    } catch (error) {
      const chessError = new ChessEngineError(
        ChessEngineErrorType.HISTORY_ERROR,
        `Failed to redo move: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error }
      );
      this.logger(chessError.message, 'error');
      return { success: false, error: chessError };
    }
  }

  /**
   * Get move history
   */
  getHistory(): EngineOperationResult<MoveHistoryEntry[]> {
    if (!this.history) {
      const error = new ChessEngineError(
        ChessEngineErrorType.HISTORY_ERROR,
        'History is not enabled',
        { config: this.config }
      );
      return { success: false, error };
    }

    try {
      const history = this.history.getHistory();
      return { success: true, data: history };
    } catch (error) {
      const chessError = new ChessEngineError(
        ChessEngineErrorType.HISTORY_ERROR,
        `Failed to get history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error }
      );
      return { success: false, error: chessError };
    }
  }

  /**
   * Get PGN of current game
   */
  getPGN(): EngineOperationResult<string> {
    try {
      let pgn: string;
      
      if (this.history) {
        pgn = this.history.getPGN();
      } else {
        pgn = this.chess.pgn();
      }

      return { success: true, data: pgn };
    } catch (error) {
      const chessError = new ChessEngineError(
        ChessEngineErrorType.VALIDATION_ERROR,
        `Failed to generate PGN: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error }
      );
      return { success: false, error: chessError };
    }
  }

  /**
   * Load game from PGN
   */
  loadPGN(pgn: string, startingFen?: string): EngineOperationResult<boolean> {
    try {
      this.logger(`Loading PGN: ${pgn.substring(0, 100)}...`, 'info');

      if (this.history && startingFen) {
        // Use history to load PGN
        const result = this.history.loadFromPGN(pgn, startingFen);
        return { success: true, data: result };
      } else {
        // Use chess.js to load PGN
        this.chess.loadPgn(pgn);
        
        // Rebuild history if enabled
        if (this.history) {
          this.rebuildHistoryFromChess();
        }

        return { success: true, data: true };
      }
    } catch (error) {
      const chessError = new ChessEngineError(
        ChessEngineErrorType.VALIDATION_ERROR,
        `Failed to load PGN: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { pgn, error }
      );
      this.logger(chessError.message, 'error');
      return { success: false, error: chessError };
    }
  }

  /**
   * Reset game to starting position
   */
  reset(startingFen?: string): EngineOperationResult<GameState> {
    try {
      const fen = startingFen || STARTING_POSITION_FEN;
      this.logger(`Resetting game to: ${fen}`, 'info');
      
      return this.loadFEN(fen);
    } catch (error) {
      const chessError = new ChessEngineError(
        ChessEngineErrorType.UNKNOWN_ERROR,
        `Failed to reset game: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { startingFen, error }
      );
      this.logger(chessError.message, 'error');
      return { success: false, error: chessError };
    }
  }

  /**
   * Get game result
   */
  getGameResult(): GameResult {
    if (this.chess.isCheckmate()) {
      return this.chess.turn() === 'w' ? 'black-wins' : 'white-wins';
    } else if (this.chess.isStalemate() || this.chess.isDraw()) {
      return 'draw';
    } else {
      return 'ongoing';
    }
  }

  /**
   * Check if position is valid
   */
  isPositionValid(): EngineOperationResult<boolean> {
    try {
      const fen = this.chess.fen();
      const validation = validateFEN(fen);
      
      if (!validation.isValid) {
        return { 
          success: true, 
          data: false, 
          warnings: [validation.error || 'Invalid position'] 
        };
      }

      // Additional validation could be added here
      return { success: true, data: true };
    } catch (error) {
      const chessError = new ChessEngineError(
        ChessEngineErrorType.VALIDATION_ERROR,
        `Failed to validate position: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error }
      );
      return { success: false, error: chessError };
    }
  }

  /**
   * Get engine configuration
   */
  getConfig(): Required<ChessEngineConfig> {
    return { ...this.config };
  }

  /**
   * Update engine configuration
   */
  updateConfig(newConfig: Partial<ChessEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update logger if logging setting changed
    if ('enableLogging' in newConfig) {
      this.logger = this.config.enableLogging 
        ? (message: string, level: 'info' | 'warn' | 'error') => {
            console[level](`[ChessEngine] ${message}`);
          }
        : () => {}; // No-op if logging disabled
    }

    // Handle history enabling/disabling
    if ('enableHistory' in newConfig) {
      if (newConfig.enableHistory && !this.history) {
        this.history = createMoveHistory(this.chess, this.chess.fen(), this.config.maxHistoryLength);
        this.rebuildHistoryFromChess();
      } else if (!newConfig.enableHistory && this.history) {
        this.history = null;
      }
    }

    this.logger('Configuration updated', 'info');
  }

  /**
   * Convert chess.js Move to ChessMove
   */
  private convertMove(move: Move): ChessMove {
    return {
      from: move.from,
      to: move.to,
      promotion: move.promotion && ['q', 'r', 'b', 'n'].includes(move.promotion) 
        ? move.promotion as 'q' | 'r' | 'b' | 'n' 
        : undefined,
      san: move.san,
      lan: move.lan || `${move.from}-${move.to}`,
      piece: move.piece,
      color: move.color,
      flags: move.flags,
      captured: move.captured,
    };
  }

  /**
   * Create move history entry from move
   */
  private createMoveHistoryEntry(move: Move): MoveHistoryEntry {
    return {
      move: this.convertMove(move),
      san: move.san,
      lan: move.lan || `${move.from}-${move.to}`,
      uci: `${move.from}${move.to}${move.promotion || ''}`,
      fen: this.chess.fen(),
      timestamp: new Date(),
      capturedPiece: move.captured,
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isStalemate: this.chess.isStalemate(),
    };
  }

  /**
   * Rebuild history from current chess state
   */
  private rebuildHistoryFromChess(): void {
    if (!this.history) return;

    try {
      this.history.clearHistory();
      
      // Note: Full history rebuild from chess.js state is limited
      // since we don't have access to the complete move sequence
      this.logger('History rebuild completed (limited functionality)', 'warn');
    } catch (error) {
      this.logger(`Failed to rebuild history: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }
}

/**
 * Create a new chess engine instance
 */
export function createChessEngine(
  startingPosition?: string,
  config?: ChessEngineConfig
): ChessEngine {
  return new ChessEngine(startingPosition, config);
}

/**
 * Utility functions for common operations
 */
export const ChessEngineUtils = {
  /**
   * Create engine with logging enabled
   */
  createWithLogging(startingPosition?: string): ChessEngine {
    return new ChessEngine(startingPosition, { enableLogging: true });
  },

  /**
   * Create engine without history
   */
  createWithoutHistory(startingPosition?: string): ChessEngine {
    return new ChessEngine(startingPosition, { enableHistory: false });
  },

  /**
   * Create engine in strict mode
   */
  createStrict(startingPosition?: string): ChessEngine {
    return new ChessEngine(startingPosition, { 
      strictMode: true, 
      validateMoves: true,
      enableLogging: true 
    });
  },

  /**
   * Load test position
   */
  createFromTestPosition(positionName: keyof typeof TEST_POSITIONS): ChessEngine {
    return new ChessEngine(TEST_POSITIONS[positionName]);
  },
};
