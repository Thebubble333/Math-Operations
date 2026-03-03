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
  handleSkip: () => void;
  stats: GameStats;
  accuracy: number;
  targetProblems: number;
  inputRef: React.RefObject<HTMLInputElement>;
  graphConfig: GraphConfig;
  unsimplifiedAnswer?: string | null;
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
  handleSkip,
  stats,
  accuracy,
  targetProblems,
  inputRef,
  graphConfig,
  unsimplifiedAnswer,
}) => {
  const progressPercentage = (session.correctCount / targetProblems) * 100;

  const [surdOutside, setSurdOutside] = useState('');
  const [surdInside, setSurdInside] = useState('');
  const [surdFocus, setSurdFocus] = useState<'outside'|'inside'>('outside');

  const [sciA, setSciA] = useState('');
  const [sciN, setSciN] = useState('');
  const [sciFocus, setSciFocus] = useState<'a'|'n'>('a');

  const [showingAnswer, setShowingAnswer] = useState(false);
  const [canGoNext, setCanGoNext] = useState(false);

  useEffect(() => {
    setSurdOutside('');
    setSurdInside('');
    setSurdFocus('outside');
    setSciA('');
    setSciN('');
    setSciFocus('a');
    setInput('');
    setShowingAnswer(false);
    setCanGoNext(false);
  }, [problem, setInput]);

  useEffect(() => {
    if (!isError) {
      if (mode === GameMode.SIMPLIFY_SURDS) {
        setSurdOutside('');
        setSurdInside('');
        setSurdFocus('outside');
      } else if (mode === GameMode.SIG_FIGS_SCI_NOTATION) {
        setSciA('');
        setSciN('');
        setSciFocus('a');
        setInput('');
      }
    }
  }, [isError, mode, setInput]);

  const handleSciInput = (val: string) => {
    if (!problem || session.endTime || isSuccess || isError) return;

    const ans = JSON.parse(problem.answer);
    const isSci = ans.type === 'sci';

    if (val === 'Backspace' || val === 'C') {
      if (isSci) {
        if (sciFocus === 'n') {
          if (sciN.length > 0) {
            setSciN(sciN.slice(0, -1));
          } else {
            setSciFocus('a');
          }
        } else {
          setSciA(sciA.slice(0, -1));
        }
      } else {
        setInput(input.slice(0, -1));
      }
      return;
    }

    if (isSci && (val === 'EXP' || val === 'e' || val === 'E')) {
      setSciFocus('n');
      return;
    }

    if (!/[0-9.-]/.test(val)) return;

    if (isSci) {
      if (sciFocus === 'a') {
        if (val === '-' && sciA.length > 0) return;
        if (val === '.' && sciA.includes('.')) return;
        const newA = sciA + val;
        setSciA(newA);
        
        if (newA === ans.a) {
          setTimeout(() => setSciFocus('n'), 50);
        } else if (newA.length >= ans.a.length && newA !== ans.a) {
          triggerError();
        }
      } else {
        if (val === '-' && sciN.length > 0) return;
        if (val === '.') return; // No decimals in exponent
        const newN = sciN + val;
        setSciN(newN);
        
        if (newN === ans.n && sciA === ans.a) {
          setIsSuccess(true);
          setTimeout(() => {
            handleCorrect();
            setIsSuccess(false);
          }, 250);
        } else if (newN.length >= ans.n.length && newN !== ans.n) {
          triggerError();
        }
      }
    } else {
      if (val === '-' && input.length > 0) return;
      if (val === '.' && input.includes('.')) return;
      
      const newVal = input + val;
      setInput(newVal);
      
      if (newVal === ans.value) {
        setIsSuccess(true);
        setTimeout(() => {
          handleCorrect();
          setIsSuccess(false);
        }, ans.type === 'count_sf' ? 500 : 250);
      } else if (newVal.length >= ans.value.length && newVal !== ans.value) {
        triggerError();
      }
    }
  };

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

  const onShowAnswerClick = () => {
    setShowingAnswer(true);
    if (problem) {
      if (mode === GameMode.EXPANDING_NEGATIVES) {
        const ans = JSON.parse(problem.answer);
        let ansStr = '';
        if (ans.x !== 0) {
          if (ans.x === 1) ansStr += 'x';
          else if (ans.x === -1) ansStr += '-x';
          else ansStr += `${ans.x}x`;
        }
        if (ans.c !== 0) {
          if (ans.c > 0 && ansStr !== '') ansStr += `+${ans.c}`;
          else ansStr += `${ans.c}`;
        }
        if (ansStr === '') ansStr = '0';
        setInput(ansStr);
      } else if (mode === GameMode.TWO_STEP_EQUATIONS) {
        const ans = JSON.parse(problem.answer);
        const ansStr = ans.den === 1 ? `${ans.num}` : `${ans.num}/${ans.den}`;
        setInput(ansStr);
      }
    }
    
    setTimeout(() => {
      setCanGoNext(true);
    }, 1000);
  };

  useEffect(() => {
    if (mode === GameMode.SIMPLIFY_SURDS) {
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
    } else if (mode === GameMode.SIG_FIGS_SCI_NOTATION) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Only handle keydown if we are not focused on the input element
        if (document.activeElement === inputRef.current) return;
        
        if (e.key === 'Backspace') {
          handleSciInput('Backspace');
        } else if (e.key.toLowerCase() === 'e') {
          handleSciInput('EXP');
        } else if (/[0-9.-]/.test(e.key) && e.key.length === 1) {
          handleSciInput(e.key);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [mode, surdOutside, surdInside, surdFocus, sciA, sciN, sciFocus, input, problem, isSuccess, isError]);

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
            <div className={`${mode === GameMode.METHODS_GRAPHS || mode === GameMode.TRIG_EXACT_VALUES || mode === GameMode.INVERSE_TRIG_EXACT_VALUES || mode === GameMode.INDEX_LAWS || mode === GameMode.SIMPLIFY_SURDS || mode === GameMode.SIG_FIGS_SCI_NOTATION || mode === GameMode.EXPANDING_NEGATIVES || mode === GameMode.TWO_STEP_EQUATIONS ? 'text-4xl sm:text-6xl py-4' : 'text-8xl sm:text-[10rem]'} font-black tracking-tighter text-slate-800 dark:text-slate-50 tabular-nums select-none drop-shadow-sm`}>
              {mode === GameMode.METHODS_GRAPHS || mode === GameMode.TRIG_EXACT_VALUES || mode === GameMode.INVERSE_TRIG_EXACT_VALUES || mode === GameMode.INDEX_LAWS || mode === GameMode.SIMPLIFY_SURDS || mode === GameMode.SIG_FIGS_SCI_NOTATION || mode === GameMode.EXPANDING_NEGATIVES || mode === GameMode.TWO_STEP_EQUATIONS ? (
                problem && mode === GameMode.SIG_FIGS_SCI_NOTATION && JSON.parse(problem.answer).type === 'count_sf' ? (
                  <div className="flex items-center justify-center">
                    <Latex>{`$\\text{Sig figs in }$`}</Latex>
                    <span className="ml-2 font-mono tracking-widest relative">
                      {(() => {
                        const ans = JSON.parse(problem.answer);
                        const numStr = ans.numStr;
                        const sigStart = ans.sigStart;
                        const sigEnd = ans.sigEnd;
                        
                        return (
                          <>
                            <span>{numStr.slice(0, sigStart)}</span>
                            <span className={`${isSuccess ? 'bg-emerald-300/50 dark:bg-emerald-500/50 rounded px-0.5 transition-colors duration-300' : ''}`}>
                              {numStr.slice(sigStart, sigEnd)}
                            </span>
                            <span>{numStr.slice(sigEnd)}</span>
                          </>
                        );
                      })()}
                    </span>
                    <Latex>{`$?$`}</Latex>
                  </div>
                ) : (
                  <Latex>{`$${problem?.question}$`}</Latex>
                )
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
          ) : (mode === GameMode.TRIG_EXACT_VALUES || mode === GameMode.INVERSE_TRIG_EXACT_VALUES) && problem ? (
            <TrigGame 
              problem={problem}
              onAnswer={handleInputChange}
              isSuccess={isSuccess}
              isError={isError}
              isInverse={mode === GameMode.INVERSE_TRIG_EXACT_VALUES}
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
          ) : mode === GameMode.SIG_FIGS_SCI_NOTATION && problem && JSON.parse(problem.answer).type === 'sci' ? (
            <>
              <div className="flex items-center justify-center text-5xl sm:text-7xl font-black py-4">
                <div 
                  className={`px-2 min-w-[1ch] text-right border-b-8 transition-all ${
                    isSuccess ? 'border-emerald-500 text-emerald-500' :
                    isError ? 'border-rose-500 text-rose-500' :
                    sciFocus === 'a' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-900 dark:text-white'
                  }`}
                  onClick={() => setSciFocus('a')}
                >
                  {sciA || (sciFocus === 'a' ? <span className="opacity-20">?</span> : '')}
                </div>
                <div className={`text-slate-900 dark:text-white pb-2 mx-1 select-none text-3xl sm:text-5xl ${isSuccess ? 'text-emerald-500' : isError ? 'text-rose-500' : ''}`}>
                  ×10
                </div>
                <div className="flex flex-col justify-start h-full pb-8">
                  <div 
                    className={`px-1 min-w-[1ch] text-left border-b-4 transition-all text-2xl sm:text-4xl ${
                      isSuccess ? 'border-emerald-500 text-emerald-500' :
                      isError ? 'border-rose-500 text-rose-500' :
                      sciFocus === 'n' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-900 dark:text-white'
                    }`}
                    onClick={() => setSciFocus('n')}
                  >
                    {sciN || (sciFocus === 'n' ? <span className="opacity-20">?</span> : '')}
                  </div>
                </div>
              </div>
              <Numpad 
                onKeyPress={(key) => handleSciInput(key)} 
                onClear={() => handleSciInput('C')}
                mode={mode}
              />
            </>
          ) : (
            <>
              <div className="relative w-full max-w-xs mx-auto">
                {unsimplifiedAnswer && (
                  <div className="text-center text-5xl font-black py-2 text-emerald-500 mb-4 opacity-80">
                    {unsimplifiedAnswer}
                  </div>
                )}
                <input
                  ref={inputRef}
                  type={mode === GameMode.SIG_FIGS_SCI_NOTATION ? "text" : "tel"}
                  inputMode={mode === GameMode.SIG_FIGS_SCI_NOTATION ? "decimal" : "numeric"}
                  autoFocus
                  disabled={showingAnswer}
                  value={input}
                  onChange={(e) => {
                    if (mode === GameMode.SIG_FIGS_SCI_NOTATION) {
                      const val = e.target.value;
                      // If the user pasted or typed multiple characters at once
                      if (Math.abs(val.length - input.length) > 1) {
                        setInput(val.replace(/[^0-9.-]/g, ''));
                        
                        // Check if it matches
                        if (!problem) return;
                        const ans = JSON.parse(problem.answer);
                        if (ans.type !== 'sci') {
                          const cleanVal = val.replace(/[^0-9.-]/g, '');
                          if (cleanVal === ans.value) {
                            setIsSuccess(true);
                            setTimeout(() => {
                              handleCorrect();
                              setIsSuccess(false);
                            }, ans.type === 'count_sf' ? 500 : 250);
                          } else if (cleanVal.length >= ans.value.length && cleanVal !== ans.value) {
                            triggerError();
                          }
                        }
                      } else if (val.length < input.length) {
                        handleSciInput('Backspace');
                      } else {
                        handleSciInput(val.slice(-1));
                      }
                    } else {
                      handleInputChange(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (mode === GameMode.EXPANDING_NEGATIVES || mode === GameMode.TWO_STEP_EQUATIONS) && !isSuccess) {
                      triggerError();
                    }
                  }}
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

              {mode === GameMode.EXPANDING_NEGATIVES && (
                <div className={`hidden md:flex flex-col items-center mt-8 space-y-3 ${showingAnswer ? "pointer-events-none opacity-50" : ""}`}>
                  <div className="flex gap-4">
                    <button onClick={() => { handleInputChange(input + '+'); inputRef.current?.focus(); }} className="w-16 h-16 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl text-3xl font-bold hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors active:scale-95 flex items-center justify-center shadow-sm">+</button>
                    <button onClick={() => { handleInputChange(input + '-'); inputRef.current?.focus(); }} className="w-16 h-16 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl text-3xl font-bold hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors active:scale-95 flex items-center justify-center shadow-sm">-</button>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">Note: You can also use your keyboard for these symbols.</p>
                </div>
              )}

              {mode === GameMode.TWO_STEP_EQUATIONS && (
                <div className={`hidden md:flex flex-col items-center mt-8 space-y-3 ${showingAnswer ? "pointer-events-none opacity-50" : ""}`}>
                  <div className="flex gap-4">
                    <button onClick={() => { handleInputChange(input + '/'); inputRef.current?.focus(); }} className="w-16 h-16 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl text-2xl font-bold hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors active:scale-95 flex items-center justify-center shadow-sm">/</button>
                    <button onClick={() => { handleInputChange(input + '-'); inputRef.current?.focus(); }} className="w-16 h-16 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl text-3xl font-bold hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors active:scale-95 flex items-center justify-center shadow-sm">-</button>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">Note: You can also use your keyboard for these symbols.</p>
                </div>
              )}

              <div className={showingAnswer ? "pointer-events-none opacity-50" : ""}>
                <Numpad 
                  onKeyPress={(key) => {
                    if (mode === GameMode.SIG_FIGS_SCI_NOTATION) {
                      handleSciInput(key);
                    } else {
                      handleInputChange(input + key);
                    }
                  }} 
                  onClear={() => {
                    if (mode === GameMode.SIG_FIGS_SCI_NOTATION) {
                      handleSciInput('C');
                    } else {
                      setInput('');
                    }
                  }}
                  mode={mode}
                />
              </div>

              {(mode === GameMode.EXPANDING_NEGATIVES || mode === GameMode.TWO_STEP_EQUATIONS) && (
                <div className="mt-8 flex justify-center">
                  {!showingAnswer ? (
                    <button
                      onClick={onShowAnswerClick}
                      className="px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors active:scale-95"
                    >
                      Show Answer
                    </button>
                  ) : canGoNext ? (
                    <button
                      onClick={handleSkip}
                      className="px-8 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors active:scale-95 shadow-md"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-6 py-3 bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 font-bold rounded-xl cursor-not-allowed"
                    >
                      Show Answer
                    </button>
                  )}
                </div>
              )}
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
