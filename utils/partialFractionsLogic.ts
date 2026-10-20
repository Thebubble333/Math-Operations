import { evaluate } from 'mathjs';

export type FractionFactorType = 'linear' | 'repeated' | 'irreducible';

export interface ExpectedTerm {
  canonicalDenominator: string; // e.g. "x-2", "(x+1)^2", "x^2+4"
  latexDenominator: string;     // e.g. "x - 2", "(x + 1)^2", "x^2 + 4"
  numeratorKind: 'constant' | 'linear';
  suggestedNumerator: string;   // e.g. "A", "B", "Ax+B"
  reason: string;
}

export interface PartialFractionProblem {
  id: string;
  category: 'linear' | 'repeated' | 'irreducible' | 'mixed';
  title: string;
  difficulty: 'Simple' | 'Intermediate' | 'Advanced';
  // Given expression: P(x) / Q(x)
  numeratorText: string;        // e.g. "5x - 1"
  numeratorLatex: string;       // e.g. "5x - 1"
  denominatorUnfactoredText: string;  // e.g. "x^2 - x - 6" or "x^3 + 4x"
  denominatorUnfactoredLatex: string; // e.g. "x^2 - x - 6"
  
  // Step 1: Factorised denominator
  denominatorFactoredText: string;   // e.g. "(x - 3)(x + 2)"
  denominatorFactoredLatex: string;  // e.g. "(x - 3)(x + 2)"
  factorisationHint: string;         // e.g. "Factorise the quadratic x^2 - x - 6 by inspection"
  
  // Step 2: Expected decomposition terms
  expectedTerms: ExpectedTerm[];
  
  // Solved form for pedagogical bonus
  solvedCoefficientsLatex?: string; // e.g. "\\frac{2}{x - 3} + \\frac{3}{x + 2}"
  explanation: string;
  discriminantInfo?: string;        // For irreducible quadratic: "b^2 - 4ac = 0 - 16 = -16 < 0"
}

export interface UserFractionTerm {
  id: string;
  numerator: string;
  denominator: string;
}

export interface Step1ValidationResult {
  isValid: boolean;
  message: string;
  isEquivalent: boolean;
  isFactored: boolean;
}

export interface Step2ValidationResult {
  isValid: boolean;
  message: string;
  detailedErrors?: string[];
  matchedTermsCount: number;
  totalRequired: number;
}

