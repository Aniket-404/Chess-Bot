import { Chess, Move } from 'chess.js';
import { ChessMove } from './types';

/**
 * Interface for a move history entry
 */
export interface MoveHistoryEntry {
  move: ChessMove;
  san: string;
  lan: string;
  uci: string;
  fen: string;
  timestamp: Date;
  capturedPiece?: string;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
}

/**
 * Interface for serialized move history
 */
export interface SerializedMoveHistory {
  moves: Omit<MoveHistoryEntry, 'timestamp'>[];
  startingPosition: string;
  currentIndex: number;
  createdAt: string;
  lastModified: string;
}

/**
 * Move history tracking class with undo/redo functionality
 */
export class MoveHistory {
  private moves: MoveHistoryEntry[] = [];
  private currentIndex: number = -1;
  private startingPosition: string;
  private chess: Chess;
  private maxHistoryLength: number;

  constructor(
    chess: Chess, 
    startingPosition?: string, 
    maxHistoryLength: number = 1000
  ) {
    this.chess = chess;
    this.startingPosition = startingPosition || chess.fen();
    this.maxHistoryLength = maxHistoryLength;
  }

  /**
   * Add a move to the history
   */
  addMove(move: Move): MoveHistoryEntry {
    const moveEntry: MoveHistoryEntry = {
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

    // If we're not at the end of history, remove all moves after current position
    if (this.currentIndex < this.moves.length - 1) {
      this.moves = this.moves.slice(0, this.currentIndex + 1);
    }

    // Add the new move
    this.moves.push(moveEntry);
    this.currentIndex++;

    // Enforce maximum history length
    if (this.moves.length > this.maxHistoryLength) {
      const removeCount = this.moves.length - this.maxHistoryLength;
      this.moves = this.moves.slice(removeCount);
      this.currentIndex -= removeCount;
    }

    return moveEntry;
  }

  /**
   * Undo the last move
   */
  undo(): boolean {
    if (!this.canUndo()) {
      return false;
    }

    this.currentIndex--;
    this.restorePosition();
    return true;
  }

  /**
   * Redo the next move
   */
  redo(): boolean {
    if (!this.canRedo()) {
      return false;
    }

    this.currentIndex++;
    const move = this.moves[this.currentIndex];
    
    try {
      // Make the move without adding to history again
      this.chess.move({
        from: move.move.from,
        to: move.move.to,
        promotion: move.move.promotion,
      });
      return true;
    } catch {
      // If move fails, revert index
      this.currentIndex--;
      return false;
    }
  }

  /**
   * Go to a specific move in the history
   */
  goToMove(index: number): boolean {
    if (index < -1 || index >= this.moves.length) {
      return false;
    }

    this.currentIndex = index;
    this.restorePosition();
    return true;
  }

  /**
   * Go to the beginning of the game
   */
  goToBeginning(): void {
    this.currentIndex = -1;
    this.restorePosition();
  }

  /**
   * Go to the end of the game
   */
  goToEnd(): void {
    this.currentIndex = this.moves.length - 1;
    this.restorePosition();
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.moves.length - 1;
  }

  /**
   * Get the current move history
   */
  getHistory(): MoveHistoryEntry[] {
    return [...this.moves];
  }

  /**
   * Get moves up to current position
   */
  getCurrentHistory(): MoveHistoryEntry[] {
    return this.moves.slice(0, this.currentIndex + 1);
  }

  /**
   * Get a specific move by index
   */
  getMove(index: number): MoveHistoryEntry | null {
    if (index < 0 || index >= this.moves.length) {
      return null;
    }
    return this.moves[index];
  }

  /**
   * Get the last move
   */
  getLastMove(): MoveHistoryEntry | null {
    if (this.currentIndex < 0) {
      return null;
    }
    return this.moves[this.currentIndex];
  }

  /**
   * Get the current position index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get the total number of moves
   */
  getLength(): number {
    return this.moves.length;
  }

  /**
   * Clear the entire history
   */
  clearHistory(): void {
    this.moves = [];
    this.currentIndex = -1;
    this.restorePosition();
  }

  /**
   * Get PGN representation of the history
   */
  getPGN(): string {
    const chess = new Chess(this.startingPosition);
    let pgn = '';
    let moveNumber = 1;

    for (let i = 0; i <= this.currentIndex; i++) {
      const move = this.moves[i];
      
      if (chess.turn() === 'w') {
        pgn += `${moveNumber}. `;
      } else if (i === 0) {
        pgn += `${moveNumber}... `;
      }

      pgn += move.san + ' ';

      if (chess.turn() === 'b') {
        moveNumber++;
      }

      try {
        chess.move({
          from: move.move.from,
          to: move.move.to,
          promotion: move.move.promotion,
        });
      } catch {
        break; // Stop if move is invalid
      }
    }

    return pgn.trim();
  }

  /**
   * Load history from PGN string
   */
  loadFromPGN(pgn: string, startingFen?: string): boolean {
    try {
      const chess = new Chess(startingFen || this.startingPosition);
      const moves: MoveHistoryEntry[] = [];

      // Parse PGN and create move history
      const moveRegex = /\d+\.{1,3}\s*([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?)/g;
      let match;

      while ((match = moveRegex.exec(pgn)) !== null) {
        const san = match[1];
        try {
          const move = chess.move(san);
          if (move) {
            const moveEntry: MoveHistoryEntry = {
              move: this.convertMove(move),
              san: move.san,
              lan: move.lan || `${move.from}-${move.to}`,
              uci: `${move.from}${move.to}${move.promotion || ''}`,
              fen: chess.fen(),
              timestamp: new Date(),
              capturedPiece: move.captured,
              isCheck: chess.isCheck(),
              isCheckmate: chess.isCheckmate(),
              isStalemate: chess.isStalemate(),
            };
            moves.push(moveEntry);
          }
        } catch {
          return false; // Invalid move in PGN
        }
      }

      // Replace current history
      this.moves = moves;
      this.currentIndex = moves.length - 1;
      this.restorePosition();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Serialize history for saving
   */
  serialize(): SerializedMoveHistory {
    return {
      moves: this.moves.map(move => ({
        move: move.move,
        san: move.san,
        lan: move.lan,
        uci: move.uci,
        fen: move.fen,
        capturedPiece: move.capturedPiece,
        isCheck: move.isCheck,
        isCheckmate: move.isCheckmate,
        isStalemate: move.isStalemate,
      })),
      startingPosition: this.startingPosition,
      currentIndex: this.currentIndex,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
  }

  /**
   * Load history from serialized data
   */
  static fromSerialized(
    data: SerializedMoveHistory, 
    chess: Chess
  ): MoveHistory {
    const history = new MoveHistory(chess, data.startingPosition);
    
    history.moves = data.moves.map(moveData => ({
      ...moveData,
      timestamp: new Date(), // Use current time for deserialized moves
    }));
    
    history.currentIndex = data.currentIndex;
    history.restorePosition();
    
    return history;
  }

  /**
   * Get move statistics
   */
  getStatistics(): {
    totalMoves: number;
    captures: number;
    checks: number;
    castles: number;
    promotions: number;
    enPassants: number;
  } {
    return {
      totalMoves: this.moves.length,
      captures: this.moves.filter(move => move.capturedPiece).length,
      checks: this.moves.filter(move => move.isCheck).length,
      castles: this.moves.filter(move => move.move.flags.includes('k') || move.move.flags.includes('q')).length,
      promotions: this.moves.filter(move => move.move.promotion).length,
      enPassants: this.moves.filter(move => move.move.flags.includes('e')).length,
    };
  }

  /**
   * Find moves by criteria
   */
  findMoves(criteria: {
    piece?: string;
    from?: string;
    to?: string;
    capture?: boolean;
    check?: boolean;
    promotion?: boolean;
  }): MoveHistoryEntry[] {
    return this.moves.filter(entry => {
      if (criteria.piece && entry.move.piece !== criteria.piece) return false;
      if (criteria.from && entry.move.from !== criteria.from) return false;
      if (criteria.to && entry.move.to !== criteria.to) return false;
      if (criteria.capture !== undefined && !!entry.capturedPiece !== criteria.capture) return false;
      if (criteria.check !== undefined && entry.isCheck !== criteria.check) return false;
      if (criteria.promotion !== undefined && !!entry.move.promotion !== criteria.promotion) return false;
      return true;
    });
  }

  /**
   * Convert chess.js Move to our ChessMove interface
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
   * Restore chess position based on current index
   */
  private restorePosition(): void {
    // Reset to starting position
    this.chess.load(this.startingPosition);

    // Replay moves up to current index
    for (let i = 0; i <= this.currentIndex; i++) {
      if (i < this.moves.length) {
        const move = this.moves[i];
        try {
          this.chess.move({
            from: move.move.from,
            to: move.move.to,
            promotion: move.move.promotion,
          });
        } catch (error) {
          console.error(`Failed to restore move ${i}:`, error);
          break;
        }
      }
    }
  }
}

/**
 * Create a new move history instance
 */
export function createMoveHistory(
  chess: Chess, 
  startingPosition?: string, 
  maxLength?: number
): MoveHistory {
  return new MoveHistory(chess, startingPosition, maxLength);
}

/**
 * Create move history from PGN
 */
export function createMoveHistoryFromPGN(
  pgn: string, 
  chess: Chess, 
  startingFen?: string
): MoveHistory | null {
  const history = new MoveHistory(chess, startingFen);
  if (history.loadFromPGN(pgn, startingFen)) {
    return history;
  }
  return null;
}

// Legacy functions for backward compatibility
export const addMoveToHistory = () => {
  // Add move to history - replaced by MoveHistory class
  return [];
};

export const undoLastMove = () => {
  // Undo last move - replaced by MoveHistory class
  return null;
};
