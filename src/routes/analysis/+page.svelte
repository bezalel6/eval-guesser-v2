<script lang="ts">
  import 'chessground/assets/chessground.base.css';
  import 'chessground/assets/chessground.cburnett.css';
  import { Chess } from 'svelte-chess';
  import EvaluationBar from '$lib/EvaluationBar.svelte';
  import type { PageData } from './$types';
  import type { FEN } from '$lib/types/chess';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  export let data: PageData;

  // Use the FEN from server or fallback to default
  let currentFen: FEN = data.fen;
  let analysisDepth: number = 20; // Deeper analysis for the analysis page
  let fenInput: string = currentFen;
  let showFenInput: boolean = false;

  // Update URL when FEN changes (for shareable analysis links)
  function updateURL(fen: FEN): void {
    const url = new URL($page.url);
    if (fen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
      url.searchParams.set('fen', encodeURIComponent(fen));
    } else {
      url.searchParams.delete('fen');
    }
    goto(url.toString(), { replaceState: true, noScroll: true });
  }

  // Handle FEN input submission
  function submitFEN(): void {
    const trimmedFen = fenInput.trim();
    if (trimmedFen) {
      currentFen = trimmedFen as FEN;
      updateURL(currentFen);
      showFenInput = false;
    }
  }

  // Reset to starting position
  function resetPosition(): void {
    currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    fenInput = currentFen;
    updateURL(currentFen);
  }

  // Copy FEN to clipboard
  async function copyFEN(): Promise<void> {
    try {
      await navigator.clipboard.writeText(currentFen);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy FEN:', err);
    }
  }

  // Copy analysis link to clipboard
  async function copyLink(): Promise<void> {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('fen', encodeURIComponent(currentFen));
      await navigator.clipboard.writeText(url.toString());
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }

  // React to FEN changes from chess moves
  $: if (currentFen) {
    fenInput = currentFen;
  }
</script>

<div class="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Chess Analysis Board</h1>
        <a
          href="/"
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Home
        </a>
      </div>

      {#if data.error}
        <div class="p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg mb-4">
          {data.error}
        </div>
      {/if}

      {#if data.isCustomPosition}
        <div class="p-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg mb-4">
          Analyzing custom position
        </div>
      {/if}
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Chess Board with Evaluation Bar -->
      <div class="lg:col-span-2">
        <div class="chess-container-analysis">
          <EvaluationBar fen={currentFen} depth={analysisDepth} />
          <div class="board-wrapper-analysis">
            <Chess bind:fen={currentFen} />
          </div>
        </div>
      </div>

      <!-- Controls Panel -->
      <div class="space-y-6">
        <!-- Position Controls -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Position Controls</h2>

          <div class="space-y-4">
            <button
              on:click={resetPosition}
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reset to Starting Position
            </button>

            <button
              on:click={() => showFenInput = !showFenInput}
              class="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {showFenInput ? 'Hide' : 'Load'} Custom FEN
            </button>

            {#if showFenInput}
              <div class="space-y-2">
                <input
                  type="text"
                  bind:value={fenInput}
                  placeholder="Enter FEN string..."
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  on:keydown={(e) => e.key === 'Enter' && submitFEN()}
                />
                <button
                  on:click={submitFEN}
                  class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Load Position
                </button>
              </div>
            {/if}
          </div>
        </div>

        <!-- Analysis Settings -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Analysis Settings</h2>

          <div class="space-y-4">
            <div>
              <label for="depth" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Analysis Depth: {analysisDepth}
              </label>
              <input
                id="depth"
                type="range"
                min="10"
                max="30"
                bind:value={analysisDepth}
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Share & Export -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Share & Export</h2>

          <div class="space-y-4">
            <button
              on:click={copyFEN}
              class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Copy FEN to Clipboard
            </button>

            <button
              on:click={copyLink}
              class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Copy Analysis Link
            </button>
          </div>
        </div>

        <!-- Current FEN Display -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Current Position</h2>
          <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg break-all">
            <code class="text-sm text-gray-800 dark:text-gray-200">{currentFen}</code>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .chess-container-analysis {
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

  .board-wrapper-analysis {
    width: 600px;
    height: 600px;
    position: relative;
  }

  /* Override chessground wrapper to exact size */
  :global(.board-wrapper-analysis .cg-wrap) {
    width: 600px !important;
    height: 600px !important;
  }

  /* Force cg-container to match parent size */
  :global(.board-wrapper-analysis cg-container) {
    width: 600px !important;
    height: 600px !important;
  }

  /* Ensure the board scales properly within the container */
  :global(.board-wrapper-analysis .cg-wrap cg-board) {
    width: 100% !important;
    height: 100% !important;
  }

  /* Make coordinates more visible */
  :global(.board-wrapper-analysis .cg-wrap coords) {
    font-size: 14px !important;
    font-weight: bold !important;
    position: absolute !important;
  }

  :global(.board-wrapper-analysis .cg-wrap coords.ranks) {
    left: 4px !important;
    top: 0 !important;
    bottom: 0 !important;
    width: 12px !important;
  }

  :global(.board-wrapper-analysis .cg-wrap coords.files) {
    bottom: 4px !important;
    left: 0 !important;
    right: 0 !important;
    height: 12px !important;
  }

  /* Responsive adjustments */
  @media (max-width: 1024px) {
    .chess-container-analysis {
      max-width: 100%;
      height: auto;
      aspect-ratio: 640 / 600;
    }

    .board-wrapper-analysis {
      width: 100%;
      height: 100%;
    }
  }
</style>