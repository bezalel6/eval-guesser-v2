/**
 * Reactive Svelte store for sound settings
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { soundManager } from './soundManager';
import type { SoundConfig } from './types';

// Local storage key
const STORAGE_KEY = 'chess-sound-settings';

// Default configuration
const defaultConfig: SoundConfig = {
  volume: 0.5,
  muted: false,
  moveSound: true,
  captureSound: true,
  notificationSound: true
};

// Load settings from localStorage
function loadSettings(): SoundConfig {
  if (!browser) return defaultConfig;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultConfig, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load sound settings:', e);
  }

  return defaultConfig;
}

// Save settings to localStorage
function saveSettings(config: SoundConfig): void {
  if (!browser) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save sound settings:', e);
  }
}

// Create the main store
function createSoundStore() {
  const { subscribe, set, update } = writable<SoundConfig>(loadSettings());

  return {
    subscribe,

    /**
     * Initialize sound system
     */
    async init() {
      if (browser) {
        await soundManager.init();

        // Apply stored settings
        const config = loadSettings();
        soundManager.updateConfig(config);
        set(config);
      }
    },

    /**
     * Update volume
     */
    setVolume(volume: number) {
      update(config => {
        const newConfig = { ...config, volume };
        soundManager.setVolume(volume);
        saveSettings(newConfig);
        return newConfig;
      });
    },

    /**
     * Toggle mute
     */
    toggleMute() {
      update(config => {
        const newConfig = { ...config, muted: !config.muted };
        soundManager.setMute(newConfig.muted);
        saveSettings(newConfig);
        return newConfig;
      });
    },

    /**
     * Set mute state
     */
    setMute(muted: boolean) {
      update(config => {
        const newConfig = { ...config, muted };
        soundManager.setMute(muted);
        saveSettings(newConfig);
        return newConfig;
      });
    },

    /**
     * Toggle move sounds
     */
    toggleMoveSound() {
      update(config => {
        const newConfig = { ...config, moveSound: !config.moveSound };
        soundManager.updateConfig(newConfig);
        saveSettings(newConfig);
        return newConfig;
      });
    },

    /**
     * Toggle capture sounds
     */
    toggleCaptureSound() {
      update(config => {
        const newConfig = { ...config, captureSound: !config.captureSound };
        soundManager.updateConfig(newConfig);
        saveSettings(newConfig);
        return newConfig;
      });
    },

    /**
     * Toggle notification sounds
     */
    toggleNotificationSound() {
      update(config => {
        const newConfig = { ...config, notificationSound: !config.notificationSound };
        soundManager.updateConfig(newConfig);
        saveSettings(newConfig);
        return newConfig;
      });
    },

    /**
     * Update entire configuration
     */
    updateConfig(newConfig: Partial<SoundConfig>) {
      update(config => {
        const updated = { ...config, ...newConfig };
        soundManager.updateConfig(updated);
        saveSettings(updated);
        return updated;
      });
    },

    /**
     * Reset to defaults
     */
    reset() {
      soundManager.updateConfig(defaultConfig);
      saveSettings(defaultConfig);
      set(defaultConfig);
    }
  };
}

// Export the store
export const soundStore = createSoundStore();

// Export derived stores for individual settings
export const volume = derived(soundStore, $config => $config.volume);
export const muted = derived(soundStore, $config => $config.muted);
export const moveSound = derived(soundStore, $config => $config.moveSound);
export const captureSound = derived(soundStore, $config => $config.captureSound);
export const notificationSound = derived(soundStore, $config => $config.notificationSound);