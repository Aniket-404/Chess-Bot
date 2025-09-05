// Test script for move history functionality
import { Chess } from 'chess.js';
import { MoveHistory, createMoveHistory } from './moveHistory';

console.log('Testing Move History System...\n');

// Test 1: Basic move history operations
console.log('1. Testing basic move history operations:');
try {
  const chess = new Chess();
  const history = createMoveHistory(chess);
  
  // Make some moves
  const move1 = chess.move('e4');
  if (move1) history.addMove(move1);
  
  const move2 = chess.move('e5');
  if (move2) history.addMove(move2);
  
  const move3 = chess.move('Nf3');
  if (move3) history.addMove(move3);
  
  console.log('Moves added:', history.getLength());
  console.log('Current index:', history.getCurrentIndex());
  console.log('Last move:', history.getLastMove()?.san);
  console.log('Can undo:', history.canUndo());
  console.log('Can redo:', history.canRedo());
} catch (error) {
  console.log('Error:', error);
}
console.log('');

// Test 2: Undo/Redo functionality
console.log('2. Testing undo/redo functionality:');
try {
  const chess = new Chess();
  const history = createMoveHistory(chess);
  
  // Make moves
  const moves = ['e4', 'e5', 'Nf3', 'Nc6'];
  moves.forEach(move => {
    const chessMove = chess.move(move);
    if (chessMove) history.addMove(chessMove);
  });
  
  console.log('Initial position after moves:', chess.fen().split(' ')[0]);
  console.log('History length:', history.getLength());
  
  // Test undo
  const undoSuccess = history.undo();
  console.log('Undo successful:', undoSuccess);
  console.log('Position after undo:', chess.fen().split(' ')[0]);
  console.log('Current index after undo:', history.getCurrentIndex());
  
  // Test redo
  const redoSuccess = history.redo();
  console.log('Redo successful:', redoSuccess);
  console.log('Position after redo:', chess.fen().split(' ')[0]);
  console.log('Current index after redo:', history.getCurrentIndex());
} catch (error) {
  console.log('Error:', error);
}
console.log('');

// Test 3: Navigation functionality
console.log('3. Testing move navigation:');
try {
  const chess = new Chess();
  const history = createMoveHistory(chess);
  
  // Make moves
  const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'];
  moves.forEach(move => {
    const chessMove = chess.move(move);
    if (chessMove) history.addMove(chessMove);
  });
  
  console.log('Total moves:', history.getLength());
  
  // Go to beginning
  history.goToBeginning();
  console.log('At beginning, index:', history.getCurrentIndex());
  console.log('Position:', chess.fen().split(' ')[0]);
  
  // Go to move 2
  history.goToMove(1);
  console.log('At move 2, index:', history.getCurrentIndex());
  console.log('Last move:', history.getLastMove()?.san);
  
  // Go to end
  history.goToEnd();
  console.log('At end, index:', history.getCurrentIndex());
  console.log('Last move:', history.getLastMove()?.san);
} catch (error) {
  console.log('Error:', error);
}
console.log('');

// Test 4: PGN functionality
console.log('4. Testing PGN functionality:');
try {
  const chess = new Chess();
  const history = createMoveHistory(chess);
  
  // Make the Scholar's Mate
  const moves = ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6??', 'Qxf7#'];
  moves.forEach(move => {
    const chessMove = chess.move(move);
    if (chessMove) history.addMove(chessMove);
  });
  
  const pgn = history.getPGN();
  console.log('Generated PGN:', pgn);
  console.log('Game over:', chess.isGameOver());
  console.log('Checkmate:', chess.isCheckmate());
} catch (error) {
  console.log('Error:', error);
}
console.log('');

// Test 5: Statistics and search
console.log('5. Testing statistics and move search:');
try {
  const chess = new Chess();
  const history = createMoveHistory(chess);
  
  // Make moves with captures and checks
  const moves = ['e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Nf6', 'Ng5', 'Be6', 'Nxe6', 'fxe6'];
  moves.forEach(move => {
    const chessMove = chess.move(move);
    if (chessMove) history.addMove(chessMove);
  });
  
  const stats = history.getStatistics();
  console.log('Statistics:', stats);
  
  // Find capture moves
  const captures = history.findMoves({ capture: true });
  console.log('Capture moves:', captures.map(m => m.san));
  
  // Find moves by piece
  const knightMoves = history.findMoves({ piece: 'n' });
  console.log('Knight moves:', knightMoves.map(m => m.san));
} catch (error) {
  console.log('Error:', error);
}
console.log('');

// Test 6: Serialization
console.log('6. Testing serialization:');
try {
  const chess = new Chess();
  const history = createMoveHistory(chess);
  
  // Make some moves
  const moves = ['d4', 'd5', 'Nf3', 'Nf6'];
  moves.forEach(move => {
    const chessMove = chess.move(move);
    if (chessMove) history.addMove(chessMove);
  });
  
  // Serialize
  const serialized = history.serialize();
  console.log('Serialized moves count:', serialized.moves.length);
  console.log('Starting position:', serialized.startingPosition.split(' ')[0]);
  
  // Create new history from serialized data
  const chess2 = new Chess();
  const history2 = MoveHistory.fromSerialized(serialized, chess2);
  console.log('Restored moves count:', history2.getLength());
  console.log('Last move in restored history:', history2.getLastMove()?.san);
} catch (error) {
  console.log('Error:', error);
}

console.log('\nMove History tests completed!');
