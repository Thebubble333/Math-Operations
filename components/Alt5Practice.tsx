import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import katex from 'katex';
import {
  Alt5Question,
  generateAlt5Round,
  ALT5_CATEGORIES,
} from '../utils/alt5Generators';
import { Alt5Graph } from './Alt5Graph';
import { Alt5GraphCard } from './Alt5GraphCard';

interface CategoryMastery {
  total: number;
  correct: number;
}

export const Alt5Practice: React.FC = () => {
  const navigate = useNavigate();

  // Settings
  const [difficultyMode, setDifficultyMode] = useState<'standard' | 'challenging' | 'mixed'>('standard');
  const [quizMode, setQuizMode] = useState<'mc' | 'self_check'>('mc');

  // Quiz round state - initialized synchronously so first render is immediate
  const [questions, setQuestions] = useState<Alt5Question[]>(() => generateAlt5Round('standard'));
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [roundNumber, setRoundNumber] = useState<number>(1);

  // Per-question interactive state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [isSelfCheckAnswered, setIsSelfCheckAnswered] = useState<boolean>(false);

  // Scores
  const [currentRoundAnswers, setCurrentRoundAnswers] = useState<boolean[]>([]);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState<number>(0);
  const [totalQuestionsCorrect, setTotalQuestionsCorrect] = useState<number>(0);
  const [isRoundFinished, setIsRoundFinished] = useState<boolean>(false);

  // Topic mastery tracking
  const [topicMastery, setTopicMastery] = useState<Record<number, CategoryMastery>>({});

  const cardTopRef = useRef<HTMLDivElement>(null);

  // Initialize round
  const startNewRound = (diff = difficultyMode) => {
    const newBatch = generateAlt5Round(diff);
    setQuestions(newBatch);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setIsSelfCheckAnswered(false);
    setCurrentRoundAnswers([]);
    setIsRoundFinished(false);
    cardTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentQ = questions[currentIndex];

  // Helper to render KaTeX safely
  const renderMath = (latex: string, isBlock = false) => {
    try {
      const html = katex.renderToString(latex, {
        displayMode: isBlock,
        throwOnError: false,
      });
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <span>{latex}</span>;
    }
  };

  // Helper to render a single line containing potential $math$ segments or raw LaTeX
  const renderLineSegments = (line: string) => {
    if (!line) return null;

    // 1. If line contains $...$, split by $
    if (line.includes('$')) {
      const parts = line.split('$');
      return (
        <span>
          {parts.map((segment, idx) => {
            if (idx % 2 === 1) {
              return (
                <span key={idx} className="inline-block mx-0.5">
                  {renderMath(segment, false)}
                </span>
              );
            }
            return <span key={idx}>{segment}</span>;
          })}
        </span>
      );
    }

    // 2. If line has plain English words at start followed by math in parens, e.g. "Parallel (m_1 = 4, m_2 = 4)"
    const wordMathMatch = line.match(/^([A-Za-z\s]+)\s*\((.*)\)$/);
    if (wordMathMatch && (/[\\^_{}]/.test(wordMathMatch[2]) || /^[a-z]\s*=/i.test(wordMathMatch[2].trim()))) {
      const [, wordPart, mathPart] = wordMathMatch;
      return (
        <span>
          <span>{wordPart}</span>{' '}
          <span className="inline-block">({renderMath(mathPart, false)})</span>
        </span>
      );
    }

    // 3. If line contains LaTeX commands (\frac, \left, \right, \sqrt, etc.) or syntax (^, _)
    if (/[\\^_{}]/.test(line)) {
      return <span className="inline-block">{renderMath(line, false)}</span>;
    }

    // 4. Mathematical expressions without backslashes (e.g. y = 3x - 15, (4, -3), x = 2, 4)
    const stripped = line.replace(/[0-9xyMd=+\-*/(),.\s]/g, '');
    const isMathExpr = /^[xyMd]\s*=|^\(|^-?\d/.test(line.trim());
    if (isMathExpr && stripped.length === 0) {
      return <span className="inline-block">{renderMath(line, false)}</span>;
    }

    // 5. Regular text (e.g. "Parallel", "Perpendicular", "Neither", prompt instructions)
    return <span>{line}</span>;
  };

  // Helper to render multiline prompts and mixed math
  const renderMixedText = (text: string) => {
    if (!text) return <span></span>;

    // Split on \newline or standard \n
    const lines = text.split(/\\newline|\n/);

    if (lines.length > 1) {
      return (
        <div className="space-y-2">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return null;
            // Highlight equation lines such as "(1) $...$", "(2) $...$", "$L_1:...$"
            const isEquationLine = /^\(\d+\)/.test(trimmed) || /^\(?[a-z]\)/i.test(trimmed) || /^L_\d:/.test(trimmed);
            return (
              <div
                key={lIdx}
                className={isEquationLine ? 'block my-1.5' : ''}
              >
                {isEquationLine ? (
                  <span className="inline-flex items-center px-3 py-1 font-mono text-base bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    {renderLineSegments(trimmed)}
                  </span>
                ) : (
                  <span>{renderLineSegments(trimmed)}</span>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return renderLineSegments(text);
  };

  // Multiple Choice Selection Handler
  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null || isAnswerRevealed) return;
    setSelectedOption(idx);
    setIsAnswerRevealed(true);

    const isCorrect = idx === currentQ.correctOptionIndex;
    recordAnswer(isCorrect);
  };

  // Self Check Handler
  const handleSelfGrade = (gotIt: boolean) => {
    if (isSelfCheckAnswered) return;
    setIsSelfCheckAnswered(true);
    recordAnswer(gotIt);
  };

  const recordAnswer = (isCorrect: boolean) => {
    setCurrentRoundAnswers(prev => [...prev, isCorrect]);
    setTotalQuestionsAnswered(prev => prev + 1);
    if (isCorrect) {
      setTotalQuestionsCorrect(prev => prev + 1);
    }

    // Update topic mastery
    setTopicMastery(prev => {
      const catId = currentQ.categoryId;
      const current = prev[catId] || { total: 0, correct: 0 };
      return {
        ...prev,
        [catId]: {
          total: current.total + 1,
          correct: current.correct + (isCorrect ? 1 : 0),
        },
      };
    });
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
      setIsSelfCheckAnswered(false);
      cardTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setIsRoundFinished(true);
    }
  };

  // Keyboard shortcut: Space / Enter advances when answer revealed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((isAnswerRevealed || isSelfCheckAnswered) && !isRoundFinished) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
          // If not typing in an input
          const target = e.target as HTMLElement;
          if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            handleNext();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswerRevealed, isSelfCheckAnswered, isRoundFinished, currentIndex, questions.length]);

  // Section Score
  const currentRoundScore = currentRoundAnswers.filter(Boolean).length;
  const runningAccuracy = totalQuestionsAnswered > 0
    ? Math.round((totalQuestionsCorrect / totalQuestionsAnswered) * 100)
    : 0;

  // Standalone HTML Download Trigger
  const handleDownloadStandalone = () => {
    const a = document.createElement('a');
    a.href = '/alt5-practice.html';
    a.download = 'ALT5_Practice_Single_File.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 sm:p-6 transition-colors">
      <div className="max-w-4xl mx-auto space-y-4" ref={cardTopRef}>
        {/* Simplified, Uncluttered Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/8seal')}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold transition flex items-center gap-1.5 text-xs"
              title="Return to 8 SEAL Menu"
            >
              <span>←</span>
              <span>8 SEAL</span>
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 tracking-tight leading-none">
                ALT 5 Practice
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Linear & Quadratic Graphs
              </p>
            </div>
          </div>

          {/* Right Controls: Difficulty + Mode + Stats + Download */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold ml-auto">
            {/* Difficulty */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              {(['standard', 'challenging', 'mixed'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => {
                    setDifficultyMode(diff);
                    startNewRound(diff);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    difficultyMode === diff
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {diff === 'standard' ? 'Standard' : diff === 'challenging' ? 'Challenging' : 'Mixed'}
                </button>
              ))}
            </div>

            {/* Mode toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setQuizMode('mc')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  quizMode === 'mc'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-500'
                }`}
              >
                MC
              </button>
              <button
                onClick={() => setQuizMode('self_check')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  quizMode === 'self_check'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-500'
                }`}
              >
                Paper
              </button>
            </div>

            {/* Live Stats Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-400">Score:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{currentRoundScore}/{currentRoundAnswers.length}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{runningAccuracy}%</span>
            </div>

            {/* Export Standalone */}
            <button
              onClick={handleDownloadStandalone}
              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition"
              title="Download Standalone Single-File HTML"
            >
              📥
            </button>
          </div>
        </div>

        {/* Slim Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + (isAnswerRevealed || isSelfCheckAnswered ? 1 : 0)) / (questions.length || 15)) * 100}%` }}
          />
        </div>

        {/* Main Quiz Card or Finished Scorecard */}
        {!isRoundFinished && currentQ ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
            {/* Category Badge & Top Next Question Button */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0">
                  #{currentQ.categoryId}
                </span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200 text-sm truncate">
                  {currentQ.categoryTitle}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                  currentQ.difficulty === 'standard'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                }`}>
                  {currentQ.difficulty}
                </span>
              </div>

              {/* TOP NEXT QUESTION BUTTON */}
              {(isAnswerRevealed || isSelfCheckAnswered) ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-1.5 animate-pulse shrink-0"
                >
                  <span>{currentIndex + 1 < questions.length ? 'Next Question →' : 'View Scorecard 🏆'}</span>
                </button>
              ) : (
                <div className="text-xs font-bold text-slate-400 shrink-0">
                  Q{currentIndex + 1} of {questions.length}
                </div>
              )}
            </div>

            {/* Question Prompt */}
            <div className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 leading-relaxed py-1">
              {renderMixedText(currentQ.promptLatex)}
            </div>

            {/* Table of Values if present (Type 8) */}
            {currentQ.tableData && (
              <div className="my-4 overflow-x-auto">
                <table className="min-w-[280px] mx-auto border-collapse border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden text-center text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 font-bold">
                      <th className="border border-slate-300 dark:border-slate-700 px-3 py-1.5">x</th>
                      {currentQ.tableData.map(d => (
                        <th key={`head-${d.x}`} className="border border-slate-300 dark:border-slate-700 px-3 py-1.5">
                          {d.x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-bold bg-slate-50 dark:bg-slate-800/50">y</td>
                      {currentQ.tableData.map(d => (
                        <td key={`val-${d.x}`} className="border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-mono">
                          {isAnswerRevealed || isSelfCheckAnswered ? d.y : '?'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* MULTIPLE CHOICE MODE */}
            {quizMode === 'mc' && (
              <div className="space-y-4 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {currentQ.graphOptions ? 'Select the correct graph from the 4 options below:' : 'Select the correct mathematical answer:'}
                </div>

                {/* GRAPH OPTIONS GRID (for Sketching Linear & Quadratic Graphs) */}
                {currentQ.graphOptions && currentQ.graphOptions.length === 4 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                    {currentQ.graphOptions.map((gOpt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrectOpt = isAnswerRevealed && idx === currentQ.correctOptionIndex;
                      const isErrorOpt = isAnswerRevealed && isSelected && idx !== currentQ.correctOptionIndex;

                      return (
                        <Alt5GraphCard
                          key={idx}
                          graphData={gOpt}
                          label={String.fromCharCode(65 + idx)}
                          onClick={() => handleSelectOption(idx)}
                          selected={isSelected}
                          isCorrect={isCorrectOpt}
                          isError={isErrorOpt}
                          disabled={isAnswerRevealed}
                        />
                      );
                    })}
                  </div>
                ) : (
                  /* STANDARD TEXT MULTIPLE CHOICE OPTIONS */
                  <div className="grid grid-cols-1 gap-3">
                    {currentQ.options.map((opt, idx) => {
                      let btnStyle = 'bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border-slate-200 dark:border-slate-700';

                      if (isAnswerRevealed) {
                        if (idx === currentQ.correctOptionIndex) {
                          btnStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30';
                        } else if (idx === selectedOption) {
                          btnStyle = 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30';
                        } else {
                          btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isAnswerRevealed}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-sm sm:text-base ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center shrink-0">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="font-medium overflow-x-auto py-1">
                              {renderMixedText(opt)}
                            </span>
                          </div>
                          {isAnswerRevealed && idx === currentQ.correctOptionIndex && (
                            <span className="text-emerald-500 font-black text-lg">✓</span>
                          )}
                          {isAnswerRevealed && idx === selectedOption && idx !== currentQ.correctOptionIndex && (
                            <span className="text-rose-500 font-black text-lg">✗</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SELF-CHECK CARD MODE */}
            {quizMode === 'self_check' && (
              <div className="pt-2 space-y-4">
                {!isAnswerRevealed ? (
                  <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Solve this problem completely on paper or your workbook first.
                    </p>
                    <button
                      onClick={() => setIsAnswerRevealed(true)}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-md transition"
                    >
                      Check Answer & View Worked Solution
                    </button>
                  </div>
                ) : (
                  !isSelfCheckAnswered && (
                    <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-center space-y-3">
                      <div className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                        Self-Grade Your Working:
                      </div>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleSelfGrade(true)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow active:scale-95"
                        >
                          Got It! (+1)
                        </button>
                        <button
                          onClick={() => handleSelfGrade(false)}
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow active:scale-95"
                        >
                          Need Practice
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* WORKED SOLUTION & INTERACTIVE GRAPH VIEW */}
            {isAnswerRevealed && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    Step-by-Step Worked Solution
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm space-y-2 overflow-x-auto text-slate-800 dark:text-slate-200 leading-relaxed">
                  {currentQ.workedSolutionLatex.map((line, i) => (
                    <div key={i} className="py-1">
                      {renderMath(line, false)}
                    </div>
                  ))}
                </div>

                {/* SVG Graph for Types 1, 8, 9 */}
                {currentQ.graphData && (
                  <div className="pt-2">
                    <Alt5Graph graphData={currentQ.graphData} />
                  </div>
                )}

                {/* Next Question Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleNext}
                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg transition flex items-center gap-2"
                  >
                    <span>{currentIndex + 1 < questions.length ? 'Next Question →' : 'View Section Scorecard 🏆'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SECTION SCORECARD SCREEN */
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-4xl flex items-center justify-center rounded-3xl mx-auto shadow-inner">
              🏆
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                Section #{roundNumber} Completed!
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                Round Score: <strong className="text-indigo-600 dark:text-indigo-400 font-black text-lg">{currentRoundScore} / 15</strong> ({Math.round((currentRoundScore / 15) * 100)}%)
              </p>
            </div>

            {/* Running Lifetime Totals */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-400 uppercase">Total Solved</div>
                <div className="text-xl font-black text-slate-800 dark:text-slate-100">{totalQuestionsAnswered}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-400 uppercase">Total Correct</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{totalQuestionsCorrect}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
                <div className="text-xs font-bold text-slate-400 uppercase">Overall Accuracy</div>
                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{runningAccuracy}%</div>
              </div>
            </div>

            {/* Topic Breakdown of Strengths / Weaknesses across the 13 categories */}
            <div className="text-left space-y-3 max-w-2xl mx-auto">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
                Category Mastery Breakdown:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {ALT5_CATEGORIES.map(cat => {
                  const data = topicMastery[cat.id];
                  const hasAttempted = data && data.total > 0;
                  const pct = hasAttempted ? Math.round((data.correct / data.total) * 100) : 0;
                  const isMastered = hasAttempted && pct >= 75;

                  return (
                    <div
                      key={cat.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="font-bold text-slate-700 dark:text-slate-300 truncate pr-2">
                        {cat.id}. {cat.title}
                      </div>
                      <div className="shrink-0 font-black">
                        {hasAttempted ? (
                          <span className={isMastered ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}>
                            {data.correct}/{data.total} ({pct}%)
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Unseen</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button
                onClick={() => {
                  setRoundNumber(prev => prev + 1);
                  startNewRound(difficultyMode);
                }}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg transition active:scale-95"
              >
                Start Next Section (15 New Questions) 🔄
              </button>
              <button
                onClick={() => navigate('/8seal')}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm uppercase tracking-wider rounded-2xl transition"
              >
                Back to 8 SEAL Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alt5Practice;
