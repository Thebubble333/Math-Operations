
import React from 'react';
import { GameMode } from '../types';

interface NumpadProps {
  onKeyPress: (key: string) => void;
  onClear: () => void;
  mode?: GameMode;
}

const Numpad: React.FC<NumpadProps> = ({ onKeyPress, onClear, mode }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0'];
  
  if (mode === GameMode.SIMPLIFY_SURDS) {
    keys.push('r');
  } else if (mode === GameMode.ADD_SUB_NEGATIVES || mode === GameMode.MULT_DIV_NEGATIVES || mode === GameMode.INDEX_LAWS) {
    keys.push('-');
  }

  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto mt-8 md:hidden">
      {keys.map((key) => (
        <button
          key={key}
          onClick={() => key === 'C' ? onClear() : onKeyPress(key)}
          className={`h-16 flex items-center justify-center text-xl font-bold rounded-xl active:scale-95 transition-transform
            ${key === 'C' 
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
              : key === 'r' || key === '-'
                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'bg-white text-slate-800 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
            }`}
        >
          {key === 'r' ? '√' : key}
        </button>
      ))}
    </div>
  );
};

export default Numpad;
