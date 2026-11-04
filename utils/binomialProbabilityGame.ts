import { GameMode, MathProblem } from '../types';

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function formatFrac(num: number, den: number): string {
  const g = gcd(num, den);
  const sNum = num / g;
  const sDen = den / g;
  if (sDen === 1) return sNum.toString();
  return `\\frac{${sNum}}{${sDen}}`;
}

function shuffle<T>(arr: T[]): T[] {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

// 1. Marbles / Balls in a Bag (With Replacement - Exact Binomial Probabilities)
function generateMarblesWithReplacementProblem(): MathProblem {
  const bagConfigs = [
    { blue: 6, red: 4 },   // total 10, p_red = 2/5, p_blue = 3/5
    { blue: 4, red: 6 },   // total 10, p_red = 3/5, p_blue = 2/5
    { blue: 8, red: 2 },   // total 10, p_red = 1/5, p_blue = 4/5
    { blue: 3, red: 5 },   // total 8,  p_red = 5/8, p_blue = 3/8
    { blue: 6, red: 2 },   // total 8,  p_red = 1/4, p_blue = 3/4
    { blue: 3, red: 6 },   // total 9,  p_red = 2/3, p_blue = 1/3
    { blue: 6, red: 3 },   // total 9,  p_red = 1/3, p_blue = 2/3
    { blue: 5, red: 5 },   // total 10, p_red = 1/2, p_blue = 1/2
    { blue: 9, red: 3 },   // total 12, p_red = 1/4, p_blue = 3/4
    { blue: 8, red: 4 }    // total 12, p_red = 1/3, p_blue = 2/3
  ];

  const cfg = bagConfigs[Math.floor(Math.random() * bagConfigs.length)];
  const total = cfg.blue + cfg.red;
  const g = gcd(cfg.red, total);
  const pNum = cfg.red / g; // red prob num
  const pDen = total / g;   // simplified den
  const qNum = pDen - pNum; // blue prob num

  const subType = Math.random();

  if (subType < 0.35) {
    // Drawing 2 marbles with replacement: BOTH are red (or BOTH are blue)
    const askRed = Math.random() < 0.7;
    const targetColor = askRed ? 'red' : 'blue';
    const tNum = askRed ? pNum : qNum;
    const oNum = askRed ? qNum : pNum;

    const correctNum = tNum * tNum;
    const correctDen = pDen * pDen;
    const correctStr = formatFrac(correctNum, correctDen);

    // Classic distractors: without replacement, 2*p*q, single draw p, or (1-p)^2
    const withoutRepNum = (askRed ? cfg.red : cfg.blue) * ((askRed ? cfg.red : cfg.blue) - 1);
    const withoutRepDen = total * (total - 1);

    const candDistractors = [
      formatFrac(withoutRepNum, withoutRepDen),
      formatFrac(2 * tNum * oNum, correctDen),
      formatFrac(oNum * oNum, correctDen),
      formatFrac(tNum, pDen),
      formatFrac(2 * tNum, correctDen)
    ].filter(d => d !== correctStr);

    const distractors = Array.from(new Set(candDistractors)).slice(0, 3);
    const options = shuffle([correctStr, ...distractors]);

    return {
      question: `\\text{There are } ${total} \\text{ marbles in a bag: } ${cfg.blue} \\text{ are blue and } ${cfg.red} \\text{ are red. What is the probability of drawing } 2 \\text{ marbles, with replacement, that are both ${targetColor}?}`,
      answer: options.indexOf(correctStr).toString(),
      options,
      type: 'algebra',
      mode: GameMode.METHODS_PROBABILITY
    };
  } else if (subType < 0.65) {
    // Drawing 2 marbles with replacement: EXACTLY ONE red and ONE blue
    const correctNum = 2 * pNum * qNum;
    const correctDen = pDen * pDen;
    const correctStr = formatFrac(correctNum, correctDen);

    const candDistractors = [
      formatFrac(pNum * qNum, correctDen), // forgot factor of 2!
      formatFrac(pNum * pNum, correctDen),
      formatFrac(qNum * qNum, correctDen),
      formatFrac(2 * cfg.red * cfg.blue, total * (total - 1))
    ].filter(d => d !== correctStr);

    const distractors = Array.from(new Set(candDistractors)).slice(0, 3);
    const options = shuffle([correctStr, ...distractors]);

    return {
      question: `\\text{A bag contains } ${total} \\text{ marbles: } ${cfg.blue} \\text{ are blue and } ${cfg.red} \\text{ are red. If } 2 \\text{ marbles are drawn with replacement, find the probability that exactly } 1 \\text{ is red:}`,
      answer: options.indexOf(correctStr).toString(),
      options,
      type: 'algebra',
      mode: GameMode.METHODS_PROBABILITY
    };
  } else if (subType < 0.85) {
    // Drawing 3 marbles with replacement: ALL 3 red, or EXACTLY 2 red
    const askExactly2 = Math.random() < 0.65;
    const correctDen = pDen * pDen * pDen;
    const correctNum = askExactly2 ? 3 * pNum * pNum * qNum : pNum * pNum * pNum;
    const correctStr = formatFrac(correctNum, correctDen);

    const candDistractors = [
      formatFrac(pNum * pNum * qNum, correctDen), // forgot C(3,2)=3
      formatFrac(3 * pNum * qNum * qNum, correctDen),
      formatFrac(pNum * pNum * pNum, correctDen),
      formatFrac(qNum * qNum * qNum, correctDen),
      formatFrac(3 * pNum * pNum * qNum, correctDen)
    ].filter(d => d !== correctStr);

    const distractors = Array.from(new Set(candDistractors)).slice(0, 3);
    const options = shuffle([correctStr, ...distractors]);

    return {
      question: `\\text{A bag contains } ${total} \\text{ marbles: } ${cfg.blue} \\text{ blue and } ${cfg.red} \\text{ red. Find the probability of drawing } 3 \\text{ marbles with replacement and getting ${askExactly2 ? 'exactly 2 red marbles' : 'all 3 red marbles'}:}`,
      answer: options.indexOf(correctStr).toString(),
      options,
      type: 'algebra',
      mode: GameMode.METHODS_PROBABILITY
    };
  } else {
    // Drawing 2 marbles with replacement: AT LEAST 1 red
    const correctDen = pDen * pDen;
    const correctNum = correctDen - qNum * qNum;
    const correctStr = formatFrac(correctNum, correctDen);

    const candDistractors = [
      formatFrac(2 * pNum * qNum, correctDen),
      formatFrac(pNum * pNum, correctDen),
      formatFrac(qNum * qNum, correctDen),
      formatFrac(correctDen - pNum * pNum, correctDen)
    ].filter(d => d !== correctStr);

    const distractors = Array.from(new Set(candDistractors)).slice(0, 3);
    const options = shuffle([correctStr, ...distractors]);

    return {
      question: `\\text{A bag contains } ${total} \\text{ marbles: } ${cfg.blue} \\text{ blue and } ${cfg.red} \\text{ red. Two marbles are drawn with replacement. Find the probability that at least } 1 \\text{ is red:}`,
      answer: options.indexOf(correctStr).toString(),
      options,
      type: 'algebra',
      mode: GameMode.METHODS_PROBABILITY
    };
  }
}

// 2. Explicit Binomial Distribution Exact Probabilities Pr(X = k) or Pr(X >= 1)
function generateBinomialExactValueProblem(): MathProblem {
  const nCr = (n: number, r: number): number => {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    let res = 1;
    for (let i = 1; i <= r; i++) {
      res = (res * (n - i + 1)) / i;
    }
    return Math.round(res);
  };

  const cases = [
    { n: 3, k: 2, pNum: 1, pDen: 3 },
    { n: 3, k: 1, pNum: 2, pDen: 5 },
    { n: 3, k: 2, pNum: 1, pDen: 4 },
    { n: 4, k: 2, pNum: 1, pDen: 3 },
    { n: 4, k: 3, pNum: 1, pDen: 2 },
    { n: 4, k: 1, pNum: 1, pDen: 4 },
    { n: 4, k: 2, pNum: 1, pDen: 2 },
    { n: 5, k: 3, pNum: 1, pDen: 2 },
    { n: 3, k: 2, pNum: 3, pDen: 5 }
  ];

  const c = cases[Math.floor(Math.random() * cases.length)];
  const qNum = c.pDen - c.pNum;
  const comb = nCr(c.n, c.k);

  const num = comb * Math.pow(c.pNum, c.k) * Math.pow(qNum, c.n - c.k);
  const den = Math.pow(c.pDen, c.n);
  const correctStr = formatFrac(num, den);

  // Distractors: forgetting nCr, swapping k and n-k, wrong power
  const noCombStr = formatFrac(Math.pow(c.pNum, c.k) * Math.pow(qNum, c.n - c.k), den);
  const swappedStr = formatFrac(comb * Math.pow(qNum, c.k) * Math.pow(c.pNum, c.n - c.k), den);
  const altK = c.k > 1 ? c.k - 1 : c.k + 1;
  const altStr = formatFrac(nCr(c.n, altK) * Math.pow(c.pNum, altK) * Math.pow(qNum, c.n - altK), den);
  const extraStr = formatFrac(Math.max(1, num - comb), den);

  const candDistractors = [noCombStr, swappedStr, altStr, extraStr].filter(d => d !== correctStr);
  const distractors = Array.from(new Set(candDistractors)).slice(0, 3);
  const options = shuffle([correctStr, ...distractors]);

  const pLatex = formatFrac(c.pNum, c.pDen);

  return {
    question: `\\text{Let } X \\sim \\text{Bi}\\left(${c.n}, ${pLatex}\\right)\\text{. Find the exact value of } \\Pr(X = ${c.k})\\text{:}`,
    answer: options.indexOf(correctStr).toString(),
    options,
    type: 'algebra',
    mode: GameMode.METHODS_PROBABILITY
  };
}

// 3. Binomial Mean, Variance & Finding Parameters (n, p)
function generateBinomialParametersProblem(): MathProblem {
  const problems = [
    {
      question: `\\text{Let } X \\sim \\text{Bi}(n, p) \\text{ have mean } \\text{E}(X) = 12 \\text{ and variance } \\text{Var}(X) = 4\\text{. Find } n \\text{ and } p\\text{:}`,
      correct: `n = 18, \\, p = \\frac{2}{3}`,
      distractors: [
        `n = 36, \\, p = \\frac{1}{3}`,
        `n = 16, \\, p = \\frac{3}{4}`,
        `n = 24, \\, p = \\frac{1}{2}`
      ]
    },
    {
      question: `\\text{Let } X \\sim \\text{Bi}(n, p) \\text{ have mean } \\text{E}(X) = 15 \\text{ and variance } \\text{Var}(X) = 6\\text{. Find } n \\text{ and } p\\text{:}`,
      correct: `n = 25, \\, p = \\frac{3}{5}`,
      distractors: [
        `n = 30, \\, p = \\frac{1}{2}`,
        `n = 25, \\, p = \\frac{2}{5}`,
        `n = 20, \\, p = \\frac{3}{4}`
      ]
    },
    {
      question: `\\text{Let } X \\sim \\text{Bi}(n, p) \\text{ have } \\text{E}(X) = 6 \\text{ and standard deviation } \\text{sd}(X) = 2\\text{. Find } p\\text{:}`,
      correct: `p = \\frac{1}{3}`,
      distractors: [
        `p = \\frac{2}{3}`,
        `p = \\frac{1}{2}`,
        `p = \\frac{1}{4}`
      ]
    },
    {
      question: `\\text{If } X \\sim \\text{Bi}\\left(n, \\frac{1}{2}\\right) \\text{ and } \\Pr(X \\ge 1) = \\frac{15}{16}\\text{, find the value of } n\\text{:}`,
      correct: `n = 4`,
      distractors: [`n = 3`, `n = 5`, `n = 8`]
    },
    {
      question: `\\text{If } X \\sim \\text{Bi}\\left(3, p\\right) \\text{ and } \\Pr(X = 0) = \\frac{8}{27}\\text{, find the value of } p\\text{:}`,
      correct: `p = \\frac{1}{3}`,
      distractors: [
        `p = \\frac{2}{3}`,
        `p = \\frac{1}{9}`,
        `p = \\frac{19}{27}`
      ]
    },
    {
      question: `\\text{If } X \\sim \\text{Bi}\\left(4, p\\right) \\text{ and } \\Pr(X \\ge 1) = \\frac{65}{81}\\text{, find the value of } p\\text{:}`,
      correct: `p = \\frac{1}{3}`,
      distractors: [
        `p = \\frac{2}{3}`,
        `p = \\frac{1}{4}`,
        `p = \\frac{3}{4}`
      ]
    }
  ];

  const p = problems[Math.floor(Math.random() * problems.length)];
  const options = shuffle([p.correct, ...p.distractors]);

  return {
    question: p.question,
    answer: options.indexOf(p.correct).toString(),
    options,
    type: 'algebra',
    mode: GameMode.METHODS_PROBABILITY
  };
}

export function generateBinomialProbabilityProblem(): MathProblem {
  const roll = Math.random();
  if (roll < 0.48) {
    return generateMarblesWithReplacementProblem();
  } else if (roll < 0.78) {
    return generateBinomialExactValueProblem();
  } else {
    return generateBinomialParametersProblem();
  }
}
