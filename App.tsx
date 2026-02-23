
import React, { useState, useEffect, useCallback, useRef } from 'react';
import 'katex/dist/katex.min.css';
import { GameMode, GameStats, CurrentStats, MathProblem, GraphConfig } from './types';
import { generateProblem } from './utils/gameLogic';
import MainMenu from './components/MainMenu';
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
    } else {
      document.documentElement.classList.remove('dark');
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

    const firstProblem = generateProblem(selectedMode, { forceQuadrant1: initialForceQ1 });
    setProblem(firstProblem);
    setInput('');
    setIsSuccess(false);
    setIsError(false);
    setSession({
      combo: 0,
      qpm: 0,
      correctCount: 0,
      totalAttempts: 0,
      startTime: Date.now(),
      endTime: null,
    });
    // Only focus input if not in graph/trig mode
    if (selectedMode !== GameMode.METHODS_GRAPHS && selectedMode !== GameMode.TRIG_EXACT_VALUES) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleCorrect = useCallback(() => {
    setIsCorrectFlash(true);
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
        setProblem(generateProblem(mode, { forceQuadrant1: nextForceQ1 }));
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

  const handleInputChange = (val: string) => {
    if (!problem || session.endTime || isSuccess || isError) return;
    
    let cleanVal = val;

    // Only clean input for arithmetic modes
    if (mode !== GameMode.TRIG_EXACT_VALUES && mode !== GameMode.METHODS_GRAPHS) {
      // Allow digits and minus sign
      cleanVal = val.replace(/[^0-9-]/g, '');
    }
    
    setInput(cleanVal);

    if (cleanVal === problem.answer.toString()) {
      setIsSuccess(true);
      const delay = mode === GameMode.TRIG_EXACT_VALUES ? 1000 : 250;
      setTimeout(() => {
        handleCorrect();
        setIsSuccess(false);
      }, delay);
    } else if (mode !== GameMode.TRIG_EXACT_VALUES && mode !== GameMode.METHODS_GRAPHS) {
      // Arithmetic mode error handling (length based)
      if (cleanVal.length >= problem.answer.toString().length) {
        triggerError();
      }
    } else {
      // Immediate error for button-click modes (Trig/Graphs)
      let isSignError = false;
      if (mode === GameMode.TRIG_EXACT_VALUES) {
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

      {/* Main Menu */}
      {mode === GameMode.NONE && (
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
          input={input}
          setInput={setInput}
          isShaking={isShaking}
          isCorrectFlash={isCorrectFlash}
          isSuccess={isSuccess}
          isError={isError}
          handleInputChange={handleInputChange}
          stats={stats}
          accuracy={accuracy}
          targetProblems={TARGET_PROBLEMS}
          inputRef={inputRef}
          graphConfig={graphConfig}
        />
      )}
    </>
  );
};

export default App;
