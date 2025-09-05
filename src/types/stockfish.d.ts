// Type definitions for Stockfish.js
declare module 'stockfish.js' {
  interface StockfishEngine {
    postMessage(command: string): void;
    addEventListener(event: 'message', handler: (event: MessageEvent) => void): void;
    removeEventListener(event: 'message', handler: (event: MessageEvent) => void): void;
    terminate(): void;
  }

  const Stockfish: {
    new (): StockfishEngine;
    default: new () => StockfishEngine;
  };

  export = Stockfish;
}
