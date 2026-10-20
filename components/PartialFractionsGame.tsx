import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import katex from 'katex';
import {
  PARTIAL_FRACTIONS_PROBLEMS,
  PartialFractionProblem,
  UserFractionTerm,
  validateDenominatorFactorisation,
  getProblemFactors,
  checkEquivalence,
} from '../utils/partialFractionsLogic';

function renderLatex(tex: string, displayMode = false): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return tex;
  }
}

const PartialFractionsGame: React.FC = () => {
  const navigate = useNavigate();

  // Problem management: All partial fractions problems combined on one page
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentProblem: PartialFractionProblem = PARTIAL_FRACTIONS_PROBLEMS[currentIndex];

  // Step 1 State: Factorising the denominator
  // Automatically starts with an open bracket '('
  const [step1Input, setStep1Input] = useState<string>('(');
  const [step1Completed, setStep1Completed] = useState<boolean>(false);
  const [step1Error, setStep1Error] = useState<boolean>(false);

  // Step 2 State: Fraction decomposition builder
  const [fractions, setFractions] = useState<UserFractionTerm[]>([]);
  const [step2Completed, setStep2Completed] = useState<boolean>(false);

  // Input refs
  const step1InputRef = useRef<HTMLInputElement>(null);
  const denominatorRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastActiveTargetRef = useRef<{
    type: 'step1' | 'denominator' | 'numerator';
    index?: number;
  }>({ type: 'step1' });

  // Load problem setup
  const loadProblem = (index: number) => {
    const prob = PARTIAL_FRACTIONS_PROBLEMS[index];
    setCurrentIndex(index);
    setStep1Input('(');
    setStep1Completed(false);
    setStep1Error(false);

    // Initialise Step 2 fractions with default suggested numerators and blank denominators
    const initialFractions: UserFractionTerm[] = prob.expectedTerms.map((t, idx) => ({
      id: `${Date.now()}-${idx}`,
      numerator: t.suggestedNumerator || String.fromCharCode(65 + idx),
      denominator: '',
    }));
    setFractions(initialFractions);
    setStep2Completed(false);
  };

  // Initial load
  useEffect(() => {
    loadProblem(0);
  }, []);

  const handleNextProblem = () => {
    const nextIdx = (currentIndex + 1) % PARTIAL_FRACTIONS_PROBLEMS.length;
    loadProblem(nextIdx);
  };

  const handlePrevProblem = () => {
    const prevIdx =
      (currentIndex - 1 + PARTIAL_FRACTIONS_PROBLEMS.length) % PARTIAL_FRACTIONS_PROBLEMS.length;
    loadProblem(prevIdx);
  };

  const handleResetProblem = () => {
    loadProblem(currentIndex);
  };

  // Auto-focus management:
  // Step 1: focus input and place cursor right after '('
  // Step 2: as soon as Step 1 completes, automatically focus the first denominator!
  useEffect(() => {
    if (!step1Completed) {
      const timer = setTimeout(() => {
        if (step1InputRef.current) {
          step1InputRef.current.focus();
          const len = step1InputRef.current.value.length;
          step1InputRef.current.setSelectionRange(len, len);
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        if (denominatorRefs.current[0]) {
          denominatorRefs.current[0]?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [step1Completed, currentIndex]);

  // Automatic Bracket Automation for Step 1:
  // 1. Initial open bracket '(' is placed.
  // 2. As soon as student types any valid first factor (e.g. 'x - 3'),
  //    it automatically inserts ')(', producing '(x - 3)(' with cursor right inside.
  // 3. As soon as student finishes typing the second factor, it closes ')'.
  const processBracketAutomation = (
    rawVal: string,
    isBackspacing: boolean
  ): { formatted: string; cursorOffset?: number } => {
    if (isBackspacing) {
      if (rawVal === '') return { formatted: '(' };
      return { formatted: rawVal };
    }

    let formatted = rawVal.trimStart();
    if (!formatted.startsWith('(')) {
      formatted = '(' + formatted;
    }

    const factorOptions = getProblemFactors(currentProblem);
    const normOptions = factorOptions.map(f => f.replace(/\s+/g, '').toLowerCase());

    // 1. User typing inside the first bracket: e.g. "(x - 3"
    const firstMatch = formatted.match(/^\(([^)]+)\)?$/);
    if (firstMatch) {
      const content = firstMatch[1];
      const normContent = content.replace(/\s+/g, '').toLowerCase();

      const isMatch = normOptions.includes(normContent);
      const hasLongerAlt = normOptions.some(opt => opt !== normContent && opt.startsWith(normContent));
      const userTypedClose = rawVal.endsWith(')');

      if (isMatch && (!hasLongerAlt || userTypedClose)) {
        const nextVal = `(${content})(`;
        return { formatted: nextVal, cursorOffset: nextVal.length };
      }
    }

    // 2. User explicitly typed '(' after factor, e.g. "(x - 3("
    const openAfterFirst = formatted.match(/^\(([^)]+)\($/);
    if (openAfterFirst) {
      const content = openAfterFirst[1];
      const normContent = content.replace(/\s+/g, '').toLowerCase();
      if (normOptions.includes(normContent)) {
        const nextVal = `(${content})(`;
        return { formatted: nextVal, cursorOffset: nextVal.length };
      }
    }

    // 3. User typing inside the second bracket: e.g. "(x - 3)(x + 2"
    const secondMatch = formatted.match(/^\(([^)]+)\)\(([^)]+)\)?$/);
    if (secondMatch) {
      const f1 = secondMatch[1];
      const f2 = secondMatch[2];
      const normF1 = f1.replace(/\s+/g, '').toLowerCase();
      const normF2 = f2.replace(/\s+/g, '').toLowerCase();

      const remaining = normOptions.filter(opt => opt !== normF1);
      const isSecondMatch =
        remaining.includes(normF2) || (remaining.length === 0 && normOptions.includes(normF2));
      const hasLongerAlt = remaining.some(opt => opt !== normF2 && opt.startsWith(normF2));
      const userTypedClose = rawVal.endsWith(')');

      if (isSecondMatch && (!hasLongerAlt || userTypedClose)) {
        const nextVal = `(${f1})(${f2})`;
        return { formatted: nextVal, cursorOffset: nextVal.length };
      }
    }

    // 4. Case with 3 factors:
    const thirdMatch = formatted.match(/^\(([^)]+)\)\(([^)]+)\)\(([^)]+)\)?$/);
    if (thirdMatch) {
      const f1 = thirdMatch[1];
      const f2 = thirdMatch[2];
      const f3 = thirdMatch[3];
      const normF3 = f3.replace(/\s+/g, '').toLowerCase();
      if (normOptions.includes(normF3)) {
        const nextVal = `(${f1})(${f2})(${f3})`;
        return { formatted: nextVal, cursorOffset: nextVal.length };
      }
    }

    return { formatted };
  };

  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawVal = e.target.value.replace(/²/g, '^2');
    setStep1Error(false);

    // If typing ^ or ^2 right after bracket automation placed ")("
    if (rawVal.endsWith(')(^') || rawVal.endsWith(')(^2')) {
      rawVal = rawVal.replace(/\)\(\^/, ')^');
    }

    const isBackspacing = rawVal.length < step1Input.length;
    const { formatted, cursorOffset } = processBracketAutomation(rawVal, isBackspacing);
    setStep1Input(formatted);

    if (cursorOffset !== undefined) {
      requestAnimationFrame(() => {
        if (step1InputRef.current) {
          step1InputRef.current.setSelectionRange(cursorOffset, cursorOffset);
        }
      });
    }

    // Auto-advance to Step 2 if factorisation is valid!
    const res = validateDenominatorFactorisation(formatted, currentProblem);
    if (res.isValid) {
      setTimeout(() => {
        setStep1Completed(true);
      }, 300);
    }
  };

  const handleStep1KeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const res = validateDenominatorFactorisation(step1Input, currentProblem);
      if (res.isValid) {
        setStep1Completed(true);
        setStep1Error(false);
      } else {
        setStep1Error(true);
        setTimeout(() => setStep1Error(false), 800);
      }
    }
  };

  // Step 2: Compute which expected denominator matches each fraction
  const matchedIndices = useMemo(() => {
    const claimed = new Set<number>();
    const mapping: Record<number, number> = {};

    fractions.forEach((f, idx) => {
      const den = f.denominator.trim();
      if (!den) return;
      for (let j = 0; j < currentProblem.expectedTerms.length; j++) {
        if (claimed.has(j)) continue;
        if (checkEquivalence(den, currentProblem.expectedTerms[j].canonicalDenominator)) {
          claimed.add(j);
          mapping[idx] = j;
          break;
        }
      }
    });

    return mapping;
  }, [fractions, currentProblem]);

  // Handle denominator change in Step 2:
  // "Ideally once the user has typed a correct denominator in it will move on to the next denominator."
  const handleDenominatorChange = (idx: number, val: string) => {
    const normalizedVal = val.replace(/²/g, '^2');
    const updated = fractions.map((f, i) => (i === idx ? { ...f, denominator: normalizedVal } : f));
    setFractions(updated);

    // Check which expected denominators are claimed by other fractions
    const claimedByOthers = new Set<number>();
    updated.forEach((f, i) => {
      if (i !== idx && f.denominator.trim()) {
        for (let j = 0; j < currentProblem.expectedTerms.length; j++) {
          if (
            !claimedByOthers.has(j) &&
            checkEquivalence(f.denominator.trim(), currentProblem.expectedTerms[j].canonicalDenominator)
          ) {
            claimedByOthers.add(j);
            break;
          }
        }
      }
    });

    const trimmed = val.trim();
    if (trimmed) {
      let matchedThis = false;
      for (let j = 0; j < currentProblem.expectedTerms.length; j++) {
        if (
          !claimedByOthers.has(j) &&
          checkEquivalence(trimmed, currentProblem.expectedTerms[j].canonicalDenominator)
        ) {
          matchedThis = true;
          break;
        }
      }

      if (matchedThis) {
        // User typed a correct denominator! Move to next denominator input immediately
        if (idx + 1 < fractions.length) {
          setTimeout(() => {
            denominatorRefs.current[idx + 1]?.focus();
          }, 40);
        }
      }
    }

    // Check if ALL expected denominators are matched and counts match
    const totalExpected = currentProblem.expectedTerms.length;
    const allClaimed = new Set<number>();
    updated.forEach(f => {
      const den = f.denominator.trim();
      if (!den) return;
      for (let j = 0; j < totalExpected; j++) {
        if (
          !allClaimed.has(j) &&
          checkEquivalence(den, currentProblem.expectedTerms[j].canonicalDenominator)
        ) {
          allClaimed.add(j);
          break;
        }
      }
    });

    if (allClaimed.size === totalExpected && updated.length === totalExpected) {
      setStep2Completed(true);
    } else {
      setStep2Completed(false);
    }
  };

  const handleAddFraction = () => {
    const nextChar = String.fromCharCode(65 + fractions.length);
    setFractions(prev => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, numerator: nextChar, denominator: '' },
    ]);
  };

  const handleDeleteFraction = (id: string) => {
    if (fractions.length <= 1) return;
    setFractions(prev => prev.filter(f => f.id !== id));
  };

  // Button that adds a power of 2 (^2) to the active input
  const insertPowerOfTwo = () => {
    if (!step1Completed) {
      const inputEl = step1InputRef.current;
      let cur = step1Input;

      // If bracket automation left a trailing open bracket e.g. "(x - 1)("
      if (cur.endsWith(')(')) {
        const nextVal = cur.slice(0, -1) + '^2';
        setStep1Input(nextVal);
        const res = validateDenominatorFactorisation(nextVal, currentProblem);
        if (res.isValid) {
          setTimeout(() => setStep1Completed(true), 300);
        }
        requestAnimationFrame(() => {
          inputEl?.focus();
          const pos = nextVal.length;
          inputEl?.setSelectionRange(pos, pos);
        });
        return;
      }

      const start = inputEl?.selectionStart ?? cur.length;
      const end = inputEl?.selectionEnd ?? cur.length;
      const before = cur.slice(0, start);
      const after = cur.slice(end);
      const nextVal = before + '^2' + after;

      setStep1Input(nextVal);
      setStep1Error(false);

      const res = validateDenominatorFactorisation(nextVal, currentProblem);
      if (res.isValid) {
        setTimeout(() => setStep1Completed(true), 300);
      }

      requestAnimationFrame(() => {
        inputEl?.focus();
        const pos = start + 2;
        inputEl?.setSelectionRange(pos, pos);
      });
    } else {
      let targetIdx = 0;
      if (
        lastActiveTargetRef.current.type === 'denominator' &&
        lastActiveTargetRef.current.index !== undefined &&
        lastActiveTargetRef.current.index < fractions.length
      ) {
        targetIdx = lastActiveTargetRef.current.index;
      } else {
        const firstUnmatched = fractions.findIndex((_, i) => matchedIndices[i] === undefined);
        targetIdx = firstUnmatched !== -1 ? firstUnmatched : 0;
      }

      const inputEl = denominatorRefs.current[targetIdx];
      const curDen = fractions[targetIdx]?.denominator || '';

      const start = inputEl?.selectionStart ?? curDen.length;
      const end = inputEl?.selectionEnd ?? curDen.length;
      const before = curDen.slice(0, start);
      const after = curDen.slice(end);
      const nextDen = before + '^2' + after;

      handleDenominatorChange(targetIdx, nextDen);

      requestAnimationFrame(() => {
        inputEl?.focus();
        const pos = start + 2;
        inputEl?.setSelectionRange(pos, pos);
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col p-6 sm:p-8 items-center font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header: Back button, Title, Navigation */}
      <div className="w-full max-w-5xl flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/11spec')}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold transition-colors flex items-center gap-1 text-sm sm:text-base"
          >
            ← Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-white">
            Partial Fractions
          </h1>
        </div>

        {/* Minimal Problem Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          <select
            value={currentIndex}
            onChange={e => loadProblem(Number(e.target.value))}
            className="px-3 py-1.5 text-xs sm:text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {PARTIAL_FRACTIONS_PROBLEMS.map((prob, idx) => (
              <option key={prob.id} value={idx}>
                Problem {idx + 1}: {prob.denominatorUnfactoredText}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden text-xs sm:text-sm font-bold">
            <button
              onClick={handlePrevProblem}
              disabled={currentIndex === 0}
              className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Problem"
            >
              ←
            </button>
            <span className="px-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {currentIndex + 1} / {PARTIAL_FRACTIONS_PROBLEMS.length}
            </span>
            <button
              onClick={handleNextProblem}
              disabled={currentIndex === PARTIAL_FRACTIONS_PROBLEMS.length - 1}
              className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Problem"
            >
              →
            </button>
          </div>

          <button
            onClick={handleResetProblem}
            className="px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
            title="Reset current problem"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Workspace Card: Minimal, centered, distraction-free */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-10 rounded-2xl shadow-xl flex flex-col items-center justify-center w-full max-w-5xl border border-slate-200 dark:border-slate-700 min-h-[380px] relative">
        {/* STEP 1: Just original expression with space to write factorised denominator to the right */}
        {!step1Completed && (
          <div className="flex flex-col items-center justify-center w-full py-6">
            <div className="text-xs uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-8">
              Step 1: Factorise the Denominator
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-2xl sm:text-3xl font-serif">
              {/* Original expression on the left */}
              <div
                className="text-slate-900 dark:text-slate-100"
                dangerouslySetInnerHTML={{
                  __html: renderLatex(
                    `\\frac{${currentProblem.numeratorLatex}}{${currentProblem.denominatorUnfactoredLatex}}`,
                    true
                  ),
                }}
              />

              <div className="text-3xl sm:text-4xl font-light text-slate-400 dark:text-slate-500 select-none">
                =
              </div>

              {/* Space to write factorised denominator on the right */}
              <div className="inline-flex flex-col items-center">
                {/* Numerator */}
                <div
                  className="text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 pb-1"
                  dangerouslySetInnerHTML={{
                    __html: renderLatex(currentProblem.numeratorLatex, true),
                  }}
                />

                {/* Fraction Bar */}
                <div className="w-full min-w-[200px] h-[2px] bg-slate-800 dark:bg-slate-200 my-1" />

                {/* Denominator Input + Power of 2 Button */}
                <div className="pt-1 w-full flex items-center justify-center gap-2">
                  <input
                    ref={step1InputRef}
                    type="text"
                    value={step1Input}
                    onChange={handleStep1Change}
                    onKeyDown={handleStep1KeyDown}
                    onFocus={() => {
                      lastActiveTargetRef.current = { type: 'step1' };
                    }}
                    placeholder="(x - a)(x - b)"
                    className={`w-full max-w-sm text-center px-4 py-2 font-mono text-xl sm:text-2xl font-bold rounded-xl border-2 transition-all focus:outline-none ${
                      step1Error
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 animate-shake'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm'
                    }`}
                  />
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={insertPowerOfTwo}
                    title="Add power of 2 (^2)"
                    className="h-12 px-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-all flex items-center justify-center shadow-sm active:scale-95 shrink-0 group select-none cursor-pointer"
                  >
                    <span className="font-mono text-lg font-bold group-hover:scale-110 transition-transform">^2</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Factorised form of f(x) on the left with spaces to write denominators on the right */}
        {step1Completed && (
          <div className="flex flex-col items-center justify-center w-full py-6">
            <div className="flex items-center gap-3 text-xs uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-8">
              <span>Step 2: Partial Fractions Decomposition</span>
              <button
                onClick={() => setStep1Completed(false)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline normal-case font-medium flex items-center gap-1"
              >
                ↺ Edit factorisation
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-7 text-2xl sm:text-3xl font-serif">
              {/* Factorised form of f(x) on the left */}
              <div
                className="text-slate-900 dark:text-slate-100"
                dangerouslySetInnerHTML={{
                  __html: renderLatex(
                    `\\frac{${currentProblem.numeratorLatex}}{${currentProblem.denominatorFactoredLatex}}`,
                    true
                  ),
                }}
              />

              <div className="text-3xl sm:text-4xl font-light text-slate-400 dark:text-slate-500 select-none">
                =
              </div>

              {/* Spaces to write denominators on the right */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {fractions.map((f, idx) => {
                  const isMatched = matchedIndices[idx] !== undefined;
                  return (
                    <React.Fragment key={f.id}>
                      {idx > 0 && (
                        <span className="text-2xl text-slate-400 font-bold select-none">+</span>
                      )}

                      <div className="inline-flex flex-col items-center relative group min-w-[130px] sm:min-w-[150px]">
                        {/* Numerator (editable, defaults to A, B, Bx+C etc.) */}
                        <input
                          type="text"
                          value={f.numerator}
                          onChange={e => {
                            const updated = fractions.map((frac, i) =>
                              i === idx ? { ...frac, numerator: e.target.value } : frac
                            );
                            setFractions(updated);
                          }}
                          onFocus={() => {
                            lastActiveTargetRef.current = { type: 'numerator', index: idx };
                          }}
                          className="w-24 text-center px-2 py-1 font-mono text-lg sm:text-xl font-bold bg-transparent text-indigo-600 dark:text-indigo-400 border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:outline-none"
                        />

                        {/* Fraction Bar */}
                        <div className="w-full h-[2px] bg-slate-800 dark:bg-slate-200 my-1.5" />

                        {/* Denominator Input */}
                        <input
                          ref={el => {
                            denominatorRefs.current[idx] = el;
                          }}
                          type="text"
                          value={f.denominator}
                          onChange={e => handleDenominatorChange(idx, e.target.value)}
                          onFocus={() => {
                            lastActiveTargetRef.current = { type: 'denominator', index: idx };
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              if (idx < fractions.length - 1) {
                                denominatorRefs.current[idx + 1]?.focus();
                              } else if (step2Completed) {
                                handleNextProblem();
                              }
                            }
                          }}
                          placeholder="denominator"
                          className={`w-full text-center px-3 py-2 font-mono text-lg sm:text-xl font-bold rounded-xl border-2 transition-all focus:outline-none ${
                            isMatched
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm'
                          }`}
                        />

                        {/* Delete button (if > 1 fraction) */}
                        {fractions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteFraction(f.id)}
                            title="Remove fraction"
                            className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-rose-500 hover:text-white flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* Actions: Add Blank Fraction & Add Power of 2 */}
                <div className="flex items-center gap-1.5 self-center ml-1">
                  <button
                    type="button"
                    onClick={handleAddFraction}
                    title="Add blank fraction"
                    className="w-9 h-9 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center font-bold text-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={insertPowerOfTwo}
                    title="Add power of 2 (^2)"
                    className="h-9 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-all flex items-center justify-center shadow-sm active:scale-95 font-mono text-sm group select-none cursor-pointer"
                  >
                    <span className="group-hover:scale-110 transition-transform font-bold">^2</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 Completion Banner & Next button */}
            {step2Completed && (
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base flex items-center gap-1.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Decomposition Complete!
                </span>
                <button
                  onClick={handleNextProblem}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl shadow-md transition-all active:scale-95 text-sm"
                >
                  Next Problem →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartialFractionsGame;
