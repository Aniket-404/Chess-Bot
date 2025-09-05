// Engine wrapper for unified interface
// This file will provide a unified engine interface

import { 
  initializeStockfish, 
  analyzePosition, 
  getBestMove, 
  getEvaluation, 
  isEngineReady,
  type StockfishOptions 
} from './stockfishEngine';

export interface ChessEngineResult {
  bestMove: string;
  evaluation: number;
  depth: number;
  principalVariation: string[];
}

export class ChessEngine {
  private isInitialized = false;

  constructor() {
    // Initialize engine wrapper
  }

  async initialize(): Promise<boolean> {
    try {
      this.isInitialized = await initializeStockfish();
      return this.isInitialized;
    } catch (error) {
      console.error('Failed to initialize chess engine:', error);
      return false;
    }
  }

  async getBestMove(fen: string, depth: number = 10): Promise<string> {
    if (!this.isInitialized || !isEngineReady()) {
      throw new Error('Chess engine not initialized');
    }
    
    const bestMove = await getBestMove(fen, depth);
    return bestMove || '';
  }

  async analyze(fen: string, options: StockfishOptions = { depth: 10 }): Promise<ChessEngineResult | null> {
    if (!this.isInitialized || !isEngineReady()) {
      throw new Error('Chess engine not initialized');
    }
    
    const analysis = await analyzePosition(fen, options);
    if (!analysis) {
      return null;
    }
    
    return {
      bestMove: analysis.bestMove,
      evaluation: analysis.evaluation,
      depth: analysis.depth,
      principalVariation: analysis.pv
    };
  }

  async getEvaluation(fen: string, depth: number = 10): Promise<number | null> {
    if (!this.isInitialized || !isEngineReady()) {
      throw new Error('Chess engine not initialized');
    }
    
    return await getEvaluation(fen, depth);
  }

  isReady(): boolean {
    return this.isInitialized && isEngineReady();
  }
}
