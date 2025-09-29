<script lang="ts">
  import 'chessground/assets/chessground.base.css';
  import 'chessground/assets/chessground.cburnett.css';
  import { Chess } from 'svelte-chess';
  import ManualEvalBar from '$lib/ManualEvalBar.svelte';
  import type { FEN } from '$lib/types/chess';

  // Game state
  let currentFen: FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  let currentGuess: number = 0; // Player's evaluation guess in pawns

  // Handle moves from the chess board
  function handleMove(event: CustomEvent<any>): void {
    // For now, just log the move
    console.log('Move made:', event.detail);
    // TODO: Update FEN after move
  }

  // Handle evaluation submission
  function handleEvaluationSubmit(event: CustomEvent<any>): void {
    const { evaluation, displayValue, isMate } = event.detail;
    console.log('Player evaluation guess:', {
      evaluation,
      displayValue,
      isMate,
      fen: currentFen
    });
    // TODO: Compare with actual engine evaluation
    // TODO: Show result and update score/streak
  }
</script>

<div class="w-full">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Streak</h1>
      <a
        href="/"
        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        Back to Home
      </a>
    </div>

    <!-- Main Content -->
    <div class="flex justify-center">
      <!-- Chess Board with Manual Evaluation Bar -->
      <div class="chess-container-streak">
        <ManualEvalBar
          bind:currentGuess
          on:submit={handleEvaluationSubmit}
        />
        <div class="board-wrapper-streak">
          <Chess
            fen={currentFen}
            on:move={handleMove}
          />
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .chess-container-streak {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    width: fit-content;
    margin: 0 auto;
    height: 600px;
  }

  .board-wrapper-streak {
    width: 600px;
    height: 600px;
    position: relative;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-radius: 0 8px 8px 0;
    overflow: hidden;
  }

  :global(.board-wrapper-streak .cg-wrap) {
    width: 600px !important;
    height: 600px !important;
  }

  :global(.board-wrapper-streak cg-container) {
    width: 600px !important;
    height: 600px !important;
  }

  :global(.board-wrapper-streak .cg-wrap cg-board) {
    width: 100% !important;
    height: 100% !important;
  }

  /* Responsive adjustments */
  @media (max-width: 1200px) {
    .chess-container-streak {
      flex-direction: column;
      align-items: center;
      height: auto;
    }

    .board-wrapper-streak {
      border-radius: 8px;
      margin-top: 20px;
    }
  }

  @media (max-width: 640px) {
    .chess-container-streak {
      width: 100%;
    }

    .board-wrapper-streak {
      width: 100%;
      max-width: 600px;
      aspect-ratio: 1;
      height: auto;
    }

    :global(.board-wrapper-streak .cg-wrap),
    :global(.board-wrapper-streak cg-container) {
      width: 100% !important;
      height: 100% !important;
    }
  }
</style>