import React, { useState, useEffect, useRef } from 'react';
import Latex from 'react-latex-next';
import { MathProblem } from '../types';
import MathText, { formatLatexQuestion } from './MathText';

interface SampleProportionsGameProps {
  problem: MathProblem;
  onAnswer: (val: string) => void;
  isSuccess: boolean;
  isError: boolean;
  showingAnswer?: boolean;
}

// Clean and normalize fraction strings like " 4 / 25 " or "\frac{4}{25}" -> "4/25"
function normalizeFractionInput(raw: string): string {
  let s = raw.trim().replace(/\s+/g, '');
  // Match \frac{a}{b}
  const fracMatch = s.match(/^\\frac\{(-?\d+)\}\{(-?\d+)\}$/);
  if (fracMatch) {
    return `${fracMatch[1]}/${fracMatch[2]}`;
  }
  return s;
}

// Check if raw user input matches a target fraction string "a/b" or "a"
function matchesFraction(input: string, targetFrac: string): boolean {
  const normInput = normalizeFractionInput(input);
  const normTarget = normalizeFractionInput(targetFrac);
  if (normInput === normTarget) return true;

  // Numerical equivalence fallback
  try {
    const evalInput = parseFracOrNumber(normInput);
    const evalTarget = parseFracOrNumber(normTarget);
    if (evalInput !== null && evalTarget !== null && Math.abs(evalInput - evalTarget) < 1e-6) {
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function parseFracOrNumber(str: string): number | null {
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 2) {
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den;
      }
    }
    return null;
  }
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

const SampleProportionsGame: React.FC<SampleProportionsGameProps> = ({
  problem,
  onAnswer,
  isSuccess,
  isError,
  showingAnswer = false
}) => {
  const isStepsMode = problem.type === 'steps' && Boolean(problem.marginDetails);
  const details = problem.marginDetails;

  // Step state for simplifying answer boxes
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [workingLines, setWorkingLines] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [lineError, setLineError] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isCompletedLocal, setIsCompletedLocal] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize working lines and state when problem changes
  useEffect(() => {
    setCurrentStepIndex(0);
    setCurrentInput('');
    setLineError(false);
    setFeedbackMsg(null);
    setIsCompletedLocal(false);

    if (isStepsMode && details) {
      // Line 0: Initial substitution into margin formula
      const initLine = `M = ${details.z}\\sqrt{\\frac{${details.pStr} \\times ${details.qStr}}{${details.n}}}`;
      setWorkingLines([initLine]);
    } else {
      setWorkingLines([]);
    }
  }, [problem, isStepsMode, details]);

  // When Show Answer is triggered, reveal all working lines for margin simplification
  useEffect(() => {
    if (showingAnswer && isStepsMode && details) {
      const fullWorking = [
        `M = ${details.z}\\sqrt{\\frac{${details.pStr} \\times ${details.qStr}}{${details.n}}}`,
        `= ${details.z}\\sqrt{\\frac{${details.p1pStr}}{${details.n}}}`,
        `= ${details.z}\\sqrt{${details.varStr}}`,
        `= ${details.z} \\times ${details.sdStr}`,
        `= ${details.mStr}`
      ];
      setWorkingLines(fullWorking);
      setIsCompletedLocal(true);
      setCurrentStepIndex(4);
      setFeedbackMsg('Correct solution revealed: M = ' + details.mStr);
    }
  }, [showingAnswer, isStepsMode, details]);

  // Auto-focus the input box in simplifying mode
  useEffect(() => {
    if (isStepsMode && !isCompletedLocal && !showingAnswer) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isStepsMode, currentStepIndex, workingLines, isCompletedLocal, showingAnswer]);

  // Keyboard navigation for non-steps multiple choice (keys 1, 2, 3, 4)
  useEffect(() => {
    if (isStepsMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const optIdx = parseInt(e.key, 10) - 1;
        if (problem.options && optIdx < problem.options.length) {
          if (!showingAnswer && !isSuccess && !isError) {
            onAnswer(optIdx.toString());
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStepsMode, problem, showingAnswer, isSuccess, isError, onAnswer]);

  // Handle checking the simplified input in the Answer Box
  const handleCheckLine = (valToTest?: string) => {
    if (!details || isCompletedLocal || showingAnswer) return;

    const val = (valToTest !== undefined ? valToTest : currentInput).trim();
    if (!val) return;

    const targetStep1 = `${details.p1pNum}/${details.p1pDen}`;
    const targetStep2 = `${details.varNum}/${details.varDen}`;
    const targetStep3 = `${details.sdNum}/${details.sdDen}`;
    const targetStep4 = `${details.mNum}/${details.mDen}`;
    const unreducedM = details.unreducedMStr
      ? normalizeFractionInput(details.unreducedMStr)
      : null;

    // Check if user jumped directly to the final simplified margin
    if (matchesFraction(val, targetStep4)) {
      setWorkingLines(prev => [
        ...prev,
        `= ${details.mStr}`
      ]);
      setCurrentInput('');
      setLineError(false);
      setFeedbackMsg('Correct! Fully simplified margin.');
      setIsCompletedLocal(true);
      setCurrentStepIndex(4);
      onAnswer(problem.answer.toString());
      return;
    }

    // Step 0 -> Step 1: Evaluating p*(1-p)
    if (currentStepIndex === 0) {
      if (matchesFraction(val, targetStep1)) {
        setWorkingLines(prev => [
          ...prev,
          `= ${details.z}\\sqrt{\\frac{${details.p1pStr}}{${details.n}}}`
        ]);
        setCurrentInput('');
        setLineError(false);
        setFeedbackMsg(null);
        setCurrentStepIndex(1);
        return;
      }
      // If user jumped ahead to step 2 directly (e.g. 1/100)
      if (matchesFraction(val, targetStep2)) {
        setWorkingLines(prev => [
          ...prev,
          `= ${details.z}\\sqrt{${details.varStr}}`
        ]);
        setCurrentInput('');
        setLineError(false);
        setFeedbackMsg(null);
        setCurrentStepIndex(2);
        return;
      }
    }

    // Step 1 -> Step 2: Divide by n -> p(1-p)/n
    if (currentStepIndex === 1) {
      if (matchesFraction(val, targetStep2)) {
        setWorkingLines(prev => [
          ...prev,
          `= ${details.z}\\sqrt{${details.varStr}}`
        ]);
        setCurrentInput('');
        setLineError(false);
        setFeedbackMsg(null);
        setCurrentStepIndex(2);
        return;
      }
      // If user jumped ahead to step 3 (e.g. 1/10)
      if (matchesFraction(val, targetStep3)) {
        setWorkingLines(prev => [
          ...prev,
          `= ${details.z} \\times ${details.sdStr}`
        ]);
        setCurrentInput('');
        setLineError(false);
        setFeedbackMsg(null);
        setCurrentStepIndex(3);
        return;
      }
    }

    // Step 2 -> Step 3: Square root -> sd(p_hat)
    if (currentStepIndex === 2) {
      if (matchesFraction(val, targetStep3)) {
        setWorkingLines(prev => [
          ...prev,
          `= ${details.z} \\times ${details.sdStr}`
        ]);
        setCurrentInput('');
        setLineError(false);
        setFeedbackMsg(null);
        setCurrentStepIndex(3);
        return;
      }
    }

    // Step 3 -> Step 4: Multiply by z and simplify to lowest terms
    if (currentStepIndex === 3) {
      // Check if user entered unreduced fraction (e.g. 2/10 before 1/5)
      if (unreducedM && matchesFraction(val, unreducedM)) {
        setWorkingLines(prev => [
          ...prev,
          `= ${details.unreducedMStr}`
        ]);
        setCurrentInput('');
        setLineError(false);
        setFeedbackMsg('Good! Now reduce fraction to simplest form.');
        return;
      }

      if (matchesFraction(val, targetStep4)) {
        setWorkingLines(prev => [
          ...prev,
          `= ${details.mStr}`
        ]);
        setCurrentInput('');
        setLineError(false);
        setFeedbackMsg('Correct! Fully simplified margin.');
        setIsCompletedLocal(true);
        setCurrentStepIndex(4);
        onAnswer(problem.answer.toString());
        return;
      }
    }

    // Incorrect input
    setLineError(true);
    let hint = 'Check calculation and enter a fraction, e.g. 1/100';
    if (currentStepIndex === 0) {
      hint = `\\text{Simplify } \\hat{p}(1-\\hat{p}) = ${details.pStr} \\times ${details.qStr}`;
    } else if (currentStepIndex === 1) {
      hint = `\\text{Divide by } ${details.n}\\text{: } \\frac{${details.p1pStr}}{${details.n}} \\text{ and cancel common factors}`;
    } else if (currentStepIndex === 2) {
      hint = `\\text{Evaluate square root: } \\sqrt{${details.varStr}}`;
    } else if (currentStepIndex === 3) {
      hint = `\\text{Multiply } ${details.z} \\times ${details.sdStr} \\text{ and reduce fraction}`;
    }
    setFeedbackMsg(hint);

    setTimeout(() => {
      setLineError(false);
    }, 700);
  };

  const handleKeypadPress = (char: string) => {
    const nextVal = currentInput + char;
    setCurrentInput(nextVal);
    inputRef.current?.focus();
  };

  const handleBackspace = () => {
    setCurrentInput(prev => prev.slice(0, -1));
    inputRef.current?.focus();
  };

  // -------------------------------------------------------------
  // RENDER: Step-by-Step Margin Simplifying with Answer Box Style
  // -------------------------------------------------------------
  if (isStepsMode && details) {
    const stepDescriptions = [
      `\\text{Simplify } \\hat{p}(1-\\hat{p}) = ${details.pStr} \\times ${details.qStr}`,
      `\\text{Divide by } n = ${details.n} \\text{ to simplify } \\frac{\\hat{p}(1-\\hat{p})}{n}`,
      `\\text{Take square root: } \\text{sd}(\\hat{P}) = \\sqrt{${details.varStr}}`,
      `\\text{Multiply by } z = ${details.z} \\text{ to find simplest margin } M`
    ];

    return (
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 space-y-4">
        {/* Question Stem Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm border-2 border-indigo-100 dark:border-indigo-900 text-center">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold !leading-relaxed text-slate-800 dark:text-slate-100 max-w-full">
            <MathText content={problem.question} />
          </div>
        </div>

        {/* Given Parameters Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm border-2 border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-lg sm:text-xl whitespace-nowrap">
            <span className="text-2xl">📐</span>
            <Latex>{`$M = z \\sqrt{\\frac{\\hat{p}(1-\\hat{p})}{n}}$`}</Latex>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold text-base sm:text-lg border border-violet-200 dark:border-violet-800 whitespace-nowrap">
              <Latex>{`$z = ${details.z}$`}</Latex>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-base sm:text-lg border border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
              <Latex>{`$\\hat{p} = ${details.pStr}$`}</Latex>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold text-base sm:text-lg border border-sky-200 dark:border-sky-800 whitespace-nowrap">
              <Latex>{`$1-\\hat{p} = ${details.qStr}$`}</Latex>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-base sm:text-lg border border-blue-200 dark:border-blue-800 whitespace-nowrap">
              <Latex>{`$n = ${details.n}$`}</Latex>
            </span>
          </div>
        </div>

        {/* 4 Step Progress Badges */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: 'p̂(1-p̂)', target: details.p1pStr },
            { label: '÷ n', target: details.varStr },
            { label: '√ sd', target: details.sdStr },
            { label: 'Margin M', target: details.mStr }
          ].map((st, idx) => {
            const isCompleted = idx < currentStepIndex || isCompletedLocal;
            const isCurrent = idx === currentStepIndex && !isCompletedLocal;

            return (
              <div
                key={idx}
                className={`py-2 px-2.5 rounded-2xl text-center text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-1 sm:space-x-2 border-2 ${
                  isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                    : isCurrent
                    ? 'bg-indigo-500 text-white border-indigo-600 shadow-md scale-105'
                    : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                {isCompleted ? <span>✓</span> : <span>{idx + 1}</span>}
                <span className="hidden sm:inline">{st.label}</span>
              </div>
            );
          })}
        </div>

        {/* Working Out Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-7 shadow-md border-2 border-indigo-100 dark:border-indigo-900 flex flex-col items-center">
          <div className="text-xs uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 mb-4">
            Working Out & Simplification
          </div>

          {/* List of Working Lines */}
          <div className="flex flex-col items-center space-y-3 w-full pb-4 border-b-2 border-slate-100 dark:border-slate-700/80">
            {workingLines.map((line, i) => (
              <div
                key={i}
                className={`text-2xl sm:text-4xl font-black max-w-full overflow-x-auto overflow-y-hidden scrollbar-none flex items-center justify-center px-2 py-1 transition-all ${
                  i === 0
                    ? 'text-slate-700 dark:text-slate-200'
                    : i === workingLines.length - 1 && isCompletedLocal
                    ? 'text-emerald-600 dark:text-emerald-400 scale-105'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                <div className="whitespace-nowrap">
                  <Latex>{`$${line}$`}</Latex>
                </div>
              </div>
            ))}
          </div>

          {/* Active Answer Box */}
          {!isCompletedLocal ? (
            <div className="mt-6 flex flex-col items-center w-full max-w-lg space-y-4">
              <div className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300 text-center max-w-full px-2">
                <MathText content={stepDescriptions[Math.min(currentStepIndex, 3)]} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCheckLine();
                }}
                className="flex items-center justify-center gap-3 w-full"
              >
                <span className="text-3xl font-black text-slate-300 dark:text-slate-600">=</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="e.g. 1/100"
                  className={`w-48 sm:w-60 text-center text-2xl sm:text-3xl font-black bg-slate-100 dark:bg-slate-700/80 border-b-4 ${
                    lineError
                      ? 'border-rose-500 text-rose-500 animate-shake'
                      : 'border-indigo-400 text-indigo-600 dark:text-indigo-300'
                  } outline-none rounded-t-xl px-3 py-2 transition-colors shadow-inner`}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-md transition-all shrink-0"
                >
                  Check
                </button>
              </form>

              {/* Feedback / Hint Message */}
              {feedbackMsg && (
                <div
                  className={`text-xs sm:text-sm font-bold text-center px-4 py-2 rounded-xl transition-all max-w-full ${
                    lineError
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200'
                  }`}
                >
                  <MathText content={feedbackMsg} />
                </div>
              )}

              {/* Touch Keypad */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-sm">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '/'].map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => handleKeypadPress(char)}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-slate-800 dark:text-slate-100 font-black text-lg flex items-center justify-center shadow-sm active:scale-90 transition-all"
                  >
                    {char}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="px-3 h-10 sm:h-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-300 font-bold text-sm flex items-center justify-center shadow-sm active:scale-90 transition-all"
                >
                  ⌫
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center space-y-2 animate-fade-in text-center">
              <div className="text-2xl sm:text-3xl font-black text-emerald-500 flex items-center gap-2">
                <span>✓</span> Completed Margin Simplification!
              </div>
              <div className="text-sm font-bold text-slate-400 whitespace-nowrap">
                <Latex>{`$M = ${details.mStr}$`}</Latex>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Multiple Choice Questions (Skills 1-5)
  // Clean question card & responsive options
  // -------------------------------------------------------------
  const hasLongOptions = problem.options?.some(
    (opt: string) => opt.length > 10 || opt.includes('\\sim') || opt.includes('\\text{')
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-8 shadow-md border-2 border-indigo-100 dark:border-indigo-900 text-center">
        <div className="text-lg sm:text-2xl md:text-3xl font-bold !leading-relaxed text-slate-800 dark:text-slate-100 max-w-full">
          <MathText content={problem.question} />
        </div>
      </div>

      {problem.options && (
        <div className={`grid ${hasLongOptions ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'} gap-3 sm:gap-4 w-full`}>
          {problem.options.map((opt: string, idx: number) => {
            const isSelectedAndCorrect =
              (showingAnswer || isSuccess) && idx.toString() === problem.answer.toString();
            const isSelectedAndWrong = isError && !isSuccess;

            return (
              <button
                key={idx}
                onClick={() => !showingAnswer && !isSuccess && !isError && onAnswer(idx.toString())}
                disabled={showingAnswer || isSuccess || isError}
                className={`min-h-[85px] sm:min-h-[105px] text-base sm:text-xl md:text-2xl px-4 py-3 sm:py-4 rounded-3xl border-4 transition-all flex items-center justify-center font-bold tracking-wider shadow-sm active:scale-95 duration-150 ${
                  isSelectedAndCorrect
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-emerald-500/20 scale-102'
                    : isSelectedAndWrong
                    ? 'border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                } ${(showingAnswer || isSuccess) && !isSelectedAndCorrect ? 'opacity-40 grayscale-[0.5]' : ''}`}
              >
                <div className="max-w-full overflow-x-auto overflow-y-hidden scrollbar-none whitespace-nowrap flex items-center justify-center">
                  <MathText content={opt} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SampleProportionsGame;
