import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameMode, GameStats, GameType } from '../types';
import { GAME_MODES, GameCategory, getModesByCategory } from '../config/gameModes';

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
  globalGameType: GameType;
  setGlobalGameType: (type: GameType) => void;
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
  globalGameType,
  setGlobalGameType,
}) => {
  const navigate = useNavigate();

  const essentialSkills = getModesByCategory(GameCategory.ESSENTIAL);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="mb-8 text-center">
        <h1 className="text-6xl font-black tracking-tighter mb-2 text-indigo-600 dark:text-indigo-400 italic">
          MATHFLOW
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide mb-6">Race against yourself</p>
        
        {/* Global Game Type Toggle */}
        <div className="inline-flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setGlobalGameType('FIXED_PROBLEMS')}
            className={`px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
              globalGameType === 'FIXED_PROBLEMS'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Fixed
          </button>
          <button
            onClick={() => setGlobalGameType('TIME_ATTACK')}
            className={`px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
              globalGameType === 'TIME_ATTACK'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Time
          </button>
        </div>
      </div>

      <div className="w-full max-w-4xl space-y-12">
        {/* Essential Skills Section */}
        <div>
          <h2 className="text-xl font-bold whitespace-nowrap text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">Essential Skills</h2>
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-4">
            {essentialSkills.map(btn => (
              <button
                key={btn.id}
                onClick={() => startNewGame(btn.id)}
                className="group relative h-32 flex flex-col items-center justify-center bg-white dark:bg-slate-800 border-b-4 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-3xl shadow-lg transition-all duration-150 hover:translate-y-1 hover:border-b-0 active:scale-95 z-0 hover:z-10"
              >
                <div className={`w-auto min-w-[3rem] px-3 h-12 rounded-2xl ${btn.color} text-white flex items-center justify-center mb-3 shadow-md transform group-hover:scale-90 transition-all duration-200`}>
                  <span className="text-xl font-bold">{btn.icon}</span>
                </div>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Year Level Specific Skills Section */}
        <div>
          <h2 className="text-xl font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">Year Level Specific Skills</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <button
              onClick={() => navigate('/8mainstream')}
              className="group relative h-32 flex flex-col items-center justify-center bg-white dark:bg-slate-800 border-b-4 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-3xl shadow-lg transition-all duration-150 hover:translate-y-1 hover:border-b-0 active:scale-95 z-0 hover:z-10"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center mb-3 shadow-md transform group-hover:scale-90 transition-all duration-200">
                <span className="text-xl font-bold">8</span>
              </div>
              <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Year 8</span>
            </button>

            <button
              onClick={() => navigate('/8seal')}
              className="group relative h-32 flex flex-col items-center justify-center bg-white dark:bg-slate-800 border-b-4 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-3xl shadow-lg transition-all duration-150 hover:translate-y-1 hover:border-b-0 active:scale-95 z-0 hover:z-10"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center mb-3 shadow-md transform group-hover:scale-90 transition-all duration-200">
                <span className="text-xl font-bold">8</span>
              </div>
              <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">8 SEAL</span>
            </button>
            
            <button
              onClick={() => navigate('/11spec')}
              className="group relative h-32 flex flex-col items-center justify-center bg-white dark:bg-slate-800 border-b-4 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-3xl shadow-lg transition-all duration-150 hover:translate-y-1 hover:border-b-0 active:scale-95 z-0 hover:z-10"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-3 shadow-md transform group-hover:scale-90 transition-all duration-200">
                <span className="text-xl font-bold">11</span>
              </div>
              <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">11 Spec</span>
            </button>

            <button
              onClick={() => navigate('/12methods')}
              className="group relative h-32 flex flex-col items-center justify-center bg-white dark:bg-slate-800 border-b-4 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 rounded-3xl shadow-lg transition-all duration-150 hover:translate-y-1 hover:border-b-0 active:scale-95 z-0 hover:z-10"
            >
              <div className="w-12 h-12 rounded-2xl bg-pink-500 text-white flex items-center justify-center mb-3 shadow-md transform group-hover:scale-90 transition-all duration-200">
                <span className="text-xl font-bold">12</span>
              </div>
              <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight text-center px-1">12 Methods</span>
            </button>
          </div>
        </div>

        {/* Custom Game Section */}
        <div>
          <h2 className="text-xl font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">Custom</h2>
          <div className="grid grid-cols-1">
            <button
              onClick={() => navigate('/custom')}
              className="group relative h-24 flex flex-row items-center justify-center gap-4 bg-white dark:bg-slate-800 border-b-4 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-3xl shadow-lg transition-all duration-150 hover:translate-y-1 hover:border-b-0 active:scale-95 z-0 hover:z-10"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-500 text-white flex items-center justify-center shadow-md transform group-hover:scale-90 transition-all duration-200">
                <span className="text-xl font-bold">⚙️</span>
              </div>
              <span className="text-lg font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Create Custom Game</span>
            </button>
          </div>
        </div>
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
