/**
 * Game Manager for playing against the computer
 * Handles game state, move validation, and computer moves
 */

import { Chess } from 'chess.js';
import type { FEN, StockfishWorker } from '$lib/types/chess';

export interface GameMove {
  from: string;
  to: string;
  promotion?: string;
  san?: string;
  fen?: string;
}

export interface GameState {
  fen: FEN;
  isGameOver: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  turn: 'w' | 'b';
  moveHistory: GameMove[];
  capturedPieces: {
    white: string[];
    black: string[];
  };
}

export class GameManager {
  private chess: Chess;
  private worker: StockfishWorker | null = null;
  private playerColor: 'white' | 'black';
  private computerLevel: number;
  private moveCallback?: (move: GameMove) => void;
  private stateChangeCallback?: (state: GameState) => void;
  private isThinking: boolean = false;

  constructor(
    initialFen: FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    playerColor: 'white' | 'black' = 'white',
    computerLevel: number = 10
  ) {
    this.chess = new Chess(initialFen);
    this.playerColor = playerColor;
    this.computerLevel = Math.max(1, Math.min(20, computerLevel)); // Clamp between 1-20
  }

  /**
   * Initialize Stockfish worker
   */
  initEngine(workerPath: string = '/stockfish.js'): void {
    if (typeof Worker !== 'undefined') {
      console.log('Initializing Stockfish worker...');
      this.worker = new Worker(workerPath) as StockfishWorker;
      this.worker.onmessage = this.handleEngineMessage.bind(this);

      // Initialize engine
      this.worker.postMessage('uci');
      this.worker.postMessage('isready');

      // Set skill level (0-20, where 0 is weakest)
      this.worker.postMessage(`setoption name Skill Level value ${this.computerLevel}`);

      // Set other options for faster play at lower levels
      if (this.computerLevel < 10) {
        // Limit search depth for weaker play
        this.worker.postMessage(`setoption name Depth value ${Math.max(1, this.computerLevel)}`);
      }

      // Check if it's computer's turn after a short delay to ensure engine is ready
      setTimeout(() => {
        if (this.shouldComputerMove()) {
          console.log('Computer should move on init');
          this.makeComputerMove();
        }
      }, 500);
    }
  }

  /**
   * Set callback for when moves are made
   */
  onMove(callback: (move: GameMove) => void): void {
    this.moveCallback = callback;
  }

  /**
   * Set callback for state changes
   */
  onStateChange(callback: (state: GameState) => void): void {
    this.stateChangeCallback = callback;
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    const history = this.chess.history({ verbose: true });
    const capturedPieces = this.getCapturedPieces(history);

    return {
      fen: this.chess.fen(),
      isGameOver: this.chess.isGameOver(),
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isStalemate: this.chess.isStalemate(),
      isDraw: this.chess.isDraw(),
      turn: this.chess.turn(),
      moveHistory: history.map(m => ({
        from: m.from,
        to: m.to,
        promotion: m.promotion,
        san: m.san,
        fen: m.after
      })),
      capturedPieces
    };
  }

  /**
   * Get captured pieces from move history
   */
  private getCapturedPieces(history: any[]): { white: string[]; black: string[] } {
    const captured: { white: string[]; black: string[] } = { white: [], black: [] };

    for (const move of history) {
      if (move.captured) {
        const color: 'white' | 'black' = move.color === 'w' ? 'black' : 'white';
        captured[color].push(move.captured);
      }
    }

    return captured;
  }

  /**
   * Check if it's the computer's turn
   */
  shouldComputerMove(): boolean {
    const turn = this.chess.turn();
    const isComputerTurn = (this.playerColor === 'white' && turn === 'b') ||
                           (this.playerColor === 'black' && turn === 'w');
    return isComputerTurn && !this.chess.isGameOver() && !this.isThinking;
  }

  /**
   * Make a player move
   */
  makePlayerMove(move: GameMove): boolean {
    if (this.isThinking || this.shouldComputerMove()) {
      return false; // Not player's turn or computer is thinking
    }

    try {
      const result = this.chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q'
      });

