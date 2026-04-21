
import React from 'react';
import { GameMode } from '../types';

interface NumpadProps {
  onKeyPress: (key: string) => void;
  onClear: () => void;
  mode?: GameMode;
}

const Numpad: React.FC<NumpadProps> = ({ onKeyPress, onClear, mode }) => {
  let keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0'];
  
  if (mode === GameMode.SIMPLIFY_SURDS) {
    keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'r'];
  } else if (mode === GameMode.SIG_FIGS_SCI_NOTATION) {
    keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C', '-', 'EXP'];
  } else if (mode === GameMode.ADD_SUB_NEGATIVES || mode === GameMode.MULT_DIV_NEGATIVES || mode === GameMode.INDEX_LAWS) {
    keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '-'];
  } else if (mode === GameMode.EXPANDING_NEGATIVES) {
    keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', '+', 'C', 'x'];
  } else if (mode === GameMode.YEAR8_ADD_SUB_ALGEBRA || mode === GameMode.YEAR8_EXPANDING) {
    keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '-', 'a', 'b', 'x', 'y', 'm', 'n', 'C'];
  } else if (mode === GameMode.YEAR8_MULT_DIV_ALGEBRA) {
    keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'x', 'y', 'a', 'b', 'm', 'n', '/', 'C'];
  } else if (mode === GameMode.YEAR8_FACTORISING) {
    keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '-', '(', ')', 'a', 'b', 'x', 'y', 'm', 'n', 'C'];
  } else if (mode === GameMode.TWO_STEP_EQUATIONS) {
    keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', '/', 'C'];
  }

  return (
    <div className={`grid ${keys.length > 16 ? 'grid-cols-5' : keys.length > 12 ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5 w-full max-w-sm mx-auto mt-8 md:hidden`}>
      {keys.map((key) => (
        <button
          key={key}
          onClick={() => key === 'C' ? onClear() : onKeyPress(key)}
          className={`${keys.length > 20 ? 'h-12' : keys.length > 16 ? 'h-14' : 'h-16'} flex items-center justify-center text-xl font-bold rounded-xl active:scale-95 transition-transform
            ${key === 'C' 
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
              : key === 'r' || key === '-' || key === '+' || key === 'x' || key === 'y' || key === 'a' || key === 'b' || key === 'm' || key === 'n' || key === '(' || key === ')' || key === '/' || key === 'EXP' || key === '.'
                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'bg-white text-slate-800 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
            }
            ${key === 'EXP' ? 'text-sm' : ''}
            `}
        >
          {key === 'r' ? '√' : key === 'EXP' ? '×10ⁿ' : key}
        </button>
      ))}
    </div>
  );
};

export default Numpad;
