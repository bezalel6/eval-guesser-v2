/**
 * Sound system type definitions
 */

export type SoundType =
  | 'move'
  | 'capture'
  | 'castle'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'illegal'
  | 'promotion'
  | 'start'
  | 'end'
  | 'tick'
  | 'notify'
  | 'opponentMove'
  | 'click'
  | 'correct'
  | 'incorrect'
  | 'achievement'
  | 'premove';

export interface SoundConfig {
  volume: number; // 0-1
  muted: boolean;
  moveSound: boolean;
  captureSound: boolean;
  notificationSound: boolean;
}

export interface SoundSprite {
  [key: string]: [number, number]; // [start, duration] in ms
}

export interface SoundAsset {
  src: string[];
  sprite?: SoundSprite;
  volume?: number;
  preload?: boolean;
}