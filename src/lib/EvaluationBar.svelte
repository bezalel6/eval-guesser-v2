<script>
  import { onMount, onDestroy } from 'svelte';

  export let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Default starting position
  export let depth = 15; // Analysis depth

  let score = 0; // Evaluation score (positive = white advantage)
  let displayScore = '0.00'; // Display string for the score
  let isMate = false;
  let mateIn = 0;
  let worker;

  const MATE_SCORE = 1000; // Base score for mate evaluation

  onMount(() => {
    worker = new Worker('/stockfish.js');
    worker.onmessage = handleMessage;
    analyzePosition();
  });

  onDestroy(() => {
    if (worker) worker.terminate();
  });

  $: if (fen) analyzePosition(); // React to FEN changes

  function analyzePosition() {
    if (!worker) return;
    worker.postMessage('uci');
    worker.postMessage('isready');
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go depth ${depth}`);
  }

  function handleMessage(event) {
    const message = event.data;
    console.log(message)
    if (typeof message === 'string') {
      // Stockfish reports score from the perspective of the side to move
      // We need to convert to always show from white's perspective
      const isBlackToMove = fen.split(' ')[1] === 'b';

      // Check for mate score first
      const mateMatch = message.match(/score mate (-?\d+)/);
      if (mateMatch) {
        mateIn = parseInt(mateMatch[1]);
        isMate = true;

        // Special handling for mate 0 (checkmate on board)
        if (mateIn === 0) {
          // When it's mate 0, the side to move is in checkmate (they lost)
          // So if it's black to move, white has won, and vice versa
          if (isBlackToMove) {
            score = MATE_SCORE + 100; // White has won - highest possible score (ensure complete fill)
            displayScore = '#';  // Just show # for checkmate
          } else {
            score = -(MATE_SCORE + 100); // Black has won - lowest possible score (ensure complete fill)
            displayScore = '#';  // Just show # for checkmate
          }
        } else {
          // Convert to white's perspective if black to move
          if (isBlackToMove) {
            mateIn = -mateIn;
          }

          // Use a very high score for mate, scaled by moves to mate
          // Closer mates get higher scores (M1 > M2 > M3, etc.)
          // But M0 (checkmate) is always highest
          score = MATE_SCORE - Math.abs(mateIn);
          if (mateIn < 0) score = -score;

          // Display format
          if (mateIn > 0) {
            displayScore = '+M' + Math.abs(mateIn);
          } else {
            displayScore = '-M' + Math.abs(mateIn);
          }
        }
      } else {
        // Check for centipawn score
        const cpMatch = message.match(/score cp (-?\d+)/);
        if (cpMatch) {
          isMate = false;
          mateIn = 0;
          let rawScore = parseInt(cpMatch[1]) / 100; // Convert to pawns

          // Convert to white's perspective if black to move
          if (isBlackToMove) {
            rawScore = -rawScore;
          }

          score = rawScore;

          // Format display score
          if (score > 0) {
            displayScore = '+' + score.toFixed(2);
          } else {
            displayScore = score.toFixed(2);
          }
        }
      }
    }
  }

  // Calculate bar fill (50% neutral, shifts based on score)
  // For normal evaluations: map score to 5-95% range to leave room for mates
  // For ANY mate: complete fill (100% or 0%) - forced win is absolute
  $: whiteFill = (() => {
    if (isMate) {
      // ANY checkmate (M0, M1, M2, etc.) is a forced win - complete fill
      return score > 0 ? 100 : 0;
    }
    // For normal scores, map to range that leaves room at extremes
    // Clamp score between -20 and +20, then map to 5%-95%
    const clampedScore = Math.max(-20, Math.min(20, score));
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