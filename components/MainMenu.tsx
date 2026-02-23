import React from 'react';
import { GameMode, GameStats } from '../types';

interface MainMenuProps {
  stats: GameStats;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  startNewGame: (mode: GameMode) => void;
  exportStandalone: () => void;
  executeReset: () => void;
  isConfirmingReset: boolean;
  closeSettings: () => void;
  onOpenDevTools: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({
  stats,
  darkMode,
  setDarkMode,
  showSettings,
  setShowSettings,
  startNewGame,
  exportStandalone,
  executeReset,
  isConfirmingReset,
  closeSettings,
  onOpenDevTools,
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-black tracking-tighter mb-2 text-indigo-600 dark:text-indigo-400 italic">
          MATHFLOW
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Race against yourself</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-3xl">
        {[
          { id: GameMode.ADDITION, label: 'Add', icon: '+', color: 'bg-emerald-500' },
          { id: GameMode.SUBTRACTION, label: 'Sub', icon: '-', color: 'bg-sky-500' },
          { id: GameMode.MULTIPLICATION, label: 'Mult', icon: '×', color: 'bg-violet-500' },
          { id: GameMode.DIVISION, label: 'Div', icon: '÷', color: 'bg-rose-500' },
          { id: GameMode.MIXED, label: 'Mixed', icon: '?', color: 'bg-amber-500' },
          { id: GameMode.METHODS_GRAPHS, label: 'Graphs', icon: '📈', color: 'bg-pink-500' },
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => startNewGame(btn.id)}
            className="group relative h-32 flex flex-col items-center justify-center bg-white dark:bg-slate-800 border-b-4 border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-3xl shadow-lg transition-all active:scale-95"
          >
            <div className={`w-10 h-10 rounded-xl ${btn.color} text-white flex items-center justify-center mb-3 shadow-md transform group-hover:rotate-12 transition-transform`}>
              <span className="text-xl font-bold">{btn.icon}</span>
            </div>
            <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{btn.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-16 text-center text-slate-400 dark:text-slate-600 w-full max-w-lg">
        <div className="flex gap-12 justify-center mb-10 bg-white dark:bg-slate-800/50 p-6 rounded-3xl shadow-sm">
          <div>
            <div className="text-3xl font-black text-slate-700 dark:text-slate-300">{stats.highScore}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold">Best Streak</div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-700 dark:text-slate-300">{stats.totalSolved}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold">Solved</div>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-6">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-90"
            title="Toggle Theme"
          >
            {darkMode ? '🌙' : '☀️'}
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-90"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-black mb-8 text-slate-800 dark:text-slate-100 italic">SETTINGS</h2>
            <div className="space-y-4">
              <button 
                onClick={exportStandalone}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all uppercase tracking-tighter flex items-center justify-center gap-2 shadow-lg"
              >
                <span>💾</span> SAVE OFFLINE VERSION
              </button>
              <button 
                onClick={executeReset}
                className={`w-full py-5 font-black rounded-2xl transition-all uppercase tracking-tighter shadow-sm ${
                  isConfirmingReset 
                  ? 'bg-rose-600 text-white ring-4 ring-rose-500/30' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isConfirmingReset ? 'Click to Confirm?' : 'Reset Progress'}
              </button>
              <button 
                onClick={closeSettings}
                className="w-full py-5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-2xl transition-all uppercase tracking-tighter"
              >
                Close
              </button>
              
              <button 
                onClick={() => {
                  onOpenDevTools();
                  closeSettings();
                }}
                className="w-full py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                🛠️ Open Diagnostics
              </button>
            </div>
            <p className="mt-6 text-center text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
              MathFlow v1.5
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainMenu;
