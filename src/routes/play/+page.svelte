<script lang="ts">
  import EvaluationBar from '$lib/EvaluationBar.svelte';
  import type { PageData } from './$types';
  import type { FEN } from '$lib/types/chess';
	import { Chess, Engine } from '$lib/chess';
 
  export let data: PageData;
  // Game state - all managed by svelte-chess component
  let currentFen: FEN = data.fen;
  let moveHistory: string[] = []; // SAN notation from svelte-chess
  let moveNumber: number = 1;
  let turn: 'w' | 'b' = 'w';
  let isGameOver: boolean = false;
  let inCheck: boolean = false;
  let gameStarted: boolean = false;
  let showSettingsModal: boolean = true;

  // Chess component reference for methods
  let chessComponent: Chess;

  // Settings
  let playerColor: 'white' | 'black' = data.playerColor;
  let computerLevel: number = data.computerLevel;
  let showEvaluation: boolean = true;

  // Engine configuration based on settings
  // Create Engine instance when game starts
  let engineConfig: Engine | undefined;
  $: engineConfig = gameStarted ? new Engine({
    color: playerColor === 'white' ? 'b' : 'w', // Engine plays opposite color
    depth: Math.max(1, Math.min(20, computerLevel)),
    moveTime: computerLevel >= 15 ? 2000 : computerLevel >= 10 ? 1000 : 500
  }) : undefined;

  // Orientation based on player color
  let orientation: 'w' | 'b';
  $: orientation = playerColor === 'black' ? 'b' : 'w';

  // Start a new game with selected settings
  function startGame(): void {
    currentFen = data.fen;
    moveHistory = [];
    showSettingsModal = false;
    gameStarted = true;
  }

  // Handle moves from the chess board
  function handleMove(event: CustomEvent<any>): void {
    const move = event.detail;
    console.log('Move made:', move);
    // svelte-chess handles everything internally!
    // The move object contains: san, from, to, piece, etc.
  }

  // Handle game over
  function handleGameOver(event: CustomEvent<any>): void {
    const { reason, result } = event.detail;
    console.log(`Game over: ${reason}, result: ${result}`);
    // Could show a modal or notification here
  }

  // Handle ready event
  function handleReady(): void {
    console.log('Chess component ready');
  }

  // New game
  function newGame(): void {
    gameStarted = false;
    moveHistory = [];
    currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    showSettingsModal = true;

    // Reset the chess component
    if (chessComponent) {
      chessComponent.reset();
    }
  }

  // Undo move - svelte-chess handles this beautifully
  function undoMove(): void {
    if (chessComponent && !isGameOver) {
      // Undo twice when playing against computer (player move + computer move)
      chessComponent.undo();
      if (engineConfig) {
        chessComponent.undo();
      }
    }
  }

  // Format move for display
  function formatMove(move: string, index: number): string {
    const moveNum = Math.floor(index / 2) + 1;
    const isWhite = index % 2 === 0;
    return isWhite ? `${moveNum}. ${move}` : move;
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
            <Chess
              bind:this={chessComponent}
              bind:fen={currentFen}
              bind:history={moveHistory}
              bind:moveNumber
              bind:turn
              bind:isGameOver
              bind:inCheck
              {orientation}
              engine={engineConfig}
              on:move={handleMove}
              on:gameOver={handleGameOver}
              on:ready={handleReady}
            />
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
            disabled={moveHistory.length < 2 || isGameOver}
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Undo
          </button>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Game Status -->
        {#if inCheck}
          <div class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg p-4 text-center font-semibold">
            Check!
          </div>
        {/if}

        {#if isGameOver}
          <div class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg p-4 text-center font-semibold">
            Game Over
          </div>
        {/if}

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

        <!-- Game Info -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Game Info</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Turn:</span>
              <span class="font-medium text-gray-900 dark:text-white">
                {turn === 'w' ? 'White' : 'Black'}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Move:</span>
              <span class="font-medium text-gray-900 dark:text-white">{moveNumber}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Playing as:</span>
              <span class="font-medium text-gray-900 dark:text-white capitalize">{playerColor}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Computer Level:</span>
              <span class="font-medium text-gray-900 dark:text-white">{computerLevel}/20</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Settings Modal -->
  {#if showSettingsModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Game Settings
        </h2>

        <div class="space-y-6">
          <!-- Player Color -->
          <div>
            <div class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Play as
            </div>
            <div class="grid grid-cols-2 gap-4">
              <button
                on:click={() => playerColor = 'white'}
                class="p-4 rounded-lg border-2 transition-all {playerColor === 'white' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}"
              >
                <div class="text-4xl mb-2">♔</div>
                <div class="text-sm font-medium {playerColor === 'white' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}">White</div>
              </button>
              <button
                on:click={() => playerColor = 'black'}
                class="p-4 rounded-lg border-2 transition-all {playerColor === 'black' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}"
              >
                <div class="text-4xl mb-2">♚</div>
                <div class="text-sm font-medium {playerColor === 'black' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}">Black</div>
              </button>
            </div>
          </div>

          <!-- Computer Level -->
          <div>
            <label for="computer-level" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Computer Strength: {computerLevel}
            </label>
            <input
              id="computer-level"
              type="range"
              min="1"
              max="20"
              bind:value={computerLevel}
              class="w-full"
            />
            <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Beginner</span>
              <span>Intermediate</span>
              <span>Master</span>
            </div>
          </div>

          <!-- Show Evaluation -->
          <div>
            <label class="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                bind:checked={showEvaluation}
                class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                Show evaluation bar during game
              </span>
            </label>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-8 flex gap-4">
          <a
            href="/"
            class="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center"
          >
            Cancel
          </a>
          <button
            on:click={startGame}
            class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  {/if}
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

  /* svelte-chess handles board styling internally, we just need wrapper */
  :global(.board-wrapper-play > div) {
    width: 100% !important;
    height: 100% !important;
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