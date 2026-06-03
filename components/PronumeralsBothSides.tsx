import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import katex from 'katex';
import { motion, AnimatePresence } from 'motion/react';
import { evaluate } from 'mathjs';

// Convert a floating point number to a LaTeX fraction if necessary
function floatToFraction(val: number, tolerance = 1e-4): { num: number, den: number } {
  if (Math.abs(val - Math.round(val)) < tolerance) {
    return { num: Math.round(val), den: 1 };
  }
  for (let den = 2; den <= 20; den++) {
    const num = Math.round(val * den);
    if (Math.abs(val - num / den) < tolerance) {
      return { num, den };
    }
  }
  return { num: Math.round(val * 100), den: 100 };
}

function formatValue(val: number): string {
  if (Math.abs(val - Math.round(val)) < 1e-4) {
    return Math.round(val).toString();
  }
  const frac = floatToFraction(val);
  if (frac.den === 1) {
    return frac.num.toString();
  }
  if (frac.num < 0) {
    return `-\\frac{${Math.abs(frac.num)}}{${frac.den}}`;
  }
  return `\\frac{${frac.num}}{${frac.den}}`;
}

function formatExpression(coeff: number, constant: number): string {
  if (coeff === 0 && constant === 0) return "0";
  
  let termX = "";
  if (coeff !== 0) {
    if (coeff === 1) {
      termX = "x";
    } else if (coeff === -1) {
      termX = "-x";
    } else {
      termX = `${formatValue(coeff)}x`;
    }
  }
  
  let termConst = "";
  if (constant !== 0) {
    if (constant > 0) {
      termConst = coeff !== 0 ? ` + ${formatValue(constant)}` : formatValue(constant);
    } else {
      termConst = coeff !== 0 ? ` - ${formatValue(Math.abs(constant))}` : formatValue(constant);
    }
  }
  
  return `${termX}${termConst}`;
}

interface WorkingLine {
  lhsText: string;     // Raw LaTeX
  rhsText: string;     // Raw LaTeX
  lhsCoeff: number;
  lhsConst: number;
  rhsCoeff: number;
  rhsConst: number;
  comment: string;     // Explanation card
}

interface EquationProblem {
  initialLhsText: string;
  initialRhsText: string;
  lhsCoeff: number;
  lhsConst: number;
  rhsCoeff: number;
  rhsConst: number;
  
  // Bracket info
  hasLhsBracket: boolean;
  lhsMult?: number;
  lhsBracCoeff?: number;
  lhsBracConst?: number;

  hasRhsBracket: boolean;
  rhsMult?: number;
  rhsBracCoeff?: number;
  rhsBracConst?: number;

  trueX: number;
}

