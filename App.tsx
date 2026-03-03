
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { GameMode, GameStats, CurrentStats, MathProblem, GraphConfig } from './types';
import { generateProblem } from './utils/gameLogic';
import MainMenu from './components/MainMenu';
import Seal8Menu from './components/Seal8Menu';
import Methods12Menu from './components/Methods12Menu';
import Spec11Menu from './components/Spec11Menu';
import SummaryScreen from './components/SummaryScreen';
import ActiveGame from './components/ActiveGame';
import DevTools from './components/DevTools';

const TARGET_PROBLEMS = 20;

const App: React.FC = () => {
  // Persistence
  const [mode, setMode] = useState<GameMode>(GameMode.NONE);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('mathStats');
    return saved ? JSON.parse(saved) : { highScore: 0, totalSolved: 0 };
  });

  // Graph Config
  const [graphConfig, setGraphConfig] = useState<GraphConfig>({
    gridColumns: 4,
    axisStrokeWidth: 1.2,
    gridStrokeWidth: 0.5,
    graphStrokeWidth: 1.5,
    fontSize: 7,
    axisFontSize: 7
  });
  const [showDevTools, setShowDevTools] = useState(false);

  // Game State
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [input, setInput] = useState<string>('');
  const [session, setSession] = useState<CurrentStats>({
    combo: 0,
    qpm: 0,
    correctCount: 0,
    totalAttempts: 0,
    startTime: null,
    endTime: null,
  });
  const [isShaking, setIsShaking] = useState(false);
  const [isCorrectFlash, setIsCorrectFlash] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [unsimplifiedAnswer, setUnsimplifiedAnswer] = useState<string | null>(null);
  
  // Trig Mode State
  const [forceQuadrant1, setForceQuadrant1] = useState(false);
  const hasErrorOnCurrent = useRef(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('mathStats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // QPM Update Timer
  useEffect(() => {
    if (!session.startTime || session.endTime || mode === GameMode.NONE) return;

    const interval = setInterval(() => {
      setSession(prev => {
        if (!prev.startTime || prev.endTime) return prev;
        const elapsedMinutes = (Date.now() - prev.startTime) / 60000;
        const qpm = prev.correctCount > 0 ? Math.round(prev.correctCount / elapsedMinutes) : 0;
        return { ...prev, qpm };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session.startTime, session.endTime, mode]);

  const startNewGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    
    // Initial problem generation
    const isTrig = selectedMode === GameMode.TRIG_EXACT_VALUES;
    const initialForceQ1 = isTrig; // First 3 questions are Q1, so start with true
    setForceQuadrant1(initialForceQ1);
    hasErrorOnCurrent.current = false;

    const firstProblem = generateProblem(selectedMode, { forceQuadrant1: initialForceQ1, combo: 0 });
    setProblem(firstProblem);
    setInput('');
    setIsSuccess(false);
    setIsError(false);
    setUnsimplifiedAnswer(null);
    setSession({
      combo: 0,
      qpm: 0,
      correctCount: 0,
      totalAttempts: 0,
      startTime: Date.now(),
      endTime: null,
    });
    // Only focus input if not in graph/trig mode
    if (selectedMode !== GameMode.METHODS_GRAPHS && selectedMode !== GameMode.TRIG_EXACT_VALUES && selectedMode !== GameMode.INVERSE_TRIG_EXACT_VALUES) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleCorrect = useCallback(() => {
    setIsCorrectFlash(true);
    setUnsimplifiedAnswer(null);
    setTimeout(() => setIsCorrectFlash(false), 400);

    setSession(prev => {
      const newCombo = prev.combo + 1;
      const newCorrectCount = prev.correctCount + 1;
      const newTotalAttempts = prev.totalAttempts + 1;
      
      // Update high score (Best Streak)
      if (newCombo > stats.highScore) {
        setStats(s => ({ ...s, highScore: newCombo }));
      }
      setStats(s => ({ ...s, totalSolved: s.totalSolved + 1 }));

      const isFinished = newCorrectCount >= TARGET_PROBLEMS;

      // Determine next problem params
      if (!isFinished) {
        let nextForceQ1 = false;
        if (mode === GameMode.TRIG_EXACT_VALUES) {
           // Force Q1 if:
           // 1. We are in the first 3 questions (newCorrectCount < 3)
           // 2. An error occurred on the current question
           if (newCorrectCount < 3 || hasErrorOnCurrent.current) {
             nextForceQ1 = true;
           } else {
             nextForceQ1 = false;
           }
        }
        
        setForceQuadrant1(nextForceQ1);
        setProblem(generateProblem(mode, { forceQuadrant1: nextForceQ1, combo: newCombo }));
        hasErrorOnCurrent.current = false;
      } else {
        setProblem(null);
      }

      return {
        ...prev,
        combo: newCombo,
        correctCount: newCorrectCount,
        totalAttempts: newTotalAttempts,
        endTime: isFinished ? Date.now() : null,
      };
    });

    setInput('');
  }, [mode, stats.highScore, session.correctCount, forceQuadrant1]);

  const triggerError = (isSignError: boolean = false) => {
    setIsShaking(true);
    setIsError(true);
    
    // Mark error for Trig mode logic
    // Only if NOT a sign error (magnitude was wrong)
    if (!isSignError) {
      hasErrorOnCurrent.current = true;
    }

    setSession(prev => ({ 
      ...prev, 
      combo: 0,
      totalAttempts: prev.totalAttempts + 1 
    }));

    setTimeout(() => {
      setIsShaking(false);
      setIsError(false);
      setInput('');
    }, 250);
  };

  const handleSkip = useCallback(() => {
    setUnsimplifiedAnswer(null);
    
    setSession(prev => {
      const newTotalAttempts = prev.totalAttempts + 1;
      
      const isFinished = prev.correctCount >= TARGET_PROBLEMS;

      if (!isFinished) {
        let nextForceQ1 = false;
        if (mode === GameMode.TRIG_EXACT_VALUES) {
           if (prev.correctCount < 3 || hasErrorOnCurrent.current) {
             nextForceQ1 = true;
           } else {
             nextForceQ1 = false;
           }
        }
        
        setForceQuadrant1(nextForceQ1);
        setProblem(generateProblem(mode, { forceQuadrant1: nextForceQ1, combo: 0 }));
        hasErrorOnCurrent.current = false;
      } else {
        setProblem(null);
      }

      return {
        ...prev,
        combo: 0,
        totalAttempts: newTotalAttempts,
      };
    });

    setInput('');
  }, [mode, session.correctCount, forceQuadrant1]);

  const parseAlgebraInput = (input: string) => {
    const clean = input.replace(/\s+/g, '');
    let xCoef = 0;
    let cCoef = 0;
    
    // Find x term
    const xMatch = clean.match(/([+-]?\d*)x/);
    if (xMatch) {
      let xStr = xMatch[1];
      if (xStr === '' || xStr === '+') xCoef = 1;
      else if (xStr === '-') xCoef = -1;
      else xCoef = parseInt(xStr, 10);
    }
    
    // Find constant term
    const cStr = clean.replace(/([+-]?\d*)x/, '');
    if (cStr) {
      cCoef = parseInt(cStr, 10);
      if (isNaN(cCoef)) cCoef = 0;
    }
    
    return { x: xCoef, c: cCoef };
  };

  const parseFractionInput = (input: string) => {
    const parts = input.split('/');
    if (parts.length === 1) {
      const num = parseInt(parts[0], 10);
      return { num: isNaN(num) ? null : num, den: 1, origNum: isNaN(num) ? null : num, origDen: 1 };
    } else if (parts.length === 2) {
      if (parts[1] === '' || parts[1] === '-') return { num: null, den: null, origNum: null, origDen: null };
      
      let num = parseInt(parts[0], 10);
      let den = parseInt(parts[1], 10);
      if (isNaN(num) || isNaN(den) || den === 0) return { num: null, den: null, origNum: null, origDen: null };
      
      let origNum = num;
      let origDen = den;

      if (den < 0) {
        num = -num;
        den = -den;
      }
      
      const gcd = (x: number, y: number): number => y === 0 ? Math.abs(x) : gcd(y, x % y);
      const divisor = gcd(num, den);
      
      return { num: num / divisor, den: den / divisor, origNum, origDen };
    }
    return { num: null, den: null, origNum: null, origDen: null };
  };

  const handleInputChange = (val: string) => {
    if (!problem || session.endTime || isSuccess || isError) return;
    
    let cleanVal = val;

    // Only clean input for arithmetic modes
    if (mode !== GameMode.TRIG_EXACT_VALUES && mode !== GameMode.INVERSE_TRIG_EXACT_VALUES && mode !== GameMode.METHODS_GRAPHS && mode !== GameMode.SIMPLIFY_SURDS && mode !== GameMode.EXPANDING_NEGATIVES && mode !== GameMode.TWO_STEP_EQUATIONS) {
      // Allow digits and minus sign
      cleanVal = val.replace(/[^0-9-]/g, '');
    } else if (mode === GameMode.SIMPLIFY_SURDS) {
      // Allow digits and 'r'
      cleanVal = val.replace(/[^0-9rR]/g, '').toLowerCase();
    } else if (mode === GameMode.EXPANDING_NEGATIVES) {
      // Allow digits, x, +, -
      cleanVal = val.replace(/[^0-9xX+\-]/g, '').toLowerCase();
    } else if (mode === GameMode.TWO_STEP_EQUATIONS) {
      // Allow digits, -, /
      cleanVal = val.replace(/[^0-9\-/]/g, '');
    }
    
    setInput(cleanVal);

    if (mode === GameMode.SIMPLIFY_SURDS || mode === GameMode.SIG_FIGS_SCI_NOTATION) {
      // We handle surd and sci notation logic in ActiveGame now, so this branch shouldn't be reached
      // But just in case, we do nothing here.
      return;
    }

    if (mode === GameMode.EXPANDING_NEGATIVES) {
      const ans = JSON.parse(problem.answer);
      const parsed = parseAlgebraInput(cleanVal);
      if (parsed.x === ans.x && parsed.c === ans.c) {
        setIsSuccess(true);
        setTimeout(() => {
          handleCorrect();
          setIsSuccess(false);
        }, 250);
      }
      return;
    }

    if (mode === GameMode.TWO_STEP_EQUATIONS) {
      const ans = JSON.parse(problem.answer);
      const parsed = parseFractionInput(cleanVal);
      if (parsed.num !== null && parsed.num === ans.num && parsed.den === ans.den) {
        const expectedStr = ans.den === 1 ? `${ans.num}` : `${ans.num}/${ans.den}`;
        
        if (cleanVal === expectedStr) {
          setIsSuccess(true);
          setTimeout(() => {
            handleCorrect();
            setIsSuccess(false);
          }, 250);
        } else {
          setUnsimplifiedAnswer(cleanVal);
          setInput('');
        }
      }
      return;
    }

    if (cleanVal === problem.answer.toString()) {
      setIsSuccess(true);
      const delay = (mode === GameMode.TRIG_EXACT_VALUES || mode === GameMode.INVERSE_TRIG_EXACT_VALUES) ? 1000 : 250;
      setTimeout(() => {
        handleCorrect();
        setIsSuccess(false);
      }, delay);
    } else if (mode !== GameMode.TRIG_EXACT_VALUES && mode !== GameMode.INVERSE_TRIG_EXACT_VALUES && mode !== GameMode.METHODS_GRAPHS) {
      // Arithmetic mode error handling (length based)
      if (cleanVal.length >= problem.answer.toString().length) {
        triggerError();
      }
    } else {
      // Immediate error for button-click modes (Trig/Graphs)
      let isSignError = false;
      if (mode === GameMode.TRIG_EXACT_VALUES || mode === GameMode.INVERSE_TRIG_EXACT_VALUES) {
        const ans = problem.answer.toString();
        if (cleanVal === '-' + ans || ans === '-' + cleanVal) {
          isSignError = true;
        }
      }
      triggerError(isSignError);
    }
  };

  const executeReset = () => {
    if (!isConfirmingReset) {
      setIsConfirmingReset(true);
      return;
    }
    
    setStats({ highScore: 0, totalSolved: 0 });
    localStorage.removeItem('mathStats');
    setIsConfirmingReset(false);
    setShowSettings(false);
  };

  const closeSettings = () => {
    setShowSettings(false);
    setIsConfirmingReset(false);
  };

  const exportStandalone = () => {
    try {
      const doctype = "<!DOCTYPE html>\n";
      const htmlContent = document.documentElement.outerHTML;
      const blob = new Blob([doctype + htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MathFlow-Standalone.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const accuracy = session.totalAttempts > 0 
    ? Math.round((session.correctCount / session.totalAttempts) * 100) 
    : 100;

  return (
    <>
      {showDevTools && (
        <DevTools 
          config={graphConfig} 
          setConfig={setGraphConfig} 
          onClose={() => setShowDevTools(false)} 
        />
      )}

      {/* Menus */}
      {mode === GameMode.NONE && (
        <Routes>
          <Route path="/" element={
            <MainMenu
              stats={stats}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              showSettings={showSettings}
              setShowSettings={setShowSettings}
              startNewGame={startNewGame}
              exportStandalone={exportStandalone}
              executeReset={executeReset}
              isConfirmingReset={isConfirmingReset}
              closeSettings={closeSettings}
              onOpenDevTools={() => setShowDevTools(true)}
            />
          } />
          <Route path="/8seal" element={<Seal8Menu startNewGame={startNewGame} />} />
          <Route path="/11spec" element={<Spec11Menu startNewGame={startNewGame} />} />
          <Route path="/12methods" element={<Methods12Menu startNewGame={startNewGame} />} />
        </Routes>
      )}

      {/* Summary Screen */}
      {mode !== GameMode.NONE && session.endTime && (
        <SummaryScreen
          session={session}
          accuracy={accuracy}
          startNewGame={startNewGame}
          setMode={setMode}
          mode={mode}
        />
      )}

      {/* Active Game View */}
      {mode !== GameMode.NONE && !session.endTime && (
        <ActiveGame
          mode={mode}
          setMode={setMode}
          session={session}
          problem={problem}
          setProblem={setProblem}
          input={input}
          setInput={setInput}
          isShaking={isShaking}
          isCorrectFlash={isCorrectFlash}
          isSuccess={isSuccess}
          setIsSuccess={setIsSuccess}
          isError={isError}
          handleInputChange={handleInputChange}
          handleCorrect={handleCorrect}
          triggerError={triggerError}
          handleSkip={handleSkip}
          stats={stats}
          accuracy={accuracy}
          targetProblems={TARGET_PROBLEMS}
          inputRef={inputRef}
          graphConfig={graphConfig}
          unsimplifiedAnswer={unsimplifiedAnswer}
        />
      )}
    </>
  );
};

export default App;
