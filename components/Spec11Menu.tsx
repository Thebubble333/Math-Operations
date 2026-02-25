import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameMode } from '../types';

interface Spec11MenuProps {
  startNewGame: (mode: GameMode) => void;
}

const Spec11Menu: React.FC<Spec11MenuProps> = ({ startNewGame }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4 transition-colors duration-300">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <div className="text-right">
            <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">11 Specialist Maths</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Advanced Modules</p>
          </div>
        </div>

        <div className="space-y-12">
          {/* Trigonometry Section */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              <h2 className="text-xl font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Trigonometry</h2>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => startNewGame(GameMode.INVERSE_TRIG_EXACT_VALUES)}
                className="group relative h-32 flex flex-col items-center justify-center bg-white dark:bg-slate-800 border-b-4 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-800 rounded-3xl shadow-lg transition-all duration-150 hover:translate-y-1 hover:border-b-0 active:scale-95 z-0 hover:z-10"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-3 shadow-md transform group-hover:scale-90 transition-all duration-200">
                  <span className="text-xl font-bold">sin⁻¹</span>
                </div>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Inverse Exact Values</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Spec11Menu;
