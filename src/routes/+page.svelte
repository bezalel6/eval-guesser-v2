<script lang="ts">
  import 'chessground/assets/chessground.base.css';
  import 'chessground/assets/chessground.cburnett.css';
  import { Chess } from 'svelte-chess';
  import EvaluationBar from '$lib/EvaluationBar.svelte';
  import type { FEN } from '$lib/types/chess';

  let currentFen: FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
</script>

<div class="w-full">
    <div class="max-w-6xl mx-auto px-6 py-12">

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

  /* Override chessground wrapper to exact size */
  :global(.board-wrapper .cg-wrap) {
    width: 600px !important;
    height: 600px !important;
  }

  /* Force cg-container to match parent size, overriding inline styles */
  :global(.board-wrapper cg-container) {
    width: 600px !important;
    height: 600px !important;
  }

  /* Ensure the board scales properly within the container */
  :global(.board-wrapper .cg-wrap cg-board) {
    width: 100% !important;
    height: 100% !important;
  }

  /* Make coordinates more visible and ensure they don't affect layout */
  :global(.cg-wrap coords) {
    font-size: 14px !important;
    font-weight: bold !important;
    position: absolute !important;
  }

  :global(.cg-wrap coords.ranks) {
    left: 4px !important;
    top: 0 !important;
    bottom: 0 !important;
    width: 12px !important;
  }

  :global(.cg-wrap coords.files) {
    bottom: 4px !important;
    left: 0 !important;
    right: 0 !important;
    height: 12px !important;
  }
</style>

