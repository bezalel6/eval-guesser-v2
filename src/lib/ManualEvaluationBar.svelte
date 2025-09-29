<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let currentGuess: number = 0; // Current evaluation guess in pawns (positive = white advantage)

  // State
  let displayValue: string = '0.00';
  let isMateGuess: boolean = false;
  let mateIn: number = 0;
  let isWhiteMate: boolean = true;

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

  // Calculate bar fill based on current guess
  $: whiteFill = ((): number => {
    if (isMateGuess) {
      return isWhiteMate ? 100 : 0;
    }
    // Map evaluation to percentage (clamp between -20 and +20 pawns)
    const clampedScore = Math.max(-20, Math.min(20, currentGuess));
    // Map -20 to 5%, 0 to 50%, +20 to 95%
    return 50 + (clampedScore * 2.25);
  })();
  $: blackFill = 100 - whiteFill;

  // Handle slider input
  function handleSliderInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    currentGuess = parseFloat(target.value);
    isMateGuess = false; // Reset mate guess when using slider
  }

  // Toggle mate guess
  function toggleMateGuess(): void {
    isMateGuess = !isMateGuess;
    if (isMateGuess) {
      mateIn = 1;
      isWhiteMate = currentGuess >= 0;
    }
  }

  // Handle mate direction change
  function toggleMateColor(): void {
    if (isMateGuess) {
      isWhiteMate = !isWhiteMate;
    }
  }

  // Handle mate number change
  function handleMateInChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    mateIn = parseInt(target.value) || 1;
  }

  // Submit the evaluation
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
</script>

<div class="manual-eval-container">
  <div class="eval-bar">
    <div class="black" style="height: {blackFill}%"></div>
    <div class="white" style="height: {whiteFill}%"></div>
    <div class="score" class:mate={isMateGuess}>
      {displayValue}
    </div>
  </div>

  <div class="controls">
    <div class="slider-container">
      <label class="slider-label">
        <span class="label-text">Evaluation (pawns):</span>
        <input
          type="range"
          min="-10"
          max="10"
          step="0.1"
          value={currentGuess}
          on:input={handleSliderInput}
          disabled={isMateGuess}
          class="evaluation-slider"
        />
        <span class="value-display">{displayValue}</span>
      </label>
    </div>

    <div class="mate-controls">
      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={isMateGuess}
          on:change={toggleMateGuess}
          class="mate-checkbox"
        />
        <span>Checkmate</span>
      </label>

      {#if isMateGuess}
        <div class="mate-inputs">
          <button
            on:click={toggleMateColor}
            class="mate-color-btn"
            class:white-mate={isWhiteMate}
            class:black-mate={!isWhiteMate}
          >
            {isWhiteMate ? '♔ White' : '♚ Black'}
          </button>
          <label class="mate-in-label">
            <span>in</span>
            <input
              type="number"
              min="0"
              max="50"
              value={mateIn}
              on:input={handleMateInChange}
              class="mate-in-input"
            />
            <span>moves</span>
          </label>
        </div>
      {/if}
    </div>

    <button
      on:click={submitEvaluation}
      class="submit-btn"
    >
      Submit Evaluation
    </button>
  </div>
</div>

<style>
  .manual-eval-container {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 20px;
  }

  .eval-bar {
    position: relative;
    width: 40px;
    height: 600px;
    background: #333;
    border-right: 1px solid #555;
    overflow: hidden;
    border-radius: 4px 0 0 4px;
  }

  .white {
    background: linear-gradient(to top, #ffffff, #f0f0f0);
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    transition: height 0.3s ease;
  }

  .black {
    background: linear-gradient(to bottom, #000000, #2a2a2a);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    transition: height 0.3s ease;
  }

  .score {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #fff;
    background: rgba(0, 0, 0, 0.6);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 14px;
    font-weight: bold;
    z-index: 10;
    min-width: 35px;
    text-align: center;
  }

  .score.mate {
    background: rgba(255, 0, 0, 0.7);
    color: #fff;
    font-size: 16px;
  }

  .controls {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    min-width: 250px;
  }

  .slider-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .slider-label {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .label-text {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  .evaluation-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    outline: none;
    background: linear-gradient(to right, #000 0%, #666 50%, #fff 100%);
    cursor: pointer;
  }

  .evaluation-slider:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .value-display {
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    color: #1f2937;
    padding: 4px 8px;
    background: #f3f4f6;
    border-radius: 4px;
  }

  .mate-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
  }

  .mate-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .mate-inputs {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .mate-color-btn {
    padding: 6px 12px;
    border: 2px solid #d1d5db;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
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
    padding: 4px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 14px;
    text-align: center;
  }

  .submit-btn {
    padding: 12px 24px;
    background: #10b981;
    color: white;
    font-weight: 600;
    font-size: 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .submit-btn:hover {
    background: #059669;
  }

  .submit-btn:active {
    transform: translateY(1px);
  }

  /* Dark mode styles */
  :global(.dark) .controls {
    background: #1f2937;
  }

  :global(.dark) .label-text,
  :global(.dark) .checkbox-label,
  :global(.dark) .mate-in-label {
    color: #e5e7eb;
  }

  :global(.dark) .value-display {
    background: #374151;
    color: #f3f4f6;
  }

  :global(.dark) .mate-in-input {
    background: #374151;
    color: #f3f4f6;
    border-color: #4b5563;
  }

  :global(.dark) .mate-color-btn {
    border-color: #4b5563;
  }

  :global(.dark) .mate-color-btn.white-mate {
    background: #e5e7eb;
    color: #111827;
  }

  :global(.dark) .mate-color-btn.black-mate {
    background: #111827;
    color: #e5e7eb;
    border-color: #6b7280;
  }
</style>