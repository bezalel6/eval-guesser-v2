<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { FEN } from '$lib/types/chess';
  import { UCIParser } from '$lib/uciParser';

  // Props
  export let fen: FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Default starting position

  // State variables
  let score: number = 0; // Evaluation score (positive = white advantage)
  let displayScore: string = '0.00'; // Display string for the score
  let isMate: boolean = false;

  const dispatch = createEventDispatcher();
  const uciParser = new UCIParser();

  // Set up real-time analysis callback
  uciParser.setAnalysisCallback((snapshot) => {
    dispatch('analysis', snapshot);
  });

  // Reactive statement to reset parser when FEN changes
  $: if (fen) {
    const isBlackToMove = fen.split(' ')[1] === 'b';
    uciParser.reset();
    uciParser.setSideToMove(isBlackToMove);
  }

  // Handle UCI messages from the Chess component
  export function handleUCIMessage(message: string): void {
    if (typeof message === 'string') {
      // Parse UCI info messages for move analysis
      if (message.startsWith('info ')) {
        uciParser.parseInfo(message);

        // Only update evaluation bar for the BEST move (multipv 1)
        // This ensures the bar shows the same evaluation as the top move in the list
        const multipvMatch = message.match(/multipv (\d+)/);
        const multipv = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;

        if (multipv === 1) {
          const evalResult = uciParser.parseEvaluation(message);
          if (evalResult) {
            score = evalResult.score;
            displayScore = evalResult.displayScore;
            isMate = evalResult.isMate;
          }
        }
      }

      // When analysis completes, emit final data
      if (message.startsWith('bestmove')) {
        const snapshot = uciParser.handleBestMove(message);
        dispatch('analysis', snapshot);
      }
    }
  }

  // Calculate bar fill (50% neutral, shifts based on score)
  // For normal evaluations: map score to 5-95% range to leave room for mates
  // For ANY mate: complete fill (100% or 0%) - forced win is absolute
  $: whiteFill = ((): number => {
    if (isMate) {
      // ANY checkmate (M0, M1, M2, etc.) is a forced win - complete fill
      return score > 0 ? 100 : 0;
    }
    // For normal scores, map to range that leaves room at extremes
    // Clamp score between -20 and +20, then map to 5%-95%
    const clampedScore: number = Math.max(-20, Math.min(20, score));
    // Map -20 to 5%, 0 to 50%, +20 to 95%
    return 50 + (clampedScore * 2.25); // 2.25 = 45/20
  })();
  $: blackFill = 100 - whiteFill;
</script>

<div class="eval-bar">
  <div class="black" style="height: {blackFill}%"></div>
  <div class="white" style="height: {whiteFill}%"></div>
  <div class="score" class:mate={isMate}>
    {displayScore}
  </div>
</div>

<style>
  .eval-bar {
    position: relative;
    width: 40px; /* Wider for better visibility */
    height: 100%; /* Matches parent height */
    background: #333;
    border-right: 1px solid #555;
    overflow: hidden;
  }
  .white {
    background: linear-gradient(to top, #ffffff, #f0f0f0);
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    transition: height 0.3s ease;
  }
  .black {
    background: linear-gradient(to bottom, #000000, #2a2a2a);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    transition: height 0.3s ease;
  }
  .score {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #fff;
    background: rgba(0, 0, 0, 0.6);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 14px;
    font-weight: bold;
    z-index: 10;
    min-width: 35px;
    text-align: center;
  }

  .score.mate {
    background: rgba(255, 0, 0, 0.7);
    color: #fff;
    font-size: 16px;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0% { opacity: 0.8; }
    50% { opacity: 1; }
    100% { opacity: 0.8; }
  }
</style>