/**
 * Centralized Sound Manager using Howler.js
 */

import { Howl, Howler } from 'howler';
import type { SoundType, SoundConfig, SoundAsset } from './types';

class SoundManager {
  private sounds: Map<SoundType, Howl> = new Map();
  private config: SoundConfig = {
    volume: 0.5,
    muted: false,
    moveSound: true,
    captureSound: true,
    notificationSound: true
  };
  private initialized: boolean = false;

  /**
   * Initialize sound manager with audio assets
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Define sound assets using actual files
    const assets: Record<SoundType, SoundAsset> = {
      move: {
        src: ['/sounds/move-self.mp3'],
        preload: true,
        volume: 0.5
      },
      capture: {
        src: ['/sounds/capture.mp3'],
        preload: true,
        volume: 0.6
      },
      castle: {
        src: ['/sounds/castle.mp3'],
        preload: true,
        volume: 0.5
      },
      check: {
        src: ['/sounds/move-check.mp3'],
        preload: true,
        volume: 0.6
      },
      checkmate: {
        src: ['/sounds/game-win.mp3'],
        preload: true,
        volume: 0.7
      },
      stalemate: {
        src: ['/sounds/game-draw.mp3'],
        volume: 0.6
      },
      draw: {
        src: ['/sounds/game-draw.mp3'],
        volume: 0.6
      },
      illegal: {
        src: ['/sounds/illegal.mp3'],
        volume: 0.5
      },
      promotion: {
        src: ['/sounds/promote.mp3'],
        preload: true,
        volume: 0.5
      },
      start: {
        src: ['/sounds/game-start.mp3'],
        volume: 0.6
      },
      end: {
        src: ['/sounds/game-end.mp3'],
        volume: 0.6
      },
      tick: {
        src: ['/sounds/tenseconds.mp3'],
        volume: 0.3
      },
      notify: {
        src: ['/sounds/notify.mp3'],
        volume: 0.4
      },
      opponentMove: {
        src: ['/sounds/move-opponent.mp3'],
        volume: 0.5
      },
      click: {
        src: ['/sounds/click.mp3'],
        volume: 0.3
      },
      correct: {
        src: ['/sounds/correct.mp3'],
        volume: 0.5
      },
      incorrect: {
        src: ['/sounds/incorrect.mp3'],
        volume: 0.5
      },
      achievement: {
        src: ['/sounds/achievement.mp3'],
        volume: 0.6
      },
      premove: {
        src: ['/sounds/premove.mp3'],
        volume: 0.4
      }
    };

    // Load sounds
    for (const [type, asset] of Object.entries(assets) as [SoundType, SoundAsset][]) {
      const howl = new Howl({
        src: asset.src,
        sprite: asset.sprite,
        volume: asset.volume ?? this.config.volume,
        preload: asset.preload ?? false,
        html5: false // Use Web Audio API for better performance
      });

      this.sounds.set(type, howl);
    }

    // Set global volume
    Howler.volume(this.config.volume);

    // Handle mobile unlock
    Howler.autoUnlock = true;

    this.initialized = true;
  }

  /**
   * Play a sound effect
   */
  play(type: SoundType, spriteKey?: string): number | undefined {
    if (this.config.muted) return;

    // Check specific sound settings
    if (type === 'move' && !this.config.moveSound) return;
    if (type === 'capture' && !this.config.captureSound) return;
    if (type === 'notify' && !this.config.notificationSound) return;

    const sound = this.sounds.get(type);
    if (!sound) {
      console.warn(`Sound not found: ${type}`);
      return;
    }

    // Play sprite or full sound (if spriteKey provided and sprite exists, use it)
    if (spriteKey && sound._sprite && sound._sprite[spriteKey]) {
      return sound.play(spriteKey);
    }

    // Otherwise play the whole sound
    return sound.play();
  }

  /**
   * Play chess move sound based on move type
   */
  playChessMove(moveType: {
    capture?: boolean;
    castle?: boolean;
    check?: boolean;
    checkmate?: boolean;
    promotion?: boolean;
  }): void {
    if (moveType.checkmate) {
      this.play('checkmate');
    } else if (moveType.check) {
      this.play('check');
    } else if (moveType.castle) {
      this.play('castle');
    } else if (moveType.promotion) {
      this.play('promotion');
    } else if (moveType.capture) {
      this.play('capture');
    } else {
      this.play('move');
    }
  }

  /**
   * Stop a specific sound or all sounds
   */
  stop(type?: SoundType, id?: number): void {
    if (type) {
      const sound = this.sounds.get(type);
      sound?.stop(id);
    } else {
      // Stop all sounds
      this.sounds.forEach(sound => sound.stop());
    }
  }

  /**
   * Pause a specific sound or all sounds
   */
  pause(type?: SoundType, id?: number): void {
    if (type) {
      const sound = this.sounds.get(type);
      sound?.pause(id);
    } else {
      // Pause all sounds
      this.sounds.forEach(sound => sound.pause());
    }
  }

  /**
   * Resume a specific sound or all sounds
   */
  resume(type?: SoundType, id?: number): void {
    if (type) {
      const sound = this.sounds.get(type);
      sound?.play(id);
    } else {
      // Resume all sounds
      this.sounds.forEach(sound => sound.play());
    }
  }

  /**
   * Set master volume
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.config.volume);
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.config.volume;
  }

  /**
   * Toggle mute
   */
  toggleMute(): void {
    this.config.muted = !this.config.muted;
    Howler.mute(this.config.muted);
  }

  /**
   * Set mute state
   */
  setMute(muted: boolean): void {
    this.config.muted = muted;
    Howler.mute(muted);
  }

  /**
   * Update sound configuration
   */
  updateConfig(config: Partial<SoundConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.volume !== undefined) {
      this.setVolume(config.volume);
    }

    if (config.muted !== undefined) {
      this.setMute(config.muted);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): SoundConfig {
    return { ...this.config };
  }

  /**
   * Preload all sounds
   */
  async preloadAll(): Promise<void> {
    const loadPromises: Promise<void>[] = [];

    this.sounds.forEach(sound => {
      if (sound.state() === 'unloaded') {
        loadPromises.push(
          new Promise((resolve) => {
            sound.once('load', () => resolve());
            sound.load();
          })
        );
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.sounds.forEach(sound => sound.unload());
    this.sounds.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Export for type access
export type { SoundManager };