const PronumeralsBothSides: React.FC = () => {
  const navigate = useNavigate();
  
  const [level, setLevel] = useState<1 | 2>(1);
  const [problemIndex, setProblemIndex] = useState<number>(1);
  const [totalProblems] = useState<number>(5);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  
  const [problem, setProblem] = useState<EquationProblem | null>(null);
  
  // Game states
  const [workingLines, setWorkingLines] = useState<WorkingLine[]>([]);
  const [currentLhsCoeff, setCurrentLhsCoeff] = useState<number>(0);
  const [currentLhsConst, setCurrentLhsConst] = useState<number>(0);
  const [currentRhsCoeff, setCurrentRhsCoeff] = useState<number>(0);
  const [currentRhsConst, setCurrentRhsConst] = useState<number>(0);
  const [hasLhsBracket, setHasLhsBracket] = useState<boolean>(false);
  const [hasRhsBracket, setHasRhsBracket] = useState<boolean>(false);

  const [customInputLine, setCustomInputLine] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDone, setIsDone] = useState<boolean>(false);

  // Hint and Assistance state
  const [isHintRevealed, setIsHintRevealed] = useState<boolean>(false);
  const [assistedThisProblem, setAssistedThisProblem] = useState<boolean>(false);

  const historyEndRef = useRef<HTMLDivElement>(null);

  // Generate a problem
  const generateNewProblem = (selectedLevel: 1 | 2) => {
    let attempts = 0;
    while (attempts < 500) {
      attempts++;
      
      // Determine the root x solution (neat fraction with denominator 1, 2, 3 or 4)
      const roots = [1, 2, 3, 4];
      const rootDen = roots[Math.floor(Math.random() * roots.length)];
      let rootNum = Math.floor(Math.random() * 17) - 8; // -8 to 8
      if (rootNum === 0) rootNum = 3; // avoid 0 as root to make it active

      const trueX = rootNum / rootDen;

      if (selectedLevel === 1) {
        // No brackets. ax + b = cx + d
        const a = (Math.floor(Math.random() * 11) - 5) || 3; // non-zero -5 to 5
        let c = (Math.floor(Math.random() * 11) - 5) || -2;
        while (c === a) {
          c = (Math.floor(Math.random() * 11) - 5) || 2;
        }

        // To keep parameters integers, LHS & RHS must evaluate to integer constants when x = trueX
        // Let's choose an integer constant b
        const b = Math.floor(Math.random() * 17) - 8; // -8 to 8
        // RHS constant is d. We need d = b + (a - c) * trueX.
        // We require d to be an integer.
        const diff = (a - c) * rootNum;
        if (diff % rootDen === 0) {
          const d = b + diff / rootDen;
          
          // Render initial expressions
          let initialLhsText = formatExpression(a, b);
          let initialRhsText = formatExpression(c, d);

          setProblem({
            initialLhsText,
            initialRhsText,
            lhsCoeff: a,
            lhsConst: b,
            rhsCoeff: c,
            rhsConst: d,
            hasLhsBracket: false,
            hasRhsBracket: false,
            trueX
          });
          return;
        }
      } else {
        // Level 2: Brackets involved
        // L * (a*x + b) = R * (c*x + d) or similar.
        const hasBothBrackets = Math.random() < 0.5;
        
        const lhsMult = Math.floor(Math.random() * 4) + 2; // coefficient of bracket, e.g. 2,3,4,5
        const lhsBracCoeff = Math.floor(Math.random() * 3) + 1; // e.g. x, 2x, 3x (positive or negative)
        const lhsBracConst = (Math.floor(Math.random() * 9) - 4) || 2; // non-zero constant in brackets

        const overallLhsCoeff = lhsMult * lhsBracCoeff;
        const overallLhsConst = lhsMult * lhsBracConst;

        if (hasBothBrackets) {
          const rhsMult = Math.floor(Math.random() * 4) + 2;
          const rhsBracCoeff = (Math.floor(Math.random() * 5) - 2) || -1; // non-zero coeff
          const overallRhsCoeff = rhsMult * rhsBracCoeff;

          if (overallLhsCoeff === overallRhsCoeff) continue; // prevent x vanishing

          // RHS constant is determined by trueX solution
          // lhsMult * (lhsBracCoeff * trueX + lhsBracConst) = rhsMult * (rhsBracCoeff * trueX + rhsBracConst)
          // Let rhsBracConst be d.
          // LHS_val = lhsMult * (lhsBracCoeff * trueX + lhsBracConst)
          // rhsMult * (rhsBracCoeff * trueX + d) = LHS_val
          // rhsBracCoeff * trueX + d = LHS_val / rhsMult
          // d = LHS_val / rhsMult - rhsBracCoeff * trueX
          const lhsVal = lhsMult * (lhsBracCoeff * trueX + lhsBracConst);
          const rhsBracConstFloat = lhsVal / rhsMult - rhsBracCoeff * trueX;

          // Check if rhsBracConst is a neat integer
          if (Math.abs(rhsBracConstFloat - Math.round(rhsBracConstFloat)) < 1e-4) {
            const rhsBracConst = Math.round(rhsBracConstFloat);
            const overallRhsConst = rhsMult * rhsBracConst;

            // Generate LHS and RHS text representation
            const initialLhsText = `${lhsMult}(${formatExpression(lhsBracCoeff, lhsBracConst)})`;
            const initialRhsText = `${rhsMult}(${formatExpression(rhsBracCoeff, rhsBracConst)})`;

            setProblem({
              initialLhsText,
              initialRhsText,
              lhsCoeff: overallLhsCoeff,
              lhsConst: overallLhsConst,
              rhsCoeff: overallRhsCoeff,
              rhsConst: overallRhsConst,
              hasLhsBracket: true,
              lhsMult,
              lhsBracCoeff,
              lhsBracConst,
              hasRhsBracket: true,
              rhsMult,
              rhsBracCoeff,
              rhsBracConst,
              trueX
            });
            return;
          }
        } else {
          // One bracket on LHS, basic terms on RHS (cx + d)
          const c = (Math.floor(Math.random() * 7) - 3) || 1; // non-zero
          const overallRhsCoeff = c;

          if (overallLhsCoeff === overallRhsCoeff) continue;

          // lhsMult * (lhsBracCoeff * trueX + lhsBracConst) = c * trueX + d
          // d = lhsMult * (lhsBracCoeff * trueX + lhsBracConst) - c * trueX
          const lhsVal = lhsMult * (lhsBracCoeff * trueX + lhsBracConst);
          const dFloat = lhsVal - c * trueX;

          if (Math.abs(dFloat - Math.round(dFloat)) < 1e-4) {
            const d = Math.round(dFloat);
            const initialLhsText = `${lhsMult}(${formatExpression(lhsBracCoeff, lhsBracConst)})`;
            const initialRhsText = formatExpression(c, d);

            setProblem({
              initialLhsText,
              initialRhsText,
              lhsCoeff: overallLhsCoeff,
              lhsConst: overallLhsConst,
              rhsCoeff: overallRhsCoeff,
              rhsConst: d,
              hasLhsBracket: true,
              lhsMult,
              lhsBracCoeff,
              lhsBracConst,
              hasRhsBracket: false,
              trueX
            });
            return;
          }
        }
      }
    }

    // Ultimate fallback if randomization gets tight
    setProblem({
      initialLhsText: "5x - 3",
      initialRhsText: "2x + 7",
      lhsCoeff: 5,
      lhsConst: -3,
      rhsCoeff: 2,
      rhsConst: 7,
      hasLhsBracket: false,
      hasRhsBracket: false,
      trueX: 10/3
    });
  };

  // On mount or level change, start game
  useEffect(() => {
    generateNewProblem(level);
    setIsDone(false);
    setErrorMessage(null);
    setIsHintRevealed(false);
    setAssistedThisProblem(false);
  }, [level]);

  // Initialise problem when it changes
  useEffect(() => {
    if (!problem) return;
    const initialLine: WorkingLine = {
      lhsText: problem.initialLhsText,
      rhsText: problem.initialRhsText,
      lhsCoeff: problem.lhsCoeff,
      lhsConst: problem.lhsConst,
      rhsCoeff: problem.rhsCoeff,
      rhsConst: problem.rhsConst,
      comment: "Original Equation"
    };

    setWorkingLines([initialLine]);
    setCurrentLhsCoeff(problem.lhsCoeff);
    setCurrentLhsConst(problem.lhsConst);
    setCurrentRhsCoeff(problem.rhsCoeff);
    setCurrentRhsConst(problem.rhsConst);
    setHasLhsBracket(problem.hasLhsBracket);
    setHasRhsBracket(problem.hasRhsBracket);
    setIsDone(false);
    setErrorMessage(null);
    setIsHintRevealed(false);
    setAssistedThisProblem(false);
  }, [problem]);

  // Scroll to bottom on working lines updates
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [workingLines]);

  // Helper render katex
  const renderKatex = (math: string) => {
    try {
      return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(math, { throwOnError: false }) }} />;
    } catch {
      return <span>{math}</span>;
    }
  };

  // Dynamic interactive feedback comments
  const checkSuccess = (lCoeff: number, lConst: number, rCoeff: number, rConst: number, fromManual: boolean = false) => {
    if (!problem) return;

    // Check if we reached isolated x = constant (or constant = x)
    const isLhsIsolatedX = lCoeff === 1 && lConst === 0 && rCoeff === 0;
    const isRhsIsolatedX = rCoeff === 1 && rConst === 0 && lCoeff === 0;
    const solvedNumLhs = isLhsIsolatedX && Math.abs(rConst - problem.trueX) < 1e-4;
    const solvedNumRhs = isRhsIsolatedX && Math.abs(lConst - problem.trueX) < 1e-4;

    if (solvedNumLhs || solvedNumRhs) {
      setIsDone(true);
      if (!assistedThisProblem) {
        setScore(prev => prev + 10);
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
        }
      }
    }
  };

  // Quick interactive step action
  const applyAction = (actionType: 'expand' | 'add_x' | 'sub_x' | 'add_val' | 'sub_val' | 'div', amountVal: number) => {
    if (!problem) return;
    setErrorMessage(null);

    let nextLCoeff = currentLhsCoeff;
    let nextLConst = currentLhsConst;
    let nextRCoeff = currentRhsCoeff;
    let nextRConst = currentRhsConst;

    let comment = '';
    let lhsStr = '';
    let rhsStr = '';

    if (actionType === 'expand') {
      nextLCoeff = problem.lhsCoeff;
      nextLConst = problem.lhsConst;
      nextRCoeff = problem.rhsCoeff;
      nextRConst = problem.rhsConst;
      setHasLhsBracket(false);
      setHasRhsBracket(false);
      comment = 'Expanded brackets on both sides';
      lhsStr = formatExpression(nextLCoeff, nextLConst);
      rhsStr = formatExpression(nextRCoeff, nextRConst);
    } else if (hasLhsBracket || hasRhsBracket) {
      // If brackets exist, enforce expanding them first as standard tutorial practice
      setErrorMessage("Expand the brackets first to combine variables!");
      return;
    } else if (actionType === 'add_x') {
      nextLCoeff += amountVal;
      nextRCoeff += amountVal;
      const amtStr = amountVal === 1 ? 'x' : `${amountVal}x`;
      comment = `Added ${amtStr} to both sides`;
      lhsStr = formatExpression(nextLCoeff, nextLConst);
      rhsStr = formatExpression(nextRCoeff, nextRConst);
    } else if (actionType === 'sub_x') {
      nextLCoeff -= amountVal;
      nextRCoeff -= amountVal;
      const amtStr = amountVal === 1 ? 'x' : `${amountVal}x`;
      comment = `Subtracted ${amtStr} from both sides`;
      lhsStr = formatExpression(nextLCoeff, nextLConst);
      rhsStr = formatExpression(nextRCoeff, nextRConst);
    } else if (actionType === 'add_val') {
      nextLConst += amountVal;
      nextRConst += amountVal;
      comment = `Added ${amountVal} to both sides`;
      lhsStr = formatExpression(nextLCoeff, nextLConst);
      rhsStr = formatExpression(nextRCoeff, nextRConst);
    } else if (actionType === 'sub_val') {
      nextLConst -= amountVal;
      nextRConst -= amountVal;
      comment = `Subtracted ${amountVal} from both sides`;
      lhsStr = formatExpression(nextLCoeff, nextLConst);
      rhsStr = formatExpression(nextRCoeff, nextRConst);
    } else if (actionType === 'div') {
      nextLCoeff /= amountVal;
      nextLConst /= amountVal;
      nextRCoeff /= amountVal;
      nextRConst /= amountVal;
      comment = `Divided both sides by ${amountVal}`;
      lhsStr = formatExpression(nextLCoeff, nextLConst);
      rhsStr = formatExpression(nextRCoeff, nextRConst);
    }

    const newLine: WorkingLine = {
      lhsText: lhsStr,
      rhsText: rhsStr,
      lhsCoeff: nextLCoeff,
      lhsConst: nextLConst,
      rhsCoeff: nextRCoeff,
      rhsConst: nextRConst,
      comment
    };

    setWorkingLines(prev => [...prev, newLine]);
    setCurrentLhsCoeff(nextLCoeff);
    setCurrentLhsConst(nextLConst);
    setCurrentRhsCoeff(nextRCoeff);
    setCurrentRhsConst(nextRConst);

    checkSuccess(nextLCoeff, nextLConst, nextRCoeff, nextRConst);
  };

  // Custom step input manual parse check
  // Unified submit handler for custom linear equation steps and final isolated answers
  const handleUnifiedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem) return;
    setErrorMessage(null);

    const input = customInputLine.trim();
    if (!input) return;

    const lowercaseInput = input.toLowerCase().replace(/\s+/g, '');

    // 1. Check if it's the final isolated answer
    let isFinalAnswer = false;

    // Direct match: no '=' at all
    if (!input.includes('=')) {
      try {
        const val = evaluate(lowercaseInput);
        if (Math.abs(val - problem.trueX) < 1e-3) {
          isFinalAnswer = true;
        } else {
          // If a student types a simple number or fraction that is incorrect
          if (/^[0-9\/\.\-]+$/.test(lowercaseInput)) {
            setErrorMessage("Incorrect final answer! Double check your calculations.");
            return;
          } else {
            setErrorMessage("Invalid step format. Include '=' to show equation working steps (e.g., 3x = 10).");
            return;
          }
        }
      } catch (err) {
        setErrorMessage("Could not parse numeric answer. Include '=' for equation steps (e.g. 3x = 10).");
        return;
      }
    } else {
      // Has '=' sign
      const parts = input.split('=');
      if (parts.length !== 2) {
        setErrorMessage("An equation step must contain exactly one '=' sign.");
        return;
      }

      const rawLhs = parts[0].trim();
      const rawRhs = parts[1].trim();
      const cleanLhs = rawLhs.toLowerCase().replace(/\s+/g, '');
      const cleanRhs = rawRhs.toLowerCase().replace(/\s+/g, '');

      // Check if LHS is literally x and RHS is the target value, OR vice versa
      const lhsIsX = cleanLhs === 'x';
      const rhsIsX = cleanRhs === 'x';

      if (lhsIsX || rhsIsX) {
        try {
          const valExpr = lhsIsX ? rawRhs : rawLhs;
          const numericVal = evaluate(valExpr);
          if (Math.abs(numericVal - problem.trueX) < 1e-3) {
            isFinalAnswer = true;
          } else {
            setErrorMessage("Incorrect final answer! Double check your calculations.");
            return;
          }
        } catch {
          // Fall through to general step checking if expression could not evaluate directly (e.g. x = 2x - 3)
        }
      }
    }

    // Process if detected as a final correct answer
    if (isFinalAnswer) {
      const solvedLhs = "x";
      const solvedRhs = formatValue(problem.trueX);
      const newLine: WorkingLine = {
        lhsText: solvedLhs,
        rhsText: solvedRhs,
        lhsCoeff: 1,
        lhsConst: 0,
        rhsCoeff: 0,
        rhsConst: problem.trueX,
        comment: "Solved!"
      };

      setWorkingLines(prev => [...prev, newLine]);
      setCurrentLhsCoeff(1);
      setCurrentLhsConst(0);
      setCurrentRhsCoeff(0);
      setCurrentRhsConst(problem.trueX);
      setHasLhsBracket(false);
      setHasRhsBracket(false);
      setIsDone(true);
      setCustomInputLine('');
      
      if (!assistedThisProblem) {
        setScore(prev => prev + 10);
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
        }
      }
      return;
    }

    // 2. Otherwise, treat as an intermediate working step
    if (!input.includes('=')) {
      setErrorMessage("To add a working step, make sure to include '=' (e.g. 3x = 10)");
      return;
    }

    // Check if brackets need to be expanded first in Level 2
    if (hasLhsBracket || hasRhsBracket) {
      const hasBracketsInInput = input.includes('(') || input.includes(')');
      if (hasBracketsInInput) {
        setErrorMessage("Please expand brackets first! Type the expanded equation.");
        return;
      }
    }

    const parts = input.split('=');
    const rawLhs = parts[0].trim();
    const rawRhs = parts[1].trim();

    try {
      // Evaluate linearity check and equivalence at correct root
      const userLhsVal = evaluate(rawLhs, { x: problem.trueX });
      const userRhsVal = evaluate(rawRhs, { x: problem.trueX });

      if (Math.abs(userLhsVal - userRhsVal) > 1e-4) {
        setErrorMessage("This equation step is not equivalent, or your calculation is incorrect!");
        return;
      }

      // Check if linear by evaluating at 0 and 1
      const l0 = evaluate(rawLhs, { x: 0 });
      const l1 = evaluate(rawLhs, { x: 1 });
      const l_coeff = l1 - l0;
      const l_const = l0;

      // Check linear validator
      const l2 = evaluate(rawLhs, { x: 2 });
      if (Math.abs(l2 - (2 * l_coeff + l_const)) > 1e-4) {
        setErrorMessage("Please keep the expressions linear (no x² or powers).");
        return;
      }

      const r0 = evaluate(rawRhs, { x: 0 });
      const r1 = evaluate(rawRhs, { x: 1 });
      const r_coeff = r1 - r0;
      const r_const = r0;

      // Check RHS validator
      const r2 = evaluate(rawRhs, { x: 2 });
      if (Math.abs(r2 - (2 * r_coeff + r_const)) > 1e-4) {
        setErrorMessage("Please keep the expressions linear (no x² or powers).");
        return;
      }

      // Check if it is the same as previous line
      if (Math.abs(l_coeff - currentLhsCoeff) < 1e-4 &&
          Math.abs(l_const - currentLhsConst) < 1e-4 &&
          Math.abs(r_coeff - currentRhsCoeff) < 1e-4 &&
          Math.abs(r_const - currentRhsConst) < 1e-4) {
        setErrorMessage("This step is identical to your current line! Simplify further.");
        return;
      }

      // Accepted! Set new state
      const lhsFormatted = formatExpression(l_coeff, l_const);
      const rhsFormatted = formatExpression(r_coeff, r_const);

      const newLine: WorkingLine = {
        lhsText: lhsFormatted,
        rhsText: rhsFormatted,
        lhsCoeff: l_coeff,
        lhsConst: l_const,
        rhsCoeff: r_coeff,
        rhsConst: r_const,
        comment: "Typed manual step"
      };

      setWorkingLines(prev => [...prev, newLine]);
      setCurrentLhsCoeff(l_coeff);
      setCurrentLhsConst(l_const);
      setCurrentRhsCoeff(r_coeff);
      setCurrentRhsConst(r_const);
      setHasLhsBracket(false);
      setHasRhsBracket(false);
      setCustomInputLine('');

      checkSuccess(l_coeff, l_const, r_coeff, r_const);

    } catch (err) {
      setErrorMessage("Could not parse expressions cleanly. Use standard algebra, e.g. 3x = 10");
    }
  };

  // Move to next problem
  const handleNextProblem = () => {
    if (problemIndex < totalProblems) {
      setProblemIndex(prev => prev + 1);
      generateNewProblem(level);
    } else {
      // Completed set! Let's clear the problem to transition to the scoreboard congrats view
      setProblem(null);
      setProblemIndex(prev => prev + 1);
    }
  };

  // Restart set
  const restartGameSet = () => {
    setProblemIndex(1);
    setScore(0);
    setIsDone(false);
    generateNewProblem(level);
  };

  interface HintStep {
    text: string;
    onApply: () => void;
  }

  const getActiveHint = (): HintStep | null => {
    if (!problem || isDone) return null;

    if (hasLhsBracket || hasRhsBracket) {
      return {
        text: "Expand the brackets on both sides to simplify the equation expressions first.",
        onApply: () => applyAction('expand', 1)
      };
    }

    if (currentRhsCoeff !== 0) {
      const rx = currentRhsCoeff;
      if (rx > 0) {
        const xStr = rx === 1 ? 'x' : `${rx}x`;
        return {
          text: `Subtract ${xStr} from both sides to gather all variable terms on the left.`,
          onApply: () => applyAction('sub_x', rx)
        };
      } else {
        const xStr = Math.abs(rx) === 1 ? 'x' : `${Math.abs(rx)}x`;
        return {
          text: `Add ${xStr} to both sides to gather all variable terms on the left.`,
          onApply: () => applyAction('add_x', Math.abs(rx))
        };
      }
    }

    if (currentLhsConst !== 0) {
      const lc = currentLhsConst;
      if (lc > 0) {
        return {
          text: `Subtract ${lc} from both sides to isolate the variable term on the left.`,
          onApply: () => applyAction('sub_val', lc)
        };
      } else {
        return {
          text: `Add ${Math.abs(lc)} to both sides to isolate the variable term on the left.`,
          onApply: () => applyAction('add_val', Math.abs(lc))
        };
      }
    }

    if (currentLhsCoeff !== 1 && currentLhsCoeff !== 0) {
      return {
        text: `Divide both sides of the equation by ${currentLhsCoeff} to solve for x.`,
        onApply: () => applyAction('div', currentLhsCoeff)
      };
    }

    return null;
  };

  // Dynamic Suggestion Chips / Hint block
  const renderSuggestions = () => {
    if (!problem || isDone) return null;

    const activeHint = getActiveHint();
    if (!activeHint) return null;

    if (!isHintRevealed) {
      return (
        <div className="flex flex-col items-center justify-center py-2">
          <button
            type="button"
            onClick={() => setIsHintRevealed(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
          >
            💡 Show Hint Suggestion
          </button>
        </div>
      );
    }

    return (
      <div className="bg-amber-500/5 dark:bg-amber-500/10 border-2 border-dashed border-amber-500/20 rounded-[2rem] p-5 max-w-xl mx-auto text-center space-y-3.5 animate-fadeIn">
        <div className="flex items-center justify-center gap-2">
          <span className="text-amber-600 dark:text-amber-400 text-lg">💡</span>
          <span className="text-amber-600 dark:text-amber-400 font-extrabold uppercase text-xs tracking-widest">
            Hint Suggestion
          </span>
        </div>
        
        <p className="text-slate-700 dark:text-slate-200 font-semibold text-sm">
          {activeHint.text}
        </p>

        <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setAssistedThisProblem(true);
              activeHint.onApply();
            }}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-md flex items-center gap-1.5"
          >
            🎯 Apply Hint Step
          </button>
        </div>
        
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          (Applying hints automates this step, but this question's points will not count towards your score or streak)
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      
      {/* Top Navigation Frame */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-10">
        <button 
          onClick={() => navigate('/9mainstream')} 
          className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 font-bold transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span>←</span> Back
        </button>
        
        <div className="flex items-center gap-4">
          <div className="text-center sm:text-right">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">YEAR 9 INTERACTIVE</p>
            <h1 className="text-lg font-black text-slate-800 dark:text-slate-100">Pronumerals on both sides</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Streak Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full font-black text-sm border border-amber-500/20">
            <span>🔥</span>
            <span>{streak}</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col gap-6">
        
        {/* Top Control Bar (Level and Progress Selection) */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-3xl gap-4 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
            <button
              onClick={() => { setLevel(1); setProblemIndex(1); setScore(0); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${level === 1 ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-indigo-500'}`}
            >
              Level 1: Standard
            </button>
            <button
              onClick={() => { setLevel(2); setProblemIndex(1); setScore(0); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${level === 2 ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-indigo-500'}`}
            >
              Level 2: Brackets
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Set Score</span>
              <p className="text-xl font-black text-slate-800 dark:text-slate-200">{score} pts</p>
            </div>
            
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
            
            <div className="text-left">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Problem</span>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{problemIndex} of {totalProblems}</p>
            </div>
          </div>
        </div>

        {/* Core Gameboard */}
        {problem && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* LHS: The Interactive Vertical Workbook Card */}
            <div className="md:col-span-12 bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between shadow-xl border border-slate-200/50 dark:border-slate-800 relative overflow-hidden transition-all duration-300">
              
              {/* Header inside Card */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-indigo-500/10">
                  {level === 1 ? "No Brackets" : "Multi-Step Brackets"}
                </span>
                
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                  Best Streak: {bestStreak}
                </span>
              </div>

              {/* Workbook content feed */}
              <div className="flex-1 flex flex-col gap-4 border-b border-dashed border-slate-200 dark:border-slate-700/50 pb-8 min-h-[16rem]">
                <AnimatePresence initial={false}>
                  {workingLines.map((line, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-50 hover:bg-indigo-50/20 dark:bg-slate-900/40 dark:hover:bg-indigo-950/20 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-xs text-slate-500 flex items-center justify-center font-black">
                          {index + 1}
                        </span>
                        
                        <div className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                          {renderKatex(`${line.lhsText} = ${line.rhsText}`)}
                        </div>
                      </div>

                      {/* Comment / annotation tags */}
                      <span className="mt-2 sm:mt-0 px-2.5 py-1 text-xs font-bold text-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg">
                        {line.comment}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                <div ref={historyEndRef} />
              </div>

              {/* Interaction Panel (Active Steps / Suggestion / Manual / Jump to Answer) */}
              <div className="pt-6 space-y-6">
                
                {/* 1. Dynamic Step Action Suggeston Chips */}
                {!isDone && renderSuggestions()}

                {/* 2. Step Interaction / Input Controls */}
                {!isDone && (
                  <div className="bg-slate-50 dark:bg-slate-900/30 p-6 sm:p-8 rounded-[2rem] border border-slate-150 dark:border-slate-800/80 max-w-2xl mx-auto w-full">
                    <div className="mb-4">
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                        Enter next step or final answer
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Type an algebraic step (e.g. <strong>3x = 10</strong>) or the final value (e.g. <strong>x = 10/3</strong>, <strong>10/3 = x</strong>, or just <strong>10/3</strong>).
                      </p>
                    </div>

                    <form onSubmit={handleUnifiedSubmit} className="flex gap-2.5">
                      <input
                        type="text"
                        value={customInputLine}
                        onChange={(e) => setCustomInputLine(e.target.value)}
                        placeholder="e.g. 3x = 10 or x = 10/3"
                        className="flex-1 px-5 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl focus:border-indigo-500 focus:outline-none font-bold text-base shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/10"
                      />
                      <button
                        type="submit"
                        className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition active:scale-95 shadow-md shrink-0"
                      >
                        Submit
                      </button>
                    </form>

                    {errorMessage && (
                      <p className="mt-3.5 text-rose-500 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 animate-shake">
                        <span>⚠️</span> {errorMessage}
                      </p>
                    )}
                  </div>
                )}

                {/* Next Problem / Finished screen splash */}
                {isDone && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`p-8 border-2 rounded-[2rem] text-center flex flex-col items-center justify-center gap-4 ${
                      assistedThisProblem
                        ? "bg-amber-500/10 border-amber-500/20"
                        : "bg-emerald-500/10 border-emerald-500/20"
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-full text-white text-3xl flex items-center justify-center shadow-lg transform scale-110 mb-2 ${
                      assistedThisProblem ? "bg-amber-500" : "bg-emerald-500"
                    }`}>
                      {assistedThisProblem ? "🤝" : "✓"}
                    </div>
                    <div>
                      <h3 className={`text-2xl font-black italic uppercase ${
                        assistedThisProblem ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {assistedThisProblem ? "Completed with Help!" : "Excellent Work!"}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm mt-1">
                        {assistedThisProblem 
                          ? <>Equation solved with hints (no points gained this round, but streak kept intact!). x = {renderKatex(formatValue(problem.trueX))}</>
                          : <>Mathematical proof matches solution: x = {renderKatex(formatValue(problem.trueX))} (+10 pts gained!)</>
                        }
                      </p>
                    </div>

                    <div className="flex gap-4 mt-2">
                      <button
                        onClick={handleNextProblem}
                        className={`px-6 py-3 text-white rounded-xl font-black text-sm uppercase tracking-wider transition active:scale-95 shadow ${
                          assistedThisProblem ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"
                        }`}
                      >
                        {problemIndex < totalProblems ? "Next Problem" : "Finish Set"}
                      </button>
                    </div>
                  </motion.div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* Completed Game set Screen (Result page) */}
        {!problem && problemIndex > totalProblems && (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
            <div className="w-24 h-24 bg-indigo-500 text-white text-5xl flex items-center justify-center rounded-full mx-auto shadow-lg shadow-indigo-500/20">
              🏆
            </div>
            <h2 className="text-4xl font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase italic">
              Set Completed!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
              You successfully solved all the equations with pronumerals on both sides in this round! Excellent algebra progress.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={restartGameSet}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-black transition active:scale-95 uppercase tracking-wider"
              >
                Play Again
              </button>
              <button
                onClick={() => navigate('/9mainstream')}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 rounded-xl font-black transition active:scale-95 uppercase tracking-wider"
              >
                Back to Year 9
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PronumeralsBothSides;
