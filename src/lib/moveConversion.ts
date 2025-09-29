/**
 * Move conversion utilities for chess notation
 * Converts between UCI and SAN notation
 */

import { Chess } from 'chess.js';

export interface MoveConversionResult {
  san: string;
  isValid: boolean;
}

/**
 * Convert UCI move to SAN notation using chess.js
 * This provides accurate conversion by maintaining board state
 */
export function uciToSan(fen: string, uciMove: string): MoveConversionResult {
  try {
    const chess = new Chess(fen);

    // Parse UCI move format (e.g., "e2e4", "e7e8q")
    if (uciMove.length < 4) {
      return { san: uciMove, isValid: false };
    }

    const from = uciMove.substring(0, 2);
    const to = uciMove.substring(2, 4);
    const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

    // Try to make the move
    const move = chess.move({
      from,
      to,
      promotion
    });

    if (move) {
      return { san: move.san, isValid: true };
    } else {
      // Fallback to basic conversion if move is invalid
      return { san: getBasicSan(uciMove), isValid: false };
    }
  } catch (error) {
    // Fallback to basic conversion on any error
    return { san: getBasicSan(uciMove), isValid: false };
  }
}

/**
 * Basic UCI to SAN conversion fallback
 * Used when chess.js conversion fails
 */
function getBasicSan(uci: string): string {
  if (uci.length < 4) return uci;

  const from = uci.substring(0, 2);
  const to = uci.substring(2, 4);
  const promotion = uci.length > 4 ? uci[4].toUpperCase() : '';

  // Handle common patterns
  const piecePatterns: { [key: string]: string } = {
    // Knights
    'g1f3': 'Nf3', 'b1c3': 'Nc3', 'g8f6': 'Nf6', 'b8c6': 'Nc6',
    // Bishops
    'f1c4': 'Bc4', 'f1b5': 'Bb5', 'c1f4': 'Bf4', 'c8f5': 'Bf5',
    // Castling
    'e1g1': 'O-O', 'e1c1': 'O-O-O', 'e8g8': 'O-O', 'e8c8': 'O-O-O'
  };

  // Check for known patterns
  const pattern = from + to;
  if (piecePatterns[pattern]) {
    return piecePatterns[pattern];
  }

  // Basic pawn moves
  if (from[0] === to[0] && Math.abs(parseInt(from[1]) - parseInt(to[1])) <= 2) {
    // Straight pawn move
    return to + promotion;
  }

  // Pawn captures
  if (Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) === 1 &&
      Math.abs(parseInt(from[1]) - parseInt(to[1])) === 1) {
    return from[0] + 'x' + to + promotion;
  }

  // Default: destination square with promotion
  return to + promotion;
}

/**
 * Batch convert multiple UCI moves to SAN
 */
export function batchUciToSan(fen: string, uciMoves: string[]): Map<string, MoveConversionResult> {
  const results = new Map<string, MoveConversionResult>();

  for (const uciMove of uciMoves) {
    results.set(uciMove, uciToSan(fen, uciMove));
  }

  return results;
}

/**
 * Get the move's destination square for simple display
 */
export function getDestinationSquare(uci: string): string {
  if (uci.length < 4) return uci;
  return uci.substring(2, 4);
}