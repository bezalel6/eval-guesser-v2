<script lang="ts">
  import { Chess, Engine } from '$lib/chess';
  import EvaluationBar from '$lib/EvaluationBar.svelte';
  import type { PageData } from './$types';
  import type { FEN } from '$lib/types/chess';
  import type { AnalysisSnapshot } from '$lib/uciParser';
  import { onMount } from 'svelte';

  export let data: PageData;

  // Chess component reference
  let chessComponent: Chess;
  let evaluationBar: EvaluationBar;

  // Current position being analyzed
  let currentFen: FEN = data.fen;
  let moveHistory: string[] = [];
  let moveNumber: number = 1;
  let turn: 'w' | 'b' = 'w';

  // Analysis settings
  let analysisDepth: number = 12;
  let showSettings: boolean = false;
  let currentAnalysis: AnalysisSnapshot | null = null;
  let analysisInProgress: boolean = false;

  // Engine for analysis (color: 'none' means it won't auto-play)
  let analysisEngine: Engine | undefined;

  // Top engine moves (maximum 4)
  interface EngineMove {
    move: string; // UCI format
    san: string; // SAN notation
    evaluation: string;
    depth: number;
    multipv?: number;
    pv?: string[];
    nodes?: number;
  }

  let topMoves: EngineMove[] = [];

  // Initialize analysis engine on mount
  onMount(() => {
    // Create engine for analysis mode (doesn't auto-play)
    analysisEngine = new Engine({
      color: 'none', // Won't auto-play moves
      depth: analysisDepth,
      moveTime: 5000 // Allow more time for deep analysis
    });

    // Engine automatically analyzes when attached to Chess component
    // No manual triggering needed - the library handles everything
  });

  // Handle UCI messages from the Chess component
  function handleUCI(event: CustomEvent<string>): void {
    const message = event.detail;
    // Forward UCI messages to the evaluation bar
    if (evaluationBar) {
      evaluationBar.handleUCIMessage(message);
    }

    // Also parse for analysis display
    if (message.startsWith('info ')) {
      // Parse MultiPV info for top moves display
      parseEngineInfo(message);
    }
  }

  // Parse engine info messages for top moves
  function parseEngineInfo(message: string): void {
    // This will be called for each UCI info line
    // The existing handleAnalysis will still work via the EvaluationBar's dispatch
  }

  // Handle depth changes without recreating engine
  // Note: The library doesn't provide a setDepth method, so we need to recreate
  // But only when user actually changes the slider, not on every reactive update
  function updateAnalysisDepth(newDepth: number): void {
    if (newDepth !== analysisDepth) {
      analysisDepth = newDepth;
      // Only recreate if depth actually changed
      analysisEngine = new Engine({
        color: 'none',
        depth: analysisDepth,
        moveTime: 5000
      });
    }
  }

  // Handle analysis updates from EvaluationBar
  function handleAnalysis(event: CustomEvent<AnalysisSnapshot>): void {
    currentAnalysis = event.detail;
    analysisInProgress = !event.detail.isComplete;

    // Convert to display format
    const moves: EngineMove[] = [];
    const isBlackToMove = currentFen.split(' ')[1] === 'b';

    for (const [move, analysis] of event.detail.moves.entries()) {
      // Convert score to display format
      let evaluation: string;
      if (analysis.score.type === 'mate') {
        const mateValue = isBlackToMove ? -analysis.score.value : analysis.score.value;
        evaluation = mateValue > 0 ? `+M${Math.abs(mateValue)}` : `-M${Math.abs(mateValue)}`;
      } else {
        let score = analysis.score.value / 100;
        if (isBlackToMove) score = -score;
        evaluation = score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2);
      }

      // For now, just use UCI notation (SAN conversion would need chess.js)
      const san = move;

      moves.push({
        move: analysis.move,
        san,
        evaluation,
        depth: analysis.depth,
        multipv: analysis.multipv,
        pv: analysis.pv,
        nodes: analysis.nodes
      });
    }

    // Sort by MultiPV rank or score
    moves.sort((a, b) => {
      if (a.multipv && b.multipv) return a.multipv - b.multipv;
      const scoreA = parseEvaluation(a.evaluation);
      const scoreB = parseEvaluation(b.evaluation);
      return scoreB - scoreA;
    });

    topMoves = moves.slice(0, 4);
  }

  // Parse evaluation string to numeric value
  function parseEvaluation(evaluation: string): number {
    if (evaluation.includes('M')) {
      const mateIn = parseInt(evaluation.replace(/[+-M]/g, ''));
      return evaluation.startsWith('+') ? 10000 - mateIn : -10000 + mateIn;
    }
    return parseFloat(evaluation);
  }

  // Play a move from the engine list
  function playMove(uciMove: string): void {
    if (!chessComponent) return;
    // Use moveLan for UCI format moves (e.g., "e2e4", "e7e8q" for promotion)
    chessComponent.moveLan(uciMove);
  }

  // Reset to initial position
  function resetToInitial(): void {
    currentFen = data.fen;
    moveHistory = [];
    if (chessComponent) {
      chessComponent.load(data.fen);
    }
  }

  // Handle move events
  function handleMove(event: CustomEvent): void {
    console.log('Move made:', event.detail);
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
          <EvaluationBar
            bind:this={evaluationBar}
            fen={currentFen}
            on:analysis={handleAnalysis}
          />
          <div class="board-wrapper-analysis">
            <Chess
              bind:this={chessComponent}
              bind:fen={currentFen}
              bind:history={moveHistory}
              bind:moveNumber
              bind:turn
              engine={analysisEngine}
              on:move={handleMove}
              on:uci={handleUCI}
            />
          </div>
        </div>

        <!-- Board Controls -->
        <div class="mt-6 flex items-center justify-center space-x-4">
          <button
            on:click={resetToInitial}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reset Position
          </button>
          <button
            on:click={() => chessComponent?.undo()}
            disabled={moveHistory.length === 0}
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Undo Move
          </button>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Engine Lines -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Best Moves</h2>
            {#if currentAnalysis}
              <div class="flex items-center space-x-2">
                {#if analysisInProgress}
                  <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                {/if}
                <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  Depth {currentAnalysis.depth}
                </span>
              </div>
            {/if}
          </div>

          <div class="space-y-2">
            {#if topMoves.length === 0}
              <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Analyzing position...
              </div>
            {:else}
              {#each topMoves as move, index}
                <button
                  on:click={() => playMove(move.move)}
                  class="w-full p-3 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
                >
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center space-x-3">
                      <span class="text-sm font-bold text-gray-500 dark:text-gray-400">
                        {move.multipv || (index + 1)}.
                      </span>
                      <span class="font-medium text-gray-900 dark:text-white">
                        {move.san}
                      </span>
                    </div>
                    <span class="text-sm font-mono font-medium {move.evaluation.startsWith('+') ? 'text-green-600 dark:text-green-400' : move.evaluation.startsWith('-') ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}">
                      {move.evaluation}
                    </span>
                  </div>
                  {#if move.pv && move.pv.length > 1}
                    <div class="text-xs text-gray-500 dark:text-gray-400 text-left truncate">
                      {move.pv.slice(0, 5).join(' ')}...
                    </div>
                  {/if}
                  {#if move.nodes}
                    <div class="text-xs text-gray-400 dark:text-gray-500 text-left">
                      {(move.nodes / 1000).toFixed(0)}k nodes
                    </div>
                  {/if}
                </button>
              {/each}
            {/if}
          </div>
        </div>

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
              <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label for="depth" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Analysis Depth: {analysisDepth}
                </label>
                <input
                  id="depth"
                  type="range"
                  min="1"
                  max="30"
                  value={analysisDepth}
                  on:change={(e) => updateAnalysisDepth(parseInt(e.currentTarget.value))}
                  class="w-full"
                />
                <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Fast</span>
                  <span>Balanced</span>
                  <span>Deep</span>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                    <span class="text-gray-600 dark:text-gray-400">FEN:</span>
                    <span class="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">
                      {currentFen.split(' ').slice(0, 2).join(' ')}...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Move History -->
        {#if moveHistory.length > 0}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Move History</h2>
            <div class="grid grid-cols-2 gap-1 text-sm font-mono max-h-48 overflow-y-auto">
              {#each moveHistory as move, index}
                <div class="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  {index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ` : ''}{move}
                </div>
              {/each}
            </div>
          </div>
        {/if}
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

  /* svelte-chess handles board styling internally */
  :global(.board-wrapper-analysis > div) {
    width: 100% !important;
    height: 100% !important;
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