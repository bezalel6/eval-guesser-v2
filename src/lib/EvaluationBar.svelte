<script>
  import { onMount, onDestroy } from 'svelte';

  export let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Default starting position
  export let depth = 15; // Analysis depth

  let score = 0; // Evaluation score (positive = white advantage)
  let worker;

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
    if (typeof message === 'string') {
      const match = message.match(/score cp (-?\d+)/); // Extract centipawn score
      if (match) {
        score = parseInt(match[1]) / 100; // Convert to pawns (e.g., 1.5)
        score = Math.max(-10, Math.min(10, score)); // Clamp to -10 to +10
      }
    }
  }

  // Calculate bar fill (50% neutral, shifts based on score)
  // When white is winning (positive score), white fills from bottom
  // When black is winning (negative score), black fills from top
  $: whiteFill = 50 + (score * 5); // 50% + (score / 10 * 50%)
  $: blackFill = 100 - whiteFill;
</script>

<div class="eval-bar">
  <div class="black" style="height: {blackFill}%"></div>
  <div class="white" style="height: {whiteFill}%"></div>
  <div class="score">{score > 0 ? '+' : ''}{score.toFixed(2)}</div>
</div>

<style>
  .eval-bar {
    position: relative;
    width: 40px; /* Wider for better visibility */
    height: 100%; /* Matches parent height */
    background: #333;
    border: 2px solid #555;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
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
</style>