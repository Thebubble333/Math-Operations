import React from 'react';
import { GameMode, CurrentStats } from '../types';

interface SummaryScreenProps {
  session: CurrentStats;
  accuracy: number;
  startNewGame: (mode: GameMode) => void;
  setMode: (mode: GameMode) => void;
  mode: GameMode;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({
  session,
  accuracy,
  startNewGame,
  setMode,
  mode,
}) => {
  const timeElapsed = Math.round((session.endTime! - (session.startTime || 0)) / 1000);
  const currentDate = new Date().toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const getModeName = (m: GameMode) => {
    switch (m) {
      case GameMode.ADDITION: return 'Addition';
      case GameMode.SUBTRACTION: return 'Subtraction';
      case GameMode.MULTIPLICATION: return 'Multiplication';
      case GameMode.DIVISION: return 'Division';
      case GameMode.MIXED: return 'Mixed Operations';
      case GameMode.ADD_SUB_NEGATIVES: return '+/- Negatives';
      case GameMode.MULT_DIV_NEGATIVES: return '×/÷ Negatives';
      case GameMode.METHODS_GRAPHS: return 'Methods Graphs';
      case GameMode.TRIG_EXACT_VALUES: return 'Trig Exact Values';
      case GameMode.INDEX_LAWS: return 'Index Laws';
      case GameMode.SIMPLIFY_SURDS: return 'Simplify Surds';
      case GameMode.SIG_FIGS_SCI_NOTATION: return 'Sig Figs & Sci Notation';
      case GameMode.INVERSE_TRIG_EXACT_VALUES: return 'Inverse Trig Exact Values';
      case GameMode.EXPANDING_NEGATIVES: return 'Expanding Negatives';
      case GameMode.TWO_STEP_EQUATIONS: return 'Two-Step Equations';
      case GameMode.YEAR8_ADD_SUB_ALGEBRA: return 'Add/Sub Algebra';
      case GameMode.YEAR8_MULT_DIV_ALGEBRA: return 'Mult/Div Algebra';
      case GameMode.YEAR8_EXPANDING: return 'Expanding';
      case GameMode.YEAR8_FACTORISING: return 'Factorising';
      case GameMode.CUSTOM: return 'Custom Game';
      default: return 'Unknown Mode';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[3rem] p-10 shadow-2xl border-b-8 border-slate-200 dark:border-slate-700 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-xl">✓</div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 italic">
            {session.gameType === 'TIME_ATTACK' ? "TIME'S UP" : "SESSION CLEAR"}
          </h2>
          <div className="mt-2 flex flex-col items-center gap-1">
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest rounded-full">
              {getModeName(mode)}
            </span>
            <p className="text-[11px] uppercase font-black text-slate-400 tracking-widest">{currentDate}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl col-span-2 flex justify-between items-center px-8">
             <div className="text-left">
               <div className="text-4xl font-black text-slate-800 dark:text-white">{session.correctCount}<span className="text-slate-300 dark:text-slate-600 text-2xl">/{session.totalAttempts}</span></div>
               <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Score</div>
             </div>
             <div className="text-right">
               <div className="text-4xl font-black text-indigo-500">{accuracy}%</div>
               <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accuracy</div>
             </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl">
            <div className="text-3xl font-black text-orange-500">{session.qpm}</div>
            <div className="text-[9px] uppercase font-bold text-slate-400">Avg QPM</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl">
            <div className="text-3xl font-black text-emerald-500">
              {session.gameType === 'TIME_ATTACK' ? `${Math.floor(timeElapsed/60)}:${(timeElapsed%60).toString().padStart(2,'0')}` : `${timeElapsed}s`}
            </div>
            <div className="text-[9px] uppercase font-bold text-slate-400">Time</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl col-span-2">
            <div className="text-3xl font-black text-violet-500">{session.combo}</div>
            <div className="text-[9px] uppercase font-bold text-slate-400">Final Streak</div>
          </div>
        </div>

        <button 
          onClick={() => startNewGame(mode)}
          className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl shadow-lg transition-all active:scale-95 mb-4 uppercase tracking-tight"
        >
          Play Again
        </button>
        <button 
          onClick={() => setMode(GameMode.NONE)}
          className="w-full py-5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-3xl transition-all uppercase tracking-tight"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default SummaryScreen;
