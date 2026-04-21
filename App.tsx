
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { GameMode, GameStats, CurrentStats, MathProblem, GraphConfig, GameType, FeedbackToken } from './types';
import { generateProblem } from './utils/gameLogic';
import MainMenu from './components/MainMenu';
import Seal8Menu from './components/Seal8Menu';
import Year8Menu from './components/Year8Menu';
import Methods12Menu from './components/Methods12Menu';
import Spec11Menu from './components/Spec11Menu';
import CustomGameMenu from './components/CustomGameMenu';
import SummaryScreen from './components/SummaryScreen';
import ActiveGame from './components/ActiveGame';
import DevTools from './components/DevTools';

const TARGET_PROBLEMS = 20;

const App: React.FC = () => {
  const navigate = useNavigate();
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
  const [granularFeedback, setGranularFeedback] = useState<FeedbackToken[] | null>(null);
  const [lastIncorrectFeedback, setLastIncorrectFeedback] = useState<FeedbackToken[] | null>(null);
  const [lastPartialFeedback, setLastPartialFeedback] = useState<FeedbackToken[] | null>(null);
  
  // Global Game Settings (Fixed vs Time)
  const [globalGameType, setGlobalGameType] = useState<GameType>('FIXED_PROBLEMS');
  const [globalTimeLimit, setGlobalTimeLimit] = useState<number>(180); // Default 3 mins

  // Custom Game State
  const [customModes, setCustomModes] = useState<GameMode[]>([]);
  const [targetProblems, setTargetProblems] = useState(TARGET_PROBLEMS);
  const [gameType, setGameType] = useState<GameType>('FIXED_PROBLEMS');
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);

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

  // QPM Update Timer & Game Timer
  useEffect(() => {
    if (!session.startTime || session.endTime || mode === GameMode.NONE) return;

    const interval = setInterval(() => {
      setSession(prev => {
        if (!prev.startTime || prev.endTime) return prev;
        
        const elapsedMinutes = (Date.now() - prev.startTime) / 60000;
        const qpm = prev.correctCount > 0 ? Math.round(prev.correctCount / elapsedMinutes) : 0;
        
        // Check for Time Attack end condition
        if (prev.gameType === 'TIME_ATTACK' && prev.timeLimit) {
          const elapsedSeconds = (Date.now() - prev.startTime) / 1000;
          if (elapsedSeconds >= prev.timeLimit) {
            return {
              ...prev,
              qpm,
              endTime: Date.now()
            };
          }
        }

        return { ...prev, qpm };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session.startTime, session.endTime, mode]);

  const startNewGame = (selectedMode: GameMode, customConfig?: { modes: GameMode[], count: number, gameType: GameType, timeLimit?: number }) => {
    setMode(selectedMode);
    
    if (selectedMode === GameMode.CUSTOM && customConfig) {
      setCustomModes(customConfig.modes);
      setTargetProblems(customConfig.count);
      setGameType(customConfig.gameType);
      setTimeLimit(customConfig.timeLimit);
    } else {
      setCustomModes([]);
      setGameType(globalGameType);
      
      if (globalGameType === 'TIME_ATTACK') {
        setTimeLimit(globalTimeLimit);
        setTargetProblems(1000); // Effectively infinite for time attack display purposes
      } else {
        setTimeLimit(undefined);
        // Set target problems based on category
        // Import GAME_MODES and GameCategory to check category
        // Since we can't easily import here without refactoring, we'll check the ID prefix or known IDs
        // Actually we can just check the mode ID against known lists or patterns
        
        // Hardcoded check for now as it's simpler than importing the config array if not already imported
        // But wait, we need to know if it's Methods or Spec.
        // Let's look at the ID strings in types.ts
        
        const isMethodsOrSpec = [
          GameMode.METHODS_GRAPHS,
          GameMode.TRIG_EXACT_VALUES,
          GameMode.INVERSE_TRIG_EXACT_VALUES
        ].includes(selectedMode);

        if (isMethodsOrSpec) {
          setTargetProblems(10);
        } else {
          setTargetProblems(20);
        }
      }
    }
    
    // Initial problem generation
    let problemMode = selectedMode;
    if (selectedMode === GameMode.CUSTOM && customConfig && customConfig.modes.length > 0) {
      problemMode = customConfig.modes[Math.floor(Math.random() * customConfig.modes.length)];
    }

    const isTrig = problemMode === GameMode.TRIG_EXACT_VALUES;
    const initialForceQ1 = isTrig; // First 3 questions are Q1, so start with true
    setForceQuadrant1(initialForceQ1);
    hasErrorOnCurrent.current = false;

    const firstProblem = generateProblem(problemMode, { forceQuadrant1: initialForceQ1, combo: 0 });
    setProblem(firstProblem);
    setInput('');
    setIsSuccess(false);
    setIsError(false);
    setUnsimplifiedAnswer(null);
    setGranularFeedback(null);
    setLastIncorrectFeedback(null);
    setLastPartialFeedback(null);
    setSession({
      combo: 0,
      qpm: 0,
      correctCount: 0,
      totalAttempts: 0,
      startTime: Date.now(),
      endTime: null,
      gameType: selectedMode === GameMode.CUSTOM && customConfig ? customConfig.gameType : globalGameType,
      timeLimit: selectedMode === GameMode.CUSTOM && customConfig ? customConfig.timeLimit : (globalGameType === 'TIME_ATTACK' ? globalTimeLimit : undefined)
    });
    // Only focus input if not in graph/trig mode
    if (problemMode !== GameMode.METHODS_GRAPHS && problemMode !== GameMode.TRIG_EXACT_VALUES && problemMode !== GameMode.INVERSE_TRIG_EXACT_VALUES) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleCorrect = useCallback(() => {
    setIsCorrectFlash(true);
    setUnsimplifiedAnswer(null);
    setLastIncorrectFeedback(null);
    setLastPartialFeedback(null);
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

      const isFinished = prev.gameType === 'FIXED_PROBLEMS' && newCorrectCount >= targetProblems;

      // Determine next problem params
      if (!isFinished) {
        let nextMode = mode;
        if (mode === GameMode.CUSTOM && customModes.length > 0) {
          nextMode = customModes[Math.floor(Math.random() * customModes.length)];
        }

        let nextForceQ1 = false;
        if (nextMode === GameMode.TRIG_EXACT_VALUES) {
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
        setProblem(generateProblem(nextMode, { forceQuadrant1: nextForceQ1, combo: newCombo }));
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
  }, [mode, stats.highScore, session.correctCount, forceQuadrant1, targetProblems, customModes]);

  const triggerError = (isSignError: boolean = false, wipeInput: boolean = true, delayMs: number = 250) => {
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
      if (wipeInput) setInput('');
      setGranularFeedback(null);
    }, delayMs);
  };

  const handleSkip = useCallback(() => {
    setUnsimplifiedAnswer(null);
    setLastIncorrectFeedback(null);
    setLastPartialFeedback(null);
    
    setSession(prev => {
      const newTotalAttempts = prev.totalAttempts + 1;
      
      const isFinished = prev.correctCount >= targetProblems;

      if (!isFinished) {
        let nextMode = mode;
        if (mode === GameMode.CUSTOM && customModes.length > 0) {
          nextMode = customModes[Math.floor(Math.random() * customModes.length)];
        }

        let nextForceQ1 = false;
        if (nextMode === GameMode.TRIG_EXACT_VALUES) {
           if (prev.correctCount < 3 || hasErrorOnCurrent.current) {
             nextForceQ1 = true;
           } else {
             nextForceQ1 = false;
           }
        }
        
        setForceQuadrant1(nextForceQ1);
        setProblem(generateProblem(nextMode, { forceQuadrant1: nextForceQ1, combo: 0 }));
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
  }, [mode, session.correctCount, forceQuadrant1, targetProblems, customModes]);

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

  const parseMultiVarAlgebra = (input: string) => {
    const clean = input.replace(/\s+/g, '');
    const terms: Record<string, number> = {};
    const regex = /([+-]?\d*)([a-z]+)?/gi; 
    let match;
    let lastIndex = -1;
    while ((match = regex.exec(clean)) !== null) {
      if (regex.lastIndex === lastIndex) break; 
      lastIndex = regex.lastIndex;
      
      if (match[0] === '') continue;
      
      let coefStr = match[1];
      let varStr = match[2] ? match[2].toLowerCase() : 'constant';
      
      if (varStr !== 'constant') {
        varStr = varStr.split('').sort().join('');
      }
      
      let coef = 1;
      if (coefStr === '' || coefStr === '+') coef = 1;
      else if (coefStr === '-') coef = -1;
      else coef = parseInt(coefStr, 10);
      
      if (isNaN(coef)) coef = 0;
      
      terms[varStr] = (terms[varStr] || 0) + coef;
    }
    for (const k in terms) {
      if (terms[k] === 0) delete terms[k];
    }
    return terms;
  };

  const getFactorisingFeedback = (
    inputValue: string, 
    expected: { termX: number, termC: number, letter: string, str: string }
  ): { feedback: FeedbackToken[], isCorrect: boolean, isPartial: boolean } | null => {
    // Expected format: A(Bx + C)
    const match = inputValue.match(/^([+-]?\d*)\(([+-]?\d*)([a-z]*)([+-])(\d+)\)$/i);
    if (!match) return null;

    let outCoefStr = match[1];
    let inCoefXStr = match[2];
    let varStr = match[3] ? match[3].toLowerCase() : '';
    let opStr = match[4];
    let inCStr = match[5];

    let A = 1;
    if (outCoefStr === '' || outCoefStr === '+') A = 1;
    else if (outCoefStr === '-') A = -1;
    else A = parseInt(outCoefStr, 10);

    let B = 1;
    if (inCoefXStr === '' || inCoefXStr === '+') B = 1;
    else if (inCoefXStr === '-') B = -1;
    else B = parseInt(inCoefXStr, 10);

    let C = parseInt(inCStr, 10);
    if (opStr === '-') C = -C;

    const feedback: FeedbackToken[] = [];
    
    // Check if A is a valid common factor of termX and termC
    // It must divide both evenly, and it must be > 1 or < -1 (can't just pull out 1 or -1 ordinarily if there are larger factors, but here any valid factor > 1 helps) 
    // Wait, technically a student COULD pull out -1, but let's say |A| > 1.
    const isAValidCommonFactor = Math.abs(A) > 1 && 
      (expected.termX % A === 0) && 
      (expected.termC % A === 0);
    
    if (isAValidCommonFactor) {
      feedback.push({ text: outCoefStr, color: 'text-emerald-500 text-shadow-sm' });
    } else {
      feedback.push({ text: outCoefStr, color: 'text-rose-500 text-shadow-sm' });
    }

    feedback.push({ text: '(', color: 'text-slate-900 dark:text-white' });
    
    let bIsCorrect = false;
    if (isAValidCommonFactor && B === expected.termX / A && varStr === expected.letter) {
      bIsCorrect = true;
      feedback.push({ text: inCoefXStr + varStr, color: 'text-emerald-500 text-shadow-sm' });
    } else {
      feedback.push({ text: inCoefXStr + varStr, color: 'text-rose-500 text-shadow-sm' });
    }

    let cIsCorrect = false;
    if (isAValidCommonFactor && C === expected.termC / A) {
      cIsCorrect = true;
      feedback.push({ text: opStr + inCStr, color: 'text-emerald-500 text-shadow-sm' });
    } else {
      feedback.push({ text: opStr + inCStr, color: 'text-rose-500 text-shadow-sm' });
    }

    feedback.push({ text: ')', color: 'text-slate-900 dark:text-white' });

    const isAllGreen = isAValidCommonFactor && bIsCorrect && cIsCorrect;
    
    // We consider it partial if they factored out a common factor, but NOT the greatest common factor.
    // However, if they typed EXACTLY the expected string, it's fully correct.
    const isPartial = isAllGreen && inputValue !== expected.str;
    
    return { feedback, isCorrect: isAllGreen && !isPartial, isPartial };
  };

  const getMultiVarFeedback = (inputValue: string, expectedTerms: Record<string, number>): { feedback: FeedbackToken[], isAllCorrect: boolean } | null => {
    const matches = inputValue.match(/[+-]?[^-+]+/g);
    if (!matches) return null;
    
    const expectedKeys = Object.keys(expectedTerms);
    if (matches.length !== expectedKeys.length) return null;
    
    for(let t of matches) {
      if (t === '+' || t === '-' || t.endsWith('+') || t.endsWith('-')) return null;
    }
    
    const typedKeys = matches.map(t => {
      const m = t.match(/^([+-]?\d*)([a-z]*)$/i);
      if (!m) return 'unknown';
      return m[2] ? m[2].toLowerCase().split('').sort().join('') : 'constant';
    });
    
    const numExpectedVars = expectedKeys.filter(k => k !== 'constant').length;
    const numTypedVars = typedKeys.filter(k => k !== 'constant' && k !== 'unknown').length;
    
    if (numTypedVars < numExpectedVars) return null;
    
    let feedback: FeedbackToken[] = [];
    let isAllCorrect = true;
    
    for (let i = 0; i < matches.length; i++) {
      const termStr = matches[i];
      const m = termStr.match(/^([+-]?\d*)([a-z]*)$/i);
      if (!m) {
        feedback.push({text: termStr, color: 'text-rose-500 text-shadow-sm'});
        isAllCorrect = false;
        continue;
      }
      
      let coefStr = m[1];
      let varStrOriginal = m[2];
      let varStrMapped = varStrOriginal ? varStrOriginal.toLowerCase().split('').sort().join('') : 'constant';
      
      let typedCoef = 1;
      if (coefStr === '' || coefStr === '+') typedCoef = 1;
      else if (coefStr === '-') typedCoef = -1;
      else typedCoef = parseInt(coefStr, 10);

      // find expected coef for this key
      const expectedCoef = expectedTerms[varStrMapped];
      
      if (expectedCoef === undefined) {
        feedback.push({text: termStr, color: 'text-rose-500 text-shadow-sm'});
        isAllCorrect = false;
      } else {
        if (typedCoef === expectedCoef) {
          feedback.push({text: termStr, color: 'text-emerald-500 text-shadow-sm'});
        } else {
          isAllCorrect = false;
          if (varStrOriginal) {
            if (coefStr === '') {
              feedback.push({text: varStrOriginal, color: 'text-rose-500 text-shadow-sm'});
            } else if (coefStr === '+' || coefStr === '-') {
              feedback.push({text: coefStr, color: 'text-rose-500 text-shadow-sm'});
              feedback.push({text: varStrOriginal, color: 'text-emerald-500 text-shadow-sm'});
            } else {
               feedback.push({text: coefStr, color: 'text-rose-500 text-shadow-sm'});
               feedback.push({text: varStrOriginal, color: 'text-emerald-500 text-shadow-sm'});
            }
          } else {
            feedback.push({text: termStr, color: 'text-rose-500 text-shadow-sm'});
          }
        }
      }
    }
    
    return { feedback, isAllCorrect };
  };

  const handleInputChange = (val: string) => {
    if (!problem || session.endTime || isSuccess || isError) return;
    
    if (unsimplifiedAnswer) setUnsimplifiedAnswer(null);
    
    const currentProblemMode = problem.mode || mode;
    
    let cleanVal = val;

    // Only clean input for arithmetic modes
    if (currentProblemMode !== GameMode.TRIG_EXACT_VALUES && currentProblemMode !== GameMode.INVERSE_TRIG_EXACT_VALUES && currentProblemMode !== GameMode.METHODS_GRAPHS && currentProblemMode !== GameMode.SIMPLIFY_SURDS && currentProblemMode !== GameMode.EXPANDING_NEGATIVES && currentProblemMode !== GameMode.TWO_STEP_EQUATIONS && currentProblemMode !== GameMode.YEAR8_ADD_SUB_ALGEBRA && currentProblemMode !== GameMode.YEAR8_MULT_DIV_ALGEBRA && currentProblemMode !== GameMode.YEAR8_EXPANDING && currentProblemMode !== GameMode.YEAR8_FACTORISING) {
      // Allow digits and minus sign
      cleanVal = val.replace(/[^0-9-]/g, '');
    } else if (currentProblemMode === GameMode.SIMPLIFY_SURDS) {
      // Allow digits and 'r'
      cleanVal = val.replace(/[^0-9rR]/g, '').toLowerCase();
    } else if (currentProblemMode === GameMode.EXPANDING_NEGATIVES) {
      // Allow digits, x, +, -
      cleanVal = val.replace(/[^0-9xX+\-]/g, '').toLowerCase();
    } else if (currentProblemMode === GameMode.YEAR8_ADD_SUB_ALGEBRA || currentProblemMode === GameMode.YEAR8_EXPANDING) {
      // Allow digits, letters, +, -
      cleanVal = val.replace(/[^0-9a-zA-Z+\-]/g, '').toLowerCase();
    } else if (currentProblemMode === GameMode.YEAR8_FACTORISING) {
      // Allow digits, letters, +, -, (, )
      cleanVal = val.replace(/[^0-9a-zA-Z+\-()]/g, '').toLowerCase();
    } else if (currentProblemMode === GameMode.YEAR8_MULT_DIV_ALGEBRA) {
      // Allow digits, a,b,x,y,m,n,/,+,- (maybe + and - just in case?)
      cleanVal = val.replace(/[^0-9abxymn/+\-]/gi, '').toLowerCase();
    } else if (currentProblemMode === GameMode.TWO_STEP_EQUATIONS) {
      // Allow digits, -, /
      cleanVal = val.replace(/[^0-9\-/]/g, '');
    }
    
    setInput(cleanVal);

    if (currentProblemMode === GameMode.SIMPLIFY_SURDS || currentProblemMode === GameMode.SIG_FIGS_SCI_NOTATION) {
      // We handle surd and sci notation logic in ActiveGame now, so this branch shouldn't be reached
      // But just in case, we do nothing here.
      return;
    }

    if (currentProblemMode === GameMode.EXPANDING_NEGATIVES) {
      const ans = JSON.parse(problem.answer.toString());
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

    if (currentProblemMode === GameMode.YEAR8_ADD_SUB_ALGEBRA || currentProblemMode === GameMode.YEAR8_EXPANDING) {
      const ans = JSON.parse(problem.answer.toString());
      if (ans.type === 'multivar') {
        const feedbackResult = getMultiVarFeedback(cleanVal, ans.terms);
        if (feedbackResult) {
          if (feedbackResult.isAllCorrect) {
            setGranularFeedback(feedbackResult.feedback);
            setIsSuccess(true);
            setTimeout(() => {
              handleCorrect();
              setIsSuccess(false);
              setGranularFeedback(null);
            }, 800);
          } else {
            setLastIncorrectFeedback(feedbackResult.feedback);
            setGranularFeedback(null);
            triggerError(false, true, 250); // Instantly wipe input, trigger standard error shake
          }
        }
      }
      return;
    }

    if (currentProblemMode === GameMode.YEAR8_FACTORISING) {
      const ans = JSON.parse(problem.answer.toString());
      if (cleanVal === ans.str) {
        setIsSuccess(true);
        setTimeout(() => {
          handleCorrect();
          setIsSuccess(false);
          setGranularFeedback(null);
        }, 250);
      } else if (cleanVal.endsWith(')')) {
        const feedbackResult = getFactorisingFeedback(cleanVal, ans);
        if (feedbackResult) {
          if (feedbackResult.isPartial) {
            // It's a mathematically valid partial factorisation!
            // Tell them to go further.
            setLastPartialFeedback(feedbackResult.feedback);
            setLastIncorrectFeedback(null);
            setGranularFeedback(null);
            setInput('');
          } else if (feedbackResult.isCorrect) {
            // Shouldn't hit this if cleanVal !== ans.str unless order differences, but just in case
            setIsSuccess(true);
            setTimeout(() => {
              handleCorrect();
              setIsSuccess(false);
              setGranularFeedback(null);
            }, 250);
          } else {
            // It's a wrong factorisation
            setLastIncorrectFeedback(feedbackResult.feedback);
            setGranularFeedback(null);
            triggerError(false, true, 250);
          }
        } else {
          // Unparseable factorisation attempt
          setLastIncorrectFeedback([{ text: cleanVal, color: 'text-rose-500 text-shadow-sm' }]);
          setGranularFeedback(null);
          triggerError(false, true, 250);
        }
      }
      return;
    }

    if (currentProblemMode === GameMode.YEAR8_MULT_DIV_ALGEBRA) {
      const ans = JSON.parse(problem.answer.toString());
      if (ans.isDiv) {
        if (cleanVal === ans.str) {
          setIsSuccess(true);
          setTimeout(() => {
            handleCorrect();
            setIsSuccess(false);
          }, 250);
        }
      } else {
        const feedbackResult = getMultiVarFeedback(cleanVal, ans.terms);
        if (feedbackResult && Object.keys(ans.terms).length > 0) {
          if (feedbackResult.isAllCorrect) {
            setGranularFeedback(feedbackResult.feedback);
            setIsSuccess(true);
            setTimeout(() => {
              handleCorrect();
              setIsSuccess(false);
              setGranularFeedback(null);
            }, 800);
          } else {
             setLastIncorrectFeedback(feedbackResult.feedback);
             setGranularFeedback(null);
             triggerError(false, true, 250);
          }
        }
      }
      return;
    }

    if (currentProblemMode === GameMode.TWO_STEP_EQUATIONS) {
      const ans = JSON.parse(problem.answer.toString());
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
      const delay = (currentProblemMode === GameMode.TRIG_EXACT_VALUES || currentProblemMode === GameMode.INVERSE_TRIG_EXACT_VALUES) ? 1000 : 250;
      setTimeout(() => {
        handleCorrect();
        setIsSuccess(false);
      }, delay);
    } else if (currentProblemMode !== GameMode.TRIG_EXACT_VALUES && currentProblemMode !== GameMode.INVERSE_TRIG_EXACT_VALUES && currentProblemMode !== GameMode.METHODS_GRAPHS) {
      // Arithmetic mode error handling (length based)
      if (cleanVal.length >= problem.answer.toString().length) {
        triggerError();
      }
    } else {
      // Immediate error for button-click modes (Trig/Graphs)
      let isSignError = false;
      if (currentProblemMode === GameMode.TRIG_EXACT_VALUES || currentProblemMode === GameMode.INVERSE_TRIG_EXACT_VALUES) {
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
              globalGameType={globalGameType}
              setGlobalGameType={setGlobalGameType}
            />
          } />
          <Route path="/8mainstream" element={<Year8Menu startNewGame={startNewGame} />} />
          <Route path="/8seal" element={<Seal8Menu startNewGame={startNewGame} />} />
          <Route path="/11spec" element={<Spec11Menu startNewGame={startNewGame} />} />
          <Route path="/12methods" element={<Methods12Menu startNewGame={startNewGame} />} />
          <Route path="/custom" element={<CustomGameMenu startNewGame={startNewGame} onBack={() => navigate('/')} />} />
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
          mode={(mode === GameMode.CUSTOM && problem?.mode) ? problem.mode : mode}
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
          targetProblems={targetProblems}
          inputRef={inputRef}
          graphConfig={graphConfig}
          unsimplifiedAnswer={unsimplifiedAnswer}
          granularFeedback={granularFeedback}
          lastIncorrectFeedback={lastIncorrectFeedback}
          lastPartialFeedback={lastPartialFeedback}
        />
      )}
    </>
  );
};

export default App;