// Convert user math expression into JS-evaluable string for mathjs
export function toMathJS(expr: string): string {
  let s = expr.replace(/\s+/g, '');
  // Replace unicode superscripts with standard power caret
  s = s.replace(/²/g, '^2').replace(/³/g, '^3');
  // Replace brackets with parentheses
  s = s.replace(/\[/g, '(').replace(/\]/g, ')');
  // Implicit multiplication: 2x -> 2*x, )x -> )*x, x( -> x*(, )( -> )*(
  let prev = '';
  while (s !== prev) {
    prev = s;
    s = s.replace(/([0-9])([a-zA-Z\(])/g, '$1*$2');
    s = s.replace(/([a-zA-Z])([a-zA-Z0-9\(])/g, '$1*$2');
    s = s.replace(/(\))([a-zA-Z0-9\(])/g, '$1*$2');
  }
  return s;
}

// Evaluate expression safely across numeric test points
const TEST_X_POINTS = [2.718, -3.1415, 4.62, -1.83, 6.25];

export function checkEquivalence(expr1: string, expr2: string): boolean {
  try {
    const js1 = toMathJS(expr1);
    const js2 = toMathJS(expr2);
    for (const x of TEST_X_POINTS) {
      const v1 = evaluate(js1, { x });
      const v2 = evaluate(js2, { x });
      if (typeof v1 !== 'number' || typeof v2 !== 'number' || isNaN(v1) || isNaN(v2)) {
        return false;
      }
      if (Math.abs(v1 - v2) > 1e-4) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

// Extract individual factor options from the problem for automatic bracket completion in Step 1
export function getProblemFactors(problem: PartialFractionProblem): string[] {
  const factored = problem.denominatorFactoredText;
  const factors: string[] = [];

  // Match bracketed terms: (x - 3), (x + 2), (x^2 + 4), etc.
  const bracketMatches = Array.from(factored.matchAll(/\(([^)]+)\)/g));
  for (const m of bracketMatches) {
    const rawFactor = m[1].trim();
    if (rawFactor && !factors.includes(rawFactor)) {
      factors.push(rawFactor);
    }
  }

  // Check for leading unbracketed monomial: e.g. "x(x + 3)" or "2x(x - 1)"
  const leadingMonomialMatch = factored.match(/^([0-9]*[a-zA-Z](?:\^[0-9]+)?)\(/);
  if (leadingMonomialMatch) {
    const mono = leadingMonomialMatch[1].trim();
    if (mono && !factors.includes(mono)) {
      factors.unshift(mono);
    }
  }

  // Also check expectedTerms canonical denominators if factors list is missing any
  for (const term of problem.expectedTerms) {
    let d = term.canonicalDenominator.replace(/^\(|\)$/g, '').replace(/\^\d+$/, '').trim();
    if (d && !factors.includes(d)) {
      factors.push(d);
    }
  }

  return factors;
}

// Step 1 Validation: Check factorisation of denominator
export function validateDenominatorFactorisation(
  userInput: string,
  problem: PartialFractionProblem
): Step1ValidationResult {
  const cleaned = userInput.trim();
  if (!cleaned) {
    return {
      isValid: false,
      message: 'Please enter the factorised denominator.',
      isEquivalent: false,
      isFactored: false,
    };
  }

  // Check equivalence to unfactored or factored target
  const target = problem.denominatorFactoredText;
  const isEquiv = checkEquivalence(cleaned, target);

  if (!isEquiv) {
    return {
      isValid: false,
      message: 'This expression is not equivalent to the original denominator. Check your signs and factors.',
      isEquivalent: false,
      isFactored: false,
    };
  }

  // Check that the student did not just leave it expanded
  // e.g., if problem denominator is "x^2 - x - 6" and user typed "x^2 - x - 6",
  // it has no parentheses or factor structure.
  const normUser = cleaned.replace(/²/g, '^2').replace(/\s+/g, '');
  const normUnfactored = problem.denominatorUnfactoredText.replace(/²/g, '^2').replace(/\s+/g, '');
  if (normUser === normUnfactored && normUnfactored.includes('^2') && !normUnfactored.startsWith('(')) {
    return {
      isValid: false,
      message: 'The expression is equivalent, but still in expanded form. You must factorise it into brackets!',
      isEquivalent: true,
      isFactored: false,
    };
  }

  // User input should contain brackets or product form (e.g. "(x-3)(x+2)" or "x(x+4)" or "(x+1)^2")
  const hasParentheses = cleaned.includes('(') && cleaned.includes(')');
  const isSimpleMonomial = /^x(\^[0-9]+)?$/.test(normUser);

  if (!hasParentheses && !isSimpleMonomial) {
    return {
      isValid: false,
      message: 'Make sure your factors are enclosed in brackets, e.g. (x - a)(x - b).',
      isEquivalent: true,
      isFactored: false,
    };
  }

  return {
    isValid: true,
    message: 'Denominator correctly factorised!',
    isEquivalent: true,
    isFactored: true,
  };
}

// Step 2 Validation: Check the decomposition fractions
export function validateDecomposition(
  userTerms: UserFractionTerm[],
  problem: PartialFractionProblem
): Step2ValidationResult {
  if (userTerms.length === 0) {
    return {
      isValid: false,
      message: 'Please add at least one fraction to set up the decomposition.',
      matchedTermsCount: 0,
      totalRequired: problem.expectedTerms.length,
    };
  }

  // Check for any empty fields
  for (let i = 0; i < userTerms.length; i++) {
    const term = userTerms[i];
    if (!term.numerator.trim() || !term.denominator.trim()) {
      return {
        isValid: false,
        message: `Fraction ${i + 1} has an empty numerator or denominator. Please fill both in.`,
        matchedTermsCount: 0,
        totalRequired: problem.expectedTerms.length,
      };
    }
  }

  const detailedErrors: string[] = [];
  const expected = problem.expectedTerms;

  if (userTerms.length !== expected.length) {
    detailedErrors.push(
      `You have set up ${userTerms.length} fraction${userTerms.length === 1 ? '' : 's'}, but this expression decomposes into ${expected.length} partial fraction${expected.length === 1 ? '' : 's'}.`
    );
  }

  // Match each user term to an expected term
  const matchedExpectedIndices = new Set<number>();
  const usedLetters = new Set<string>();

  userTerms.forEach((uTerm, idx) => {
    const uDen = uTerm.denominator.trim();
    const uNum = uTerm.numerator.trim();

    // Check if denominator matches any expected denominator
    let matchedExpIdx = -1;
    for (let j = 0; j < expected.length; j++) {
      if (matchedExpectedIndices.has(j)) continue; // don't double match
      if (checkEquivalence(uDen, expected[j].canonicalDenominator)) {
        matchedExpIdx = j;
        break;
      }
    }

    if (matchedExpIdx === -1) {
      // Check if it matched a previously matched expected denominator (duplicate denominator)
      const duplicateIdx = expected.findIndex(e => checkEquivalence(uDen, e.canonicalDenominator));
      if (duplicateIdx !== -1) {
        detailedErrors.push(
          `Fraction ${idx + 1}: Denominator "${uDen}" is repeated. Each partial fraction must have a distinct factor or power.`
        );
      } else {
        detailedErrors.push(
          `Fraction ${idx + 1}: Denominator "${uDen}" is not a valid factor or power of the denominator.`
        );
      }
      return;
    }

    const expTerm = expected[matchedExpIdx];
    matchedExpectedIndices.add(matchedExpIdx);

    // Validate numerator kind
    // Kind 1: Constant (e.g. A, B, C, k) -> must NOT contain variable 'x'
    // Kind 2: Linear (e.g. Ax + B, Bx + C, Cx + D) -> must contain variable 'x', but NOT x^2
    const numClean = uNum.replace(/\s+/g, '');
    const containsX = /[xX]/.test(numClean);
    const containsXSquared = /[xX]\^|x\*x/i.test(numClean);

    if (expTerm.numeratorKind === 'constant') {
      if (containsX) {
        detailedErrors.push(
          `Fraction ${idx + 1} with denominator "${uDen}": The denominator is a linear factor or power of a linear factor, so its numerator must be a constant (e.g. A or B), not a linear expression.`
        );
      }
    } else if (expTerm.numeratorKind === 'linear') {
      if (!containsX) {
        detailedErrors.push(
          `Fraction ${idx + 1} with denominator "${uDen}": The denominator is an irreducible quadratic (${expTerm.reason}), so its numerator must be a linear expression in x (e.g. Ax + B or Bx + C), not just a constant.`
        );
      } else if (containsXSquared) {
        detailedErrors.push(
          `Fraction ${idx + 1} with denominator "${uDen}": The numerator cannot have degree 2 ($x^2$). It must be linear (e.g. Ax + B).`
        );
      }
    }

    // Track letter duplication warning if single letter
    if (/^[A-Za-z]$/.test(numClean)) {
      if (usedLetters.has(numClean.toUpperCase())) {
        // Soft note: duplicate letter
      }
      usedLetters.add(numClean.toUpperCase());
    }
  });

  // Check if any expected denominators were missing
  if (matchedExpectedIndices.size < expected.length) {
    const missing = expected
      .filter((_, idx) => !matchedExpectedIndices.has(idx))
      .map(e => e.latexDenominator);
    if (detailedErrors.length === 0) {
      detailedErrors.push(`Missing fraction term with denominator: ${missing.join(', ')}.`);
    }
  }

  const isValid = detailedErrors.length === 0 && matchedExpectedIndices.size === expected.length;

  return {
    isValid,
    message: isValid
      ? 'Perfect! You have set up the correct partial fraction decomposition.'
      : (detailedErrors[0] || 'Please review your decomposition terms.'),
    detailedErrors: detailedErrors.length > 0 ? detailedErrors : undefined,
    matchedTermsCount: matchedExpectedIndices.size,
    totalRequired: expected.length,
  };
}

// Convert an expression to a clean LaTeX preview string for real-time typing
export function formatToLatex(expr: string): string {
  if (!expr.trim()) return '';
  let s = expr.trim();
  // Handle fractions like A / (x - 2)
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 2) {
      return `\\frac{${formatToLatex(parts[0])}}{${formatToLatex(parts[1])}}`;
    }
  }
  // Exponent formatting: x^2 -> x^{2}, (x+1)^2 -> (x+1)^2
  s = s.replace(/\^([0-9a-zA-Z]+)/g, '^{$1}');
  // Multiplication signs
  s = s.replace(/\*/g, ' \\cdot ');
  return s;
}

// Comprehensive Curated Problems for 11 Specialist Maths
export const PARTIAL_FRACTIONS_PROBLEMS: PartialFractionProblem[] = [
  // --- Category 1: Linear Factors (ax + b) ---
  {
    id: 'lin-1',
    category: 'linear',
    title: 'Distinct Linear: Simple Quadratic',
    difficulty: 'Simple',
    numeratorText: '5x - 1',
    numeratorLatex: '5x - 1',
    denominatorUnfactoredText: 'x^2 - x - 6',
    denominatorUnfactoredLatex: 'x^2 - x - 6',
    denominatorFactoredText: '(x - 3)(x + 2)',
    denominatorFactoredLatex: '(x - 3)(x + 2)',
    factorisationHint: 'Look for two numbers that multiply to -6 and add to -1 (i.e. -3 and +2).',
    expectedTerms: [
      {
        canonicalDenominator: 'x - 3',
        latexDenominator: 'x - 3',
        numeratorKind: 'constant',
        suggestedNumerator: 'A',
        reason: 'Linear factor (ax+b)',
      },
      {
        canonicalDenominator: 'x + 2',
        latexDenominator: 'x + 2',
        numeratorKind: 'constant',
        suggestedNumerator: 'B',
        reason: 'Linear factor (ax+b)',
      },
    ],
    solvedCoefficientsLatex: '\\frac{2.8}{x - 3} + \\frac{2.2}{x + 2} \\implies \\frac{14}{5(x-3)} + \\frac{11}{5(x+2)}',
    explanation: 'Since the denominator factors into two distinct linear factors (x - 3) and (x + 2), each factor receives a constant numerator A and B.',
  },
  {
    id: 'lin-2',
    category: 'linear',
    title: 'Distinct Linear: Difference of Squares',
    difficulty: 'Simple',
    numeratorText: '6x + 2',
    numeratorLatex: '6x + 2',
    denominatorUnfactoredText: 'x^2 - 4',
    denominatorUnfactoredLatex: 'x^2 - 4',
    denominatorFactoredText: '(x - 2)(x + 2)',
    denominatorFactoredLatex: '(x - 2)(x + 2)',
    factorisationHint: 'Difference of two squares: a^2 - b^2 = (a - b)(a + b).',
    expectedTerms: [
      {
        canonicalDenominator: 'x - 2',
        latexDenominator: 'x - 2',
        numeratorKind: 'constant',
        suggestedNumerator: 'A',
        reason: 'Linear factor (x - 2)',
      },
      {
        canonicalDenominator: 'x + 2',
        latexDenominator: 'x + 2',
        numeratorKind: 'constant',
        suggestedNumerator: 'B',
        reason: 'Linear factor (x + 2)',
      },
    ],
    solvedCoefficientsLatex: '\\frac{7/2}{x - 2} + \\frac{5/2}{x + 2} = \\frac{7}{2(x-2)} + \\frac{5}{2(x+2)}',
    explanation: 'x^2 - 4 = (x - 2)(x + 2). Two distinct linear factors give constant numerators A and B.',
  },
  {
    id: 'lin-3',
    category: 'linear',
    title: 'Distinct Linear: Common Monomial Factor',
    difficulty: 'Simple',
    numeratorText: '7x + 12',
    numeratorLatex: '7x + 12',
    denominatorUnfactoredText: 'x^2 + 3x',
    denominatorUnfactoredLatex: 'x^2 + 3x',
    denominatorFactoredText: 'x(x + 3)',
    denominatorFactoredLatex: 'x(x + 3)',
    factorisationHint: 'Take out the common factor of x: x^2 + 3x = x(x + 3).',
    expectedTerms: [
      {
        canonicalDenominator: 'x',
        latexDenominator: 'x',
        numeratorKind: 'constant',
        suggestedNumerator: 'A',
        reason: 'Linear factor x',
      },
      {
        canonicalDenominator: 'x + 3',
        latexDenominator: 'x + 3',
        numeratorKind: 'constant',
        suggestedNumerator: 'B',
        reason: 'Linear factor (x + 3)',
      },
    ],
    solvedCoefficientsLatex: '\\frac{4}{x} + \\frac{3}{x + 3}',
    explanation: 'x and (x + 3) are distinct linear factors, so the decomposition is A/x + B/(x + 3).',
  },
  {
    id: 'lin-4',
    category: 'linear',
    title: 'Distinct Linear: Three Linear Factors',
    difficulty: 'Intermediate',
    numeratorText: '3x^2 + 11x - 2',
    numeratorLatex: '3x^2 + 11x - 2',
    denominatorUnfactoredText: 'x^3 - x',
    denominatorUnfactoredLatex: 'x^3 - x',
    denominatorFactoredText: 'x(x - 1)(x + 1)',
    denominatorFactoredLatex: 'x(x - 1)(x + 1)',
    factorisationHint: 'First factor out x: x(x^2 - 1). Then factor the difference of squares: x(x - 1)(x + 1).',
    expectedTerms: [
      {
        canonicalDenominator: 'x',
        latexDenominator: 'x',
        numeratorKind: 'constant',
        suggestedNumerator: 'A',
        reason: 'Linear factor x',
      },
      {
        canonicalDenominator: 'x - 1',
        latexDenominator: 'x - 1',
        numeratorKind: 'constant',
        suggestedNumerator: 'B',
        reason: 'Linear factor (x - 1)',
      },
      {
        canonicalDenominator: 'x + 1',
        latexDenominator: 'x + 1',
        numeratorKind: 'constant',
        suggestedNumerator: 'C',
        reason: 'Linear factor (x + 1)',
      },
    ],
    solvedCoefficientsLatex: '\\frac{2}{x} + \\frac{6}{x - 1} - \\frac{5}{x + 1}',
    explanation: 'Three distinct linear factors produce three partial fractions with constant numerators A, B, and C.',
  },

  // --- Category 2: Repeated Linear Factors (ax + b)^n ---
  {
    id: 'rep-1',
    category: 'repeated',
    title: 'Repeated Linear: Perfect Square Trinomial',
    difficulty: 'Simple',
    numeratorText: '4x + 3',
    numeratorLatex: '4x + 3',
    denominatorUnfactoredText: 'x^2 - 2x + 1',
    denominatorUnfactoredLatex: 'x^2 - 2x + 1',
    denominatorFactoredText: '(x - 1)^2',
    denominatorFactoredLatex: '(x - 1)^2',
    factorisationHint: 'Notice this is a perfect square: (x - 1)^2.',
    expectedTerms: [
      {
        canonicalDenominator: 'x - 1',
        latexDenominator: 'x - 1',
        numeratorKind: 'constant',
        suggestedNumerator: 'A',
        reason: 'First power of repeated linear factor',
      },
      {
        canonicalDenominator: '(x - 1)^2',
        latexDenominator: '(x - 1)^2',
        numeratorKind: 'constant',
        suggestedNumerator: 'B',
        reason: 'Second power of repeated linear factor',
      },
    ],
    solvedCoefficientsLatex: '\\frac{4}{x - 1} + \\frac{7}{(x - 1)^2}',
    explanation: 'For a repeated linear factor (x - 1)^2, we must include terms for each power up to 2: A/(x - 1) and B/(x - 1)^2. Both numerators are constants!',
  },
  {
    id: 'rep-2',
    category: 'repeated',
    title: 'Repeated Linear: Monomial and Square',
    difficulty: 'Intermediate',
    numeratorText: '3x^2 - 5x + 4',
    numeratorLatex: '3x^2 - 5x + 4',
    denominatorUnfactoredText: 'x^3 - 4x^2 + 4x',
    denominatorUnfactoredLatex: 'x^3 - 4x^2 + 4x',
    denominatorFactoredText: 'x(x - 2)^2',
    denominatorFactoredLatex: 'x(x - 2)^2',
    factorisationHint: 'Factor out x: x(x^2 - 4x + 4) = x(x - 2)^2.',
    expectedTerms: [
      {
        canonicalDenominator: 'x',
        latexDenominator: 'x',
        numeratorKind: 'constant',
        suggestedNumerator: 'A',
        reason: 'Linear factor x',
      },
      {
        canonicalDenominator: 'x - 2',
        latexDenominator: 'x - 2',
        numeratorKind: 'constant',
        suggestedNumerator: 'B',
        reason: 'First power of (x - 2)',
      },
      {
        canonicalDenominator: '(x - 2)^2',
        latexDenominator: '(x - 2)^2',
        numeratorKind: 'constant',
        suggestedNumerator: 'C',
        reason: 'Second power of (x - 2)',
      },
    ],
    solvedCoefficientsLatex: '\\frac{1}{x} + \\frac{2}{x - 2} + \\frac{3}{(x - 2)^2}',
    explanation: 'The factor x requires A/x, while the repeated factor (x - 2)^2 requires B/(x - 2) and C/(x - 2)^2.',
  },
  {
    id: 'rep-3',
    category: 'repeated',
    title: 'Repeated Linear: Distinct and Repeated Factor',
    difficulty: 'Intermediate',
    numeratorText: '2x^2 + 7x + 1',
    numeratorLatex: '2x^2 + 7x + 1',
    denominatorUnfactoredText: '(x + 1)(x^2 + 6x + 9)',
    denominatorUnfactoredLatex: '(x + 1)(x^2 + 6x + 9)',
    denominatorFactoredText: '(x + 1)(x + 3)^2',
    denominatorFactoredLatex: '(x + 1)(x + 3)^2',
    factorisationHint: 'Recognise that x^2 + 6x + 9 is the perfect square (x + 3)^2.',
    expectedTerms: [
      {
        canonicalDenominator: 'x + 1',
        latexDenominator: 'x + 1',
        numeratorKind: 'constant',
        suggestedNumerator: 'A',
        reason: 'Distinct linear factor (x + 1)',
      },
      {
        canonicalDenominator: 'x + 3',
        latexDenominator: 'x + 3',
        numeratorKind: 'constant',
        suggestedNumerator: 'B',
        reason: 'First power of repeated linear factor (x + 3)',
      },
      {
        canonicalDenominator: '(x + 3)^2',
        latexDenominator: '(x + 3)^2',
        numeratorKind: 'constant',
        suggestedNumerator: 'C',
        reason: 'Second power of repeated linear factor (x + 3)',
      },
    ],
    solvedCoefficientsLatex: '\\frac{-1}{x + 1} + \\frac{3}{x + 3} - \\frac{1}{(x + 3)^2}',
    explanation: 'Decomposes into A/(x + 1) + B/(x + 3) + C/(x + 3)^2. Notice that every repeated linear term has a constant numerator.',
  },

  // --- Category 3: Irreducible Quadratic Factors (ax^2 + bx + c, b^2 - 4ac < 0) ---
  {
    id: 'quad-1',
    category: 'irreducible',
    title: 'Irreducible Quadratic: Sum of Squares',
    difficulty: 'Simple',
    numeratorText: '3x^2 + x + 8',
    numeratorLatex: '3x^2 + x + 8',
    denominatorUnfactoredText: 'x^3 + 4x',
    denominatorUnfactoredLatex: 'x^3 + 4x',
    denominatorFactoredText: 'x(x^2 + 4)',
    denominatorFactoredLatex: 'x(x^2 + 4)',
    factorisationHint: 'Factor out x: x(x^2 + 4). Note x^2 + 4 has b^2 - 4ac = 0 - 16 = -16 < 0 and cannot be factored over real numbers.',
    expectedTerms: [
      {
        canonicalDenominator: 'x',
        latexDenominator: 'x',
        numeratorKind: 'constant',
        suggestedNumerator: 'A',
        reason: 'Linear factor x',
      },
      {
        canonicalDenominator: 'x^2 + 4',
        latexDenominator: 'x^2 + 4',
        numeratorKind: 'linear',
        suggestedNumerator: 'Bx+C',
        reason: 'Irreducible quadratic factor with b^2 - 4ac < 0',
      },
    ],
    solvedCoefficientsLatex: '\\frac{2}{x} + \\frac{x + 1}{x^2 + 4}',
    explanation: 'The factor x^2 + 4 is an irreducible quadratic (discriminant \\Delta = -16 < 0). Therefore, its numerator must be a linear expression (Bx + C).',
    discriminantInfo: 'b^2 - 4ac = 0^2 - 4(1)(4) = -16 < 0 \\implies \\text{irreducible}',
  },
  {
    id: 'quad-2',
    category: 'irreducible',
    title: 'Irreducible Quadratic with Linear Factor',
    difficulty: 'Intermediate',
    numeratorText: '5x^2 - 2x + 9',
    numeratorLatex: '5x^2 - 2x + 9',
    denominatorUnfactoredText: '(x - 1)(x^2 + 9)',
    denominatorUnfactoredLatex: '(x - 1)(x^2 + 9)',
    denominatorFactoredText: '(x - 1)(x^2 + 9)',
    factorisationHint: 'x^2 + 9 has no real roots (b^2 - 4ac = -36 < 0), so it is already fully factored over the reals.',
    expectedTerms: [
      {
        canonicalDenominator: 'x - 1',
        latexDenominator: 'x - 1',
        numeratorKind: 'constant',
        suggestedNumerator: 'A',
        reason: 'Linear factor (x - 1)',
      },
      {
        canonicalDenominator: 'x^2 + 9',
        latexDenominator: 'x^2 + 9',
        numeratorKind: 'linear',
        suggestedNumerator: 'Bx+C',
        reason: 'Irreducible quadratic factor (b^2 - 4ac < 0)',
      },
    ],
    solvedCoefficientsLatex: '\\frac{1.2}{x - 1} + \\frac{3.8x + 1.8}{x^2 + 9}',
    explanation: '(x - 1) gets constant A, while irreducible quadratic (x^2 + 9) requires a linear numerator (Bx + C).',
    discriminantInfo: '\\Delta = 0^2 - 4(1)(9) = -36 < 0 \\implies \\text{irreducible}',
  },
  {
    id: 'quad-3',
    category: 'irreducible',
    title: 'Irreducible Quadratic: Non-Zero b Term',
    difficulty: 'Advanced',
    numeratorText: '4x^2 + 3x + 10',
    numeratorLatex: '4x^2 + 3x + 10',
    denominatorUnfactoredText: '(x + 2)(x^2 + 2x + 5)',
    denominatorUnfactoredLatex: '(x + 2)(x^2 + 2x + 5)',
    denominatorFactoredText: '(x + 2)(x^2 + 2x + 5)',
    factorisationHint: 'Check the discriminant of x^2 + 2x + 5: b^2 - 4ac = 4 - 20 = -16 < 0, so it cannot be factored into linear terms.',
    expectedTerms: [
      {
        canonicalDenominator: 'x + 2',
        latexDenominator: 'x + 2',
        numeratorKind: 'constant',
        suggestedNumerator: 'A',
        reason: 'Linear factor (x + 2)',
      },
      {
        canonicalDenominator: 'x^2 + 2x + 5',
        latexDenominator: 'x^2 + 2x + 5',
        numeratorKind: 'linear',
        suggestedNumerator: 'Bx+C',
        reason: 'Irreducible quadratic with b^2 - 4ac = 4 - 20 = -16 < 0',
      },
    ],
    solvedCoefficientsLatex: '\\frac{4}{x + 2} + \\frac{0x - 5}{x^2 + 2x + 5}',
    explanation: 'Because b^2 - 4ac = 4 - 20 = -16 < 0, x^2 + 2x + 5 is irreducible over \\mathbb{R}, requiring the numerator form Bx + C.',
    discriminantInfo: '\\Delta = 2^2 - 4(1)(5) = 4 - 20 = -16 < 0 \\implies \\text{irreducible}',
  },

  // --- Category 4: Mixed Combination ---
  {
    id: 'mix-1',
    category: 'mixed',
    title: 'Repeated Linear and Irreducible Quadratic',
    difficulty: 'Advanced',
    numeratorText: '2x^3 - x^2 + 4x + 3',
    numeratorLatex: '2x^3 - x^2 + 4x + 3',
    denominatorUnfactoredText: '(x - 1)^2(x^2 + 1)',
    denominatorUnfactoredLatex: '(x - 1)^2(x^2 + 1)',
    denominatorFactoredText: '(x - 1)^2(x^2 + 1)',
    factorisationHint: '(x - 1)^2 is repeated linear; (x^2 + 1) is irreducible quadratic (b^2 - 4ac = -4 < 0).',
    expectedTerms: [
      {
        canonicalDenominator: 'x - 1',
        latexDenominator: 'x - 1',
        numeratorKind: 'constant',
        suggestedNumerator: 'A',
        reason: 'First power of repeated linear factor (x - 1)',
      },
      {
        canonicalDenominator: '(x - 1)^2',
        latexDenominator: '(x - 1)^2',
        numeratorKind: 'constant',
        suggestedNumerator: 'B',
        reason: 'Second power of repeated linear factor (x - 1)',
      },
      {
        canonicalDenominator: 'x^2 + 1',
        latexDenominator: 'x^2 + 1',
        numeratorKind: 'linear',
        suggestedNumerator: 'Cx+D',
        reason: 'Irreducible quadratic factor x^2 + 1',
      },
    ],
    solvedCoefficientsLatex: '\\frac{A}{x - 1} + \\frac{B}{(x - 1)^2} + \\frac{Cx + D}{x^2 + 1}',
    explanation: 'Combines both rules: each power of (x - 1) gets a constant numerator, while the irreducible quadratic gets a linear numerator (Cx + D).',
    discriminantInfo: '\\Delta = 0 - 4(1)(1) = -4 < 0 \\implies \\text{irreducible}',
  },
];
