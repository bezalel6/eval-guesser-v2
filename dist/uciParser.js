/**
 * UCI Parser Module
 * Parses Stockfish UCI protocol messages to extract move analysis data
 */
export class UCIParser {
    constructor() {
        this.currentDepth = 0;
        this.moveAnalysis = new Map();
        this.isBlackToMove = false;
        this.reset();
    }
    /**
     * Reset parser state
     */
    reset() {
        this.currentDepth = 0;
        this.moveAnalysis.clear();
        this.isBlackToMove = false;
    }
    /**
     * Set the side to move for perspective adjustment
     */
    setSideToMove(isBlack) {
        this.isBlackToMove = isBlack;
    }
    /**
     * Parse a UCI info message
     * Returns true if analysis was updated, false otherwise
     */
    parseInfo(message) {
        // Extract depth from message
        const depthMatch = message.match(/depth (\d+)/);
        if (!depthMatch)
            return false;
        const depth = parseInt(depthMatch[1], 10);
        // Handle depth transitions
        if (depth > this.currentDepth) {
            // Deeper analysis reached - clear previous data
            this.moveAnalysis.clear();
            this.currentDepth = depth;
        }
        else if (depth < this.currentDepth) {
            // Ignore shallower analysis
            return false;
        }
        // Parse current move being analyzed
        const currMoveMatch = message.match(/currmove ([a-h][1-8][a-h][1-8][qrbnQRBN]?)/);
        if (currMoveMatch) {
            const move = currMoveMatch[1];
            const score = this.extractScore(message);
            if (score) {
                const nodes = this.extractNodes(message);
                this.moveAnalysis.set(move, {
                    move,
                    score,
                    depth,
                    nodes
                });
                return true;
            }
        }
        // Parse principal variation (best line)
        const pvMatch = message.match(/pv (.+)$/);
        if (pvMatch) {
            const moves = pvMatch[1].trim().split(/\s+/);
            const firstMove = moves[0];
            if (firstMove && this.isValidMove(firstMove)) {
                const score = this.extractScore(message);
                if (score) {
                    const nodes = this.extractNodes(message);
                    // PV data overwrites currmove data for the same move
                    this.moveAnalysis.set(firstMove, {
                        move: firstMove,
                        score,
                        depth,
                        pv: moves,
                        nodes
                    });
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Parse evaluation score from UCI message
     * Returns from WHITE's perspective
     */
    parseEvaluation(message) {
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
                }
                else {
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
    getSnapshot() {
        // Find best move (highest score from white's perspective)
        let bestMove;
        let bestScore = -Infinity;
        for (const [move, analysis] of this.moveAnalysis.entries()) {
            const score = this.calculateNumericScore(analysis.score);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return {
            depth: this.currentDepth,
            moves: new Map(this.moveAnalysis),
            timestamp: Date.now(),
            bestMove
        };
    }
    /**
     * Check if we have any analysis data
     */
    hasAnalysis() {
        return this.moveAnalysis.size > 0;
    }
    /**
     * Get current depth
     */
    getCurrentDepth() {
        return this.currentDepth;
    }
    // Private helper methods
    extractScore(message) {
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
    extractNodes(message) {
        const nodesMatch = message.match(/nodes (\d+)/);
        return nodesMatch ? parseInt(nodesMatch[1], 10) : undefined;
    }
    isValidMove(move) {
        // Basic validation for UCI move format
        return /^[a-h][1-8][a-h][1-8][qrbnQRBN]?$/.test(move);
    }
    calculateNumericScore(score) {
        if (score.type === 'mate') {
            // Heavily weight mates, closer mates are better
            return score.value > 0 ? 10000 - score.value : -10000 - score.value;
        }
        // Centipawn score
        return score.value;
    }
}
