<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  // Props
  export let currentGuess: number = 0; // Current evaluation guess in pawns

  // State
  let displayValue: string = '0.00';
  let isMateGuess: boolean = false;
  let mateIn: number = 1;
  let isWhiteMate: boolean = true;
  let isDragging: boolean = false;
  let isHovering: boolean = false;
  let hoverY: number = 0;
  let hoverValue: string = '';
  let barElement: HTMLDivElement;
  let showControls: boolean = true;

  // Performance optimization: local drag state
  let dragState: {
    currentGuess: number;
    isMateGuess: boolean;
    isWhiteMate: boolean;
    displayValue: string;
    whiteFill: number;
    blackFill: number;
  } | null = null;

  // RAF throttling
  let rafId: number | null = null;
  let pendingUpdate: (() => void) | null = null;

  const dispatch = createEventDispatcher();

  // Update display value when guess changes
  $: {
    if (isMateGuess) {
      displayValue = isWhiteMate ? `M${mateIn}` : `-M${mateIn}`;
    } else {
      if (currentGuess > 0) {
        displayValue = `+${currentGuess.toFixed(2)}`;
      } else {
        displayValue = currentGuess.toFixed(2);
      }
    }
  }

  // Calculate bar fill based on current guess (or drag state)
  $: whiteFill = calculateWhiteFill(
    dragState?.currentGuess ?? currentGuess,
    dragState?.isMateGuess ?? isMateGuess,
    dragState?.isWhiteMate ?? isWhiteMate
  );
  $: blackFill = 100 - whiteFill;

  function calculateWhiteFill(guess: number, isMate: boolean, isWhite: boolean): number {
    if (isMate) {
      return isWhite ? 100 : 0;
    }
    // Map evaluation to percentage (clamp between -20 and +20 pawns)
    const clampedScore = Math.max(-20, Math.min(20, guess));
    // Map -20 to 5%, 0 to 50%, +20 to 95%
    return 50 + (clampedScore * 2.25);
  }

  // Convert Y position to evaluation
  function positionToEvaluation(y: number, barHeight: number): { value: number, isMate: boolean, displayStr: string } {
    const percentage = (barHeight - y) / barHeight; // Invert Y (bottom = white advantage)

    if (percentage <= 0.025) {
      // Bottom 2.5% = Black mate
      return { value: -1000, isMate: true, displayStr: '-M' };
    } else if (percentage >= 0.975) {
      // Top 2.5% = White mate
      return { value: 1000, isMate: true, displayStr: 'M' };
    } else {
      // Regular evaluation: map 2.5%-97.5% to -20 to +20 pawns
      const normalized = (percentage - 0.025) / 0.95; // 0-1 range
      const evaluation = (normalized - 0.5) * 40; // -20 to +20
      const displayStr = evaluation >= 0 ? `+${evaluation.toFixed(2)}` : evaluation.toFixed(2);
      return { value: evaluation, isMate: false, displayStr };
    }
  }

  // Throttled update using RAF
  function scheduleUpdate(updateFn: () => void): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }

    pendingUpdate = updateFn;
    rafId = requestAnimationFrame(() => {
      if (pendingUpdate) {
        pendingUpdate();
        pendingUpdate = null;
      }
      rafId = null;
    });
  }

  // Apply evaluation from position (optimized for drag performance)
  function applyEvaluation(y: number, rect: DOMRect, updateReactive: boolean = true): void {
    const result = positionToEvaluation(y, rect.height);

    if (isDragging && !updateReactive) {
      // During drag: update local state only, no reactive updates
      if (result.isMate) {
        dragState = {
          currentGuess: 0,
          isMateGuess: true,
          isWhiteMate: result.value > 0,
          displayValue: result.value > 0 ? 'M1' : '-M1',
          whiteFill: result.value > 0 ? 100 : 0,
          blackFill: result.value > 0 ? 0 : 100
        };
      } else {
        const whiteFillCalc = calculateWhiteFill(result.value, false, false);
        dragState = {
          currentGuess: result.value,
          isMateGuess: false,
          isWhiteMate: false,
          displayValue: result.displayStr,
          whiteFill: whiteFillCalc,
          blackFill: 100 - whiteFillCalc
        };
      }
    } else if (updateReactive) {
      // Not dragging or explicit reactive update: update reactive state
      if (result.isMate) {
        isMateGuess = true;
        isWhiteMate = result.value > 0;
        mateIn = 1; // Default to mate in 1
      } else {
        isMateGuess = false;
        currentGuess = result.value;
      }
      dragState = null; // Clear drag state
    }
  }

  // Handle click on bar
  function handleBarClick(event: MouseEvent): void {
    const rect = barElement.getBoundingClientRect();
    const y = event.clientY - rect.top;
    applyEvaluation(y, rect, true);
  }

  // Handle mouse down for dragging
  function handleMouseDown(event: MouseEvent): void {
    event.preventDefault();
    isDragging = true;

    // Initialize drag state with current values
    dragState = {
      currentGuess,
      isMateGuess,
      isWhiteMate,
      displayValue,
      whiteFill,
      blackFill
    };

    const rect = barElement.getBoundingClientRect();
    const y = event.clientY - rect.top;
    applyEvaluation(y, rect, false);
  }

  // Handle mouse move for dragging and hover (optimized)
  function handleMouseMove(event: MouseEvent): void {
    const rect = barElement.getBoundingClientRect();
    const y = event.clientY - rect.top;

    if (isDragging) {
      // During drag: throttled updates to local state only
      scheduleUpdate(() => {
        if (isDragging) { // Check if still dragging
          applyEvaluation(y, rect, false);
        }
      });
    } else if (isHovering) {
      // Hover updates (only when not dragging)
      scheduleUpdate(() => {
        if (isHovering && !isDragging) { // Double-check state
          hoverY = Math.max(0, Math.min(rect.height, y));
          const result = positionToEvaluation(y, rect.height);
          hoverValue = result.displayStr;
        }
      });
    }
  }

  // Handle mouse up
  function handleMouseUp(): void {
    if (isDragging && dragState) {
      // Commit drag state to reactive state
      if (dragState.isMateGuess) {
        isMateGuess = true;
        isWhiteMate = dragState.isWhiteMate;
        mateIn = 1;
      } else {
        isMateGuess = false;
        currentGuess = dragState.currentGuess;
      }
    }

    isDragging = false;
    dragState = null;

    // Cancel any pending RAF updates
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
      pendingUpdate = null;
    }
  }

  // Handle mouse enter/leave for hover state
  function handleMouseEnter(): void {
    isHovering = true;
  }

  function handleMouseLeave(): void {
    isHovering = false;
    isDragging = false;
    dragState = null;

    // Cancel any pending RAF updates
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
      pendingUpdate = null;
    }
  }

  // Handle keyboard shortcuts
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isMateGuess) {
        currentGuess = Math.min(20, currentGuess + (event.shiftKey ? 0.01 : 0.1));
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isMateGuess) {
        currentGuess = Math.max(-20, currentGuess - (event.shiftKey ? 0.01 : 0.1));
      }
    } else if (event.key === '0') {
      event.preventDefault();
      isMateGuess = false;
      currentGuess = 0;
    }
  }

  // Handle increment/decrement buttons
  function incrementEval(): void {
    if (!isMateGuess) {
      currentGuess = Math.min(20, currentGuess + 0.25);
    }
  }

  function decrementEval(): void {
    if (!isMateGuess) {
      currentGuess = Math.max(-20, currentGuess - 0.25);
    }
  }

  // Submit evaluation
  function submitEvaluation(): void {
    let finalEvaluation: number | string;

    if (isMateGuess) {
      finalEvaluation = isWhiteMate ? `M${mateIn}` : `-M${mateIn}`;
    } else {
      finalEvaluation = currentGuess;
    }

    dispatch('submit', {
      evaluation: finalEvaluation,
      displayValue: displayValue,
      isMate: isMateGuess
    });
  }

  // Set up global mouse up listener
  onMount(() => {
    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      // Cleanup RAF on unmount
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  });
</script>

