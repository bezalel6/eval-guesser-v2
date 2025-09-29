/**
 * Composable hook for using sounds in components
 */

import { soundManager } from './soundManager';
import type { SoundType } from './types';

export interface UseSoundOptions {
  volume?: number;
  interrupt?: boolean;
}

export interface UseSoundReturn {
  play: (spriteKey?: string) => number | undefined;
  stop: (id?: number) => void;
  pause: (id?: number) => void;
  resume: (id?: number) => void;
}

/**
 * Hook to use a specific sound in a component
 * @param type - The type of sound to use
 * @param options - Optional configuration
 * @returns Object with sound control methods
 */
export function useSound(type: SoundType, options?: UseSoundOptions): UseSoundReturn {
  let currentId: number | undefined;

  return {
    play: (spriteKey?: string) => {
      if (options?.interrupt && currentId !== undefined) {
        soundManager.stop(type, currentId);
      }

      currentId = soundManager.play(type, spriteKey);
      return currentId;
    },

    stop: (id?: number) => {
      soundManager.stop(type, id ?? currentId);
      if (!id || id === currentId) {
        currentId = undefined;
      }
    },

    pause: (id?: number) => {
      soundManager.pause(type, id ?? currentId);
    },

    resume: (id?: number) => {
      soundManager.resume(type, id ?? currentId);
    }
  };
}

/**
 * Hook for chess-specific move sounds
 */
export function useChessMoveSound() {
  return {
    play: (moveType: {
      capture?: boolean;
      castle?: boolean;
      check?: boolean;
      checkmate?: boolean;
      promotion?: boolean;
    }) => {
      soundManager.playChessMove(moveType);
    }
  };
}