import { GameMode } from '../types';

export enum GameCategory {
  ESSENTIAL = 'Essential Skills',
  SEAL_8 = '8 SEAL',
  METHODS_12 = '12 Methods',
  SPEC_11 = '11 Specialist',
}

export interface GameModeConfig {
  id: GameMode;
  label: string;
  category: GameCategory;
  icon: string;
  color: string; // Tailwind class for background color (e.g., 'bg-emerald-500')
  activeBorder: string;
  activeText: string;
  activeBg: string;
  darkActiveBg: string;
  darkActiveText: string;
}

export const GAME_MODES: GameModeConfig[] = [
  // Essential Skills
  { 
    id: GameMode.ADDITION, 
    label: 'Add', 
    category: GameCategory.ESSENTIAL, 
    icon: '+', 
    color: 'bg-emerald-500',
    activeBorder: 'border-emerald-500',
    activeText: 'text-emerald-700',
    activeBg: 'bg-emerald-50',
    darkActiveBg: 'dark:bg-emerald-900/30',
    darkActiveText: 'dark:text-emerald-300'
  },
  { 
    id: GameMode.SUBTRACTION, 
    label: 'Sub', 
    category: GameCategory.ESSENTIAL, 
    icon: '-', 
    color: 'bg-sky-500',
    activeBorder: 'border-sky-500',
    activeText: 'text-sky-700',
    activeBg: 'bg-sky-50',
    darkActiveBg: 'dark:bg-sky-900/30',
    darkActiveText: 'dark:text-sky-300'
  },
  { 
    id: GameMode.MULTIPLICATION, 
    label: 'Mult', 
    category: GameCategory.ESSENTIAL, 
    icon: '×', 
    color: 'bg-violet-500',
    activeBorder: 'border-violet-500',
    activeText: 'text-violet-700',
    activeBg: 'bg-violet-50',
    darkActiveBg: 'dark:bg-violet-900/30',
    darkActiveText: 'dark:text-violet-300'
  },
  { 
    id: GameMode.DIVISION, 
    label: 'Div', 
    category: GameCategory.ESSENTIAL, 
    icon: '÷', 
    color: 'bg-rose-500',
    activeBorder: 'border-rose-500',
    activeText: 'text-rose-700',
    activeBg: 'bg-rose-50',
    darkActiveBg: 'dark:bg-rose-900/30',
    darkActiveText: 'dark:text-rose-300'
  },
  { 
    id: GameMode.MIXED, 
    label: 'Mixed', 
    category: GameCategory.ESSENTIAL, 
    icon: '?', 
    color: 'bg-amber-500',
    activeBorder: 'border-amber-500',
    activeText: 'text-amber-700',
    activeBg: 'bg-amber-50',
    darkActiveBg: 'dark:bg-amber-900/30',
    darkActiveText: 'dark:text-amber-300'
  },
  { 
    id: GameMode.ADD_SUB_NEGATIVES, 
    label: '+/- Neg', 
    category: GameCategory.ESSENTIAL, 
    icon: '±', 
    color: 'bg-teal-500',
    activeBorder: 'border-teal-500',
    activeText: 'text-teal-700',
    activeBg: 'bg-teal-50',
    darkActiveBg: 'dark:bg-teal-900/30',
    darkActiveText: 'dark:text-teal-300'
  },
  { 
    id: GameMode.MULT_DIV_NEGATIVES, 
    label: '×/÷ Neg', 
    category: GameCategory.ESSENTIAL, 
    icon: '×÷', 
    color: 'bg-cyan-500',
    activeBorder: 'border-cyan-500',
    activeText: 'text-cyan-700',
    activeBg: 'bg-cyan-50',
    darkActiveBg: 'dark:bg-cyan-900/30',
    darkActiveText: 'dark:text-cyan-300'
  },

  // 8 SEAL
  { 
    id: GameMode.INDEX_LAWS, 
    label: 'Neg Powers', 
    category: GameCategory.SEAL_8, 
    icon: 'x⁻ⁿ', 
    color: 'bg-indigo-500',
    activeBorder: 'border-indigo-500',
    activeText: 'text-indigo-700',
    activeBg: 'bg-indigo-50',
    darkActiveBg: 'dark:bg-indigo-900/30',
    darkActiveText: 'dark:text-indigo-300'
  },
  { 
    id: GameMode.SIMPLIFY_SURDS, 
    label: 'Surds', 
    category: GameCategory.SEAL_8, 
    icon: '√x', 
    color: 'bg-teal-500',
    activeBorder: 'border-teal-500',
    activeText: 'text-teal-700',
    activeBg: 'bg-teal-50',
    darkActiveBg: 'dark:bg-teal-900/30',
    darkActiveText: 'dark:text-teal-300'
  },
  { 
    id: GameMode.EXPANDING_NEGATIVES, 
    label: 'Expanding Negatives', 
    category: GameCategory.SEAL_8, 
    icon: '-a(x)', 
    color: 'bg-rose-500',
    activeBorder: 'border-rose-500',
    activeText: 'text-rose-700',
    activeBg: 'bg-rose-50',
    darkActiveBg: 'dark:bg-rose-900/30',
    darkActiveText: 'dark:text-rose-300'
  },
  { 
    id: GameMode.TWO_STEP_EQUATIONS, 
    label: 'Two-Step Equations', 
    category: GameCategory.SEAL_8, 
    icon: 'ax+b', 
    color: 'bg-orange-500',
    activeBorder: 'border-orange-500',
    activeText: 'text-orange-700',
    activeBg: 'bg-orange-50',
    darkActiveBg: 'dark:bg-orange-900/30',
    darkActiveText: 'dark:text-orange-300'
  },
  { 
    id: GameMode.SIG_FIGS_SCI_NOTATION, 
    label: 'Sig Figs & Sci', 
    category: GameCategory.SEAL_8, 
    icon: '10ⁿ', 
    color: 'bg-emerald-500',
    activeBorder: 'border-emerald-500',
    activeText: 'text-emerald-700',
    activeBg: 'bg-emerald-50',
    darkActiveBg: 'dark:bg-emerald-900/30',
    darkActiveText: 'dark:text-emerald-300'
  },

  // 12 Methods
  { 
    id: GameMode.METHODS_GRAPHS, 
    label: 'Graphs', 
    category: GameCategory.METHODS_12, 
    icon: '📈', 
    color: 'bg-pink-500',
    activeBorder: 'border-pink-500',
    activeText: 'text-pink-700',
    activeBg: 'bg-pink-50',
    darkActiveBg: 'dark:bg-pink-900/30',
    darkActiveText: 'dark:text-pink-300'
  },
  { 
    id: GameMode.TRIG_EXACT_VALUES, 
    label: 'Trig', 
    category: GameCategory.METHODS_12, 
    icon: '📐', 
    color: 'bg-purple-500',
    activeBorder: 'border-purple-500',
    activeText: 'text-purple-700',
    activeBg: 'bg-purple-50',
    darkActiveBg: 'dark:bg-purple-900/30',
    darkActiveText: 'dark:text-purple-300'
  },

  // 11 Specialist
  { 
    id: GameMode.INVERSE_TRIG_EXACT_VALUES, 
    label: 'Inverse Exact Values', 
    category: GameCategory.SPEC_11, 
    icon: 'sin⁻¹', 
    color: 'bg-emerald-500',
    activeBorder: 'border-emerald-500',
    activeText: 'text-emerald-700',
    activeBg: 'bg-emerald-50',
    darkActiveBg: 'dark:bg-emerald-900/30',
    darkActiveText: 'dark:text-emerald-300'
  },
];

export const getModesByCategory = (category: GameCategory): GameModeConfig[] => {
  return GAME_MODES.filter(mode => mode.category === category);
};