<div class="eval-container">
  <!-- The evaluation bar - exactly 40px x 600px -->
  <div
    class="eval-bar"
    class:dragging={isDragging}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    on:click={handleBarClick}
    on:keydown={handleKeyDown}
    bind:this={barElement}
    tabindex="0"
    role="slider"
    aria-label="Evaluation adjustment"
    aria-valuenow={dragState?.currentGuess ?? currentGuess}
    aria-valuemin={-20}
    aria-valuemax={20}
  >
    <div class="black" style="height: {dragState?.blackFill ?? blackFill}%"></div>
    <div class="white" style="height: {dragState?.whiteFill ?? whiteFill}%"></div>

    <!-- Score display -->
    <div class="score" class:mate={dragState?.isMateGuess ?? isMateGuess}>
      {dragState?.displayValue ?? displayValue}
    </div>

    <!-- Hover indicator -->
    {#if isHovering && !isDragging}
      <div class="hover-line" style="top: {hoverY}px"></div>
      <div class="hover-tooltip" style="top: {hoverY}px">
        {hoverValue}
      </div>
    {/if}

    <!-- Mate zone indicators -->
    <div class="mate-zone mate-zone-top"></div>
    <div class="mate-zone mate-zone-bottom"></div>
  </div>

  <!-- Control panel - separate from the bar -->
  <div class="control-panel" class:hidden={!showControls}>
    <!-- Fine adjustment buttons -->
    <div class="control-group">
      <label class="control-label">Fine Adjust</label>
      <div class="adjust-buttons">
        <button
          on:click={decrementEval}
          disabled={isMateGuess || currentGuess <= -20}
          class="adjust-btn"
          title="Decrease by 0.25"
        >
          −
        </button>
        <span class="adjust-value">0.25</span>
        <button
          on:click={incrementEval}
          disabled={isMateGuess || currentGuess >= 20}
          class="adjust-btn"
          title="Increase by 0.25"
        >
          +
        </button>
      </div>
    </div>

    <!-- Value display -->
    <div class="value-display-large">
      {displayValue}
    </div>

    <!-- Mate controls -->
    <div class="control-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={isMateGuess}
          class="mate-checkbox"
        />
        Checkmate
      </label>

      {#if isMateGuess}
        <div class="mate-inputs">
          <button
            on:click={() => isWhiteMate = !isWhiteMate}
            class="mate-color-btn"
            class:white-mate={isWhiteMate}
            class:black-mate={!isWhiteMate}
          >
            {isWhiteMate ? '♔' : '♚'}
          </button>
          <label class="mate-in-label">
            in
            <input
              type="number"
              min="0"
              max="50"
              bind:value={mateIn}
              class="mate-in-input"
            />
          </label>
        </div>
      {/if}
    </div>

    <!-- Action buttons -->
    <div class="action-buttons">
      <button
        on:click={() => { isMateGuess = false; currentGuess = 0; }}
        class="reset-btn"
        title="Reset to 0.00"
      >
        Reset
      </button>
      <button
        on:click={submitEvaluation}
        class="submit-btn"
      >
        Submit
      </button>
    </div>

    <!-- Keyboard hints -->
    <div class="hints">
      <span class="hint">Click bar to set</span>
      <span class="hint">↑↓ Arrow keys</span>
      <span class="hint">Shift for precision</span>
    </div>
  </div>
</div>

<style>
  .eval-container {
    display: flex;
    gap: 20px;
    align-items: stretch;
  }

  /* The evaluation bar - EXACT dimensions */
  .eval-bar {
    position: relative;
    width: 40px;
    height: 600px;
    background: #333;
    border-right: 1px solid #555;
    overflow: hidden;
    cursor: grab;
    user-select: none;
    outline: none;
    transition: box-shadow 0.2s;
  }

  .eval-bar:hover {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }

  .eval-bar:focus {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }

  .eval-bar.dragging {
    cursor: grabbing;
  }

  /* Bar fill colors - removed transition for smooth dragging */
  .white {
    background: linear-gradient(to top, #ffffff, #f0f0f0);
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    pointer-events: none;
    /* Removed transition during drag for better performance */
  }

  .black {
    background: linear-gradient(to bottom, #000000, #2a2a2a);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    pointer-events: none;
    /* Removed transition during drag for better performance */
  }

  /* Add transition back when not dragging */
  .eval-bar:not(.dragging) .white,
  .eval-bar:not(.dragging) .black {
    transition: height 0.15s ease-out;
  }

  /* Score display */
  .score {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #fff;
    background: rgba(0, 0, 0, 0.7);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: bold;
    z-index: 10;
    min-width: 35px;
    text-align: center;
    pointer-events: none;
    white-space: nowrap;
  }

  .score.mate {
    background: rgba(255, 0, 0, 0.8);
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }

  /* Hover effects */
  .hover-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(255, 255, 255, 0.6);
    pointer-events: none;
    z-index: 5;
  }

  .hover-tooltip {
    position: absolute;
    left: 45px;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    white-space: nowrap;
    pointer-events: none;
    z-index: 15;
  }

  /* Mate zone indicators */
  .mate-zone {
    position: absolute;
    left: 0;
    right: 0;
    height: 15px; /* 2.5% of 600px */
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .mate-zone-top {
    top: 0;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
  }

  .mate-zone-bottom {
    bottom: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.3), transparent);
  }

  .eval-bar:hover .mate-zone {
    opacity: 1;
  }

  /* Control panel */
  .control-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    min-width: 200px;
  }

  .control-panel.hidden {
    display: none;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .control-label {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .adjust-buttons {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: center;
  }

  .adjust-btn {
    width: 36px;
    height: 36px;
    border: 2px solid #d1d5db;
    border-radius: 8px;
    background: white;
    color: #374151;
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .adjust-btn:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #3b82f6;
    color: #3b82f6;
  }

  .adjust-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .adjust-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .adjust-value {
    font-size: 14px;
    font-weight: 600;
    color: #6b7280;
    padding: 0 8px;
  }

  .value-display-large {
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    color: #1f2937;
    padding: 8px;
    background: #f3f4f6;
    border-radius: 6px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #374151;
    cursor: pointer;
  }

  .mate-checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .mate-inputs {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 8px;
  }

  .mate-color-btn {
    width: 36px;
    height: 36px;
    border: 2px solid #d1d5db;
    border-radius: 6px;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mate-color-btn.white-mate {
    background: #f9fafb;
    color: #111827;
    border-color: #6b7280;
  }

  .mate-color-btn.black-mate {
    background: #111827;
    color: #f9fafb;
    border-color: #374151;
  }

  .mate-in-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #374151;
  }

  .mate-in-input {
    width: 50px;
    padding: 4px 6px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 14px;
    text-align: center;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .reset-btn {
    flex: 1;
    padding: 8px 16px;
    background: #6b7280;
    color: white;
    font-weight: 500;
    font-size: 14px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .reset-btn:hover {
    background: #4b5563;
  }

  .submit-btn {
    flex: 2;
    padding: 8px 16px;
    background: #10b981;
    color: white;
    font-weight: 600;
    font-size: 14px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .submit-btn:hover {
    background: #059669;
  }

  .hints {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e5e7eb;
  }

  .hint {
    font-size: 11px;
    color: #9ca3af;
  }

  /* Dark mode */
  :global(.dark) .control-panel {
    background: #1f2937;
  }

  :global(.dark) .control-label,
  :global(.dark) .checkbox-label,
  :global(.dark) .mate-in-label {
    color: #e5e7eb;
  }

  :global(.dark) .value-display-large {
    background: #374151;
    color: #f3f4f6;
  }

  :global(.dark) .adjust-btn {
    background: #374151;
    color: #e5e7eb;
    border-color: #4b5563;
  }

  :global(.dark) .adjust-btn:hover:not(:disabled) {
    background: #4b5563;
    border-color: #60a5fa;
    color: #60a5fa;
  }

  :global(.dark) .adjust-value {
    color: #9ca3af;
  }

  :global(.dark) .mate-in-input {
    background: #374151;
    color: #f3f4f6;
    border-color: #4b5563;
  }

  :global(.dark) .hints {
    border-top-color: #374151;
  }

  :global(.dark) .hint {
    color: #6b7280;
  }
</style>