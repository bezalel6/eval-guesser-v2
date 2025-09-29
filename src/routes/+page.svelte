<script>
  import { Chess } from 'svelte-chess';
  import EvaluationBar from '$lib/EvaluationBar.svelte';

  let currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
</script>

<div class="w-full">
    <div class="max-w-6xl mx-auto px-6 py-12">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Eval Guesser</h1>

        <div class="chess-container">
            <EvaluationBar fen={currentFen} depth={15} />
            <div class="board-wrapper">
                <Chess bind:fen={currentFen} />
            </div>
        </div>
    </div>
</div>

<style>
  .chess-container {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    width: 640px; /* Fixed width: 40px eval bar + 600px board */
    margin: 0 auto;
    height: 600px; /* Fixed height for the container */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
  }

  .board-wrapper {
    width: 600px;
    height: 600px;
    position: relative;
  }

  /* Global styles for the chessboard */
  :global(.chessground) {
    width: 100% !important;
    height: 100% !important;
  }

  :global(.cg-wrap) {
    width: 100% !important;
    height: 100% !important;
    display: block !important;
    position: relative !important;
  }

  :global(.cg-board) {
    width: 100% !important;
    height: 100% !important;
  }

  /* Ensure coordinates are visible */
  :global(.cg-wrap coords) {
    font-size: 14px !important;
    font-weight: bold !important;
  }

  :global(.cg-wrap coords.ranks) {
    left: 4px !important;
  }

  :global(.cg-wrap coords.files) {
    bottom: 4px !important;
  }
</style>

