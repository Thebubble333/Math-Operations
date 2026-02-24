
export enum GameMode {
  ADDITION = 'addition',
  SUBTRACTION = 'subtraction',
  MULTIPLICATION = 'multiplication',
  DIVISION = 'division',
  MIXED = 'mixed',
  ADD_SUB_NEGATIVES = 'add_sub_negatives',
  MULT_DIV_NEGATIVES = 'mult_div_negatives',
  METHODS_GRAPHS = 'methods_graphs',
  TRIG_EXACT_VALUES = 'trig_exact_values',
  INDEX_LAWS = 'index_laws',
  SIMPLIFY_SURDS = 'simplify_surds',
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
  type?: 'arithmetic' | 'graph' | 'trig';
  angle?: number; // For trig unit circle visualization (in radians)
}