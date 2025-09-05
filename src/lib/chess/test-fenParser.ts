// Simple test script to verify FEN parser functionality
import { 
  validateFEN, 
  loadFEN, 
  getFEN, 
  loadPositionFromFEN,
  comparePositions,
  STARTING_POSITION_FEN,
  TEST_POSITIONS,
  getPositionInfo,
} from './fenParser';

console.log('Testing FEN Parser...\n');

// Test 1: Validate FEN strings
console.log('1. Testing FEN validation:');
console.log('Starting position valid:', validateFEN(STARTING_POSITION_FEN).isValid);
console.log('Invalid FEN valid:', validateFEN('invalid-fen').isValid);
console.log('');

// Test 2: Load and get FEN
console.log('2. Testing load/get FEN:');
try {
  const chess = loadFEN(STARTING_POSITION_FEN);
  const fen = getFEN(chess);
  console.log('Loaded and extracted FEN successfully');
  console.log('FEN matches:', fen === STARTING_POSITION_FEN);
} catch (error) {
  console.log('Error:', error);
}
console.log('');

// Test 3: Load position and get game state
console.log('3. Testing position loading:');
try {
  const gameState = loadPositionFromFEN(STARTING_POSITION_FEN);
  console.log('Game state loaded successfully');
  console.log('Turn:', gameState.turn);
  console.log('Available moves:', gameState.moves.length);
  console.log('In check:', gameState.inCheck);
  console.log('Game over:', gameState.isGameOver);
} catch (error) {
  console.log('Error:', error);
}
console.log('');

// Test 4: Position comparison
console.log('4. Testing position comparison:');
console.log('Starting positions match:', comparePositions(STARTING_POSITION_FEN, STARTING_POSITION_FEN));
console.log('Different positions match:', comparePositions(STARTING_POSITION_FEN, TEST_POSITIONS.MIDDLE_GAME));
console.log('');

// Test 5: Position info extraction
console.log('5. Testing position info:');
try {
  const info = getPositionInfo(STARTING_POSITION_FEN);
  console.log('Active color:', info.activeColor);
  console.log('White can castle kingside:', info.castlingRights.whiteKingside);
  console.log('White can castle queenside:', info.castlingRights.whiteQueenside);
  console.log('En passant target:', info.enPassantTarget);
  console.log('Halfmove clock:', info.halfmoveClock);
  console.log('Fullmove number:', info.fullmoveNumber);
} catch (error) {
  console.log('Error:', error);
}

console.log('\nFEN Parser tests completed!');
