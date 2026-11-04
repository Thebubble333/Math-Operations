import { GameMode, MathProblem, NormalDiagramConfig } from '../types';

function shuffle<T>(arr: T[]): T[] {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

// 1. Conditional & Interval Probability with two parameters (e.g. Pr(X < a) = m and Pr(X > b) = n)
function generateTwoParamConditionalProblem(): MathProblem {
  const paramPairs = [
    { p1: 'm', p2: 'n' },
    { p1: 'p', p2: 'q' },
    { p1: 'u', p2: 'v' },
    { p1: 'c', p2: 'd' }
  ];
  const { p1, p2 } = paramPairs[Math.floor(Math.random() * paramPairs.length)];

  const boundPairs = [
    { a: 'a', b: 'b' },
    { a: 'x_1', b: 'x_2' },
    { a: 'k_1', b: 'k_2' }
  ];
  const { a, b } = boundPairs[Math.floor(Math.random() * boundPairs.length)];

  const templates = [
    // Classic: Pr(X < a) = m, Pr(X > b) = n, find Pr(X > a | X < b)
    {
      question: `\\text{Let } X \\text{ be a normally distributed random variable with } ${a} < ${b}\\text{. Given } \\Pr(X < ${a}) = ${p1} \\text{ and } \\Pr(X > ${b}) = ${p2}\\text{, express } \\Pr(X > ${a} \\mid X < ${b}) \\text{ in terms of } ${p1} \\text{ and } ${p2}\\text{:}`,
      correct: `\\frac{1 - ${p1} - ${p2}}{1 - ${p2}}`,
      distractors: [
        `\\frac{1 - ${p1} - ${p2}}{1 - ${p1}}`,
        `\\frac{1 - ${p1}}{1 - ${p2}}`,
        `1 - ${p1} - ${p2}`
      ],
      diagram: {
        leftZ: -1.1,
        leftLabel: a,
        leftAreaLabel: p1,
        rightZ: 1.3,
        rightLabel: b,
        rightAreaLabel: p2,
        shadeRegion: 'between'
      } as NormalDiagramConfig
    },
    // Reverse condition: Pr(X < a) = m, Pr(X > b) = n, find Pr(X < b | X > a)
    {
      question: `\\text{Let } X \\text{ be a normally distributed random variable with } ${a} < ${b}\\text{. Given } \\Pr(X < ${a}) = ${p1} \\text{ and } \\Pr(X > ${b}) = ${p2}\\text{, express } \\Pr(X < ${b} \\mid X > ${a}) \\text{ in terms of } ${p1} \\text{ and } ${p2}\\text{:}`,
      correct: `\\frac{1 - ${p1} - ${p2}}{1 - ${p1}}`,
      distractors: [
        `\\frac{1 - ${p1} - ${p2}}{1 - ${p2}}`,
        `\\frac{1 - ${p2}}{1 - ${p1}}`,
        `\\frac{${p1} + ${p2}}{1 - ${p1}}`
      ],
      diagram: {
        leftZ: -1.2,
        leftLabel: a,
        leftAreaLabel: p1,
        rightZ: 1.0,
        rightLabel: b,
        rightAreaLabel: p2,
        shadeRegion: 'between'
      } as NormalDiagramConfig
    },
    // Tail given < b: Pr(X < a) = m, Pr(X > b) = n, find Pr(X < a | X < b)
    {
      question: `\\text{Let } X \\text{ be a normally distributed random variable with } ${a} < ${b}\\text{. Given } \\Pr(X < ${a}) = ${p1} \\text{ and } \\Pr(X > ${b}) = ${p2}\\text{, express } \\Pr(X < ${a} \\mid X < ${b}) \\text{ in terms of } ${p1} \\text{ and } ${p2}\\text{:}`,
      correct: `\\frac{${p1}}{1 - ${p2}}`,
      distractors: [
        `\\frac{1 - ${p1} - ${p2}}{1 - ${p2}}`,
        `\\frac{${p1}}{${p2}}`,
        `${p1}(1 - ${p2})`
      ],
      diagram: {
        leftZ: -1.3,
        leftLabel: a,
        leftAreaLabel: p1,
        rightZ: 1.1,
        rightLabel: b,
        rightAreaLabel: p2,
        shadeRegion: 'left'
      } as NormalDiagramConfig
    },
    // Right tail given > a: Pr(X < a) = m, Pr(X > b) = n, find Pr(X > b | X > a)
    {
      question: `\\text{Let } X \\text{ be a normally distributed random variable with } ${a} < ${b}\\text{. Given } \\Pr(X < ${a}) = ${p1} \\text{ and } \\Pr(X > ${b}) = ${p2}\\text{, express } \\Pr(X > ${b} \\mid X > ${a}) \\text{ in terms of } ${p1} \\text{ and } ${p2}\\text{:}`,
      correct: `\\frac{${p2}}{1 - ${p1}}`,
      distractors: [
        `\\frac{1 - ${p1} - ${p2}}{1 - ${p1}}`,
        `\\frac{${p2}}{1 - ${p2}}`,
        `${p2}(1 - ${p1})`
      ],
      diagram: {
        leftZ: -1.1,
        leftLabel: a,
        leftAreaLabel: p1,
        rightZ: 1.3,
        rightLabel: b,
        rightAreaLabel: p2,
        shadeRegion: 'right'
      } as NormalDiagramConfig
    },
    // Overlapping given: Pr(X > a) = m and Pr(X < b) = n with a < b
    {
      question: `\\text{For a normal random variable } X \\text{ with } ${a} < ${b}\\text{, suppose } \\Pr(X > ${a}) = ${p1} \\text{ and } \\Pr(X < ${b}) = ${p2}\\text{. Write } \\Pr(X > ${a} \\mid X < ${b}) \\text{ in terms of } ${p1} \\text{ and } ${p2}\\text{:}`,
      correct: `\\frac{${p1} + ${p2} - 1}{${p2}}`,
      distractors: [
        `\\frac{1 - ${p1} - ${p2}}{${p2}}`,
        `\\frac{${p1} + ${p2} - 1}{${p1}}`,
        `\\frac{${p1}}{${p2}}`
      ],
      diagram: {
        leftZ: -1.0,
        leftLabel: a,
        rightZ: 1.2,
        rightLabel: b,
        shadeRegion: 'between'
      } as NormalDiagramConfig
    },
    // Cumulative given: Pr(X < a) = m and Pr(X < b) = n with a < b
    {
      question: `\\text{For a normal random variable } X \\text{ with } ${a} < ${b}\\text{, suppose } \\Pr(X < ${a}) = ${p1} \\text{ and } \\Pr(X < ${b}) = ${p2}\\text{. Write } \\Pr(X > ${a} \\mid X < ${b}) \\text{ in terms of } ${p1} \\text{ and } ${p2}\\text{:}`,
      correct: `\\frac{${p2} - ${p1}}{${p2}}`,
      distractors: [
        `\\frac{${p2} - ${p1}}{1 - ${p1}}`,
        `\\frac{1 - ${p1} - ${p2}}{${p2}}`,
        `${p2} - ${p1}`
      ],
      diagram: {
        leftZ: -1.1,
        leftLabel: a,
        leftAreaLabel: p1,
        rightZ: 1.2,
        rightLabel: b,
        shadeRegion: 'between'
      } as NormalDiagramConfig
    }
  ];

  const t = templates[Math.floor(Math.random() * templates.length)];
  const options = shuffle([t.correct, ...t.distractors]);

  return {
    question: t.question,
    answer: options.indexOf(t.correct).toString(),
    options,
    normalDiagram: t.diagram,
    type: 'algebra',
    mode: GameMode.METHODS_NORMAL_SYMMETRY
  };
}

// 2. Symmetric Normal Distribution with a single parameter (Z ~ N(0,1) or X ~ N(mu, sigma^2))
function generateSymmetricParamProblem(): MathProblem {
  const pVars = ['m', 'p', 'k', 'a'];
  const p = pVars[Math.floor(Math.random() * pVars.length)];

  const ConcreteCases = [
    { mu: 50, sd: 5, k: 1, low: 45, high: 55 },
    { mu: 100, sd: 15, k: 1, low: 85, high: 115 },
    { mu: 20, sd: 4, k: 1.5, low: 14, high: 26 },
    { mu: 60, sd: 8, k: 2, low: 44, high: 76 },
    { mu: 30, sd: 6, k: 1, low: 24, high: 36 }
  ];
  const cc = ConcreteCases[Math.floor(Math.random() * ConcreteCases.length)];

  const templates = [
    // Z ~ N(0,1), Pr(Z > c) = m, find Pr(Z > -c | Z < c)
    {
      question: `\\text{Let } Z \\sim \\text{N}(0, 1) \\text{ and } c > 0\\text{. Given } \\Pr(Z > c) = ${p}\\text{, express } \\Pr(Z > -c \\mid Z < c) \\text{ in terms of } ${p}\\text{:}`,
      correct: `\\frac{1 - 2${p}}{1 - ${p}}`,
      distractors: [
        `\\frac{1 - ${p}}{1 - 2${p}}`,
        `1 - 2${p}`,
        `\\frac{1 - 2${p}}{${p}}`
      ],
      diagram: {
        meanLabel: '0',
        leftZ: -1.2,
        leftLabel: '-c',
        leftAreaLabel: p,
        rightZ: 1.2,
        rightLabel: 'c',
        rightAreaLabel: p,
        shadeRegion: 'between'
      } as NormalDiagramConfig
    },
    // X ~ N(mu, sd^2), Pr(X > high) = m, find Pr(X > low | X < high)
    {
      question: `\\text{Let } X \\sim \\text{N}(${cc.mu}, ${cc.sd}^2)\\text{. Given } \\Pr(X > ${cc.high}) = ${p}\\text{, express } \\Pr(X > ${cc.low} \\mid X < ${cc.high}) \\text{ in terms of } ${p}\\text{:}`,
      correct: `\\frac{1 - 2${p}}{1 - ${p}}`,
      distractors: [
        `\\frac{1 - ${p}}{2}`,
        `1 - 2${p}`,
        `\\frac{1 - ${p}}{1 + ${p}}`
      ],
      diagram: {
        meanLabel: `${cc.mu}`,
        leftZ: -1.2,
        leftLabel: `${cc.low}`,
        leftAreaLabel: p,
        rightZ: 1.2,
        rightLabel: `${cc.high}`,
        rightAreaLabel: p,
        shadeRegion: 'between'
      } as NormalDiagramConfig
    },
    // X ~ N(mu, sd^2), Pr(X < low) = m, find Pr(mu < X < high)
    {
      question: `\\text{Let } X \\sim \\text{N}(${cc.mu}, ${cc.sd}^2)\\text{. Given } \\Pr(X < ${cc.low}) = ${p}\\text{, express } \\Pr(${cc.mu} < X < ${cc.high}) \\text{ in terms of } ${p}\\text{:}`,
      correct: `\\frac{1}{2} - ${p}`,
      distractors: [
        `1 - 2${p}`,
        `1 - ${p}`,
        `\\frac{1 - ${p}}{2}`
      ],
      diagram: {
        meanLabel: `${cc.mu}`,
        leftZ: -1.2,
        leftLabel: `${cc.low}`,
        leftAreaLabel: p,
        rightZ: 1.2,
        rightLabel: `${cc.high}`,
        shadeRegion: 'between'
      } as NormalDiagramConfig
    },
    // Z ~ N(0,1), Pr(-c < Z < c) = m, find Pr(Z > c)
    {
      question: `\\text{Let } Z \\sim \\text{N}(0, 1) \\text{ with } c > 0\\text{. If } \\Pr(-c < Z < c) = ${p}\\text{, express } \\Pr(Z > c) \\text{ in terms of } ${p}\\text{:}`,
      correct: `\\frac{1 - ${p}}{2}`,
      distractors: [
        `1 - ${p}`,
        `1 - 2${p}`,
        `\\frac{1 + ${p}}{2}`
      ],
      diagram: {
        meanLabel: '0',
        leftZ: -1.2,
        leftLabel: '-c',
        rightZ: 1.2,
        rightLabel: 'c',
        shadeRegion: 'right'
      } as NormalDiagramConfig
    },
    // Z ~ N(0,1), Pr(-c < Z < c) = m, find Pr(Z < c)
    {
      question: `\\text{Let } Z \\sim \\text{N}(0, 1) \\text{ with } c > 0\\text{. If } \\Pr(-c < Z < c) = ${p}\\text{, express } \\Pr(Z < c) \\text{ in terms of } ${p}\\text{:}`,
      correct: `\\frac{1 + ${p}}{2}`,
      distractors: [
        `\\frac{1 - ${p}}{2}`,
        `1 - \\frac{${p}}{2}`,
        `\\frac{1}{2} + ${p}`
      ],
      diagram: {
        meanLabel: '0',
        leftZ: -1.2,
        leftLabel: '-c',
        rightZ: 1.2,
        rightLabel: 'c',
        shadeRegion: 'between'
      } as NormalDiagramConfig
    },
    // X ~ N(mu, sd^2), Pr(low < X < high) = m, find Pr(X < high | X > low) -> wait, that's m / ((1+m)/2) = 2m/(1+m)
    {
      question: `\\text{Let } X \\sim \\text{N}(${cc.mu}, ${cc.sd}^2)\\text{. Given } \\Pr(${cc.low} < X < ${cc.high}) = ${p}\\text{, express } \\Pr(X < ${cc.high} \\mid X > ${cc.low}) \\text{ in terms of } ${p}\\text{:}`,
      correct: `\\frac{2${p}}{1 + ${p}}`,
      distractors: [
        `\\frac{${p}}{1 - ${p}}`,
        `\\frac{1 + ${p}}{2}`,
        `\\frac{2${p}}{1 - ${p}}`
      ],
      diagram: {
        meanLabel: `${cc.mu}`,
        leftZ: -1.2,
        leftLabel: `${cc.low}`,
        rightZ: 1.2,
        rightLabel: `${cc.high}`,
        shadeRegion: 'between'
      } as NormalDiagramConfig
    }
  ];

  const t = templates[Math.floor(Math.random() * templates.length)];
  const options = shuffle([t.correct, ...t.distractors]);

  return {
    question: t.question,
    answer: options.indexOf(t.correct).toString(),
    options,
    normalDiagram: t.diagram,
    type: 'algebra',
    mode: GameMode.METHODS_NORMAL_SYMMETRY
  };
}

// 3. Z-score standardisation & symmetry to find unknown boundary k, mean mu, or sd sigma
function generateZScoreSymmetryValueProblem(): MathProblem {
  const problems = [
    {
      question: `\\text{Let } X \\sim \\text{N}(20, 4^2) \\text{ and } Z \\sim \\text{N}(0, 1)\\text{. Find } k \\text{ such that } \\Pr(X > 26) = \\Pr(Z < k)\\text{:}`,
      correct: `k = -1.5`,
      distractors: [`k = 1.5`, `k = -6`, `k = -0.375`],
      diagram: {
        meanLabel: '20',
        leftZ: -1.5,
        leftLabel: '14',
        rightZ: 1.5,
        rightLabel: '26',
        shadeRegion: 'right'
      } as NormalDiagramConfig
    },
    {
      question: `\\text{Let } X \\sim \\text{N}(50, 8^2) \\text{ and } Z \\sim \\text{N}(0, 1)\\text{. Find } k \\text{ such that } \\Pr(X < 38) = \\Pr(Z > k)\\text{:}`,
      correct: `k = 1.5`,
      distractors: [`k = -1.5`, `k = 12`, `k = 0.75`],
      diagram: {
        meanLabel: '50',
        leftZ: -1.5,
        leftLabel: '38',
        rightZ: 1.5,
        rightLabel: '62',
        shadeRegion: 'left'
      } as NormalDiagramConfig
    },
    {
      question: `\\text{Let } X \\sim \\text{N}(100, 12^2)\\text{. Using symmetry, find } k \\text{ if } \\Pr(X > 118) = \\Pr(X < k)\\text{:}`,
      correct: `k = 82`,
      distractors: [`k = 88`, `k = -118`, `k = 86`],
      diagram: {
        meanLabel: '100',
        leftZ: -1.5,
        leftLabel: 'k',
        rightZ: 1.5,
        rightLabel: '118',
        shadeRegion: 'both_tails'
      } as NormalDiagramConfig
    },
    {
      question: `\\text{Let } X \\sim \\text{N}(\\mu, \\sigma^2)\\text{. Given that } \\Pr(X < 18) = \\Pr(X > 34)\\text{, find the mean } \\mu\\text{:}`,
      correct: `\\mu = 26`,
      distractors: [`\\mu = 24`, `\\mu = 16`, `\\mu = 28`],
      diagram: {
        meanLabel: '\\mu',
        leftZ: -1.3,
        leftLabel: '18',
        rightZ: 1.3,
        rightLabel: '34',
        shadeRegion: 'both_tails'
      } as NormalDiagramConfig
    },
    {
      question: `\\text{Let } X \\sim \\text{N}(\\mu, 3^2) \\text{ and } Z \\sim \\text{N}(0, 1)\\text{. If } \\Pr(X > 25) = \\Pr(Z < -2)\\text{, find } \\mu\\text{:}`,
      correct: `\\mu = 19`,
      distractors: [`\\mu = 31`, `\\mu = 22`, `\\mu = 16`],
      diagram: {
        meanLabel: '\\mu',
        rightZ: 1.6,
        rightLabel: '25',
        shadeRegion: 'right'
      } as NormalDiagramConfig
    },
    {
      question: `\\text{Let } X \\sim \\text{N}(40, \\sigma^2) \\text{ and } Z \\sim \\text{N}(0, 1)\\text{. If } \\Pr(X < 30) = \\Pr(Z > 2.5)\\text{, find } \\sigma\\text{:}`,
      correct: `\\sigma = 4`,
      distractors: [`\\sigma = 2.5`, `\\sigma = 5`, `\\sigma = 10`],
      diagram: {
        meanLabel: '40',
        leftZ: -1.6,
        leftLabel: '30',
        shadeRegion: 'left'
      } as NormalDiagramConfig
    },
    {
      question: `\\text{Let } X \\sim \\text{N}(\\mu, \\sigma^2) \\text{ and } Z \\sim \\text{N}(0, 1)\\text{. Given } \\Pr(Z < c) = m \\text{ for } c > 0\\text{, find } \\Pr(X < \\mu - c\\sigma)\\text{:}`,
      correct: `1 - m`,
      distractors: [`m`, `m - 0.5`, `2m - 1`],
      diagram: {
        meanLabel: '\\mu',
        leftZ: -1.2,
        leftLabel: '\\mu-c\\sigma',
        rightZ: 1.2,
        rightLabel: '\\mu+c\\sigma',
        shadeRegion: 'left'
      } as NormalDiagramConfig
    },
    {
      question: `\\text{Let } X \\sim \\text{N}(\\mu, \\sigma^2) \\text{ and } Z \\sim \\text{N}(0, 1)\\text{. Given } \\Pr(Z < c) = m \\text{ for } c > 0\\text{, find } \\Pr(\\mu - c\\sigma < X < \\mu + c\\sigma)\\text{:}`,
      correct: `2m - 1`,
      distractors: [`1 - 2m`, `2(1 - m)`, `m - 0.5`],
      diagram: {
        meanLabel: '\\mu',
        leftZ: -1.2,
        leftLabel: '\\mu-c\\sigma',
        rightZ: 1.2,
        rightLabel: '\\mu+c\\sigma',
        shadeRegion: 'between'
      } as NormalDiagramConfig
    }
  ];

  const p = problems[Math.floor(Math.random() * problems.length)];
  const options = shuffle([p.correct, ...p.distractors]);

  return {
    question: p.question,
    answer: options.indexOf(p.correct).toString(),
    options,
    normalDiagram: p.diagram,
    type: 'algebra',
    mode: GameMode.METHODS_NORMAL_SYMMETRY
  };
}

export function generateNormalSymmetryProblem(): MathProblem {
  const roll = Math.random();
  if (roll < 0.45) {
    return generateTwoParamConditionalProblem();
  } else if (roll < 0.78) {
    return generateSymmetricParamProblem();
  } else {
    return generateZScoreSymmetryValueProblem();
  }
}
