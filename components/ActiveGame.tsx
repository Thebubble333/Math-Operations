import React, { useState, useEffect } from 'react';
import Latex from 'react-latex-next';
import { GameMode, GameStats, CurrentStats, MathProblem, GraphConfig } from '../types';
import Numpad from './Numpad';
import GraphCard from './GraphCard';
import TrigGame from './TrigGame';

interface ActiveGameProps {
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  session: CurrentStats;
  problem: MathProblem | null;
  setProblem: React.Dispatch<React.SetStateAction<MathProblem | null>>;
  input: string;
  setInput: (val: string) => void;
  isShaking: boolean;
  isCorrectFlash: boolean;
  isSuccess: boolean;
  setIsSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  isError: boolean;
  handleInputChange: (val: string) => void;
  handleCorrect: () => void;
  triggerError: (isSignError?: boolean) => void;
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
  setProblem,
  input,
  setInput,
  isShaking,
  isCorrectFlash,
  isSuccess,
  setIsSuccess,
  isError,
  handleInputChange,
  handleCorrect,
  triggerError,
  stats,
  accuracy,
  targetProblems,
  inputRef,
  graphConfig,
}) => {
  const progressPercentage = (session.correctCount / targetProblems) * 100;

  const [surdOutside, setSurdOutside] = useState('');
  const [surdInside, setSurdInside] = useState('');
  const [surdFocus, setSurdFocus] = useState<'outside'|'inside'>('outside');

  useEffect(() => {
    setSurdOutside('');
    setSurdInside('');
    setSurdFocus('outside');
    setInput('');
  }, [problem, setInput]);

  useEffect(() => {
    if (!isError && mode === GameMode.SIMPLIFY_SURDS) {
      setSurdOutside('');
      setSurdInside('');
      setSurdFocus('outside');
    }
  }, [isError, mode]);

  const handleSurdInput = (val: string) => {
    if (!problem || session.endTime || isSuccess || isError) return;

    if (val === 'Backspace' || val === 'C') {
      if (surdFocus === 'inside') {
        if (surdInside.length > 0) {
          setSurdInside(surdInside.slice(0, -1));
        } else {
          setSurdFocus('outside');
        }
      } else {
        setSurdOutside(surdOutside.slice(0, -1));
      }
      return;
    }

    if (val === 'r' || val === 'R' || val === '√') {
      setSurdFocus('inside');
      return;
    }

    if (!/[0-9]/.test(val)) return;

    const ans = JSON.parse(problem.answer);
    const expectedV = ans.v;
    const expectedO = ans.o;
    const expectedI = ans.i;

    if (surdFocus === 'outside') {
      const newOut = surdOutside + val;
      const o = parseInt(newOut);
      
      if (o * o > expectedV) {
        triggerError();
        return;
      }

      const canAppend = (o * 10) * (o * 10) <= expectedV;
      const isValidNow = expectedV % (o * o) === 0;

      setSurdOutside(newOut);

      if (o === expectedO) {
        setTimeout(() => setSurdFocus('inside'), 50);
      } else if (!canAppend) {
        if (isValidNow) {
          setTimeout(() => setSurdFocus('inside'), 50);
        } else {
          triggerError();
        }
      }
    } else {
      const newIn = surdInside + val;
      setSurdInside(newIn);
      
      const o = parseInt(surdOutside) || 1;
      const i = parseInt(newIn);
      const userV = o * o * i;

      if (userV === expectedV) {
        if (o === expectedO && i === expectedI) {
          setIsSuccess(true);
          setTimeout(() => {
            handleCorrect();
            setIsSuccess(false);
          }, 250);
        } else if (o > ans.a) {
          setIsSuccess(true);
          setTimeout(() => {
            setProblem(prev => {
              if (!prev) return prev;
              const newAns = { ...ans, a: o, n: i };
              return {
                ...prev,
                question: o === 1 ? `\\sqrt{${i}}` : `${o}\\sqrt{${i}}`,
                answer: JSON.stringify(newAns)
              };
            });
            setSurdOutside('');
            setSurdInside('');
            setSurdFocus('outside');
            setIsSuccess(false);
          }, 500);
        } else {
          triggerError();
        }
      } else {
        if (userV > expectedV || userV * 10 > expectedV) {
          triggerError();
        }
      }
    }
  };

  useEffect(() => {
    if (mode !== GameMode.SIMPLIFY_SURDS) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        handleSurdInput('Backspace');
      } else if (e.key.toLowerCase() === 'r') {
        handleSurdInput('r');
      } else if (/[0-9]/.test(e.key) && e.key.length === 1) {
        handleSurdInput(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, surdOutside, surdInside, surdFocus, problem, isSuccess, isError]);

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
            <div className={`${mode === GameMode.METHODS_GRAPHS || mode === GameMode.TRIG_EXACT_VALUES || mode === GameMode.INDEX_LAWS || mode === GameMode.SIMPLIFY_SURDS ? 'text-4xl sm:text-6xl py-4' : 'text-8xl sm:text-[10rem]'} font-black tracking-tighter text-slate-800 dark:text-slate-50 tabular-nums select-none drop-shadow-sm`}>
              {mode === GameMode.METHODS_GRAPHS || mode === GameMode.TRIG_EXACT_VALUES || mode === GameMode.INDEX_LAWS || mode === GameMode.SIMPLIFY_SURDS ? (
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
          ) : mode === GameMode.TRIG_EXACT_VALUES && problem ? (
            <TrigGame 
              problem={problem}
              onAnswer={handleInputChange}
              isSuccess={isSuccess}
              isError={isError}
            />
          ) : mode === GameMode.SIMPLIFY_SURDS ? (
            <>
              <div className="flex items-center justify-center text-5xl sm:text-7xl font-black py-4">
                <div 
                  className={`px-2 min-w-[1ch] text-right border-b-8 transition-all ${
                    isSuccess ? 'border-emerald-500 text-emerald-500' :
                    isError ? 'border-rose-500 text-rose-500' :
                    surdFocus === 'outside' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-900 dark:text-white'
                  }`}
                  onClick={() => setSurdFocus('outside')}
                >
                  {surdOutside || (surdFocus === 'outside' ? <span className="opacity-20">?</span> : '')}
                </div>
                <div className={`text-slate-900 dark:text-white pb-2 mx-1 select-none ${isSuccess ? 'text-emerald-500' : isError ? 'text-rose-500' : ''}`}>
                  √
                </div>
                <div 
                  className={`px-2 min-w-[1ch] text-left border-b-8 transition-all ${
                    isSuccess ? 'border-emerald-500 text-emerald-500' :
                    isError ? 'border-rose-500 text-rose-500' :
                    surdFocus === 'inside' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-900 dark:text-white'
                  }`}
                  onClick={() => setSurdFocus('inside')}
                >
                  {surdInside || (surdFocus === 'inside' ? <span className="opacity-20">?</span> : '')}
                </div>
              </div>
              <Numpad 
                onKeyPress={(key) => handleSurdInput(key)} 
                onClear={() => handleSurdInput('C')}
                mode={mode}
              />
            </>
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
                mode={mode}
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
