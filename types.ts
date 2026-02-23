
export enum GameMode {
  ADDITION = 'addition',
  SUBTRACTION = 'subtraction',
  MULTIPLICATION = 'multiplication',
  DIVISION = 'division',
  MIXED = 'mixed',
  METHODS_GRAPHS = 'methods_graphs',
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

export type GraphType = 'linear' | 'quadratic' | 'cubic' | 'hyperbola' | 'truncus' | 'sqrt';

export interface GraphParams {
  type: GraphType;
  a: number;
  h: number;
  k: number;
}

export interface GraphConfig {
  gridColumns: number;
  axisStrokeWidth: number;
  gridStrokeWidth: number;
  graphStrokeWidth: number;
  fontSize: number;
  axisFontSize: number;
}

export interface MathProblem {
  question: string;
  answer: number | string;
  options?: GraphParams[];
  type?: 'arithmetic' | 'graph';
}