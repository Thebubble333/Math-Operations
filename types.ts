
export enum GameMode {
  ADDITION = 'addition',
  SUBTRACTION = 'subtraction',
  MULTIPLICATION = 'multiplication',
  MIXED = 'mixed',
  NONE = 'none'
}

export interface GameStats {
  highScore: number;
  totalSolved: number;
}

export interface CurrentStats {
  combo: number;
  qpm: number;
  correctCount: number;
  totalAttempts: number;
  startTime: number | null;
  endTime: number | null;
}

export interface MathProblem {
  question: string;
  answer: number;
}
