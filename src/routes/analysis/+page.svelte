<script lang="ts">
  import 'chessground/assets/chessground.base.css';
  import 'chessground/assets/chessground.cburnett.css';
  import { Chess } from 'svelte-chess';
  import EvaluationBar from '$lib/EvaluationBar.svelte';
  import type { PageData } from './$types';
  import type { FEN } from '$lib/types/chess';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';

  // Import types from UCI parser
  import type { AnalysisSnapshot, MoveAnalysisData } from '$lib/uciParser';
  import { uciToSan, batchUciToSan } from '$lib/moveConversion';

  export let data: PageData;

  // Initial position from URL (or default)
  let initialFen: FEN = data.fen;

  // Current position being analyzed (changes as moves are made)
  let currentFen: FEN = initialFen;

  let analysisDepth: number = 12; // Search depth in ply (half-moves)
  let showSettings: boolean = false; // Settings panel visibility state
  let currentAnalysis: AnalysisSnapshot | null = null;

  // UCI engine output (maximum 4 moves with MultiPV)
  interface EngineMove {
    move: string; // UCI format (e.g., "e2e4")
    san: string; // Standard algebraic notation (e.g., "e4")
    evaluation: string; // e.g., "+0.25" (pawns) or "+M3" (mate)
    depth: number; // Search depth in ply
    multipv?: number; // MultiPV rank (1=best, 2=second best, etc.)
    pv?: string[]; // Principal variation (best continuation)
    nodes?: number; // Nodes searched for this move
  }

  let topMoves: EngineMove[] = [];
  let analysisInProgress: boolean = false;

  // Handle analysis updates from EvaluationBar
  function handleAnalysis(event: CustomEvent<AnalysisSnapshot>): void {
    currentAnalysis = event.detail;
    analysisInProgress = !event.detail.isComplete;

    // Convert to our display format and sort by score
    const moves: EngineMove[] = [];
    const isBlackToMove = currentFen.split(' ')[1] === 'b';

    // Batch convert UCI moves to SAN for efficiency
    const uciMoves = Array.from(event.detail.moves.keys());
    const sanConversions = batchUciToSan(currentFen, uciMoves);

    for (const [move, analysis] of event.detail.moves.entries()) {
      // Convert score to display format
      let evaluation: string;
      if (analysis.score.type === 'mate') {
        const mateValue = isBlackToMove ? -analysis.score.value : analysis.score.value;
        evaluation = mateValue > 0 ? `+M${Math.abs(mateValue)}` : `-M${Math.abs(mateValue)}`;
      } else {
        // Convert centipawns to pawns and adjust for perspective
        let score = analysis.score.value / 100;
        if (isBlackToMove) score = -score;

        if (score > 0) {
          evaluation = `+${score.toFixed(2)}`;
        } else {
          evaluation = score.toFixed(2);
        }
      }

      // Get SAN notation
      const sanResult = sanConversions.get(move);
      const san = sanResult?.san || move;

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

    // Sort by MultiPV rank first (if available), then by score
    moves.sort((a, b) => {
      // If both have MultiPV, sort by that (lower is better)
      if (a.multipv && b.multipv) {
        return a.multipv - b.multipv;
      }
      // Otherwise sort by score (higher is better)
      const scoreA = parseEvaluation(a.evaluation);
      const scoreB = parseEvaluation(b.evaluation);
      return scoreB - scoreA;
    });

    topMoves = moves.slice(0, 4);
  }

  // Helper to parse evaluation string to numeric value for sorting
  function parseEvaluation(evaluation: string): number {
    if (evaluation.includes('M')) {
      const mateIn = parseInt(evaluation.replace(/[+-M]/g, ''));
      return evaluation.startsWith('+') ? 10000 - mateIn : -10000 + mateIn;
    }
    return parseFloat(evaluation);
  }

  // Function removed - now using proper UCI to SAN conversion from moveConversion.ts

  // Play a move from the engine list
  function playMove(move: string): void {
    // TODO: Implement move playing through chess library
    console.log('Playing move:', move);
  }

  // Reset to initial position
  function resetToInitial(): void {
    currentFen = initialFen;
  }
</script>

<div class="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Position Evaluator</h1>
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
          Non-standard position loaded from FEN string
        </div>
      {/if}
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Chess Board with Evaluation Bar -->
      <div class="lg:col-span-2">
        <div class="chess-container-analysis">
          <EvaluationBar
            fen={currentFen}
            depth={analysisDepth}
            on:analysis={handleAnalysis}
          />
          <div class="board-wrapper-analysis">
            <Chess bind:fen={currentFen} />
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- UCI Engine Output -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Move Candidates</h2>
            {#if currentAnalysis}
              <div class="flex items-center space-x-2">
                {#if analysisInProgress}
                  <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                {/if}
                <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {currentAnalysis.depth} ply
                </span>
              </div>
            {/if}
          </div>

          <div class="space-y-2">
            {#if topMoves.length === 0}
              <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Computing search tree...
              </div>
            {:else}
              {#each topMoves.slice(0, 4) as move, index}
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
                      {(move.nodes / 1000).toFixed(0)}k nodes evaluated
                    </div>
                  {/if}
                </button>
              {/each}
            {/if}
          </div>
        </div>

        <!-- Engine Configuration -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <button
            on:click={() => showSettings = !showSettings}
            class="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Engine Parameters</h2>
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
                  Depth: {analysisDepth}
                </label>
                <input
                  id="depth"
                  type="range"
                  min="10"
                  max="20"
                  bind:value={analysisDepth}
                  class="w-full"
                />
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Higher depth = deeper search tree, exponentially more computation
                </div>
              </div>
            </div>
          {/if}
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