      if (result) {
        const moveWithSan: GameMove = {
          ...move,
          san: result.san,
          fen: this.chess.fen()
        };

        this.moveCallback?.(moveWithSan);
        this.stateChangeCallback?.(this.getState());

        // Check if computer should move
        if (this.shouldComputerMove()) {
          setTimeout(() => this.makeComputerMove(), 500); // Small delay for better UX
        }

        return true;
      }
    } catch (e) {
      console.error('Invalid move:', e);
    }

    return false;
  }

  /**
   * Request computer move from Stockfish
   */
  private makeComputerMove(): void {
    if (!this.worker || this.isThinking) {
      console.log('Cannot make computer move:', { worker: !!this.worker, isThinking: this.isThinking });
      return;
    }

    console.log('Making computer move...');
    this.isThinking = true;
    const fen = this.chess.fen();

    // Send position to engine
    this.worker.postMessage(`position fen ${fen}`);

    // Request best move with time/depth based on level
    if (this.computerLevel >= 15) {
      // Strong play: use more time
      this.worker.postMessage('go movetime 2000');
    } else if (this.computerLevel >= 10) {
      // Medium play
      this.worker.postMessage('go movetime 1000');
    } else if (this.computerLevel >= 5) {
      // Weak play
      this.worker.postMessage('go movetime 500');
    } else {
      // Very weak play
      this.worker.postMessage(`go depth ${this.computerLevel}`);
    }
  }

  /**
   * Handle messages from Stockfish
   */
  private handleEngineMessage(event: MessageEvent): void {
    const message = event.data;

    // Log all messages during development
    if (message && !message.includes('info depth')) {
      console.log('Stockfish:', message);
    }

    if (typeof message === 'string') {
      // Handle readyok to trigger computer move if needed
      if (message === 'readyok' && this.shouldComputerMove() && !this.isThinking) {
        console.log('Engine ready, checking for computer move');
        this.makeComputerMove();
      }

      // Handle bestmove
      if (message.startsWith('bestmove')) {
        console.log('Got best move:', message);
        const match = message.match(/bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/);

        if (match) {
          const uciMove = match[1];
          const from = uciMove.substring(0, 2);
          const to = uciMove.substring(2, 4);
          const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

          try {
            const result = this.chess.move({
              from,
              to,
              promotion
            });

            if (result) {
              const move: GameMove = {
                from,
                to,
                promotion,
                san: result.san,
                fen: this.chess.fen()
              };

              console.log('Computer moved:', move.san);
              this.isThinking = false;
              this.moveCallback?.(move);
              this.stateChangeCallback?.(this.getState());
            }
          } catch (e) {
            console.error('Invalid computer move:', e);
            this.isThinking = false;
          }
        } else {
          console.log('No valid move in bestmove message');
          this.isThinking = false;
        }
      }
    }
  }

  /**
   * Get legal moves for a square
   */
  getLegalMoves(square: string): string[] {
    const moves = this.chess.moves({ square: square as any, verbose: true }) as any[];
    return moves.map(m => m.to);
  }

  /**
   * Reset the game
   */
  reset(fen?: FEN): void {
    const resetFen = fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    this.chess = new Chess(resetFen);
    this.isThinking = false;
    this.stateChangeCallback?.(this.getState());

    // Check if computer should make first move
    if (this.shouldComputerMove()) {
      setTimeout(() => this.makeComputerMove(), 1000);
    }
  }

  /**
   * Undo last move (or last two moves if it was computer's turn)
   */
  undo(): void {
    if (this.isThinking) return;

    // Undo computer's move
    this.chess.undo();

    // Undo player's move
    if (this.chess.history().length > 0) {
      this.chess.undo();
    }

    this.stateChangeCallback?.(this.getState());
  }

  /**
   * Clean up
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Get current FEN
   */
  getFen(): FEN {
    return this.chess.fen();
  }

  /**
   * Check if it's player's turn
   */
  isPlayerTurn(): boolean {
    return !this.shouldComputerMove() && !this.isThinking;
  }

  /**
   * Check if computer is thinking
   */
  isComputerThinking(): boolean {
    return this.isThinking;
  }
}