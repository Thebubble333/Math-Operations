import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameMode } from '../types';

interface Year8MenuProps {
  startNewGame: (mode: GameMode) => void;
}

const Year8Menu: React.FC<Year8MenuProps> = ({ startNewGame }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-black tracking-tighter mb-2 text-indigo-600 dark:text-indigo-400 italic">
          YEAR 8
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Year 8 Mathematics</p>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        <div>
          <h2 className="text-xl font-bold whitespace-nowrap text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">Algebra</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: GameMode.YEAR8_ADD_SUB_ALGEBRA, label: 'Add/Sub Algebra', icon: 'x±x', color: 'bg-blue-500' },
              { id: GameMode.YEAR8_MULT_DIV_ALGEBRA, label: 'Mult/Div Algebra', icon: 'xy/x', color: 'bg-indigo-500' },
              { id: GameMode.YEAR8_EXPANDING, label: 'Expanding', icon: 'a(x)', color: 'bg-purple-500' },
              { id: GameMode.YEAR8_FACTORISING, label: 'Factorising', icon: '(x+a)', color: 'bg-fuchsia-500' },
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => startNewGame(btn.id)}
                className="group relative h-32 flex flex-col items-center justify-center bg-white dark:bg-slate-800 border-b-4 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-3xl shadow-lg transition-all duration-150 hover:translate-y-1 hover:border-b-0 active:scale-95 z-0 hover:z-10"
              >
                <div className={`w-auto min-w-[3rem] px-3 h-12 rounded-2xl ${btn.color} text-white flex items-center justify-center mb-3 shadow-md transform group-hover:scale-90 transition-all duration-200`}>
                  <span className="text-xl font-bold">{btn.icon}</span>
                </div>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight text-center px-2">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 text-center text-slate-400 dark:text-slate-600 w-full max-w-lg">
        <button 
          onClick={() => navigate('/')}
          className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-90 font-bold uppercase tracking-widest"
        >
          Back to Main Menu
        </button>
      </div>
    </div>
  );
};

export default Year8Menu;
