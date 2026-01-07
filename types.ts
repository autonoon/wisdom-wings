export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface Point {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'sparkle' | 'dust' | 'trail';
}

export interface Pipe {
  x: number;
  width: number;
  gapTop: number;
  gapHeight: number;
  passed: boolean;
}

export interface GameRefs {
  score: number;
  highScore: number;
  birdY: number;
  birdVelocity: number;
  pipes: Pipe[];
  particles: Particle[];
  lastTime: number;
  frameCount: number;
}