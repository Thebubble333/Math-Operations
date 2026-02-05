
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameMode, GameStats, CurrentStats, MathProblem } from './types';
import { generateProblem } from './utils/gameLogic';
import Numpad from './components/Numpad';

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
  const [showSettings, setShowSettings] = useState(false);

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
    const firstProblem = generateProblem(selectedMode);
    setProblem(firstProblem);
    setInput('');
    setSession({
      combo: 0,
      qpm: 0,
      correctCount: 0,
      totalAttempts: 0,
      startTime: Date.now(),
      endTime: null,
    });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCorrect = useCallback(() => {
    setIsCorrectFlash(true);
    setTimeout(() => setIsCorrectFlash(false), 300);

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

      return {
        ...prev,
        combo: newCombo,
        correctCount: newCorrectCount,
        totalAttempts: newTotalAttempts,
        endTime: isFinished ? Date.now() : null,
      };
    });

    setInput('');
    if (session.correctCount + 1 < TARGET_PROBLEMS) {
      setProblem(generateProblem(mode));
    } else {
      setProblem(null);
    }
  }, [mode, stats.highScore, session.correctCount]);

  const triggerError = () => {
    setIsShaking(true);
    setSession(prev => ({ 
      ...prev, 
      combo: 0,
      totalAttempts: prev.totalAttempts + 1 
    }));
    setTimeout(() => setIsShaking(false), 400);
  };

  const handleInputChange = (val: string) => {
    if (!problem || session.endTime) return;
    
    const cleanVal = val.replace(/[^0-9]/g, '');
    setInput(cleanVal);

    if (cleanVal === problem.answer.toString()) {
      handleCorrect();
    } else if (cleanVal.length >= problem.answer.toString().length) {
      triggerError();
      setInput('');
    }
  };

  const resetProgress = () => {
    if (confirm('Are you sure you want to reset all progress?')) {
      setStats({ highScore: 0, totalSolved: 0 });
      localStorage.removeItem('mathStats');
      setShowSettings(false);
    }
  };

  const progressPercentage = (session.correctCount / TARGET_PROBLEMS) * 100;
  const accuracy = session.totalAttempts > 0 
    ? Math.round((session.correctCount / session.totalAttempts) * 100) 
    : 100;

  // Main Menu
  if (mode === GameMode.NONE) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="mb-12 text-center">
          <h1 className="text-6xl font-black tracking-tighter mb-2 text-indigo-600 dark:text-indigo-400 italic">
            MATHFLOW
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Race against yourself</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl">
          {[
            { id: GameMode.ADDITION, label: 'Add', icon: '+', color: 'bg-emerald-500' },
            { id: GameMode.SUBTRACTION, label: 'Sub', icon: '-', color: 'bg-sky-500' },
            { id: GameMode.MULTIPLICATION, label: 'Mult', icon: '×', color: 'bg-violet-500' },
            { id: GameMode.MIXED, label: 'Mixed', icon: '?', color: 'bg-amber-500' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => startNewGame(btn.id)}
              className="group relative h-40 flex flex-col items-center justify-center bg-white dark:bg-slate-800 border-b-4 border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-3xl shadow-lg transition-all active:scale-95"
            >
              <div className={`w-12 h-12 rounded-2xl ${btn.color} text-white flex items-center justify-center mb-3 shadow-md transform group-hover:rotate-12 transition-transform`}>
                <span className="text-2xl font-bold">{btn.icon}</span>
              </div>
              <span className="text-lg font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{btn.label}</span>
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
            >
              {darkMode ? '🌙' : '☀️'}
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-90"
            >
              ⚙️
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-3xl font-black mb-8 text-slate-800 dark:text-slate-100 italic">SETTINGS</h2>
              <button 
                onClick={resetProgress}
                className="w-full py-5 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl transition-all mb-4 uppercase tracking-tighter"
              >
                Reset Progress
              </button>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-full py-5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-2xl transition-all uppercase tracking-tighter"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Summary Screen
  if (session.endTime) {
    const timeElapsed = Math.round((session.endTime - (session.startTime || 0)) / 1000);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[3rem] p-12 shadow-2xl border-b-8 border-slate-200 dark:border-slate-700 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-4 shadow-xl">✓</div>
            <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 italic">SESSION CLEAR</h2>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl">
              <div className="text-4xl font-black text-indigo-500">{accuracy}%</div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Accuracy</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl">
              <div className="text-4xl font-black text-orange-500">{session.qpm}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Avg QPM</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl">
              <div className="text-4xl font-black text-emerald-500">{timeElapsed}s</div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Time</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl">
              <div className="text-4xl font-black text-violet-500">{session.combo}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Final Streak</div>
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
            Main Menu
          </button>
        </div>
      </div>
    );
  }

  // Active Game View
  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col p-4 ${isCorrectFlash ? 'flash-green' : ''} bg-slate-50 dark:bg-slate-900`}>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-200 dark:bg-slate-800 z-50">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Header Info */}
      <div className="flex justify-between items-center mb-4 pt-6 max-w-4xl mx-auto w-full">
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
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
        <div className={`text-center space-y-12 w-full transition-transform duration-100 ${isShaking ? 'shake' : ''}`}>
          <div className="relative">
            <div className="text-[12px] absolute -top-8 left-1/2 -translate-x-1/2 font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]">
              Problem {session.correctCount + 1} / {TARGET_PROBLEMS}
            </div>
            <div className="text-8xl sm:text-[10rem] font-black tracking-tighter text-slate-800 dark:text-slate-50 tabular-nums select-none drop-shadow-sm">
              {problem?.question}
            </div>
          </div>
          
          <div className="relative w-full max-w-xs mx-auto">
            <input
              ref={inputRef}
              type="tel"
              autoFocus
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full bg-transparent text-center text-7xl font-black py-4 outline-none border-b-8 border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white caret-indigo-500"
              placeholder=""
              autoComplete="off"
            />
          </div>
        </div>

        {/* Numpad for Mobile */}
        <Numpad 
          onKeyPress={(key) => handleInputChange(input + key)} 
          onClear={() => setInput('')}
        />
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] py-4">
        Accuracy: {accuracy}% • High Streak: {stats.highScore}
      </div>
    </div>
  );
};

export default App;
