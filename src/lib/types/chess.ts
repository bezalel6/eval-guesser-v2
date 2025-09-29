/**
 * Chess-related type definitions
 */

/** Standard chess FEN string */
export type FEN = string;

/** Chess piece colors */
export type Color = 'white' | 'black' | 'w' | 'b';

/** Evaluation score in centipawns or mate distance */
export interface EvaluationScore {
  /** Score in pawns (centipawns / 100) */
  score: number;
  /** Whether this is a mate evaluation */
  isMate: boolean;
  /** Number of moves to mate (positive for white, negative for black) */
  mateIn: number;
  /** Display string for the score */
  displayScore: string;
}

/** Stockfish worker message types */
export type StockfishMessage = string;

/** Stockfish analysis depth */
export type AnalysisDepth = number;

/** Evaluation bar fill percentages */
export interface BarFill {
  /** White fill percentage (0-100) */
  whiteFill: number;
  /** Black fill percentage (0-100) */
  blackFill: number;
}

/** Stockfish Web Worker instance */
export type StockfishWorker = Worker;

/** Chess square in algebraic notation */
export type Square = string;

/** Chess move in UCI format */
export type Move = [Square, Square];