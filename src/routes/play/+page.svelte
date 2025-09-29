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
  import { soundStore, soundManager } from '$lib/sound';
  import { useChessMoveSound } from '$lib/sound';
  import { Chess as ChessJS } from 'chess.js';

  export let data: PageData;

  // Game state
  let gameManager: GameManager;
  let currentFen: FEN = data.fen;
  let gameState: GameState;
  let moveHistory: GameMove[] = [];
  let isThinking: boolean = false;
  let showEvaluation: boolean = true;
  let moveCount: number = 0; // Track total moves for key
  let gameStarted: boolean = false; // Track if game has started
  let showSettingsModal: boolean = true; // Show settings before game
  let chessComponent: any; // Reference to the Chess component

  // Settings
  let playerColor: 'white' | 'black' = data.playerColor;
  let computerLevel: number = data.computerLevel;

  // Sound
  const moveSound = useChessMoveSound();

  // Start a new game with selected settings
  async function startGame(): Promise<void> {
    if (!browser) return;

    // Reset the board position
    currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    // Reset move history
    moveHistory = [];
    moveCount = 0;

    // Wait for DOM update
    await tick();

    // Reset the Chess component if it exists
    if (chessComponent) {
      chessComponent.reset();
    }

    // Initialize game manager
    gameManager = new GameManager(currentFen, playerColor, computerLevel);

    // Set up callbacks
    gameManager.onMove(async (move) => {
      console.log('Move made:', move);

      // Determine if this is a computer move
      // Computer moves come from the engine, player moves come from the board
      const isComputerMove = !gameManager.isPlayerTurn();

      // Play move sound based on the move details in the move object
      if (move.san) {
        const chess = new ChessJS(move.fen || gameManager.getFen());

        if (chess.isCheckmate()) {
          // Play win/lose sound based on who won
          soundManager.play(isComputerMove ? 'stalemate' : 'checkmate');
        } else if (chess.isCheck()) {
          soundManager.play('check');
        } else if (move.san.includes('x')) {
          soundManager.play('capture');
        } else if (move.san === 'O-O' || move.san === 'O-O-O') {
          soundManager.play('castle');
        } else if (move.san.includes('=')) {
          soundManager.play('promotion');
        } else {
          soundManager.play(isComputerMove ? 'opponentMove' : 'move');
        }
      }

      // Only update the Chess component for computer moves
      // Player moves already updated the component directly
      if (isComputerMove && chessComponent) {
        // Use SAN notation if available, otherwise use from/to
        if (move.san) {
          chessComponent.move(move.san);
        } else if (move.from && move.to) {
          chessComponent.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion
          });
        }
      }

      // Update move history
      moveHistory = [...moveHistory, move];
      moveCount++; // Increment to force re-render

      // Update FEN for evaluation bar
      currentFen = gameManager.getFen();

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

    // Hide modal and start game
    showSettingsModal = false;
    gameStarted = true;
  }

  onMount(async () => {
    // Initialize sound system
    if (browser) {
      await soundStore.init();
    }
  });

  onDestroy(() => {
    gameManager?.destroy();
  });

  // Handle moves from the chess board
  function handleMove(event: CustomEvent<any>): void {
    if (!gameManager) return;

    const move = event.detail;
    console.log('Player move event:', move);

    // Check if it's the player's turn
    if (!gameManager.isPlayerTurn()) {
      console.log('Not player turn, ignoring move');
      return;
    }

    // The Chess component has already made the move visually
    // We just need to update the game manager's internal state
    // and trigger the computer's response

    // Update game manager's internal chess.js instance to match
    const success = gameManager.makePlayerMove({
      from: move.from,
      to: move.to,
      promotion: move.promotion
    });

    if (success) {
      // Update the FEN for the evaluation bar
      currentFen = gameManager.getFen();

      isThinking = true;
      setTimeout(() => {
        isThinking = gameManager.isComputerThinking();
      }, 100);
    }
  }

  // New game
  function newGame(): void {
    // Destroy current game
    gameManager?.destroy();
    gameManager = null!;

    // Reset state
    moveHistory = [];
    currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    gameStarted = false;
    moveCount = 0;

    // Show settings modal for new game
    showSettingsModal = true;
  }

  // Undo move
  function undoMove(): void {
    if (gameManager && !isThinking && chessComponent) {
      // Undo two moves (player's and computer's)
      chessComponent.undo();
      chessComponent.undo();

      // Update game manager's internal state
      gameManager.undo();
      currentFen = gameManager.getFen();

      // Remove last two moves from history (player and computer)
      moveHistory = moveHistory.slice(0, -2);
    }
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
            <Chess
              bind:this={chessComponent}
              fen={currentFen}
              on:move={handleMove}
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


      </div>
    </div>
  </div>

  <!-- Settings Modal -->
  {#if showSettingsModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Settings
        </h2>

        <div class="space-y-6">
          <!-- Player Color -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
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
            <label for="modal-level" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Search Depth: {computerLevel}
            </label>
            <input
              id="modal-level"
              type="range"
              min="1"
              max="20"
              bind:value={computerLevel}
              class="w-full"
            />
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
                Show evaluation
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