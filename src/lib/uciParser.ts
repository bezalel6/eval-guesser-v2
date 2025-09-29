/**
 * UCI Parser Module
 * Parses Stockfish UCI protocol messages to extract move analysis data
 * Properly handles iterative deepening and MultiPV analysis
 */

export interface MoveScore {
  type: 'cp' | 'mate';
  value: number;
}

export interface MoveAnalysisData {
  move: string;
  score: MoveScore;
  depth: number;
  pv?: string[];
  nodes?: number;
  multipv?: number; // MultiPV rank (1 = best, 2 = second best, etc.)
  seldepth?: number; // Selective depth
  time?: number; // Time in milliseconds
}

export interface AnalysisSnapshot {
  depth: number;
  moves: Map<string, MoveAnalysisData>;
  timestamp: number;
  bestMove?: string;
  isComplete: boolean; // Whether analysis is complete or ongoing
}

export class UCIParser {
  private currentDepth: number = 0;
  private moveAnalysis: Map<string, MoveAnalysisData> = new Map();
  private depthAnalysis: Map<number, Map<string, MoveAnalysisData>> = new Map();
  private isBlackToMove: boolean = false;
  private analysisCallback?: (snapshot: AnalysisSnapshot) => void;

  constructor() {
    this.reset();
  }

  /**
   * Set callback for real-time analysis updates
   */
  setAnalysisCallback(callback: (snapshot: AnalysisSnapshot) => void): void {
    this.analysisCallback = callback;
  }

  /**
   * Reset parser state
   */
  reset(): void {
    this.currentDepth = 0;
    this.moveAnalysis.clear();
    this.depthAnalysis.clear();
    this.isBlackToMove = false;
  }

  /**
   * Set the side to move for perspective adjustment
   */
  setSideToMove(isBlack: boolean): void {
    this.isBlackToMove = isBlack;
  }

  /**
   * Parse a UCI info message
   * Returns true if analysis was updated, false otherwise
   */
  parseInfo(message: string): boolean {
    // Extract depth from message
    const depthMatch = message.match(/depth (\d+)/);
    if (!depthMatch) return false;

    const depth = parseInt(depthMatch[1], 10);
    let updated = false;

    console.log('[UCIParser] Processing:', message.substring(0, 80) + '...');

    // Handle depth transitions - only clear when going DEEPER
    if (depth > this.currentDepth) {
      // Store previous depth analysis before clearing
      if (this.currentDepth > 0 && this.moveAnalysis.size > 0) {
        this.depthAnalysis.set(this.currentDepth, new Map(this.moveAnalysis));
      }

      // Start fresh analysis for new depth
      this.moveAnalysis.clear();
      this.currentDepth = depth;
    } else if (depth < this.currentDepth) {
      // For shallower analysis, still process it but don't update current depth
      // This can happen with MultiPV or delayed messages
    }

    // Extract additional info fields
    const multipvMatch = message.match(/multipv (\d+)/);
    const seldepthMatch = message.match(/seldepth (\d+)/);
    const timeMatch = message.match(/time (\d+)/);
    const nodesMatch = message.match(/nodes (\d+)/);

    const multipv = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;
    const seldepth = seldepthMatch ? parseInt(seldepthMatch[1], 10) : undefined;
    const time = timeMatch ? parseInt(timeMatch[1], 10) : undefined;
    const nodes = nodesMatch ? parseInt(nodesMatch[1], 10) : undefined;

    // Parse current move being analyzed
    const currMoveMatch = message.match(/currmove ([a-h][1-8][a-h][1-8][qrbnQRBN]?)/);
    if (currMoveMatch) {
      const move = currMoveMatch[1];
      const score = this.extractScore(message);

      if (score) {
        // Only update if we don't have better data (PV) for this move
        const existing = this.moveAnalysis.get(move);

        if (!existing || !existing.pv) {
          this.moveAnalysis.set(move, {
            move,
            score,
            depth,
            multipv,
            seldepth,
            time,
            nodes
          });
          updated = true;
        }
      }
    }

    // Parse principal variation (best line) - this is higher quality data
    const pvMatch = message.match(/\bpv ([a-h][1-8][a-h][1-8][qrbnQRBN]?(?:\s+[a-h][1-8][a-h][1-8][qrbnQRBN]?)*)/);
    if (pvMatch) {
      const moves = pvMatch[1].trim().split(/\s+/);
      const firstMove = moves[0];

      if (firstMove && this.isValidMove(firstMove)) {
        const score = this.extractScore(message);

        if (score) {
          // PV data always overwrites existing data
          this.moveAnalysis.set(firstMove, {
            move: firstMove,
            score,
            depth,
            pv: moves,
            multipv,
            seldepth,
            time,
            nodes
          });
          updated = true;
        }
      }
    }

    // Emit real-time updates if we have new data
    if (updated && this.analysisCallback) {
      const snapshot = this.getSnapshot(false);
      this.analysisCallback(snapshot);
    }

    return updated;
  }

  // Removed getMoveKey method - using move as direct key

