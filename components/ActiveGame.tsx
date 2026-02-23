import React from 'react';
import Latex from 'react-latex-next';
import { GameMode, GameStats, CurrentStats, MathProblem, GraphConfig } from '../types';
import Numpad from './Numpad';
import GraphCard from './GraphCard';

interface ActiveGameProps {
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  session: CurrentStats;
  problem: MathProblem | null;
  input: string;
  setInput: (val: string) => void;
  isShaking: boolean;
  isCorrectFlash: boolean;
  isSuccess: boolean;
  isError: boolean;
  handleInputChange: (val: string) => void;
  stats: GameStats;
  accuracy: number;
  targetProblems: number;
  inputRef: React.RefObject<HTMLInputElement>;
  graphConfig: GraphConfig;
}

const ActiveGame: React.FC<ActiveGameProps> = ({
  mode,
  setMode,
  session,
  problem,
  input,
  setInput,
  isShaking,
  isCorrectFlash,
  isSuccess,
  isError,
  handleInputChange,
  stats,
  accuracy,
  targetProblems,
  inputRef,
  graphConfig,
}) => {
  const progressPercentage = (session.correctCount / targetProblems) * 100;

  return (
    <div className={`min-h-screen transition-all duration-300 flex flex-col p-4 ${isCorrectFlash ? 'success-glow' : ''} bg-slate-50 dark:bg-slate-900`}>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-200 dark:bg-slate-800 z-50">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Header Info */}
      <div className={`flex justify-between items-center mb-4 pt-6 mx-auto w-full ${mode === GameMode.METHODS_GRAPHS ? 'max-w-[98vw]' : 'max-w-4xl'}`}>
        <button 
          onClick={() => setMode(GameMode.NONE)}
          className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white dark:bg-slate-800 px-6 py-2 rounded-2xl shadow-sm border-b-4 border-indigo-100 dark:border-slate-950">
            <div className="text-xl font-black text-indigo-500 italic leading-none">{session.qpm}</div>
            <div className="text-[9px] uppercase tracking-tighter text-slate-400 font-black">QPM</div>
          </div>
          <div className="bg-white dark:bg-slate-800 px-6 py-2 rounded-2xl shadow-sm border-b-4 border-orange-100 dark:border-slate-950">
            <div className="text-xl font-black text-orange-500 italic leading-none">{session.combo}</div>
            <div className="text-[9px] uppercase tracking-tighter text-slate-400 font-black">Streak</div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className={`flex-1 flex flex-col items-center justify-center mx-auto w-full ${mode === GameMode.METHODS_GRAPHS ? 'max-w-[98vw]' : 'max-w-4xl'}`}>
        <div className={`text-center space-y-8 w-full transition-transform duration-100 ${isShaking ? 'shake' : ''}`}>
          <div className="relative">
            <div className="text-[12px] absolute -top-8 left-1/2 -translate-x-1/2 font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]">
              Problem {session.correctCount + 1} / {targetProblems}
            </div>
            <div className={`${mode === GameMode.METHODS_GRAPHS ? 'text-4xl sm:text-6xl py-4' : 'text-8xl sm:text-[10rem]'} font-black tracking-tighter text-slate-800 dark:text-slate-50 tabular-nums select-none drop-shadow-sm`}>
              {mode === GameMode.METHODS_GRAPHS ? (
                <Latex>{`$${problem?.question}$`}</Latex>
              ) : (
                problem?.question
              )}
            </div>
          </div>
          
          {mode === GameMode.METHODS_GRAPHS && problem?.options ? (
            <div 
              className="grid gap-6 max-w-[95vw] mx-auto w-full px-4"
              style={{ gridTemplateColumns: `repeat(${graphConfig.gridColumns}, minmax(0, 1fr))` }}
            >
              {problem.options.map((opt, idx) => (
                <GraphCard 
                  key={idx}
                  params={opt}
                  config={graphConfig}
                  onClick={() => handleInputChange(idx.toString())}
                  className="w-full shadow-sm hover:shadow-xl transition-shadow duration-200"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="relative w-full max-w-xs mx-auto">
                <input
                  ref={inputRef}
                  type="tel"
                  autoFocus
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className={`w-full bg-transparent text-center text-7xl font-black py-4 outline-none border-b-8 transition-all caret-indigo-500 ${
                    isSuccess 
                      ? 'text-emerald-500 border-emerald-500' 
                      : isError 
                        ? 'text-rose-500 border-rose-500' 
                        : 'text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400'
                  }`}
                  placeholder=""
                  autoComplete="off"
                />
              </div>
              <Numpad 
                onKeyPress={(key) => handleInputChange(input + key)} 
                onClear={() => setInput('')}
              />
            </>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] py-4">
        Accuracy: {accuracy}% • High Streak: {stats.highScore}
      </div>
    </div>
  );
};

export default ActiveGame;
