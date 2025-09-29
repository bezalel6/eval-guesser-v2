<script lang="ts">
  import 'chessground/assets/chessground.base.css';
  import 'chessground/assets/chessground.cburnett.css';
  import { onMount, onDestroy, tick } from 'svelte';
  import { Chess } from 'svelte-chess';
  import EvaluationBar from '$lib/EvaluationBar.svelte';
  import { GameManager, type GameMove, type GameState } from '$lib/gameManager';
  import type { PageData } from './$types';
  import type { FEN } from '$lib/types/chess';
  import { browser } from '$app/environment';

  export let data: PageData;

  // Game state
  let gameManager: GameManager;
  let currentFen: FEN = data.fen;
  let gameState: GameState;
  let moveHistory: GameMove[] = [];
  let isThinking: boolean = false;
  let showEvaluation: boolean = true;
  let showSettings: boolean = false;
  let moveCount: number = 0; // Track total moves for key

  // Settings
  let playerColor: 'white' | 'black' = data.playerColor;
  let computerLevel: number = data.computerLevel;

  onMount(() => {
    if (!browser) return;

    // Initialize game manager
    gameManager = new GameManager(data.fen, playerColor, computerLevel);

    // Set up callbacks
    gameManager.onMove(async (move) => {
      const newFen = move.fen || gameManager.getFen();
      console.log('Move made, updating FEN from:', currentFen, 'to:', newFen);

      // Force update by reassigning (triggers Svelte reactivity)
      currentFen = newFen;
      moveHistory = [...moveHistory, move];
      moveCount++; // Increment to force re-render

      // Ensure DOM updates
      await tick();
    });

    gameManager.onStateChange((state) => {
      gameState = state;
    });

    // Initialize engine
    gameManager.initEngine();

    // Get initial state
    gameState = gameManager.getState();
  });

  onDestroy(() => {
    gameManager?.destroy();
  });

  // Handle moves from the chess board
  function handleMove(event: CustomEvent<any>): void {
    if (!gameManager || !gameManager.isPlayerTurn()) return;

    const move = event.detail;
    console.log('Player move event:', move);

    // The Chess component has already updated currentFen through binding
    // We just need to tell the game manager about the move
    const success = gameManager.makePlayerMove({
      from: move.from,
      to: move.to,
      promotion: move.promotion
    });

    if (success) {
      isThinking = true;
      setTimeout(() => {
        isThinking = gameManager.isComputerThinking();
      }, 100);
    }
  }

  // New game
  function newGame(): void {
    moveHistory = [];
    currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    gameManager?.reset();
  }

  // Undo move
  function undoMove(): void {
    if (gameManager && !isThinking) {
      gameManager.undo();
      currentFen = gameManager.getFen();
      // Remove last two moves from history (player and computer)
      moveHistory = moveHistory.slice(0, -2);
    }
  }

  // Apply settings
  function applySettings(): void {
    // Recreate game manager with new settings
    gameManager?.destroy();
    gameManager = new GameManager(currentFen, playerColor, computerLevel);

    gameManager.onMove(async (move) => {
      const newFen = move.fen || gameManager.getFen();
      console.log('Move made after settings, updating FEN:', newFen);

      // Force update by reassigning
      currentFen = newFen;
      moveHistory = [...moveHistory, move];
      moveCount++;

      await tick();
    });

    gameManager.onStateChange((state) => {
      gameState = state;
    });

    gameManager.initEngine();
    gameState = gameManager.getState();

    showSettings = false;
  }

  // Format move for display
  function formatMove(move: GameMove, index: number): string {
    const moveNumber = Math.floor(index / 2) + 1;
    const isWhite = index % 2 === 0;
    return isWhite ? `${moveNumber}. ${move.san}` : move.san || '';
  }
</script>

