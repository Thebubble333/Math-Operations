import React, { useState } from 'react';
import { GameMode, GameType } from '../types';
import { GAME_MODES, GameCategory, getModesByCategory } from '../config/gameModes';

interface CustomGameMenuProps {
  startNewGame: (mode: GameMode, customConfig?: { modes: GameMode[], count: number, gameType: GameType, timeLimit?: number }) => void;
  onBack: () => void;
}

const CustomGameMenu: React.FC<CustomGameMenuProps> = ({ startNewGame, onBack }) => {
  const [selectedModes, setSelectedModes] = useState<GameMode[]>([]);
  const [problemCount, setProblemCount] = useState(20);
  const [gameType, setGameType] = useState<GameType>('FIXED_PROBLEMS');
  const [timeLimit, setTimeLimit] = useState(180); // Default 3 minutes (180s)

  const toggleMode = (mode: GameMode) => {
    setSelectedModes(prev => 
      prev.includes(mode) 
        ? prev.filter(m => m !== mode)
        : [...prev, mode]
    );
  };

  const handleStart = () => {
    if (selectedModes.length > 0) {
      startNewGame(GameMode.CUSTOM, { 
        modes: selectedModes, 
        count: problemCount, 
        gameType, 
        timeLimit: gameType === 'TIME_ATTACK' ? timeLimit : undefined 
      });
    }
  };

  const categories = Object.values(GameCategory);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-4xl">
        <button 
          onClick={onBack}
          className="mb-8 flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Menu
        </button>

        <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
          Custom Game
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Select the topics you want to practice and set the number of questions.
        </p>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Select Topics</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map(category => {
              const modes = getModesByCategory(category);
              if (modes.length === 0) return null;

              return (
                <div key={category} className="flex flex-col gap-2">
                  <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                    {category}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {modes.map(({ id, label, icon, color, activeBorder, activeText, activeBg, darkActiveBg, darkActiveText }) => (
                      <button
                        key={id}
                        onClick={() => toggleMode(id)}
                        className={`flex items-center p-2 rounded-lg border transition-all ${
                          selectedModes.includes(id)
                            ? `${activeBorder} ${activeBg} ${darkActiveBg} ${activeText} ${darkActiveText} border-2 shadow-sm`
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-bold mr-2 ${
                          selectedModes.includes(id)
                            ? `${color} text-white`
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                          {icon}
                        </div>
                        <span className="font-bold text-[10px] uppercase tracking-tight leading-tight text-left">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full">
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
            {/* Game Type Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg mb-3">
              <button
                onClick={() => setGameType('FIXED_PROBLEMS')}
                className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${
                  gameType === 'FIXED_PROBLEMS'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Fixed Problems
              </button>
              <button
                onClick={() => setGameType('TIME_ATTACK')}
                className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${
                  gameType === 'TIME_ATTACK'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Time Attack
              </button>
            </div>

            {gameType === 'FIXED_PROBLEMS' ? (
              <div className="flex items-center">
                <div className="flex-1 mr-6">
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wide">Questions</h2>
                    <span className="text-[10px] font-bold text-slate-400">5-100</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={problemCount}
                    onChange={(e) => setProblemCount(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 block"
                  />
                </div>
                
                <div className="flex items-center border-l border-slate-100 dark:border-slate-700 pl-4">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={problemCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        setProblemCount(Math.min(Math.max(val, 1), 100));
                      }
                    }}
                    className="w-14 h-9 text-center text-lg font-bold text-indigo-600 dark:text-indigo-400 bg-slate-100 dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-900 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/50 transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="flex-1 mr-6">
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wide">Time Limit</h2>
                    <span className="text-[10px] font-bold text-slate-400">1-10 min</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="600"
                    step="30"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 block"
                  />
                </div>
                
                <div className="flex items-center border-l border-slate-100 dark:border-slate-700 pl-4 min-w-[4rem] justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                      {Math.floor(timeLimit / 60)}:{(timeLimit % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">MM:SS</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={selectedModes.length === 0}
            className={`md:w-40 py-3 md:py-0 rounded-xl font-black text-lg uppercase tracking-tight transition-all transform active:scale-[0.98] shadow-lg flex items-center justify-center ${
              selectedModes.length > 0
                ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/30'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomGameMenu;
