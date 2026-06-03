import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameMode } from '../types';

interface Year9MenuProps {
  startNewGame: (mode: GameMode) => void;
}

const Year9Menu: React.FC<Year9MenuProps> = ({ startNewGame }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-black tracking-tighter mb-2 text-indigo-600 dark:text-indigo-400 italic">
          YEAR 9
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Year 9 Mathematics</p>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        <div>
          <h2 className="text-xl font-bold whitespace-nowrap text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">Equations & Relationships</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { 
                id: GameMode.YEAR9_BOTH_SIDES, 
                label: 'Pronumerals on Both Sides', 
                icon: 'ax+b = cx+d', 
                desc: 'Solve equations step-by-step or jump straight to the correct x values',
                color: 'bg-indigo-600',
                route: '/pronumerals-both-sides'
              }
            ].map(btn => (
              <button
                key={btn.label}
                onClick={() => navigate(btn.route)}
                className="group relative flex flex-col sm:flex-row items-center gap-6 p-6 bg-white dark:bg-slate-800 border-b-4 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/35 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-[2rem] shadow-lg transition-all duration-150 hover:translate-y-1 hover:border-b-0 active:scale-95 z-0 hover:z-10 text-left w-full"
              >
                <div className={`w-16 h-16 rounded-2xl ${btn.color} text-white flex items-center justify-center shadow-md transform group-hover:scale-95 transition-all duration-200 shrink-0`}>
                  <span className="text-sm font-black whitespace-nowrap px-1">{btn.icon}</span>
                </div>
                <div>
                  <span className="block text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{btn.label}</span>
                  <span className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">{btn.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 text-center text-slate-400 dark:text-slate-600 w-full max-w-lg">
        <button 
          onClick={() => navigate('/')}
          className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-90 font-bold uppercase tracking-widest text-sm"
        >
          Back to Main Menu
        </button>
      </div>
    </div>
  );
};

export default Year9Menu;
