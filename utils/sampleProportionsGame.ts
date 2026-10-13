import { GameMode, MathProblem, StepItem, MarginDetails } from '../types';

export interface MarginCase {
  z: number;
  pNum: number;
  pDen: number;
  pDec?: number;
  n: number;
  p1pNum: number;
  p1pDen: number;
  varNum: number;
  varDen: number;
  sdNum: number;
  sdDen: number;
  mNum: number;
  mDen: number;
  unreducedMNum?: number;
  unreducedMDen?: number;
}

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
  if (den === 1) return num.toString();
  return `\\frac{${num}}{${den}}`;
}

function shuffle<T>(arr: T[]): T[] {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

// Curated cases where p*(1-p)/n cancels to clean perfect squares, all fractions
export const MARGIN_CASES: MarginCase[] = [
  {
    z: 2,
    pNum: 1, pDen: 5,
    n: 16,
    p1pNum: 4, p1pDen: 25,
    varNum: 1, varDen: 100,
    sdNum: 1, sdDen: 10,
    mNum: 1, mDen: 5,
    unreducedMNum: 2, unreducedMDen: 10
  },
  {
    z: 2,
    pNum: 4, pDen: 5,
    n: 16,
    p1pNum: 4, p1pDen: 25,
    varNum: 1, varDen: 100,
    sdNum: 1, sdDen: 10,
    mNum: 1, mDen: 5,
    unreducedMNum: 2, unreducedMDen: 10
  },
  {
    z: 2,
    pNum: 1, pDen: 2,
    n: 25,
    p1pNum: 1, p1pDen: 4,
    varNum: 1, varDen: 100,
    sdNum: 1, sdDen: 10,
    mNum: 1, mDen: 5,
    unreducedMNum: 2, unreducedMDen: 10
  },
  {
    z: 2,
    pNum: 1, pDen: 4,
    n: 48,
    p1pNum: 3, p1pDen: 16,
    varNum: 1, varDen: 256,
    sdNum: 1, sdDen: 16,
    mNum: 1, mDen: 8,
    unreducedMNum: 2, unreducedMDen: 16
  },
  {
    z: 2,
    pNum: 3, pDen: 4,
    n: 48,
    p1pNum: 3, p1pDen: 16,
    varNum: 1, varDen: 256,
    sdNum: 1, sdDen: 16,
    mNum: 1, mDen: 8,
    unreducedMNum: 2, unreducedMDen: 16
  },
  {
    z: 2,
    pNum: 1, pDen: 2,
    n: 64,
    p1pNum: 1, p1pDen: 4,
    varNum: 1, varDen: 256,
    sdNum: 1, sdDen: 16,
    mNum: 1, mDen: 8,
    unreducedMNum: 2, unreducedMDen: 16
  },
  {
    z: 2,
    pNum: 3, pDen: 5,
    n: 96,
    p1pNum: 6, p1pDen: 25,
    varNum: 1, varDen: 400,
    sdNum: 1, sdDen: 20,
    mNum: 1, mDen: 10,
    unreducedMNum: 2, unreducedMDen: 20
  },
  {
    z: 2,
    pNum: 2, pDen: 5,
    n: 96,
    p1pNum: 6, p1pDen: 25,
    varNum: 1, varDen: 400,
    sdNum: 1, sdDen: 20,
    mNum: 1, mDen: 10,
    unreducedMNum: 2, unreducedMDen: 20
  },
  {
    z: 2,
    pNum: 1, pDen: 5,
    n: 64,
    p1pNum: 4, p1pDen: 25,
    varNum: 1, varDen: 400,
    sdNum: 1, sdDen: 20,
    mNum: 1, mDen: 10,
    unreducedMNum: 2, unreducedMDen: 20
  },
  {
    z: 2,
    pNum: 4, pDen: 5,
    n: 64,
    p1pNum: 4, p1pDen: 25,
    varNum: 1, varDen: 400,
    sdNum: 1, sdDen: 20,
    mNum: 1, mDen: 10,
    unreducedMNum: 2, unreducedMDen: 20
  },
  {
    z: 2,
    pNum: 1, pDen: 2,
    n: 100,
    p1pNum: 1, p1pDen: 4,
    varNum: 1, varDen: 400,
    sdNum: 1, sdDen: 20,
    mNum: 1, mDen: 10,
    unreducedMNum: 2, unreducedMDen: 20
  },
  {
    z: 2,
    pNum: 3, pDen: 10,
    n: 84,
    p1pNum: 21, p1pDen: 100,
    varNum: 1, varDen: 400,
    sdNum: 1, sdDen: 20,
    mNum: 1, mDen: 10,
    unreducedMNum: 2, unreducedMDen: 20
  },
  {
    z: 2,
    pNum: 7, pDen: 10,
    n: 84,
    p1pNum: 21, p1pDen: 100,
    varNum: 1, varDen: 400,
    sdNum: 1, sdDen: 20,
    mNum: 1, mDen: 10,
    unreducedMNum: 2, unreducedMDen: 20
  },
  {
    z: 3,
    pNum: 2, pDen: 5,
    n: 54,
    p1pNum: 6, p1pDen: 25,
    varNum: 1, varDen: 225,
    sdNum: 1, sdDen: 15,
    mNum: 1, mDen: 5,
    unreducedMNum: 3, unreducedMDen: 15
  },
  {
    z: 3,
    pNum: 3, pDen: 5,
    n: 54,
    p1pNum: 6, p1pDen: 25,
    varNum: 1, varDen: 225,
    sdNum: 1, sdDen: 15,
    mNum: 1, mDen: 5,
    unreducedMNum: 3, unreducedMDen: 15
  },
  {
    z: 3,
    pNum: 1, pDen: 10,
    n: 81,
    p1pNum: 9, p1pDen: 100,
    varNum: 1, varDen: 900,
    sdNum: 1, sdDen: 30,
    mNum: 1, mDen: 10,
    unreducedMNum: 3, unreducedMDen: 30
  },
  {
    z: 3,
    pNum: 9, pDen: 10,
    n: 81,
    p1pNum: 9, p1pDen: 100,
    varNum: 1, varDen: 900,
    sdNum: 1, sdDen: 30,
    mNum: 1, mDen: 10,
    unreducedMNum: 3, unreducedMDen: 30
  },
  {
    z: 2,
    pNum: 1, pDen: 3,
    n: 32,
    p1pNum: 2, p1pDen: 9,
    varNum: 1, varDen: 144,
    sdNum: 1, sdDen: 12,
    mNum: 1, mDen: 6,
    unreducedMNum: 2, unreducedMDen: 12
  },
  {
    z: 2,
    pNum: 2, pDen: 3,
    n: 32,
    p1pNum: 2, p1pDen: 9,
    varNum: 1, varDen: 144,
    sdNum: 1, sdDen: 12,
    mNum: 1, mDen: 6,
    unreducedMNum: 2, unreducedMDen: 12
  },
  {
    z: 1,
    pNum: 1, pDen: 5,
    n: 16,
    p1pNum: 4, p1pDen: 25,
    varNum: 1, varDen: 100,
    sdNum: 1, sdDen: 10,
    mNum: 1, mDen: 10,
    unreducedMNum: 1, unreducedMDen: 10
  },
  {
    z: 1,
    pNum: 1, pDen: 2,
    n: 25,
    p1pNum: 1, p1pDen: 4,
    varNum: 1, varDen: 100,
    sdNum: 1, sdDen: 10,
    mNum: 1, mDen: 10,
    unreducedMNum: 1, unreducedMDen: 10
  },
  {
    z: 2,
    pNum: 1, pDen: 10,
    n: 100,
    p1pNum: 9, p1pDen: 100,
    varNum: 9, varDen: 10000,
    sdNum: 3, sdDen: 100,
    mNum: 3, mDen: 50,
    unreducedMNum: 6, unreducedMDen: 100
  },
  {
    z: 2,
    pNum: 9, pDen: 10,
    n: 100,
    p1pNum: 9, p1pDen: 100,
    varNum: 9, varDen: 10000,
    sdNum: 3, sdDen: 100,
    mNum: 3, mDen: 50,
    unreducedMNum: 6, unreducedMDen: 100
  }
];

// 1. Z-Score and Confidence Level (Mental Math)
function generateZScoreProblem(): MathProblem {
  const isReverse = Math.random() < 0.45;
  if (isReverse) {
    const items = [
      { z: 1, level: '68\\%', distractors: ['95\\%', '99.7\\%', '90\\%'] },
      { z: 2, level: '95\\%', distractors: ['68\\%', '99.7\\%', '90\\%'] },
      { z: 3, level: '99.7\\%', distractors: ['95\\%', '68\\%', '99\\%'] }
    ];
    const item = items[Math.floor(Math.random() * items.length)];
    const options = shuffle([item.level, ...item.distractors]);
    const answerIndex = options.indexOf(item.level).toString();

    return {
      question: `\\text{Which confidence level corresponds to an approximate } z = ${item.z}\\text{?}`,
      answer: answerIndex,
      options,
      type: 'algebra',
      mode: GameMode.METHODS_SAMPLE_PROPORTIONS
    };
  } else {
    const items = [
      { level: '68\\%', z: 'z \\approx 1', distractors: ['z \\approx 2', 'z \\approx 3', 'z \\approx 1.96'] },
      { level: '95\\%', z: 'z \\approx 2', distractors: ['z \\approx 1', 'z \\approx 3', 'z \\approx 1.64'] },
      { level: '99.7\\%', z: 'z \\approx 3', distractors: ['z \\approx 2', 'z \\approx 1', 'z \\approx 2.58'] }
    ];
    const item = items[Math.floor(Math.random() * items.length)];
    const options = shuffle([item.z, ...item.distractors]);
    const answerIndex = options.indexOf(item.z).toString();

    return {
      question: `\\text{What approximate } z\\text{-score is used for a } ${item.level} \\text{ confidence interval?}`,
      answer: answerIndex,
      options,
      type: 'algebra',
      mode: GameMode.METHODS_SAMPLE_PROPORTIONS
    };
  }
}

// 2. Given the sample proportion find the sample size (Quick Mental Math: n = x / p_hat)
function generateSampleSizeProblem(): MathProblem {
  const contexts = [
    { label: 'defective sensors', pNum: 1, pDen: 5, pStr: '\\frac{1}{5}', pDec: '0.2', x: 12, n: 60 },
    { label: 'cyclists', pNum: 1, pDen: 4, pStr: '\\frac{1}{4}', pDec: '0.25', x: 15, n: 60 },
    { label: 'households with solar', pNum: 1, pDen: 2, pStr: '\\frac{1}{2}', pDec: '0.5', x: 35, n: 70 },
    { label: 'students passing a test', pNum: 3, pDen: 4, pStr: '\\frac{3}{4}', pDec: '0.75', x: 36, n: 48 },
    { label: 'heavy luggage items', pNum: 1, pDen: 10, pStr: '\\frac{1}{10}', pDec: '0.1', x: 18, n: 180 },
    { label: 'seedlings germinated', pNum: 2, pDen: 5, pStr: '\\frac{2}{5}', pDec: '0.4', x: 24, n: 60 },
    { label: 'voters supporting motion', pNum: 3, pDen: 5, pStr: '\\frac{3}{5}', pDec: '0.6', x: 45, n: 75 },
    { label: 'apples with blemishes', pNum: 1, pDen: 5, pStr: '\\frac{1}{5}', pDec: '0.2', x: 25, n: 125 },
    { label: 'subscribers', pNum: 1, pDen: 4, pStr: '\\frac{1}{4}', pDec: '0.25', x: 20, n: 80 },
    { label: 'electric cars', pNum: 1, pDen: 10, pStr: '\\frac{1}{10}', pDec: '0.1', x: 14, n: 140 }
  ];

  const c = contexts[Math.floor(Math.random() * contexts.length)];
  const useFrac = Math.random() < 0.5;
  const pDisplay = useFrac ? c.pStr : c.pDec;

  const correctOpt = `n = ${c.n}`;
  const distCandidates = [
    c.n * 2,
    Math.round(c.n / 2),
    c.x * 10,
    c.n + c.x,
    Math.max(20, c.n - c.x)
  ].filter(v => v !== c.n);

  const distractors = Array.from(new Set(distCandidates)).slice(0, 3).map(d => `n = ${d}`);
  const opts = shuffle([correctOpt, ...distractors]);

  return {
    question: `\\text{In a survey, } \\hat{p} = ${pDisplay} \\text{ from } ${c.x} \\text{ observed ${c.label}. Find } n\\text{: }`,
    answer: opts.indexOf(correctOpt).toString(),
    options: opts,
    type: 'algebra',
    mode: GameMode.METHODS_SAMPLE_PROPORTIONS
  };
}

// 3. Given the sample size find the sample proportion (Natural wording, clean fractions)
function generateSampleProportionProblem(): MathProblem {
  const problems = [
    { n: 24, x: 18, pNum: 3, pDen: 4, pDec: '0.75', text: 'In a class of 24 students, 18 passed the test.' },
    { n: 50, x: 10, pNum: 1, pDen: 5, pDec: '0.2', text: 'In a sample of 50 passengers, 10 carried heavy bags.' },
    { n: 40, x: 14, pNum: 7, pDen: 20, pDec: '0.35', text: 'In a sample of 40 trees, 14 are newly planted.' },
    { n: 200, x: 30, pNum: 3, pDen: 20, pDec: '0.15', text: 'In a batch of 200 sensors, 30 were defective.' },
    { n: 80, x: 20, pNum: 1, pDen: 4, pDec: '0.25', text: 'In a sample of 80 commuters, 20 are cyclists.' },
    { n: 60, x: 36, pNum: 3, pDen: 5, pDec: '0.6', text: 'In a survey of 60 residents, 36 support the park.' },
    { n: 25, x: 5, pNum: 1, pDen: 5, pDec: '0.2', text: 'In a sample of 25 products, 5 are defective.' },
    { n: 100, x: 45, pNum: 9, pDen: 20, pDec: '0.45', text: 'In a sample of 100 households, 45 have solar panels.' },
    { n: 30, x: 12, pNum: 2, pDen: 5, pDec: '0.4', text: 'In a sample of 30 flowers, 12 bloomed early.' },
    { n: 75, x: 15, pNum: 1, pDen: 5, pDec: '0.2', text: 'In a sample of 75 devices, 15 require an update.' },
    { n: 48, x: 36, pNum: 3, pDen: 4, pDec: '0.75', text: 'In a sample of 48 candidates, 36 passed the interview.' }
  ];

  const p = problems[Math.floor(Math.random() * problems.length)];
  const correctFrac = formatFrac(p.pNum, p.pDen);
  const correctOpt = `\\hat{p} = ${correctFrac}`;

  const wrongFracs = [
    formatFrac(p.pDen - p.pNum, p.pDen),
    formatFrac(1, p.pDen),
    formatFrac(p.pNum, p.pDen * 2),
    formatFrac(Math.min(p.pNum + 1, p.pDen - 1), p.pDen)
  ].filter(f => f !== correctFrac);

  const distractors = Array.from(new Set(wrongFracs)).slice(0, 3).map(f => `\\hat{p} = ${f}`);
  const opts = shuffle([correctOpt, ...distractors]);

  return {
    question: `\\text{${p.text} Find the sample proportion } \\hat{p}\\text{: }`,
    answer: opts.indexOf(correctOpt).toString(),
    options: opts,
    type: 'algebra',
    mode: GameMode.METHODS_SAMPLE_PROPORTIONS
  };
}

// 4. Given confidence interval (nice numbers), find width / margin / sample mean (p_hat)
// All margin questions write answers as FRACTIONS as requested!
function generateConfidenceIntervalProblem(): MathProblem {
  const ciList = [
    { aStr: '0.40', bStr: '0.60', pNum: 1, pDen: 2, mNum: 1, mDen: 10, wNum: 1, wDen: 5 },
    { aStr: '0.30', bStr: '0.70', pNum: 1, pDen: 2, mNum: 1, mDen: 5, wNum: 2, wDen: 5 },
    { aStr: '0.25', bStr: '0.75', pNum: 1, pDen: 2, mNum: 1, mDen: 4, wNum: 1, wDen: 2 },
    { aStr: '0.10', bStr: '0.50', pNum: 3, pDen: 10, mNum: 1, mDen: 5, wNum: 2, wDen: 5 },
    { aStr: '0.20', bStr: '0.60', pNum: 2, pDen: 5, mNum: 1, mDen: 5, wNum: 2, wDen: 5 },
    { aStr: '0.15', bStr: '0.45', pNum: 3, pDen: 10, mNum: 3, mDen: 20, wNum: 3, wDen: 10 },
    { aStr: '0.70', bStr: '0.90', pNum: 4, pDen: 5, mNum: 1, mDen: 10, wNum: 1, wDen: 5 },
    { aStr: '0.65', bStr: '0.85', pNum: 3, pDen: 4, mNum: 1, mDen: 10, wNum: 1, wDen: 5 },
    { aStr: '0.04', bStr: '0.16', pNum: 1, pDen: 10, mNum: 3, mDen: 50, wNum: 3, wDen: 25 },
    { aStr: '0.12', bStr: '0.28', pNum: 1, pDen: 5, mNum: 2, mDen: 25, wNum: 4, wDen: 25 },
    { aStr: '0.32', bStr: '0.48', pNum: 2, pDen: 5, mNum: 2, mDen: 25, wNum: 4, wDen: 25 },
    { aStr: '0.24', bStr: '0.56', pNum: 2, pDen: 5, mNum: 4, mDen: 25, wNum: 8, wDen: 25 }
  ];

  const roll = Math.random();
  const c = ciList[Math.floor(Math.random() * ciList.length)];

  if (roll < 0.38) {
    // Find Margin of error M as a fraction!
    const correctFrac = formatFrac(c.mNum, c.mDen);
    const correctOpt = `M = ${correctFrac}`;
    const wrong = [
      formatFrac(c.wNum, c.wDen), // width (2M)
      formatFrac(c.mNum, c.mDen * 2), // M / 2
      formatFrac(c.pNum, c.pDen), // p_hat
      formatFrac(1, c.mDen)
    ].filter(f => f !== correctFrac);

    const opts = shuffle([correctOpt, ...Array.from(new Set(wrong)).slice(0, 3).map(f => `M = ${f}`)]);
    return {
      question: `\\text{Given confidence interval } (${c.aStr}, ${c.bStr})\\text{, find margin of error } M\\text{: }`,
      answer: opts.indexOf(correctOpt).toString(),
      options: opts,
      type: 'algebra',
      mode: GameMode.METHODS_SAMPLE_PROPORTIONS
    };
  } else if (roll < 0.72) {
    // Find sample mean / sample proportion p_hat (center of interval)
    const correctFrac = formatFrac(c.pNum, c.pDen);
    const pDec = (c.pNum / c.pDen).toFixed(2).replace(/0$/, '').replace(/\.0$/, '');
    const correctOpt = `\\hat{p} = ${correctFrac}`;
    const wrong = [
      formatFrac(c.mNum, c.mDen),
      formatFrac(c.pDen - c.pNum, c.pDen),
      formatFrac(c.pNum, c.pDen * 2),
      formatFrac(1, c.pDen)
    ].filter(f => f !== correctFrac);

    const opts = shuffle([correctOpt, ...Array.from(new Set(wrong)).slice(0, 3).map(f => `\\hat{p} = ${f}`)]);
    return {
      question: `\\text{Given confidence interval } (${c.aStr}, ${c.bStr})\\text{, find the sample proportion } \\hat{p}\\text{: }`,
      answer: opts.indexOf(correctOpt).toString(),
      options: opts,
      type: 'algebra',
      mode: GameMode.METHODS_SAMPLE_PROPORTIONS
    };
  } else {
    // Factor changes on CI width (VCE Exam 1 style)
    const factorQuestions = [
      {
        q: '\\text{If sample size } n \\text{ is multiplied by } 4\\text{, the CI width is multiplied by:}',
        ans: '\\frac{1}{2}',
        distractors: ['\\frac{1}{4}', '2', '4']
      },
      {
        q: '\\text{If sample size } n \\text{ is multiplied by } 9\\text{, the CI width is multiplied by:}',
        ans: '\\frac{1}{3}',
        distractors: ['\\frac{1}{9}', '3', '\\frac{1}{6}']
      },
      {
        q: '\\text{If sample size } n \\text{ is multiplied by } 16\\text{, the CI width is multiplied by:}',
        ans: '\\frac{1}{4}',
        distractors: ['\\frac{1}{16}', '4', '\\frac{1}{8}']
      },
      {
        q: '\\text{To halve } (\\times \\frac{1}{2}) \\text{ the width of a CI, } n \\text{ must be multiplied by:}',
        ans: '4',
        distractors: ['2', '8', '16']
      },
      {
        q: '\\text{To reduce CI width by a factor of } \\frac{1}{3}\\text{, } n \\text{ must be multiplied by:}',
        ans: '9',
        distractors: ['3', '6', '27']
      }
    ];
    const fq = factorQuestions[Math.floor(Math.random() * factorQuestions.length)];
    const opts = shuffle([fq.ans, ...fq.distractors]);

    return {
      question: fq.q,
      answer: opts.indexOf(fq.ans).toString(),
      options: opts,
      type: 'algebra',
      mode: GameMode.METHODS_SAMPLE_PROPORTIONS
    };
  }
}

// 5. State underlying binomial distribution & E(P_hat)
// User feedback: "Ensure the values actually vary for the binomial distribution questions. I like the E(Phat) questions."
function generateBinomialProblem(): MathProblem {
  const subType = Math.random();

  if (subType < 0.48) {
    // E(P_hat) questions - richly varied values!
    const pCandidates = [
      { str: '0.18', num: 9, den: 50 },
      { str: '0.24', num: 6, den: 25 },
      { str: '0.35', num: 7, den: 20 },
      { str: '0.42', num: 21, den: 50 },
      { str: '0.55', num: 11, den: 20 },
      { str: '0.64', num: 16, den: 25 },
      { str: '0.72', num: 18, den: 25 },
      { str: '0.81', num: 81, den: 100 },
      { str: '0.28', num: 7, den: 25 },
      { str: '0.45', num: 9, den: 20 },
      { str: '0.65', num: 13, den: 20 },
      { str: '0.15', num: 3, den: 20 },
      { str: '\\frac{1}{3}', num: 1, den: 3 },
      { str: '\\frac{2}{3}', num: 2, den: 3 },
      { str: '\\frac{3}{5}', num: 3, den: 5 },
      { str: '\\frac{4}{7}', num: 4, den: 7 },
      { str: '\\frac{3}{8}', num: 3, den: 8 },
      { str: '\\frac{5}{8}', num: 5, den: 8 },
      { str: '\\frac{5}{12}', num: 5, den: 12 },
      { str: '\\frac{7}{10}', num: 7, den: 10 }
    ];

    const nCandidates = [25, 30, 40, 50, 60, 75, 80, 100, 150, 200, 250, 500];
    const pItem = pCandidates[Math.floor(Math.random() * pCandidates.length)];
    const n = nCandidates[Math.floor(Math.random() * nCandidates.length)];

    const pVal = pItem.num / pItem.den;
    const correctOpt = `\\text{E}(\\hat{P}) = ${pItem.str}`;

    const dist1 = `\\text{E}(\\hat{P}) = ${Math.round(n * pVal)}`;
    const dist2 = `\\text{E}(\\hat{P}) = ${pItem.str.includes('\\frac') ? formatFrac(pItem.den - pItem.num, pItem.den) : (1 - pVal).toFixed(2)}`;
    const dist3 = `\\text{E}(\\hat{P}) = ${(pVal * (1 - pVal)).toFixed(2)}`;

    const opts = shuffle([correctOpt, dist1, dist2, dist3]);

    return {
      question: `\\text{Given population proportion } p = ${pItem.str} \\text{ and random sample size } n = ${n}\\text{, find } \\text{E}(\\hat{P})\\text{: }`,
      answer: opts.indexOf(correctOpt).toString(),
      options: opts,
      type: 'algebra',
      mode: GameMode.METHODS_SAMPLE_PROPORTIONS
    };
  } else if (subType < 0.76) {
    // State distribution of X = n*P_hat (varied dynamically!)
    const nValues = [12, 15, 20, 24, 25, 30, 36, 40, 48, 50, 60, 75, 80, 100];
    const pValues = [
      { str: '\\frac{1}{3}', alt: '\\frac{2}{3}' },
      { str: '\\frac{2}{3}', alt: '\\frac{1}{3}' },
      { str: '\\frac{1}{4}', alt: '\\frac{3}{4}' },
      { str: '\\frac{3}{4}', alt: '\\frac{1}{4}' },
      { str: '\\frac{1}{5}', alt: '\\frac{4}{5}' },
      { str: '\\frac{2}{5}', alt: '\\frac{3}{5}' },
      { str: '\\frac{3}{5}', alt: '\\frac{2}{5}' },
      { str: '\\frac{1}{6}', alt: '\\frac{5}{6}' },
      { str: '0.2', alt: '0.8' },
      { str: '0.3', alt: '0.7' },
      { str: '0.4', alt: '0.6' },
      { str: '0.7', alt: '0.3' },
      { str: '0.8', alt: '0.2' }
    ];

    const n = nValues[Math.floor(Math.random() * nValues.length)];
    const p = pValues[Math.floor(Math.random() * pValues.length)];

    const correctDist = `X \\sim \\text{Bi}\\left(${n}, ${p.str}\\right)`;
    const dist1 = `X \\sim \\text{Bi}\\left(${n}, ${p.alt}\\right)`;
    const dist2 = `X \\sim \\text{N}\\left(${n}, ${p.str}\\right)`;
    const dist3 = `X \\sim \\text{Bi}\\left(${Math.round(n / 2)}, ${p.str}\\right)`;

    const opts = shuffle([correctDist, dist1, dist2, dist3]);

    return {
      question: `\\text{In samples of size } n = ${n} \\text{ with population proportion } p = ${p.str}\\text{, state the distribution of } X = n\\hat{P}\\text{: }`,
      answer: opts.indexOf(correctDist).toString(),
      options: opts,
      type: 'algebra',
      mode: GameMode.METHODS_SAMPLE_PROPORTIONS
    };
  } else {
    // Rewriting Pr(P_hat ineq c) in terms of X = n*P_hat (varied dynamically!)
    const configs = [
      { n: 20, k: 5, ineq: '\\le', pStr: '0.25' },
      { n: 20, k: 6, ineq: '\\ge', pStr: '0.3' },
      { n: 40, k: 10, ineq: '<', pStr: '0.25' },
      { n: 40, k: 14, ineq: '>', pStr: '0.35' },
      { n: 50, k: 5, ineq: '\\le', pStr: '0.1' },
      { n: 50, k: 15, ineq: '\\ge', pStr: '0.3' },
      { n: 25, k: 10, ineq: '\\le', pStr: '0.4' },
      { n: 30, k: 6, ineq: '>', pStr: '0.2' },
      { n: 10, k: 2, ineq: '\\le', pStr: '\\frac{1}{5}' },
      { n: 15, k: 5, ineq: '<', pStr: '\\frac{1}{3}' },
      { n: 60, k: 20, ineq: '\\ge', pStr: '\\frac{1}{3}' }
    ];

    const c = configs[Math.floor(Math.random() * configs.length)];
    const correctOpt = `\\Pr(X ${c.ineq} ${c.k})`;
    const dist1 = `\\Pr(X ${c.ineq} ${c.k - 1})`;
    const dist2 = `\\Pr(X ${c.ineq === '\\le' ? '<' : c.ineq === '\\ge' ? '>' : c.ineq === '<' ? '\\le' : '\\ge'} ${c.k})`;
    const dist3 = `\\Pr(X = ${c.k})`;

    const opts = shuffle([correctOpt, dist1, dist2, dist3]);

    return {
      question: `\\text{For } n = ${c.n}\\text{, express } \\Pr(\\hat{P} ${c.ineq} ${c.pStr}) \\text{ in terms of } X = n\\hat{P}\\text{: }`,
      answer: opts.indexOf(correctOpt).toString(),
      options: opts,
      type: 'algebra',
      mode: GameMode.METHODS_SAMPLE_PROPORTIONS
    };
  }
}

// 6. Simplifying the margin step by step: M = z * sqrt( p*(1-p)/n )
// Now supports clean fraction values and Answer Box working lines!
export function generateMarginStepsProblem(mode: GameMode = GameMode.METHODS_MARGIN_STEPS): MathProblem {
  const c = MARGIN_CASES[Math.floor(Math.random() * MARGIN_CASES.length)];

  const pFrac = formatFrac(c.pNum, c.pDen);
  const qNum = c.pDen - c.pNum;
  const qFrac = formatFrac(qNum, c.pDen);

  const p1pFrac = formatFrac(c.p1pNum, c.p1pDen);
  const varFrac = formatFrac(c.varNum, c.varDen);
  const sdFrac = formatFrac(c.sdNum, c.sdDen);
  const mFrac = formatFrac(c.mNum, c.mDen);
  const unreducedMFrac = c.unreducedMNum && c.unreducedMDen ? formatFrac(c.unreducedMNum, c.unreducedMDen) : mFrac;

  const marginDetails: MarginDetails = {
    z: c.z,
    pStr: pFrac,
    qStr: qFrac,
    pNum: c.pNum,
    pDen: c.pDen,
    n: c.n,
    p1pNum: c.p1pNum,
    p1pDen: c.p1pDen,
    p1pStr: p1pFrac,
    varNum: c.varNum,
    varDen: c.varDen,
    varStr: varFrac,
    sdNum: c.sdNum,
    sdDen: c.sdDen,
    sdStr: sdFrac,
    mNum: c.mNum,
    mDen: c.mDen,
    mStr: mFrac,
    unreducedMStr: unreducedMFrac
  };

  const steps: StepItem[] = [
    {
      stepTitle: 'Step 1: Simplify \\hat{p}(1-\\hat{p})',
      description: `Calculate \\hat{p}(1-\\hat{p}) = ${pFrac} \\times ${qFrac}`,
      expression: `${pFrac} \\times ${qFrac}`,
      options: [p1pFrac],
      answer: p1pFrac,
      resultText: `\\hat{p}(1-\\hat{p}) = ${p1pFrac}`
    },
    {
      stepTitle: 'Step 2: Divide by n and simplify \\frac{\\hat{p}(1-\\hat{p})}{n}',
      description: `Divide by n = ${c.n} and cancel common factors`,
      expression: `\\frac{${p1pFrac}}{${c.n}}`,
      options: [varFrac],
      answer: varFrac,
      resultText: `\\frac{\\hat{p}(1-\\hat{p})}{n} = ${varFrac}`
    },
    {
      stepTitle: 'Step 3: Evaluate \\text{sd}(\\hat{P}) = \\sqrt{\\frac{\\hat{p}(1-\\hat{p})}{n}}',
      description: `Take the square root of numerator and denominator`,
      expression: `\\sqrt{${varFrac}}`,
      options: [sdFrac],
      answer: sdFrac,
      resultText: `\\text{sd}(\\hat{P}) = ${sdFrac}`
    },
    {
      stepTitle: `Step 4: Multiply by z = ${c.z} to find Margin M`,
      description: `Calculate M = ${c.z} \\times ${sdFrac} and reduce to simplest fraction`,
      expression: `${c.z} \\times ${sdFrac}`,
      options: [mFrac],
      answer: mFrac,
      resultText: `M = ${mFrac}`
    }
  ];

  return {
    question: `\\text{Simplify margin } M = z\\sqrt{\\frac{\\hat{p}(1-\\hat{p})}{n}} \\text{ for } z = ${c.z}, \\, \\hat{p} = ${pFrac}, \\, n = ${c.n}`,
    answer: mFrac,
    type: 'steps',
    steps,
    stepGiven: {
      z: c.z,
      p: pFrac,
      n: c.n
    },
    marginDetails,
    mode
  };
}

// Master generator for Sample Proportions
export function generateSampleProportionsProblem(mode: GameMode = GameMode.METHODS_SAMPLE_PROPORTIONS): MathProblem {
  if (mode === GameMode.METHODS_MARGIN_STEPS) {
    return generateMarginStepsProblem(mode);
  }

  // Mixed mode: distribute evenly across skills with extra weight on binomial & CI
  const roll = Math.random();

  if (roll < 0.18) {
    return generateZScoreProblem();
  } else if (roll < 0.36) {
    return generateSampleSizeProblem();
  } else if (roll < 0.54) {
    return generateSampleProportionProblem();
  } else if (roll < 0.77) {
    return generateBinomialProblem();
  } else {
    return generateConfidenceIntervalProblem();
  }
}
