
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
  SIG_FIGS_SCI_NOTATION = 'sig_figs_sci_notation',
  INVERSE_TRIG_EXACT_VALUES = 'inverse_trig_exact_values',
  EXPANDING_NEGATIVES = 'expanding_negatives',
  TWO_STEP_EQUATIONS = 'two_step_equations',
  YEAR8_ADD_SUB_ALGEBRA = 'year8_add_sub_algebra',
  YEAR8_MULT_DIV_ALGEBRA = 'year8_mult_div_algebra',
  YEAR8_EXPANDING = 'year8_expanding',
  YEAR8_FACTORISING = 'year8_factorising',
  SEAL8_FACTORISE_DOTS = 'seal8_factorise_dots',
  SEAL8_FACTORISE_MONIC = 'seal8_factorise_monic',
  SEAL8_COMPLETING_SQUARE = 'seal8_completing_square',
  METHODS_DERIVATIVES = 'methods_derivatives',
  METHODS_ANTIDERIVATIVES = 'methods_antiderivatives',
  METHODS_MIXED_CALCULUS = 'methods_mixed_calculus',
  YEAR12_MAXIMAL_DOMAIN = 'year12_maximal_domain',
  YEAR12_RANGE = 'year12_range',
  METHODS_SAMPLE_PROPORTIONS = 'methods_sample_proportions',
  METHODS_MARGIN_STEPS = 'methods_margin_steps',
  YEAR9_BOTH_SIDES = 'year9_both_sides',
  CUSTOM = 'custom',
  NONE = 'none'
}

export type GameType = 'FIXED_PROBLEMS' | 'TIME_ATTACK';

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
  gameType: GameType;
  timeLimit?: number; // in seconds
}

export type GraphType = 'linear' | 'quadratic' | 'cubic' | 'hyperbola' | 'truncus' | 'sqrt' | 'exponential';

export interface GraphParams {
  type: GraphType;
  a: number;
  h: number;
  k: number;
  domainContext?: {
    type: 'domain' | 'range' | 'maximal_domain';
    startX?: number | null;
    endX?: number | null;
    startOpen?: boolean;
    endOpen?: boolean;
  };
}

export interface GraphConfig {
  gridColumns: number;
  axisStrokeWidth: number;
  gridStrokeWidth: number;
  graphStrokeWidth: number;
  fontSize: number;
  axisFontSize: number;
}

export interface FeedbackToken {
  text: string;
  color: string;
}

export interface MarginDetails {
  z: number;
  pStr: string;
  qStr: string;
  pNum: number;
  pDen: number;
  n: number;
  p1pNum: number;
  p1pDen: number;
  p1pStr: string;
  varNum: number;
  varDen: number;
  varStr: string;
  sdNum: number;
  sdDen: number;
  sdStr: string;
  mNum: number;
  mDen: number;
  mStr: string;
  unreducedMStr?: string;
}

export interface StepItem {
  stepTitle: string;
  description: string;
  expression: string;
  options: string[];
  answer: string; // '0', '1', '2', or '3'
  resultText: string;
}

export interface MathProblem {
  question: string;
  answer: number | string;
  options?: any[]; // Allow strings or GraphParams
  graph?: GraphParams;
  type?: 'arithmetic' | 'graph' | 'trig' | 'algebra' | 'steps';
  steps?: StepItem[];
  stepGiven?: { z: number | string; p: string; n: number };
  marginDetails?: MarginDetails;
  angle?: number; // For trig unit circle visualization (in radians)
  mode?: GameMode;
}