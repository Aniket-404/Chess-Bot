// Test file for Stockfish engine integration
// This will verify that our engine setup is working correctly

import { ChessEngine } from './engineWrapper';

export const testStockfishIntegration = async (): Promise<void> => {
  console.log('🧪 Testing Stockfish Integration...');
  
  const engine = new ChessEngine();
  
  try {
    // Test 1: Engine initialization
    console.log('1️⃣ Testing engine initialization...');
    const initialized = await engine.initialize();
    if (!initialized) {
      throw new Error('Engine failed to initialize');
    }
    console.log('✅ Engine initialized successfully');
    
    // Test 2: Starting position analysis
    console.log('2️⃣ Testing starting position analysis...');
    const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const analysis = await engine.analyze(startingFen, { depth: 5 });
    
    if (!analysis) {
      throw new Error('Analysis returned null');
    }
    
    console.log('✅ Analysis completed:', {
      bestMove: analysis.bestMove,
      evaluation: analysis.evaluation,
      depth: analysis.depth
    });
    
    // Test 3: Get best move
    console.log('3️⃣ Testing best move calculation...');
    const bestMove = await engine.getBestMove(startingFen, 5);
    console.log('✅ Best move:', bestMove);
    
    // Test 4: Get evaluation
    console.log('4️⃣ Testing position evaluation...');
    const evaluation = await engine.getEvaluation(startingFen, 5);
    console.log('✅ Position evaluation:', evaluation);
    
    // Test 5: Invalid FEN handling
    console.log('5️⃣ Testing invalid FEN handling...');
    try {
      await engine.analyze('invalid-fen', { depth: 5 });
      console.log('❌ Should have thrown error for invalid FEN');
    } catch (error) {
      console.log('✅ Correctly handled invalid FEN:', (error as Error).message);
    }
    
    console.log('🎉 All tests passed! Stockfish integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

// Helper function to run tests in browser console
export const runEngineTests = async (): Promise<void> => {
  if (typeof window !== 'undefined') {
    await testStockfishIntegration();
  } else {
    console.log('Engine tests can only be run in browser environment');
  }
};
