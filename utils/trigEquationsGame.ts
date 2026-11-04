import { GameMode, MathProblem } from '../types';

function shuffle<T>(arr: T[]): T[] {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

// 1. General Solutions to Trig Equations (sin, cos, tan with standard and dilated arguments)
function generateGeneralSolutionProblem(): MathProblem {
  const cases = [
    // Cosine General Solutions
    {
      question: `\\text{Find the general solution to } \\cos(x) = \\frac{1}{2} \\text{ for } n \\in \\mathbb{Z}\\text{:}`,
      correct: `x = 2n\\pi \\pm \\frac{\\pi}{3}`,
      distractors: [
        `x = 2n\\pi \\pm \\frac{\\pi}{6}`,
        `x = n\\pi \\pm \\frac{\\pi}{3}`,
        `x = 2n\\pi \\pm \\frac{2\\pi}{3}`
      ]
    },
    {
      question: `\\text{Find the general solution to } \\cos(x) = -\\frac{\\sqrt{3}}{2} \\text{ for } n \\in \\mathbb{Z}\\text{:}`,
      correct: `x = 2n\\pi \\pm \\frac{5\\pi}{6}`,
      distractors: [
        `x = 2n\\pi \\pm \\frac{\\pi}{6}`,
        `x = n\\pi \\pm \\frac{5\\pi}{6}`,
        `x = 2n\\pi \\pm \\frac{2\\pi}{3}`
      ]
    },
    {
      question: `\\text{Find the general solution to } 2\\cos(2x) - \\sqrt{2} = 0 \\text{ for } n \\in \\mathbb{Z}\\text{:}`,
      correct: `x = n\\pi \\pm \\frac{\\pi}{8}`,
      distractors: [
        `x = 2n\\pi \\pm \\frac{\\pi}{8}`,
        `x = n\\pi \\pm \\frac{\\pi}{4}`,
        `x = 2n\\pi \\pm \\frac{\\pi}{4}`
      ]
    },
    {
      question: `\\text{Find the general solution to } 2\\cos(3x) + 1 = 0 \\text{ for } n \\in \\mathbb{Z}\\text{:}`,
      correct: `x = \\frac{2n\\pi}{3} \\pm \\frac{2\\pi}{9}`,
      distractors: [
        `x = 2n\\pi \\pm \\frac{2\\pi}{9}`,
        `x = \\frac{2n\\pi}{3} \\pm \\frac{\\pi}{9}`,
        `x = \\frac{n\\pi}{3} \\pm \\frac{2\\pi}{9}`
      ]
    },
    {
      question: `\\text{Find the general solution to } \\cos(2x) = 0 \\text{ for } n \\in \\mathbb{Z}\\text{:}`,
      correct: `x = n\\pi \\pm \\frac{\\pi}{4}`,
      distractors: [
        `x = 2n\\pi \\pm \\frac{\\pi}{4}`,
        `x = n\\pi \\pm \\frac{\\pi}{2}`,
        `x = \\frac{n\\pi}{2}`
      ]
    },
    // Tangent General Solutions
    {
      question: `\\text{Find the general solution to } \\tan(x) = \\sqrt{3} \\text{ for } n \\in \\mathbb{Z}\\text{:}`,
      correct: `x = n\\pi + \\frac{\\pi}{3}`,
      distractors: [
        `x = 2n\\pi + \\frac{\\pi}{3}`,
        `x = n\\pi + \\frac{\\pi}{6}`,
        `x = n\\pi \\pm \\frac{\\pi}{3}`
      ]
    },
    {
      question: `\\text{Find the general solution to } \\tan(x) = -1 \\text{ for } n \\in \\mathbb{Z}\\text{:}`,
      correct: `x = n\\pi - \\frac{\\pi}{4}`,
      distractors: [
        `x = 2n\\pi - \\frac{\\pi}{4}`,
        `x = n\\pi \\pm \\frac{\\pi}{4}`,
        `x = n\\pi + \\frac{\\pi}{4}`
      ]
    },
    {
      question: `\\text{Find the general solution to } \\sqrt{3}\\tan(2x) + 1 = 0 \\text{ for } n \\in \\mathbb{Z}\\text{:}`,
      correct: `x = \\frac{n\\pi}{2} - \\frac{\\pi}{12}`,
      distractors: [
        `x = n\\pi - \\frac{\\pi}{12}`,
        `x = \\frac{n\\pi}{2} - \\frac{\\pi}{6}`,
        `x = \\frac{n\\pi}{2} + \\frac{\\pi}{12}`
      ]
    },
    {
      question: `\\text{Find the general solution to } \\tan(3x) = \\sqrt{3} \\text{ for } n \\in \\mathbb{Z}\\text{:}`,
      correct: `x = \\frac{n\\pi}{3} + \\frac{\\pi}{9}`,
      distractors: [
        `x = n\\pi + \\frac{\\pi}{9}`,
        `x = \\frac{2n\\pi}{3} + \\frac{\\pi}{9}`,
        `x = \\frac{n\\pi}{3} + \\frac{\\pi}{3}`
      ]
    },
    // Sine General Solutions
    {
      question: `\\text{Find the general solution to } \\sin(x) = \\frac{1}{2} \\text{ for } n \\in \\mathbb{Z}\\text{:}`,
      correct: `x = 2n\\pi + \\frac{\\pi}{6} \\text{ or } x = 2n\\pi + \\frac{5\\pi}{6}`,
      distractors: [
        `x = 2n\\pi \\pm \\frac{\\pi}{6}`,
        `x = n\\pi + \\frac{\\pi}{6} \\text{ or } x = n\\pi + \\frac{5\\pi}{6}`,
        `x = 2n\\pi + \\frac{\\pi}{3} \\text{ or } x = 2n\\pi + \\frac{2\\pi}{3}`
      ]
    },
    {
      question: `\\text{Find the general solution to } 2\\sin(x) + \\sqrt{3} = 0 \\text{ for } n \\in \\mathbb{Z}\\text{:}`,
      correct: `x = 2n\\pi + \\frac{4\\pi}{3} \\text{ or } x = 2n\\pi + \\frac{5\\pi}{3}`,
      distractors: [
        `x = 2n\\pi \\pm \\frac{\\pi}{3}`,
        `x = 2n\\pi + \\frac{\\pi}{3} \\text{ or } x = 2n\\pi + \\frac{2\\pi}{3}`,
        `x = n\\pi + \\frac{4\\pi}{3} \\text{ or } x = n\\pi + \\frac{5\\pi}{3}`
      ]
    },
    {
      question: `\\text{Find the general solution to } \\sin(2x) = \\frac{\\sqrt{2}}{2} \\text{ for } n \\in \\mathbb{Z}\\text{:}`,
      correct: `x = n\\pi + \\frac{\\pi}{8} \\text{ or } x = n\\pi + \\frac{3\\pi}{8}`,
      distractors: [
        `x = 2n\\pi + \\frac{\\pi}{8} \\text{ or } x = 2n\\pi + \\frac{3\\pi}{8}`,
        `x = n\\pi \\pm \\frac{\\pi}{8}`,
        `x = n\\pi + \\frac{\\pi}{4} \\text{ or } x = n\\pi + \\frac{3\\pi}{4}`
      ]
    },
    {
      question: `\\text{Find the general solution to } \\sin(2x) = 1 \\text{ for } n \\in \\mathbb{Z}\\text{:}`,
      correct: `x = n\\pi + \\frac{\\pi}{4}`,
      distractors: [
        `x = 2n\\pi + \\frac{\\pi}{4}`,
        `x = \\frac{n\\pi}{2} + \\frac{\\pi}{4}`,
        `x = n\\pi \\pm \\frac{\\pi}{4}`
      ]
    }
  ];

  const c = cases[Math.floor(Math.random() * cases.length)];
  const options = shuffle([c.correct, ...c.distractors]);

  return {
    question: c.question,
    answer: options.indexOf(c.correct).toString(),
    options,
    type: 'algebra',
    mode: GameMode.METHODS_TRIG_EQUATIONS
  };
}

// 2. Solving Trig Equations over Restricted Domains (Exact Solutions & Sum of Solutions)
function generateDomainTrigEquationProblem(): MathProblem {
  const cases = [
    {
      question: `\\text{Solve } 2\\sin(x) - \\sqrt{3} = 0 \\text{ for } x \\in [0, 2\\pi]\\text{:}`,
      correct: `x = \\frac{\\pi}{3}, \\, \\frac{2\\pi}{3}`,
      distractors: [
        `x = \\frac{\\pi}{6}, \\, \\frac{5\\pi}{6}`,
        `x = \\frac{\\pi}{3}, \\, \\frac{5\\pi}{3}`,
        `x = \\frac{2\\pi}{3}, \\, \\frac{4\\pi}{3}`
      ]
    },
    {
      question: `\\text{Solve } 2\\cos(x) + 1 = 0 \\text{ for } x \\in [0, 2\\pi]\\text{:}`,
      correct: `x = \\frac{2\\pi}{3}, \\, \\frac{4\\pi}{3}`,
      distractors: [
        `x = \\frac{\\pi}{3}, \\, \\frac{5\\pi}{3}`,
        `x = \\frac{5\\pi}{6}, \\, \\frac{7\\pi}{6}`,
        `x = \\frac{2\\pi}{3}, \\, \\frac{5\\pi}{3}`
      ]
    },
    {
      question: `\\text{Solve } \\sqrt{2}\\sin(x) + 1 = 0 \\text{ for } x \\in [-\\pi, \\pi]\\text{:}`,
      correct: `x = -\\frac{3\\pi}{4}, \\, -\\frac{\\pi}{4}`,
      distractors: [
        `x = \\frac{5\\pi}{4}, \\, \\frac{7\\pi}{4}`,
        `x = -\\frac{\\pi}{4}, \\, \\frac{\\pi}{4}`,
        `x = -\\frac{3\\pi}{4}, \\, \\frac{3\\pi}{4}`
      ]
    },
    {
      question: `\\text{Solve } \\sqrt{3}\\tan(x) + 1 = 0 \\text{ for } x \\in [0, 2\\pi]\\text{:}`,
      correct: `x = \\frac{5\\pi}{6}, \\, \\frac{11\\pi}{6}`,
      distractors: [
        `x = \\frac{2\\pi}{3}, \\, \\frac{5\\pi}{3}`,
        `x = \\frac{\\pi}{6}, \\, \\frac{7\\pi}{6}`,
        `x = \\frac{5\\pi}{6}, \\, \\frac{7\\pi}{6}`
      ]
    },
    {
      question: `\\text{Solve } 2\\sin(2x) = 1 \\text{ for } x \\in [0, \\pi]\\text{:}`,
      correct: `x = \\frac{\\pi}{12}, \\, \\frac{5\\pi}{12}`,
      distractors: [
        `x = \\frac{\\pi}{6}, \\, \\frac{5\\pi}{6}`,
        `x = \\frac{\\pi}{12}, \\, \\frac{11\\pi}{12}`,
        `x = \\frac{\\pi}{6}, \\, \\frac{2\\pi}{3}`
      ]
    },
    {
      question: `\\text{Solve } 2\\cos(2x) = -\\sqrt{3} \\text{ for } x \\in [0, \\pi]\\text{:}`,
      correct: `x = \\frac{5\\pi}{12}, \\, \\frac{7\\pi}{12}`,
      distractors: [
        `x = \\frac{5\\pi}{6}, \\, \\frac{7\\pi}{6}`,
        `x = \\frac{\\pi}{12}, \\, \\frac{11\\pi}{12}`,
        `x = \\frac{\\pi}{3}, \\, \\frac{2\\pi}{3}`
      ]
    },
    {
      question: `\\text{Solve } \\tan(2x) = 1 \\text{ for } x \\in [0, \\pi]\\text{:}`,
      correct: `x = \\frac{\\pi}{8}, \\, \\frac{5\\pi}{8}`,
      distractors: [
        `x = \\frac{\\pi}{4}, \\, \\frac{5\\pi}{4}`,
        `x = \\frac{\\pi}{8}, \\, \\frac{3\\pi}{8}`,
        `x = \\frac{\\pi}{8}, \\, \\frac{7\\pi}{8}`
      ]
    },
    {
      question: `\\text{Solve } 2\\cos\\left(x - \\frac{\\pi}{3}\\right) = 1 \\text{ for } x \\in [0, 2\\pi]\\text{:}`,
      correct: `x = 0, \\, \\frac{2\\pi}{3}, \\, 2\\pi`,
      distractors: [
        `x = \\frac{\\pi}{3}, \\, \\frac{5\\pi}{3}`,
        `x = 0, \\, \\frac{4\\pi}{3}, \\, 2\\pi`,
        `x = \\frac{2\\pi}{3}, \\, \\frac{4\\pi}{3}`
      ]
    },
    {
      question: `\\text{Solve } 2\\sin\\left(x + \\frac{\\pi}{6}\\right) = 1 \\text{ for } x \\in [0, 2\\pi]\\text{:}`,
      correct: `x = 0, \\, \\frac{2\\pi}{3}, \\, 2\\pi`,
      distractors: [
        `x = \\frac{\\pi}{6}, \\, \\frac{5\\pi}{6}`,
        `x = \\frac{\\pi}{3}, \\, \\pi`,
        `x = 0, \\, \\frac{4\\pi}{3}, \\, 2\\pi`
      ]
    },
    {
      question: `\\text{Find the sum of the solutions to } \\sin(2x) = \\frac{1}{2} \\text{ for } x \\in [0, 2\\pi]\\text{:}`,
      correct: `3\\pi`,
      distractors: [
        `2\\pi`,
        `\\frac{5\\pi}{2}`,
        `\\frac{7\\pi}{2}`
      ]
    },
    {
      question: `\\text{How many solutions does } \\cos(3x) = -\\frac{1}{2} \\text{ have for } x \\in [0, 2\\pi]\\text{?}`,
      correct: `6`,
      distractors: [`3`, `4`, `2`]
    }
  ];

  const c = cases[Math.floor(Math.random() * cases.length)];
  const options = shuffle([c.correct, ...c.distractors]);

  return {
    question: c.question,
    answer: options.indexOf(c.correct).toString(),
    options,
    type: 'algebra',
    mode: GameMode.METHODS_TRIG_EQUATIONS
  };
}

export function generateTrigEquationsProblem(): MathProblem {
  if (Math.random() < 0.55) {
    return generateGeneralSolutionProblem();
  }
  return generateDomainTrigEquationProblem();
}
