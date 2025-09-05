// Stockfish engine integration
// This file will handle direct Stockfish communication

import { Chess } from 'chess.js';

interface StockfishEngine {
  postMessage(command: string): void;
  addEventListener(event: 'message', handler: (event: MessageEvent) => void): void;
  removeEventListener(event: 'message', handler: (event: MessageEvent) => void): void;
  terminate(): void;
}

// Initialize Stockfish WebAssembly engine
let stockfishEngine: StockfishEngine | null = null;

export interface StockfishEvaluation {
  evaluation: number;
  bestMove: string;
  depth: number;
  pv: string[];
}

export interface StockfishOptions {
  depth: number;
  multipv?: number;
  skillLevel?: number;
}

export const initializeStockfish = async (): Promise<boolean> => {
  try {
    // Dynamic import to handle client-side loading
    if (typeof window !== 'undefined') {
      const StockfishModule = await import('stockfish.js');
      stockfishEngine = new StockfishModule.default();
      
      // Set up engine initialization
      stockfishEngine.postMessage('uci');
      stockfishEngine.postMessage('isready');
      
      console.log('Stockfish engine initialized successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to initialize Stockfish engine:', error);
    return false;
  }
};

export const analyzePosition = async (
  fen: string, 
  options: StockfishOptions = { depth: 10 }
): Promise<StockfishEvaluation | null> => {
  if (!stockfishEngine) {
    console.error('Stockfish engine not initialized');
    return null;
  }

  try {
    // Validate FEN position using chess.js
    const chess = new Chess();
    try {
      chess.load(fen);
    } catch {
      throw new Error('Invalid FEN position');
    }

    return new Promise((resolve, reject) => {
      let bestMove = '';
      let evaluation = 0;
      let depth = 0;
      let pv: string[] = [];

      const timeout = setTimeout(() => {
        reject(new Error('Analysis timeout'));
      }, 10000); // 10 second timeout

      const messageHandler = (event: MessageEvent) => {
        const line = event.data;
        
        if (line.includes('bestmove')) {
          clearTimeout(timeout);
          const match = line.match(/bestmove (\S+)/);
          if (match) {
            bestMove = match[1];
          }
          
          stockfishEngine?.removeEventListener('message', messageHandler);
          resolve({
            evaluation,
            bestMove,
            depth,
            pv
          });
        } else if (line.includes('info depth')) {
          // Parse evaluation info
          const depthMatch = line.match(/depth (\d+)/);
          const scoreMatch = line.match(/score cp (-?\d+)/);
          const mateMatch = line.match(/score mate (-?\d+)/);
          const pvMatch = line.match(/pv (.+)/);
          
          if (depthMatch) {
            depth = parseInt(depthMatch[1]);
          }
          
          if (scoreMatch) {
            evaluation = parseInt(scoreMatch[1]) / 100; // Convert centipawns to pawns
          } else if (mateMatch) {
            const mateIn = parseInt(mateMatch[1]);
            evaluation = mateIn > 0 ? 999 : -999; // Indicate mate
          }
          
          if (pvMatch) {
            pv = pvMatch[1].split(' ');
          }
        }
      };

      stockfishEngine?.addEventListener('message', messageHandler);
      
      // Send position and analysis commands
      stockfishEngine?.postMessage('position fen ' + fen);
      stockfishEngine?.postMessage(`go depth ${options.depth}`);
    });
    
  } catch (error) {
    console.error('Error analyzing position:', error);
    return null;
  }
};

export const getBestMove = async (fen: string, depth: number = 10): Promise<string | null> => {
  const analysis = await analyzePosition(fen, { depth });
  return analysis ? analysis.bestMove : null;
};

export const getEvaluation = async (fen: string, depth: number = 10): Promise<number | null> => {
  const analysis = await analyzePosition(fen, { depth });
  return analysis ? analysis.evaluation : null;
};

export const isEngineReady = (): boolean => {
  return stockfishEngine !== null;
};