<div class="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Play vs Computer</h1>
      <a
        href="/"
        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        Back to Home
      </a>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Chess Board with Evaluation Bar -->
      <div class="lg:col-span-2">
        <div class="chess-container-play">
          {#if showEvaluation}
            <EvaluationBar
              fen={currentFen}
              depth={15}
            />
          {/if}
          <div class="board-wrapper-play">
            {#key moveCount}
              <Chess
                fen={currentFen}
                on:move={handleMove}
              />
            {/key}
          </div>
        </div>

        <!-- Game Controls -->
        <div class="mt-6 flex items-center justify-center space-x-4">
          <button
            on:click={newGame}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Game
          </button>
          <button
            on:click={undoMove}
            disabled={moveHistory.length < 2 || isThinking}
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Undo
          </button>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Move History -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Moves</h2>
          <div class="max-h-96 overflow-y-auto">
            {#if moveHistory.length === 0}
              <p class="text-gray-500 dark:text-gray-400 text-center py-4">
                No moves yet
              </p>
            {:else}
              <div class="grid grid-cols-2 gap-1 text-sm font-mono">
                {#each moveHistory as move, index}
                  <div class="px-2 py-1 rounded {index === moveHistory.length - 1 ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}">
                    {formatMove(move, index)}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <!-- Captured Pieces -->
        {#if gameState?.capturedPieces}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Captured</h2>
            <div class="space-y-2">
              <div>
                <span class="text-sm text-gray-600 dark:text-gray-400">By White:</span>
                <div class="text-2xl">
                  {#each gameState.capturedPieces.black as piece}
                    <span class="chess-piece">
                      {piece === 'p' ? '♟' : piece === 'n' ? '♞' : piece === 'b' ? '♝' : piece === 'r' ? '♜' : piece === 'q' ? '♛' : ''}
                    </span>
                  {/each}
                </div>
              </div>
              <div>
                <span class="text-sm text-gray-600 dark:text-gray-400">By Black:</span>
                <div class="text-2xl">
                  {#each gameState.capturedPieces.white as piece}
                    <span class="chess-piece text-white drop-shadow">
                      {piece === 'P' ? '♟' : piece === 'N' ? '♞' : piece === 'B' ? '♝' : piece === 'R' ? '♜' : piece === 'Q' ? '♛' : ''}
                    </span>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Settings -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <button
            on:click={() => showSettings = !showSettings}
            class="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
            <svg
              class="w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform {showSettings ? 'rotate-180' : ''}"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {#if showSettings}
            <div class="px-4 pb-4">
              <div class="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                <!-- Player Color -->
                <div>
                  <label for="player-color" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Play as
                  </label>
                  <select
                    id="player-color"
                    bind:value={playerColor}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="white">White</option>
                    <option value="black">Black</option>
                  </select>
                </div>

                <!-- Computer Level -->
                <div>
                  <label for="level" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Computer Strength: {computerLevel}
                  </label>
                  <input
                    id="level"
                    type="range"
                    min="1"
                    max="20"
                    bind:value={computerLevel}
                    class="w-full"
                  />
                  <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Beginner</span>
                    <span>Master</span>
                  </div>
                </div>

                <!-- Show Evaluation -->
                <div>
                  <label class="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      bind:checked={showEvaluation}
                      class="rounded"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">
                      Show evaluation bar
                    </span>
                  </label>
                </div>

                <!-- Apply Button -->
                <button
                  on:click={applySettings}
                  class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Settings
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .chess-container-play {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    height: 600px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
  }

  .board-wrapper-play {
    width: 600px;
    height: 600px;
    position: relative;
  }

  :global(.board-wrapper-play .cg-wrap) {
    width: 600px !important;
    height: 600px !important;
  }

  :global(.board-wrapper-play cg-container) {
    width: 600px !important;
    height: 600px !important;
  }

  :global(.board-wrapper-play .cg-wrap cg-board) {
    width: 100% !important;
    height: 100% !important;
  }

  .chess-piece {
    display: inline-block;
    margin: 0 2px;
  }

  /* Responsive adjustments */
  @media (max-width: 1024px) {
    .chess-container-play {
      max-width: 100%;
      height: auto;
      aspect-ratio: 640 / 600;
    }

    .board-wrapper-play {
      width: 100%;
      height: 100%;
    }
  }
</style>