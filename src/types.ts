export interface GameState {
  score: number;
  attentionSpan: number;
  isGameOver: boolean;
  distance: number;
  isPaused: boolean;
}

export interface PlayerControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  lookX: number;
  lookY: number;
}