  /**
   * Parse evaluation score from UCI message
   * Returns from WHITE's perspective
   */
  parseEvaluation(message: string): { score: number; displayScore: string; isMate: boolean } | null {
    const mateMatch = message.match(/score mate (-?\d+)/);
    if (mateMatch) {
      let mateIn = parseInt(mateMatch[1], 10);

      // Convert to white's perspective if black to move
      if (this.isBlackToMove) {
        mateIn = -mateIn;
      }

      // Special handling for mate 0 (checkmate on board)
      if (mateIn === 0) {
        // When it's mate 0, the side to move is in checkmate (they lost)
        if (this.isBlackToMove) {
          // Black is in checkmate, white wins
          return {
            score: 1100, // Very high score to ensure complete bar fill
            displayScore: '#',
            isMate: true
          };
        } else {
          // White is in checkmate, black wins
          return {
            score: -1100,
            displayScore: '#',
            isMate: true
          };
        }
      }

      // Regular mate score
      const score = 1000 - Math.abs(mateIn);
      const finalScore = mateIn > 0 ? score : -score;
      const displayScore = mateIn > 0 ? `+M${Math.abs(mateIn)}` : `-M${Math.abs(mateIn)}`;

      return {
        score: finalScore,
        displayScore,
        isMate: true
      };
    }

    const cpMatch = message.match(/score cp (-?\d+)/);
    if (cpMatch) {
      let rawScore = parseInt(cpMatch[1], 10) / 100; // Convert to pawns

      // Convert to white's perspective if black to move
      if (this.isBlackToMove) {
        rawScore = -rawScore;
      }

      const displayScore = rawScore > 0 ? `+${rawScore.toFixed(2)}` : rawScore.toFixed(2);

      return {
        score: rawScore,
        displayScore,
        isMate: false
      };
    }

    return null;
  }

  /**
   * Get current analysis snapshot
   */
  getSnapshot(isComplete: boolean = true): AnalysisSnapshot {
    // Combine current depth analysis with unique moves from all depths
    const consolidatedMoves = new Map<string, MoveAnalysisData>();

    // Start with current depth analysis (highest priority)
    for (const [move, analysis] of this.moveAnalysis.entries()) {
      const existing = consolidatedMoves.get(move);

      // Keep the highest depth analysis for each move
      if (!existing || analysis.depth >= existing.depth) {
        consolidatedMoves.set(move, analysis);
      }
    }

    // Add moves from previous depths if not already present
    for (const [depth, depthMoves] of this.depthAnalysis.entries()) {
      for (const [move, analysis] of depthMoves.entries()) {
        if (!consolidatedMoves.has(move)) {
          consolidatedMoves.set(move, analysis);
        }
      }
    }

    // Find best move (highest score from current perspective)
    let bestMove: string | undefined;
    let bestScore = -Infinity;
    let bestMultiPV = Infinity;

    for (const [move, analysis] of consolidatedMoves.entries()) {
      const score = this.calculateNumericScore(analysis.score);
      const multipv = analysis.multipv || 1;

      // Prefer better scores, but also prefer lower MultiPV ranks
      if (score > bestScore || (score === bestScore && multipv < bestMultiPV)) {
        bestScore = score;
        bestMultiPV = multipv;
        bestMove = move;
      }
    }

    return {
      depth: this.currentDepth,
      moves: consolidatedMoves,
      timestamp: Date.now(),
      bestMove,
      isComplete
    };
  }

  /**
   * Handle bestmove command (analysis completion)
   */
  handleBestMove(message: string): AnalysisSnapshot {
    // Store final depth analysis
    if (this.currentDepth > 0 && this.moveAnalysis.size > 0) {
      this.depthAnalysis.set(this.currentDepth, new Map(this.moveAnalysis));
    }

    return this.getSnapshot(true);
  }

  /**
   * Check if we have any analysis data
   */
  hasAnalysis(): boolean {
    return this.moveAnalysis.size > 0;
  }

  /**
   * Get current depth
   */
  getCurrentDepth(): number {
    return this.currentDepth;
  }

  // Private helper methods

  private extractScore(message: string): MoveScore | null {
    const cpMatch = message.match(/score cp (-?\d+)/);
    if (cpMatch) {
      return {
        type: 'cp',
        value: parseInt(cpMatch[1], 10)
      };
    }

    const mateMatch = message.match(/score mate (-?\d+)/);
    if (mateMatch) {
      return {
        type: 'mate',
        value: parseInt(mateMatch[1], 10)
      };
    }

    return null;
  }

  private extractNodes(message: string): number | undefined {
    const nodesMatch = message.match(/nodes (\d+)/);
    return nodesMatch ? parseInt(nodesMatch[1], 10) : undefined;
  }

  private isValidMove(move: string): boolean {
    // Basic validation for UCI move format
    return /^[a-h][1-8][a-h][1-8][qrbnQRBN]?$/.test(move);
  }

  private calculateNumericScore(score: MoveScore): number {
    if (score.type === 'mate') {
      // Heavily weight mates, closer mates are better
      return score.value > 0 ? 10000 - score.value : -10000 - score.value;
    }
    // Centipawn score
    return score.value;
  }
}