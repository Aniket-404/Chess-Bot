// Test script for the integrated chess engine
import { ChessEngine, ChessEngineUtils } from './chessEngine';
import { TEST_POSITIONS } from './fenParser';

console.log('Testing Integrated Chess Engine...\n');

// Test 1: Basic engine creation and initialization
console.log('1. Testing engine creation and initialization:');
try {
  const engine = new ChessEngine();
  const gameState = engine.getGameState();
  console.log('Engine created successfully:', gameState.success);
  console.log('Initial turn:', gameState.data?.turn);
  console.log('Initial moves available:', gameState.data?.moves.length);
  console.log('Game over:', gameState.data?.isGameOver);
} catch (error) {
  console.log('Error:', error);
}
console.log('');

// Test 2: Making moves with different input types
console.log('2. Testing move making with different input types:');
try {
  const engine = new ChessEngine();
  
  // Test string notation
  const move1 = engine.makeMove('e4');
  console.log('String notation move (e4):', move1.success, move1.data?.san);
  
  const move2 = engine.makeMove('e5');
  console.log('String notation move (e5):', move2.success, move2.data?.san);
  
  // Test object notation
  const move3 = engine.makeMove({ from: 'g1', to: 'f3' });
  console.log('Object notation move (Nf3):', move3.success, move3.data?.san);
  
  // Test invalid move
  const invalidMove = engine.makeMove('invalid');
  console.log('Invalid move:', invalidMove.success, invalidMove.error?.type);
} catch (error) {
  console.log('Error:', error);
}
console.log('');

// Test 3: History functionality
console.log('3. Testing history functionality:');
try {
  const engine = new ChessEngine();
  
  // Make some moves
  engine.makeMove('d4');
  engine.makeMove('d5');
  engine.makeMove('Nf3');
  engine.makeMove('Nf6');
  
  const history = engine.getHistory();
  console.log('History length:', history.data?.length);
  console.log('Last move:', history.data?.[history.data.length - 1]?.san);
  
  // Test undo
  const undoResult = engine.undoMove();
  console.log('Undo successful:', undoResult.success);
  
  const gameStateAfterUndo = engine.getGameState();
  console.log('Turn after undo:', gameStateAfterUndo.data?.turn);
  
  // Test redo
  const redoResult = engine.redoMove();
  console.log('Redo successful:', redoResult.success);
} catch (error) {
  console.log('Error:', error);
}
console.log('');

// Test 4: FEN loading and validation
console.log('4. Testing FEN loading and validation:');
try {
  const engine = new ChessEngine();
  
  // Load valid FEN
  const loadResult = engine.loadFEN(TEST_POSITIONS.MIDDLE_GAME);
  console.log('Middle game FEN loaded:', loadResult.success);
  
  const gameState = engine.getGameState();
  console.log('Turn after FEN load:', gameState.data?.turn);
  console.log('Moves available:', gameState.data?.moves.length);
  
  // Test invalid FEN
  const invalidFenResult = engine.loadFEN('invalid-fen-string');
  console.log('Invalid FEN rejected:', !invalidFenResult.success);
  console.log('Error type:', invalidFenResult.error?.type);
} catch (error) {
  console.log('Error:', error);
}
console.log('');

// Test 5: Legal move checking
console.log('5. Testing legal move checking:');
try {
  const engine = new ChessEngine();
  
  const legalMove = engine.isMoveLegal('e4');
  console.log('e4 is legal at start:', legalMove.data);
  
  const illegalMove = engine.isMoveLegal('e5'); // Can't move opponent's piece
  console.log('e5 is legal for white:', illegalMove.data);
  
  engine.makeMove('e4');
  const responseMove = engine.isMoveLegal('e5');
  console.log('e5 is legal for black after e4:', responseMove.data);
} catch (error) {
  console.log('Error:', error);
}
console.log('');

// Test 6: PGN functionality
console.log('6. Testing PGN functionality:');
try {
  const engine = new ChessEngine();
  
  // Play a short game
  const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'];
  moves.forEach(move => engine.makeMove(move));
  
  const pgnResult = engine.getPGN();
  console.log('Generated PGN:', pgnResult.data);
  
  // Test loading PGN
  const newEngine = new ChessEngine();
  const loadPgnResult = newEngine.loadPGN('1. e4 e5 2. Nf3');
  console.log('PGN loaded successfully:', loadPgnResult.success);
  
  const finalState = newEngine.getGameState();
  console.log('Position after PGN load, available moves:', finalState.data?.moves.length);
} catch (error) {
  console.log('Error:', error);
}
console.log('');

// Test 7: Game result detection
console.log('7. Testing game result detection:');
try {
  const engine = new ChessEngine();
  
  // Play Scholar's Mate
  const scholarMoves = ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6??', 'Qxf7#'];
  scholarMoves.forEach(move => {
    const result = engine.makeMove(move);
    if (!result.success) {
      console.log(`Failed to make move ${move}:`, result.error?.message);
    }
  });
  
  const gameResult = engine.getGameResult();
  console.log('Game result:', gameResult);
  
  const gameState = engine.getGameState();
  console.log('Is checkmate:', gameState.data?.inCheckmate);
  console.log('Is game over:', gameState.data?.isGameOver);
} catch (error) {
  console.log('Error:', error);
}
console.log('');

// Test 8: Configuration and utilities
console.log('8. Testing configuration and utilities:');
try {
  // Test engine with logging
  ChessEngineUtils.createWithLogging();
  console.log('Engine with logging created');
  
  // Test engine without history
  const engineNoHistory = ChessEngineUtils.createWithoutHistory();
  engineNoHistory.makeMove('e4');
  const historyResult = engineNoHistory.getHistory();
  console.log('Engine without history - history disabled:', !historyResult.success);
  
  // Test strict mode engine
  ChessEngineUtils.createStrict();
  console.log('Strict engine created');
  
  // Test test position loading
  const testEngine = ChessEngineUtils.createFromTestPosition('ENDGAME');
  const endgameState = testEngine.getGameState();
  console.log('Endgame position loaded, pieces on board:', endgameState.data?.fen.split(' ')[0]);
} catch (error) {
  console.log('Error:', error);
}
console.log('');

// Test 9: Error handling
console.log('9. Testing error handling:');
try {
  const engine = new ChessEngine();
  
  // Make moves to reach checkmate
  engine.makeMove('f3');
  engine.makeMove('e6');
  engine.makeMove('g4');
  engine.makeMove('Qh4#');
  
  // Try to make move after checkmate
  const moveAfterMate = engine.makeMove('h3');
  console.log('Move after checkmate rejected:', !moveAfterMate.success);
  console.log('Error type:', moveAfterMate.error?.type);
  
  // Test invalid FEN error
  try {
    new ChessEngine('completely-invalid-fen');
  } catch {
    console.log('Invalid starting FEN rejected during construction');
  }
} catch (error) {
  console.log('Error:', error);
}

console.log('\nIntegrated Chess Engine tests completed!');
