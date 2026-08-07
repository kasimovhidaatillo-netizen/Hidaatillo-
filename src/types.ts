export interface Position {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type FoodType = 'NORMAL' | 'GOLDEN' | 'SPEEDY' | 'SHRINK';

export interface FoodItem {
  position: Position;
  type: FoodType;
  points: number;
  color: string;
  glowColor: string;
  expiresAt?: number; // timestamp
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export type GameState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  dx: number;
  dy: number;
  size: number;
  alpha: number;
}

export interface ScoreRecord {
  score: number;
  difficulty: Difficulty;
  date: string;
  obstacles: boolean;
}
