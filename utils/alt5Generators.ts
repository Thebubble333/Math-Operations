import {
  Fraction,
  gcd,
  makeFraction,
  formatFractionLatex,
  formatLinearTerm,
  formatConstantTerm,
  formatLineEq,
  formatPointLatex,
  simplifySurd,
  randomChoice,
  randomInt,
  shuffleArray,
} from './alt5Math';

export interface Alt5GraphData {
  type: 'linear' | 'parabola_restricted' | 'parabola_features';
  xMinDomain?: number;
  xMaxDomain?: number;
  lineSlope?: number;
  lineIntercept?: number;
  isVertical?: boolean;
  verticalX?: number;
  parabolaA?: number;
  parabolaB?: number;
  parabolaC?: number;
  horizontalY?: number;
  points?: Array<{ x: number; y: number; label: string; isOpen?: boolean; color?: string }>;
}

export interface Alt5Question {
  id: string;
  categoryId: number;
  categoryTitle: string;
  difficulty: 'standard' | 'challenging';
  promptLatex: string;
  tableData?: Array<{ x: number; y: number }>;
  options: string[];
  graphOptions?: Alt5GraphData[];
  correctOptionIndex: number;
  workedSolutionLatex: string[];
  graphData?: Alt5GraphData;
}

export const ALT5_CATEGORIES = [
  { id: 1, title: 'Sketching Linear Graphs' },
  { id: 2, title: 'Midpoint, Distance, and Line Equations' },
  { id: 3, title: 'Line Equation from Gradient and Point' },
  { id: 4, title: 'Perpendicular Line Equations' },
  { id: 5, title: 'Parallel, Perpendicular, or Neither' },
  { id: 6, title: 'Point of Intersection' },
  { id: 7, title: 'Features of Quadratics' },
  { id: 8, title: 'Restricted Domain, Tables & Horizontal Intersections' },
  { id: 9, title: 'Sketching Parabolas from Features' },
  { id: 10, title: 'Parabola Equations (Turning Point Form)' },
  { id: 11, title: 'Parabola Equations (Factorised Form)' },
  { id: 12, title: 'Point Transformations' },
  { id: 13, title: 'Equation Transformations' },
];

// Helper to ensure 4 unique multiple choice options
function createOptions(correct: string, rawDistractors: string[]): { options: string[]; correctIndex: number } {
  const uniqueDistractors: string[] = [];
  for (const d of rawDistractors) {
    if (d && d !== correct && !uniqueDistractors.includes(d)) {
      uniqueDistractors.push(d);
    }
    if (uniqueDistractors.length === 3) break;
  }
  // If fewer than 3, generate mathematical fallback distractors without "+ 1" artifacts
  let fallbackCount = 1;
  while (uniqueDistractors.length < 3) {
    let fallback = '';
    if (correct.includes('=')) {
      // Modify constant or sign
      fallback = correct.replace(/([+-]?\s*\d+)$/, (m, num) => {
        const n = parseInt(num.replace(/\s+/g, ''), 10);
        const sign = n + fallbackCount >= 0 ? '+ ' : '- ';
        return `${sign}${Math.abs(n + fallbackCount)}`;
      });
      if (fallback === correct) {
        fallback = correct.startsWith('y = -') ? correct.replace('y = -', 'y = ') : correct.replace('y = ', 'y = -');
      }
    } else if (correct.includes('(') && correct.includes(')')) {
      fallback = correct.replace(/(-?\d+)/, (m, n) => String(parseInt(n, 10) + fallbackCount));
    } else if (/^-?\d+$/.test(correct.trim())) {
      fallback = String(parseInt(correct.trim(), 10) + fallbackCount);
    } else {
      fallback = `${correct} (alt ${fallbackCount})`;
    }
    if (!uniqueDistractors.includes(fallback) && fallback !== correct) {
      uniqueDistractors.push(fallback);
    }
    fallbackCount++;
  }
  const all = [correct, ...uniqueDistractors.slice(0, 3)];
  const shuffled = shuffleArray(all);
  const correctIndex = shuffled.indexOf(correct);
  return { options: shuffled, correctIndex };
}

// ==========================================
// 1. Sketching Linear Graphs (4 Graph Options Grid)
// ==========================================
export function generateQuestion1(difficulty: 'standard' | 'challenging'): Alt5Question {
  const subTypes = difficulty === 'standard' 
    ? ['horizontal', 'vertical', 'origin', 'slope_intercept', 'general']
    : ['slope_intercept', 'general', 'fractional_general'];
  const subType = randomChoice(subTypes);

  if (subType === 'vertical') {
    const a = randomInt(-5, 5, true);
    const eqLatex = `x = ${a}`;
    const prompt = `Sketch the line $${eqLatex}$. Select the correct graph:`;
    
    const correctGraph: Alt5GraphData = {
      type: 'linear',
      isVertical: true,
      verticalX: a,
      points: [{ x: a, y: 0, label: `(${a}, 0)` }]
    };

    const graphChoices: { graph: Alt5GraphData; isCorrect: boolean }[] = [
      { graph: correctGraph, isCorrect: true },
      {
        graph: {
          type: 'linear',
          lineSlope: 0,
          lineIntercept: a,
          points: [{ x: 0, y: a, label: `(0, ${a})` }]
        },
        isCorrect: false
      },
      {
        graph: {
          type: 'linear',
          isVertical: true,
          verticalX: -a,
          points: [{ x: -a, y: 0, label: `(${-a}, 0)` }]
        },
        isCorrect: false
      },
      {
        graph: {
          type: 'linear',
          lineSlope: 0,
          lineIntercept: -a,
          points: [{ x: 0, y: -a, label: `(0, ${-a})` }]
        },
        isCorrect: false
      }
    ];

    const shuffled = shuffleArray(graphChoices);
    const correctIndex = shuffled.findIndex(c => c.isCorrect);

    return {
      id: `q1-${Math.random().toString(36).substring(2, 7)}`,
      categoryId: 1,
      categoryTitle: 'Sketching Linear Graphs',
      difficulty,
      promptLatex: prompt,
      graphOptions: shuffled.map(c => c.graph),
      options: ['Graph A', 'Graph B', 'Graph C', 'Graph D'],
      correctOptionIndex: correctIndex,
      workedSolutionLatex: [
        `\\text{Equation: } ${eqLatex}`,
        `\\text{1. This is a vertical line where } x = ${a} \\text{ for every point on the line.}`,
        `\\text{2. } x\\text{-intercept: Set } y = 0 \\implies (${a}, 0).`,
        `\\text{3. } y\\text{-intercept: Since } x = ${a} \\neq 0\\text{, the line is parallel to the } y\\text{-axis and never intersects it (no } y\\text{-intercept).}`,
        `\\text{4. The correct graph is a vertical line passing through } (${a}, 0).`
      ],
      graphData: correctGraph
    };
  }

  if (subType === 'horizontal') {
    const b = randomInt(-5, 5, true);
    const eqLatex = `y = ${b}`;
    const prompt = `Sketch the line $${eqLatex}$. Select the correct graph:`;

    const correctGraph: Alt5GraphData = {
      type: 'linear',
      lineSlope: 0,
      lineIntercept: b,
      points: [{ x: 0, y: b, label: `(0, ${b})` }]
    };

    const graphChoices: { graph: Alt5GraphData; isCorrect: boolean }[] = [
      { graph: correctGraph, isCorrect: true },
      {
        graph: {
          type: 'linear',
          isVertical: true,
          verticalX: b,
          points: [{ x: b, y: 0, label: `(${b}, 0)` }]
        },
        isCorrect: false
      },
      {
        graph: {
          type: 'linear',
          lineSlope: 0,
          lineIntercept: -b,
          points: [{ x: 0, y: -b, label: `(0, ${-b})` }]
        },
        isCorrect: false
      },
      {
        graph: {
          type: 'linear',
          isVertical: true,
          verticalX: -b,
          points: [{ x: -b, y: 0, label: `(${-b}, 0)` }]
        },
        isCorrect: false
      }
    ];

    const shuffled = shuffleArray(graphChoices);
    const correctIndex = shuffled.findIndex(c => c.isCorrect);

    return {
      id: `q1-${Math.random().toString(36).substring(2, 7)}`,
      categoryId: 1,
      categoryTitle: 'Sketching Linear Graphs',
      difficulty,
      promptLatex: prompt,
      graphOptions: shuffled.map(c => c.graph),
      options: ['Graph A', 'Graph B', 'Graph C', 'Graph D'],
      correctOptionIndex: correctIndex,
      workedSolutionLatex: [
        `\\text{Equation: } ${eqLatex}`,
        `\\text{1. This is a horizontal line with constant gradient } m = 0.`,
        `\\text{2. } y\\text{-intercept: Set } x = 0 \\implies (0, ${b}).`,
        `\\text{3. } x\\text{-intercept: Since } y = ${b} \\neq 0\\text{, the line never crosses the } x\\text{-axis (no } x\\text{-intercept).}`,
        `\\text{4. The correct graph is a horizontal line through } (0, ${b}).`
      ],
      graphData: correctGraph
    };
  }

  if (subType === 'origin') {
    const mNum = randomInt(-3, 3, true);
    const m = makeFraction(mNum, 1);
    const eqLatex = `y = ${formatLinearTerm(m, 'x', true)}`;
    const prompt = `Sketch the line $${eqLatex}$. Select the correct graph:`;

    const correctGraph: Alt5GraphData = {
      type: 'linear',
      lineSlope: mNum,
      lineIntercept: 0,
      points: [
        { x: 0, y: 0, label: '(0, 0)' },
        { x: 1, y: mNum, label: `(1, ${mNum})` }
      ]
    };

    const graphChoices: { graph: Alt5GraphData; isCorrect: boolean }[] = [
      { graph: correctGraph, isCorrect: true },
      {
        graph: {
          type: 'linear',
          lineSlope: -mNum,
          lineIntercept: 0,
          points: [
            { x: 0, y: 0, label: '(0, 0)' },
            { x: 1, y: -mNum, label: `(1, ${-mNum})` }
          ]
        },
        isCorrect: false
      },
      {
        graph: {
          type: 'linear',
          lineSlope: mNum,
          lineIntercept: 2,
          points: [{ x: 0, y: 2, label: '(0, 2)' }]
        },
        isCorrect: false
      },
      {
        graph: {
          type: 'linear',
          lineSlope: -mNum,
          lineIntercept: -2,
          points: [{ x: 0, y: -2, label: '(0, -2)' }]
        },
        isCorrect: false
      }
    ];

    const shuffled = shuffleArray(graphChoices);
    const correctIndex = shuffled.findIndex(c => c.isCorrect);

    return {
      id: `q1-${Math.random().toString(36).substring(2, 7)}`,
      categoryId: 1,
      categoryTitle: 'Sketching Linear Graphs',
      difficulty,
      promptLatex: prompt,
      graphOptions: shuffled.map(c => c.graph),
      options: ['Graph A', 'Graph B', 'Graph C', 'Graph D'],
      correctOptionIndex: correctIndex,
      workedSolutionLatex: [
        `\\text{Equation: } ${eqLatex}`,
        `\\text{1. Find } y\\text{-intercept by setting } x = 0 \\implies y = ${mNum}(0) = 0 \\implies (0, 0).`,
        `\\text{2. Find } x\\text{-intercept by setting } y = 0 \\implies 0 = ${mNum}x \\implies x = 0 \\implies (0, 0).`,
        `\\text{3. Use gradient } m = ${mNum}: \\text{ from } (0, 0) \\text{ go across } 1 \\text{ and } ${mNum > 0 ? 'up ' + mNum : 'down ' + Math.abs(mNum)} \\implies (1, ${mNum}).`
      ],
      graphData: correctGraph
    };
  }

  // slope_intercept or general
  if (difficulty === 'standard') {
    const mVal = randomInt(-3, 3, true);
    const cVal = randomInt(-5, 5, true);
    const m = makeFraction(mVal, 1);
    const c = makeFraction(cVal, 1);
    const xInt = makeFraction(-cVal, mVal);
    const lineEq = formatLineEq(m, c);
    const prompt = `Sketch the line $${lineEq}$. Select the correct graph:`;

    const correctGraph: Alt5GraphData = {
      type: 'linear',
      lineSlope: mVal,
      lineIntercept: cVal,
      points: [
        { x: xInt.num / xInt.den, y: 0, label: `(${formatFractionLatex(xInt)}, 0)` },
        { x: 0, y: cVal, label: `(0, ${cVal})` }
      ]
    };

    // Distractor 1: wrong slope sign (-m)
    const d1XInt = makeFraction(cVal, mVal);
    const d1Graph: Alt5GraphData = {
      type: 'linear',
      lineSlope: -mVal,
      lineIntercept: cVal,
      points: [
        { x: d1XInt.num / d1XInt.den, y: 0, label: `(${formatFractionLatex(d1XInt)}, 0)` },
        { x: 0, y: cVal, label: `(0, ${cVal})` }
      ]
    };

    // Distractor 2: wrong intercept sign (-c)
    const d2XInt = makeFraction(cVal, mVal);
    const d2Graph: Alt5GraphData = {
      type: 'linear',
      lineSlope: mVal,
      lineIntercept: -cVal,
      points: [
        { x: d2XInt.num / d2XInt.den, y: 0, label: `(${formatFractionLatex(d2XInt)}, 0)` },
        { x: 0, y: -cVal, label: `(0, ${-cVal})` }
      ]
    };

    // Distractor 3: both signs flipped (-m, -c)
    const d3Graph: Alt5GraphData = {
      type: 'linear',
      lineSlope: -mVal,
      lineIntercept: -cVal,
      points: [
        { x: xInt.num / xInt.den, y: 0, label: `(${formatFractionLatex(xInt)}, 0)` },
        { x: 0, y: -cVal, label: `(0, ${-cVal})` }
      ]
    };

    const graphChoices: { graph: Alt5GraphData; isCorrect: boolean }[] = [
      { graph: correctGraph, isCorrect: true },
      { graph: d1Graph, isCorrect: false },
      { graph: d2Graph, isCorrect: false },
      { graph: d3Graph, isCorrect: false }
    ];

    const shuffled = shuffleArray(graphChoices);
    const correctIndex = shuffled.findIndex(c => c.isCorrect);

    return {
      id: `q1-${Math.random().toString(36).substring(2, 7)}`,
      categoryId: 1,
      categoryTitle: 'Sketching Linear Graphs',
      difficulty,
      promptLatex: prompt,
      graphOptions: shuffled.map(c => c.graph),
      options: ['Graph A', 'Graph B', 'Graph C', 'Graph D'],
      correctOptionIndex: correctIndex,
      workedSolutionLatex: [
        `\\text{Given line: } ${lineEq}`,
        `\\text{1. Find } y\\text{-intercept by setting } x = 0:`,
        `\\quad y = ${mVal}(0) ${cVal >= 0 ? '+ ' + cVal : '- ' + Math.abs(cVal)} = ${cVal} \\implies (0, ${cVal})`,
        `\\text{2. Find } x\\text{-intercept by setting } y = 0:`,
        `\\quad 0 = ${mVal}x ${cVal >= 0 ? '+ ' + cVal : '- ' + Math.abs(cVal)} \\implies ${mVal}x = ${-cVal} \\implies x = ${formatFractionLatex(xInt)} \\implies ${formatPointLatex(xInt, 0)}`,
        `\\text{3. Plot both intercepts } (0, ${cVal}) \\text{ and } ${formatPointLatex(xInt, 0)} \\text{ and draw the line passing through them.}`
      ],
      graphData: correctGraph
    };
  } else {
    // Challenging General Form: Ax + By = C
    const A = randomChoice([2, 3, 4]);
    const B = randomChoice([-3, -2, 2, 3]);
    const C = randomInt(4, 12);
    const xInt = makeFraction(C, A);
    const yInt = makeFraction(C, B);
    const prompt = `Sketch the line $${A}x ${B > 0 ? '+ ' + B : '- ' + Math.abs(B)}y = ${C}$. Select the correct graph:`;
    
    const slope = -A / B;
    const intercept = C / B;

    const correctGraph: Alt5GraphData = {
      type: 'linear',
      lineSlope: slope,
      lineIntercept: intercept,
      points: [
        { x: xInt.num / xInt.den, y: 0, label: `(${formatFractionLatex(xInt)}, 0)` },
        { x: 0, y: yInt.num / yInt.den, label: `(0, ${formatFractionLatex(yInt)})` }
      ]
    };

    // Distractor 1: opposite slope
    const d1Graph: Alt5GraphData = {
      type: 'linear',
      lineSlope: -slope,
      lineIntercept: intercept,
      points: [
        { x: -xInt.num / xInt.den, y: 0, label: `(${formatFractionLatex(makeFraction(-C, A))}, 0)` },
        { x: 0, y: yInt.num / yInt.den, label: `(0, ${formatFractionLatex(yInt)})` }
      ]
    };

    // Distractor 2: opposite y-intercept
    const d2Graph: Alt5GraphData = {
      type: 'linear',
      lineSlope: slope,
      lineIntercept: -intercept,
      points: [
        { x: -xInt.num / xInt.den, y: 0, label: `(${formatFractionLatex(makeFraction(-C, A))}, 0)` },
        { x: 0, y: -yInt.num / yInt.den, label: `(0, ${formatFractionLatex(makeFraction(-C, B))})` }
      ]
    };

    // Distractor 3: swapped intercepts
    const d3Graph: Alt5GraphData = {
      type: 'linear',
      lineSlope: -B / A,
      lineIntercept: C / A,
      points: [
        { x: yInt.num / yInt.den, y: 0, label: `(${formatFractionLatex(yInt)}, 0)` },
        { x: 0, y: xInt.num / xInt.den, label: `(0, ${formatFractionLatex(xInt)})` }
      ]
    };

    const graphChoices: { graph: Alt5GraphData; isCorrect: boolean }[] = [
      { graph: correctGraph, isCorrect: true },
      { graph: d1Graph, isCorrect: false },
      { graph: d2Graph, isCorrect: false },
      { graph: d3Graph, isCorrect: false }
    ];

    const shuffled = shuffleArray(graphChoices);
    const correctIndex = shuffled.findIndex(c => c.isCorrect);

    return {
      id: `q1-${Math.random().toString(36).substring(2, 7)}`,
      categoryId: 1,
      categoryTitle: 'Sketching Linear Graphs',
      difficulty,
      promptLatex: prompt,
      graphOptions: shuffled.map(c => c.graph),
      options: ['Graph A', 'Graph B', 'Graph C', 'Graph D'],
      correctOptionIndex: correctIndex,
      workedSolutionLatex: [
        `\\text{General form: } ${A}x ${B > 0 ? '+ ' + B : '- ' + Math.abs(B)}y = ${C}`,
        `\\text{1. Find } x\\text{-intercept by setting } y = 0:`,
        `\\quad ${A}x + 0 = ${C} \\implies x = \\frac{${C}}{${A}} = ${formatFractionLatex(xInt)} \\implies ${formatPointLatex(xInt, 0)}`,
        `\\text{2. Find } y\\text{-intercept by setting } x = 0:`,
        `\\quad 0 ${B > 0 ? '+ ' + B : '- ' + Math.abs(B)}y = ${C} \\implies y = ${formatFractionLatex(yInt)} \\implies ${formatPointLatex(0, yInt)}`,
        `\\text{3. Plot both intercepts } ${formatPointLatex(xInt, 0)} \\text{ and } ${formatPointLatex(0, yInt)} \\text{ to sketch the line.}`
      ],
      graphData: correctGraph
    };
  }
}

// ==========================================
// 2. Midpoint, Distance, and Line Equations (Split into single-part questions)
// ==========================================
export function generateQuestion2(difficulty: 'standard' | 'challenging'): Alt5Question {
  let x1 = randomInt(-5, 5);
  let y1 = randomInt(-5, 5);
  let dx = randomInt(2, 6) * (Math.random() < 0.5 ? 1 : -1);
  let dy = randomInt(2, 6) * (Math.random() < 0.5 ? 1 : -1);

  if (difficulty === 'standard') {
    if (Math.random() < 0.5) {
      dx = randomChoice([3, 4, 6]);
      dy = randomChoice([4, 3, 8]);
    }
  }

  const x2 = x1 + dx;
  const y2 = y1 + dy;

  const midX = makeFraction(x1 + x2, 2);
  const midY = makeFraction(y1 + y2, 2);
  const distSq = dx * dx + dy * dy;
  const distSurd = simplifySurd(distSq);

  const m = makeFraction(dy, dx);
  const cNum = y1 * m.den - m.num * x1;
  const c = makeFraction(cNum, m.den);
  const lineEq = formatLineEq(m, c);

  // Split into 3 distinct single-part question types
  const task = randomChoice<'midpoint' | 'distance' | 'line'>(['midpoint', 'distance', 'line']);

  if (task === 'midpoint') {
    const prompt = `Given the two points $A(${x1}, ${y1})$ and $B(${x2}, ${y2})$, determine the exact coordinates of their midpoint $M$.`;
    const correct = formatPointLatex(midX, midY);
    const distractors = [
      formatPointLatex(makeFraction(x2 - x1, 2), makeFraction(y2 - y1, 2)),
      formatPointLatex(midY, midX),
      formatPointLatex(makeFraction(x1 + x2 + 1, 2), makeFraction(y1 + y2 - 1, 2))
    ];
    const { options, correctIndex } = createOptions(correct, distractors);
    return {
      id: `q2-mid-${Math.random().toString(36).substring(2, 7)}`,
      categoryId: 2,
      categoryTitle: 'Midpoint of a Line Segment',
      difficulty,
      promptLatex: prompt,
      options,
      correctOptionIndex: correctIndex,
      workedSolutionLatex: [
        `\\text{Points: } A(${x1}, ${y1}), \\; B(${x2}, ${y2})`,
        `\\text{Midpoint formula: } M = \\left(\\frac{x_1 + x_2}{2},\\, \\frac{y_1 + y_2}{2}\\right)`,
        `M = \\left(\\frac{${x1} + (${x2})}{2},\\, \\frac{${y1} + (${y2})}{2}\\right) = ${formatPointLatex(midX, midY)}`
      ]
    };
  } else if (task === 'distance') {
    const prompt = `Given the two points $A(${x1}, ${y1})$ and $B(${x2}, ${y2})$, calculate the exact distance $d(A, B)$ in simplest surd or integer form.`;
    const correct = distSurd.latex;
    const distractors = [
      `${distSq}`,
      `\\sqrt{${distSq + 2}}`,
      simplifySurd(distSq + 4).latex
    ];
    const { options, correctIndex } = createOptions(correct, distractors);
    return {
      id: `q2-dist-${Math.random().toString(36).substring(2, 7)}`,
      categoryId: 2,
      categoryTitle: 'Distance Between Two Points',
      difficulty,
      promptLatex: prompt,
      options,
      correctOptionIndex: correctIndex,
      workedSolutionLatex: [
        `\\text{Points: } A(${x1}, ${y1}), \\; B(${x2}, ${y2})`,
        `\\text{Distance formula: } d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}`,
        `d = \\sqrt{(${x2} - (${x1}))^2 + (${y2} - (${y1}))^2} = \\sqrt{(${dx})^2 + (${dy})^2}`,
        `d = \\sqrt{${dx * dx} + ${dy * dy}} = \\sqrt{${distSq}} = ${distSurd.latex}`
      ]
    };
  } else {
    const prompt = `Determine the equation of the line passing through the two points $A(${x1}, ${y1})$ and $B(${x2}, ${y2})$ in the form $y = mx + c$.`;
    const correct = lineEq;
    const wrongSlope = makeFraction(dx, dy);
    const wrongC = makeFraction(y1 * wrongSlope.den - wrongSlope.num * x1, wrongSlope.den);
    const distractors = [
      formatLineEq(wrongSlope, wrongC),
      formatLineEq(makeFraction(-m.num, m.den), c),
      formatLineEq(m, makeFraction(-c.num, c.den))
    ];
    const { options, correctIndex } = createOptions(correct, distractors);
    return {
      id: `q2-line-${Math.random().toString(36).substring(2, 7)}`,
      categoryId: 2,
      categoryTitle: 'Line Equation from Two Points',
      difficulty,
      promptLatex: prompt,
      options,
      correctOptionIndex: correctIndex,
      workedSolutionLatex: [
        `\\text{Points: } A(${x1}, ${y1}), \\; B(${x2}, ${y2})`,
        `\\text{1. Calculate gradient: } m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{${y2} - (${y1})}{${x2} - (${x1})} = \\frac{${dy}}{${dx}} = ${formatFractionLatex(m)}`,
        `\\text{2. Use point-gradient form } y - y_1 = m(x - x_1) \\text{ with } A(${x1}, ${y1}):`,
        `\\quad y - (${y1}) = ${formatFractionLatex(m)}(x - (${x1}))`,
        `\\text{Rearranging into } y = mx + c \\text{ form: }`,
        `\\quad ${lineEq}`
      ]
    };
  }
}

// ==========================================
// 3. Line Equation from Gradient and Point
// ==========================================
export function generateQuestion3(difficulty: 'standard' | 'challenging'): Alt5Question {
  const x1 = randomInt(-5, 6, true);
  const y1 = randomInt(-6, 6);

  let m: Fraction;
  if (difficulty === 'standard') {
    m = makeFraction(randomInt(-4, 4, true), 1);
  } else {
    const den = randomChoice([2, 3, 4, 5]);
    const num = randomInt(-7, 7, true);
    m = makeFraction(num, den);
  }

  // c = y1 - m * x1
  const cNum = y1 * m.den - m.num * x1;
  const c = makeFraction(cNum, m.den);
  const correctLine = formatLineEq(m, c);

  const prompt = `A line has gradient $m = ${formatFractionLatex(m)}$ and passes through the point $P(${x1}, ${y1})$. Determine its equation in the form $y = mx + c$.`;

  // Distractors
  // Distractor 1: sign error on c: c' = y1 + m * x1
  const cDist1 = makeFraction(y1 * m.den + m.num * x1, m.den);
  // Distractor 2: swapped x and y in point substitution
  const cDist2 = makeFraction(x1 * m.den - m.num * y1, m.den);
  // Distractor 3: negative gradient
  const mDist3 = makeFraction(-m.num, m.den);
  const cDist3 = makeFraction(y1 * mDist3.den - mDist3.num * x1, mDist3.den);

  const distractors = [
    formatLineEq(m, cDist1),
    formatLineEq(m, cDist2),
    formatLineEq(mDist3, cDist3)
  ];

  const { options, correctIndex } = createOptions(correctLine, distractors);

  return {
    id: `q3-${Math.random().toString(36).substring(2, 7)}`,
    categoryId: 3,
    categoryTitle: 'Line Equation from Gradient and Point',
    difficulty,
    promptLatex: prompt,
    options,
    correctOptionIndex: correctIndex,
    workedSolutionLatex: [
      `\\text{Given: } m = ${formatFractionLatex(m)}, \\quad P(${x1}, ${y1})`,
      `\\text{Substitute into point-gradient form: } y - y_1 = m(x - x_1)`,
      `\\quad y - (${y1}) = ${formatFractionLatex(m)}(x - (${x1}))`,
      `\\quad y ${y1 >= 0 ? '- ' + y1 : '+ ' + Math.abs(y1)} = ${formatLinearTerm(m, 'x', true)} ${formatConstantTerm(makeFraction(-m.num * x1, m.den))}`,
      `\\text{Add } ${y1} \\text{ to both sides: }`,
      `\\quad ${correctLine}`
    ]
  };
}

// ==========================================
// 4. Perpendicular Line Equations
// ==========================================
export function generateQuestion4(difficulty: 'standard' | 'challenging'): Alt5Question {
  let m1: Fraction;
  if (difficulty === 'standard') {
    const intM = randomChoice([-3, -2, 2, 3, 4]);
    m1 = makeFraction(intM, 1);
  } else {
    const p = randomChoice([-5, -3, -2, 2, 3, 4, 5]);
    const q = randomChoice([2, 3, 4, 5]);
    m1 = makeFraction(p, q);
  }

  const c1 = makeFraction(randomInt(-5, 5), 1);
  const l1Eq = formatLineEq(m1, c1);

  const px = randomInt(-5, 5, true);
  const py = randomInt(-5, 5);

  // m2 = -1 / m1 = -m1.den / m1.num
  const m2 = makeFraction(-m1.den, m1.num);
  const c2Num = py * m2.den - m2.num * px;
  const c2 = makeFraction(c2Num, m2.den);
  const correctLine = formatLineEq(m2, c2);

  const prompt = `Determine the equation of the line perpendicular to $L: ${l1Eq}$ passing through $P(${px}, ${py})$ in the form $y = mx + c$.`;

  // Distractors
  // Common error 1: parallel line (used m1 instead of -1/m1)
  const cParallel = makeFraction(py * m1.den - m1.num * px, m1.den);
  // Common error 2: forgot negative sign on reciprocal (m = +1/m1)
  const mRecipPos = makeFraction(m1.den, m1.num);
  const cRecipPos = makeFraction(py * mRecipPos.den - mRecipPos.num * px, mRecipPos.den);
  // Common error 3: sign error on c2
  const cDist3 = makeFraction(py * m2.den + m2.num * px, m2.den);

  const distractors = [
    formatLineEq(m1, cParallel),
    formatLineEq(mRecipPos, cRecipPos),
    formatLineEq(m2, cDist3)
  ];

  const { options, correctIndex } = createOptions(correctLine, distractors);

  return {
    id: `q4-${Math.random().toString(36).substring(2, 7)}`,
    categoryId: 4,
    categoryTitle: 'Perpendicular Line Equations',
    difficulty,
    promptLatex: prompt,
    options,
    correctOptionIndex: correctIndex,
    workedSolutionLatex: [
      `\\text{Given line: } ${l1Eq} \\implies m_1 = ${formatFractionLatex(m1)}`,
      `\\text{For perpendicular lines: } m_1 \\times m_2 = -1 \\implies m_2 = -\\frac{1}{m_1} = ${formatFractionLatex(m2)}`,
      `\\text{Substitute gradient } m_2 = ${formatFractionLatex(m2)} \\text{ and point } P(${px}, ${py}) \\text{ into } y - y_1 = m(x - x_1):`,
      `\\quad y - (${py}) = ${formatFractionLatex(m2)}(x - (${px}))`,
      `\\text{Rearranging into } y = mx + c \\text{ form: }`,
      `\\quad ${correctLine}`
    ]
  };
}

// ==========================================
// 5. Parallel, Perpendicular, or Neither
// ==========================================
export function generateQuestion5(difficulty: 'standard' | 'challenging'): Alt5Question {
  const relationship = randomChoice<'Parallel' | 'Perpendicular' | 'Neither'>(['Parallel', 'Perpendicular', 'Neither']);

  let m1: Fraction;
  if (difficulty === 'standard') {
    m1 = makeFraction(randomChoice([-4, -3, -2, 2, 3, 4]), 1);
  } else {
    m1 = makeFraction(randomChoice([-3, -2, 2, 3, 4, 5]), randomChoice([2, 3, 4]));
  }

  let m2: Fraction;
  if (relationship === 'Parallel') {
    m2 = { ...m1 };
  } else if (relationship === 'Perpendicular') {
    m2 = makeFraction(-m1.den, m1.num);
  } else {
    // Neither: e.g. same magnitude opposite sign (m2 = -m1) or reciprocal with same sign
    m2 = Math.random() < 0.5 
      ? makeFraction(-m1.num, m1.den) 
      : makeFraction(m1.den, m1.num);
    if (m2.num === m1.num && m2.den === m1.den) {
      m2 = makeFraction(m1.num + 1, m1.den);
    }
  }

  const c1 = makeFraction(randomInt(-5, 5), 1);
  const c2 = makeFraction(randomInt(-5, 5), 1);

  // Present line 1 in y = mx + c and line 2 in Ax + By = C
  const line1Str = formatLineEq(m1, c1);

  // For line 2: Ax + By = C => y = -A/B x + C/B => m2 = -A/B => A = -m2.num, B = m2.den
  const A = -m2.num;
  const B = m2.den;
  const C = c2.num * (B / c2.den);
  const line2Str = `${A === 1 ? '' : A === -1 ? '-' : A}x ${B > 0 ? '+ ' + (B === 1 ? '' : B) : '- ' + (Math.abs(B) === 1 ? '' : Math.abs(B))}y = ${C}`;

  const prompt = `Determine whether the following pair of lines are parallel, perpendicular, or neither by comparing their gradients:\n$L_1: ${line1Str}$\n$L_2: ${line2Str}$`;

  const allChoices = ['Parallel', 'Perpendicular', 'Neither', 'Coincident (same line)'];
  const shuffledOptions = shuffleArray(allChoices);
  const correctIndex = shuffledOptions.indexOf(relationship);

  let explanation = '';
  if (relationship === 'Parallel') {
    explanation = `\\text{Since } m_1 = m_2 = ${formatFractionLatex(m1)}\\text{ and } c_1 \\neq c_2\\text{, the lines are } \\mathbf{Parallel}.`;
  } else if (relationship === 'Perpendicular') {
    explanation = `\\text{Since } m_1 \\times m_2 = ${formatFractionLatex(m1)} \\times ${formatFractionLatex(m2)} = -1\\text{, the lines are } \\mathbf{Perpendicular}.`;
  } else {
    explanation = `\\text{Since } m_1 \\neq m_2 \\text{ and } m_1 \\times m_2 = ${formatFractionLatex(makeFraction(m1.num * m2.num, m1.den * m2.den))} \\neq -1\\text{, the lines are } \\mathbf{Neither} \\text{ parallel nor perpendicular.}`;
  }

  return {
    id: `q5-${Math.random().toString(36).substring(2, 7)}`,
    categoryId: 5,
    categoryTitle: 'Parallel, Perpendicular, or Neither',
    difficulty,
    promptLatex: prompt,
    options: shuffledOptions,
    correctOptionIndex: correctIndex,
    workedSolutionLatex: [
      `\\text{1. Find gradient of } L_1: ${line1Str} \\implies m_1 = ${formatFractionLatex(m1)}`,
      `\\text{2. Rearrange } L_2 \\text{ to } y = mx + c \\text{ form: }`,
      `\\quad ${line2Str} \\implies ${B}y = ${-A}x + ${C} \\implies y = ${formatFractionLatex(m2)}x ${c2.num >= 0 ? '+' : ''}${formatFractionLatex(c2)}`,
      `\\quad \\implies m_2 = ${formatFractionLatex(m2)}`,
      `\\text{3. Compare gradients: }`,
      explanation
    ]
  };
}

// ==========================================
// 6. Point of Intersection (Simultaneous Equations)
// ==========================================
export function generateQuestion6(difficulty: 'standard' | 'challenging'): Alt5Question {
  let solX: Fraction;
  let solY: Fraction;

  if (difficulty === 'standard') {
    solX = makeFraction(randomInt(-4, 4), 1);
    solY = makeFraction(randomInt(-4, 4), 1);
  } else {
    const den = randomChoice([2, 3]);
    solX = makeFraction(randomInt(-5, 5), den);
    solY = makeFraction(randomInt(-5, 5), den);
  }

  // Create two distinct linear equations: y = m1*x + c1 and y = m2*x + c2
  const m1 = makeFraction(randomInt(-3, 3, true), 1);
  let m2 = makeFraction(randomInt(-3, 3, true), 1);
  while (m2.num === m1.num) {
    m2 = makeFraction(randomInt(-4, 4, true), 1);
  }

  // c1 = solY - m1 * solX
  const c1Num = solY.num * m1.den * solX.den - m1.num * solX.num * solY.den;
  const c1Den = solY.den * m1.den * solX.den;
  const c1 = makeFraction(c1Num, c1Den);

  // c2 = solY - m2 * solX
  const c2Num = solY.num * m2.den * solX.den - m2.num * solX.num * solY.den;
  const c2Den = solY.den * m2.den * solX.den;
  const c2 = makeFraction(c2Num, c2Den);

  const eq1 = formatLineEq(m1, c1);
  const eq2 = formatLineEq(m2, c2);

  const prompt = `Find the exact coordinates of the point of intersection of the two lines:\n(1) $${eq1}$\n(2) $${eq2}$`;

  const correct = formatPointLatex(solX, solY);
  const distractors = [
    formatPointLatex(makeFraction(-solX.num, solX.den), solY),
    formatPointLatex(solY, solX),
    formatPointLatex(solX, makeFraction(-solY.num, solY.den))
  ];

  const { options, correctIndex } = createOptions(correct, distractors);

  return {
    id: `q6-${Math.random().toString(36).substring(2, 7)}`,
    categoryId: 6,
    categoryTitle: 'Point of Intersection',
    difficulty,
    promptLatex: prompt,
    options,
    correctOptionIndex: correctIndex,
    workedSolutionLatex: [
      `\\text{Set equations equal to solve by substitution: }`,
      `\\quad ${formatLinearTerm(m1, 'x', true)} ${formatConstantTerm(c1)} = ${formatLinearTerm(m2, 'x', true)} ${formatConstantTerm(c2)}`,
      `\\text{Collect } x\\text{-terms on one side: }`,
      `\\quad (${m1.num} - ${m2.num})x = ${formatFractionLatex(c2)} - (${formatFractionLatex(c1)})`,
      `\\quad \\implies x = ${formatFractionLatex(solX)}`,
      `\\text{Substitute } x = ${formatFractionLatex(solX)} \\text{ back into (1) to solve for } y:`,
      `\\quad y = ${m1.num}(${formatFractionLatex(solX)}) ${formatConstantTerm(c1)} = ${formatFractionLatex(solY)}`,
      `\\text{Exact point of intersection: } ${correct}`
    ]
  };
}

// ==========================================
// 7. Features of Quadratics (1 feature at a time)
// ==========================================
export function generateQuestion7(difficulty: 'standard' | 'challenging'): Alt5Question {
  const form = randomChoice<'factorised' | 'turning_point' | 'general'>(['factorised', 'turning_point', 'general']);
  let a = 1;
  let r1 = randomInt(-4, 4);
  let r2 = randomInt(-4, 4);
  while (r2 === r1) r2 = randomInt(-4, 4);

  if (difficulty === 'challenging') {
    a = randomChoice([-2, -1, 2]);
  }

  // General coefficients: y = a(x - r1)(x - r2) = a(x^2 - (r1+r2)x + r1*r2)
  const b = -a * (r1 + r2);
  const c = a * r1 * r2;

  // Turning point: h = -b / (2a) = (r1 + r2) / 2
  const tpX = makeFraction(r1 + r2, 2);
  const tpYNum = -a * Math.pow(r2 - r1, 2);
  const tpY = makeFraction(tpYNum, 4);

  let eqPrompt = '';
  if (form === 'factorised') {
    const factor1 = r1 === 0 ? 'x' : `(x ${r1 > 0 ? '- ' + r1 : '+ ' + Math.abs(r1)})`;
    const factor2 = `(x ${r2 > 0 ? '- ' + r2 : '+ ' + Math.abs(r2)})`;
    eqPrompt = a === 1 ? `y = ${factor1}${factor2}` : a === -1 ? `y = -${factor1}${factor2}` : `y = ${a}${factor1}${factor2}`;
  } else if (form === 'turning_point') {
    const hStr = tpX.num === 0 ? 'x^2' : `\\left(x ${tpX.num > 0 ? '- ' + formatFractionLatex(tpX) : '+ ' + formatFractionLatex(makeFraction(-tpX.num, tpX.den))}\\right)^2`;
    const kStr = formatConstantTerm(tpY);
    eqPrompt = a === 1 ? `y = ${hStr} ${kStr}` : a === -1 ? `y = -${hStr} ${kStr}` : `y = ${a}${hStr} ${kStr}`;
  } else {
    // general form
    const aTerm = a === 1 ? 'x^2' : a === -1 ? '-x^2' : `${a}x^2`;
    const bTerm = b === 0 ? '' : b === 1 ? '+ x' : b === -1 ? '- x' : b > 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`;
    const cTerm = c === 0 ? '' : c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    eqPrompt = `y = ${aTerm} ${bTerm} ${cTerm}`;
  }

  // Ask for only ONE feature at a time!
  const targetFeature = randomChoice<'x_ints' | 'y_int' | 'tp'>(['x_ints', 'y_int', 'tp']);
  const sortedRoots = [Math.min(r1, r2), Math.max(r1, r2)];

  let prompt = '';
  let correct = '';
  let distractors: string[] = [];
  let steps: string[] = [];

  if (targetFeature === 'x_ints') {
    prompt = `Given the quadratic $${eqPrompt}$, find the exact coordinates of its $x$-intercepts.`;
    correct = `(${sortedRoots[0]}, 0) \\text{ and } (${sortedRoots[1]}, 0)`;
    distractors = [
      `(${-sortedRoots[0]}, 0) \\text{ and } (${-sortedRoots[1]}, 0)`,
      `(0, ${sortedRoots[0]}) \\text{ and } (0, ${sortedRoots[1]})`,
      `(${sortedRoots[0] - 1}, 0) \\text{ and } (${sortedRoots[1] + 1}, 0)`
    ];
    steps = [
      `\\text{Equation: } ${eqPrompt}`,
      `\\text{To find } x\\text{-intercepts, set } y = 0:`,
      `\\quad a(x - ${r1})(x - ${r2}) = 0 \\implies x = ${sortedRoots[0]} \\text{ or } x = ${sortedRoots[1]}`,
      `\\text{Exact coordinates: } (${sortedRoots[0]}, 0) \\text{ and } (${sortedRoots[1]}, 0)`
    ];
  } else if (targetFeature === 'y_int') {
    prompt = `Given the quadratic $${eqPrompt}$, find the exact coordinates of its $y$-intercept.`;
    correct = `(0, ${c})`;
    distractors = [
      `(${c}, 0)`,
      `(0, ${-c})`,
      `(0, ${c > 0 ? c + 2 : c - 2})`
    ];
    steps = [
      `\\text{Equation: } ${eqPrompt}`,
      `\\text{To find } y\\text{-intercept, set } x = 0:`,
      `\\quad y = a(0 - ${r1})(0 - ${r2}) = ${c}`,
      `\\text{Exact coordinates: } (0, ${c})`
    ];
  } else {
    prompt = `Given the quadratic $${eqPrompt}$, find the exact coordinates of its turning point.`;
    correct = `${formatPointLatex(tpX, tpY)}`;
    distractors = [
      formatPointLatex(makeFraction(-tpX.num, tpX.den), tpY),
      formatPointLatex(tpX, makeFraction(-tpY.num, tpY.den)),
      formatPointLatex(tpY, tpX)
    ];
    steps = [
      `\\text{Equation: } ${eqPrompt}`,
      `\\text{1. Axis of symmetry is midway between the roots } r_1 = ${r1}, \\, r_2 = ${r2}:`,
      `\\quad x = \\frac{${r1} + (${r2})}{2} = ${formatFractionLatex(tpX)}`,
      `\\text{2. Substitute } x = ${formatFractionLatex(tpX)} \\text{ to find } y = ${formatFractionLatex(tpY)}:`,
      `\\text{Exact Turning Point: } ${formatPointLatex(tpX, tpY)}`
    ];
  }

  const { options, correctIndex } = createOptions(correct, distractors);

  return {
    id: `q7-${Math.random().toString(36).substring(2, 7)}`,
    categoryId: 7,
    categoryTitle: 'Features of Quadratics',
    difficulty,
    promptLatex: prompt,
    options,
    correctOptionIndex: correctIndex,
    workedSolutionLatex: steps
  };
}

// ==========================================
// 8. Quadratic Restricted Domain, Tables & Horizontal Line Intersection
// ==========================================
export function generateQuestion8(difficulty: 'standard' | 'challenging'): Alt5Question {
  // y = x^2 + bx + c or a(x - h)^2 + k
  const h = randomInt(-1, 2);
  const k = randomInt(-4, 0);
  // y = (x - h)^2 + k => x^2 - 2hx + (h^2 + k)
  const a = 1;
  const b = -2 * h;
  const c = h * h + k;

  const xMin = h - 2;
  const xMax = h + 3;

  const tableData: Array<{ x: number; y: number }> = [];
  for (let x = xMin; x <= xMax; x++) {
    const yVal = a * x * x + b * x + c;
    tableData.push({ x, y: yVal });
  }

  // Choose horizontal line y = targetY such that it intersects in domain
  const targetY = k + 1; // has solutions (x - h)^2 = 1 => x = h ± 1
  const sol1 = h - 1;
  const sol2 = h + 1;
  const validSols = [sol1, sol2].filter(s => s >= xMin && s < xMax);

  const eqStr = `y = x^2 ${b === 0 ? '' : b > 0 ? '+ ' + b + 'x' : '- ' + Math.abs(b) + 'x'} ${c === 0 ? '' : c > 0 ? '+ ' + c : '- ' + Math.abs(c)}`;
  const domainStr = `${xMin} \\le x < ${xMax}`;

  const prompt = `Given $${eqStr}$ for the restricted domain $${domainStr}$, determine all exact $x$-values where the horizontal line $y = ${targetY}$ intersects the parabola.`;

  const correct = validSols.length === 0 
    ? '\\text{No points of intersection}' 
    : (validSols.length === 1 ? `x = ${validSols[0]}` : `x = ${validSols.join(', ')}`);

  const distractors = [
    `x = ${validSols.map(s => -s).join(', ')}`,
    `x = ${sol1}, ${sol2}`,
    validSols.length > 0 ? `x = ${validSols[0]}` : `x = ${h}`,
    '\\text{No points of intersection}'
  ];

  const { options, correctIndex } = createOptions(correct, distractors);

  return {
    id: `q8-${Math.random().toString(36).substring(2, 7)}`,
    categoryId: 8,
    categoryTitle: 'Restricted Domain, Tables & Horizontal Intersections',
    difficulty,
    promptLatex: prompt,
    tableData,
    options,
    correctOptionIndex: correctIndex,
    workedSolutionLatex: [
      `\\text{1. Table of integer values for } ${domainStr}:`,
      tableData.map(d => `x = ${d.x} \\implies y = (${d.x})^2 ${b >= 0 ? '+' : ''}${b}(${d.x}) ${c >= 0 ? '+' : ''}${c} = ${d.y}`).join(' \\\\ '),
      `\\text{2. Endpoint analysis:}`,
      `\\quad \\text{At } x = ${xMin}\\text{, the inequality is } \\le \\implies \\text{solid/closed dot at } (${xMin}, ${tableData[0].y}).`,
      `\\quad \\text{At } x = ${xMax}\\text{, the inequality is } < \\implies \\text{hollow/open circle at } (${xMax}, ${tableData[tableData.length - 1].y}).`,
      `\\text{3. Solve intersection with } y = ${targetY}:`,
      `\\quad x^2 ${b >= 0 ? '+' : ''}${b}x + ${c} = ${targetY} \\implies (x - ${h})^2 + ${k} = ${targetY} \\implies (x - ${h})^2 = ${targetY - k}`,
      `\\quad x - ${h} = \\pm ${Math.sqrt(targetY - k)} \\implies x = ${sol1} \\text{ or } x = ${sol2}`,
      `\\text{Checking domain } ${domainStr} \\implies x = ${validSols.join(', ')}.`
    ],
    graphData: {
      type: 'parabola_restricted',
      parabolaA: a,
      parabolaB: b,
      parabolaC: c,
      xMinDomain: xMin,
      xMaxDomain: xMax,
      horizontalY: targetY,
      points: [
        { x: xMin, y: tableData[0].y, label: `(${xMin}, ${tableData[0].y}) [closed]`, isOpen: false },
        { x: xMax, y: tableData[tableData.length - 1].y, label: `(${xMax}, ${tableData[tableData.length - 1].y}) [open]`, isOpen: true, color: 'text-rose-500' },
        ...validSols.map(s => ({ x: s, y: targetY, label: `(${s}, ${targetY})`, color: 'text-amber-500' }))
      ]
    }
  };
}

// ==========================================
// 9. Sketching Parabolas from Features (4 Graph Options Grid)
// ==========================================
export function generateQuestion9(difficulty: 'standard' | 'challenging'): Alt5Question {
  const r1 = randomInt(-3, 0);
  const r2 = randomInt(1, 4);
  const a = difficulty === 'standard' ? 1 : randomChoice([-1, 1, 2]);

  const b = -a * (r1 + r2);
  const c = a * r1 * r2;
  const tpX = makeFraction(r1 + r2, 2);
  const tpY = makeFraction(-a * Math.pow(r2 - r1, 2), 4);

  const eqStr = a === 1 
    ? `y = (x ${r1 > 0 ? '- ' + r1 : '+ ' + Math.abs(r1)})(x ${r2 > 0 ? '- ' + r2 : '+ ' + Math.abs(r2)})`
    : a === -1
    ? `y = -(x ${r1 > 0 ? '- ' + r1 : '+ ' + Math.abs(r1)})(x ${r2 > 0 ? '- ' + r2 : '+ ' + Math.abs(r2)})`
    : `y = ${a}(x ${r1 > 0 ? '- ' + r1 : '+ ' + Math.abs(r1)})(x ${r2 > 0 ? '- ' + r2 : '+ ' + Math.abs(r2)})`;

  const prompt = `Given the parabola $${eqStr}$, state its features and select the correct sketch:`;

  const correctGraph: Alt5GraphData = {
    type: 'parabola_features',
    parabolaA: a,
    parabolaB: b,
    parabolaC: c,
    points: [
      { x: r1, y: 0, label: `(${r1}, 0)` },
      { x: r2, y: 0, label: `(${r2}, 0)` },
      { x: 0, y: c, label: `(0, ${c})` },
      { x: tpX.num / tpX.den, y: tpY.num / tpY.den, label: `TP`, color: 'text-indigo-600' }
    ]
  };

  // Distractor 1: Inverted concavity (-a)
  const d1Graph: Alt5GraphData = {
    type: 'parabola_features',
    parabolaA: -a,
    parabolaB: -b,
    parabolaC: -c,
    points: [
      { x: r1, y: 0, label: `(${r1}, 0)` },
      { x: r2, y: 0, label: `(${r2}, 0)` },
      { x: 0, y: -c, label: `(0, ${-c})` },
      { x: tpX.num / tpX.den, y: -tpY.num / tpY.den, label: `TP` }
    ]
  };

  // Distractor 2: Sign-flipped roots (-r1, -r2)
  const d2Graph: Alt5GraphData = {
    type: 'parabola_features',
    parabolaA: a,
    parabolaB: -b,
    parabolaC: c,
    points: [
      { x: -r1, y: 0, label: `(${-r1}, 0)` },
      { x: -r2, y: 0, label: `(${-r2}, 0)` },
      { x: 0, y: c, label: `(0, ${c})` },
      { x: -tpX.num / tpX.den, y: tpY.num / tpY.den, label: `TP` }
    ]
  };

  // Distractor 3: Shifted y-intercept
  const d3Graph: Alt5GraphData = {
    type: 'parabola_features',
    parabolaA: a,
    parabolaB: b,
    parabolaC: -c,
    points: [
      { x: r1, y: 0, label: `(${r1}, 0)` },
      { x: r2, y: 0, label: `(${r2}, 0)` },
      { x: 0, y: -c, label: `(0, ${-c})` }
    ]
  };

  const graphChoices: { graph: Alt5GraphData; isCorrect: boolean }[] = [
    { graph: correctGraph, isCorrect: true },
    { graph: d1Graph, isCorrect: false },
    { graph: d2Graph, isCorrect: false },
    { graph: d3Graph, isCorrect: false }
  ];

  const shuffled = shuffleArray(graphChoices);
  const correctIndex = shuffled.findIndex(c => c.isCorrect);

  return {
    id: `q9-${Math.random().toString(36).substring(2, 7)}`,
    categoryId: 9,
    categoryTitle: 'Sketching Parabolas from Features',
    difficulty,
    promptLatex: prompt,
    graphOptions: shuffled.map(c => c.graph),
    options: ['Graph A', 'Graph B', 'Graph C', 'Graph D'],
    correctOptionIndex: correctIndex,
    workedSolutionLatex: [
      `\\text{Equation: } ${eqStr}`,
      `\\text{1. } x\\text{-intercepts: Set } y = 0 \\implies (${r1}, 0) \\text{ and } (${r2}, 0).`,
      `\\text{2. } y\\text{-intercept: Set } x = 0 \\implies y = ${c} \\implies (0, ${c}).`,
      `\\text{3. Axis of symmetry: } x = \\frac{${r1} + ${r2}}{2} = ${formatFractionLatex(tpX)}.`,
      `\\text{4. Turning Point: Substitute } x = ${formatFractionLatex(tpX)} \\implies y = ${formatFractionLatex(tpY)}.`,
      `\\quad \\text{Turning Point } = ${formatPointLatex(tpX, tpY)}`,
      `\\text{5. Draw a smooth parabola curve passing through all 4 key points.}`
    ],
    graphData: correctGraph
  };
}

// ==========================================
// 10. Parabola Equations (Turning Point Form)
// ==========================================
export function generateQuestion10(difficulty: 'standard' | 'challenging'): Alt5Question {
  const h = randomInt(-4, 4);
  const k = randomInt(-5, 5);
  
  let a: Fraction;
  if (difficulty === 'standard') {
    a = makeFraction(randomChoice([-2, -1, 1, 2, 3]), 1);
  } else {
    a = makeFraction(randomChoice([-3, -1, 1, 3, 5]), randomChoice([2, 4]));
  }

  // Pick passing point P(x1, y1) with x1 != h
  const dx = randomChoice([-3, -2, -1, 1, 2, 3]);
  const x1 = h + dx;
  // y1 = a * dx^2 + k
  const y1Num = a.num * (dx * dx) + k * a.den;
  const y1 = makeFraction(y1Num, a.den);

  const tpStr = `(${h}, ${k})`;
  const pStr = formatPointLatex(x1, y1);

  const prompt = `A parabola has a turning point at $${tpStr}$ and passes through the point $P${pStr}$. Determine its equation in turning point form $y = a(x - h)^2 + k$.`;

  const hTerm = h === 0 ? 'x^2' : `(x ${h > 0 ? '- ' + h : '+ ' + Math.abs(h)})^2`;
  const kTerm = k === 0 ? '' : k > 0 ? `+ ${k}` : `- ${Math.abs(k)}`;
  const aStr = a.num === 1 && a.den === 1 ? '' : a.num === -1 && a.den === 1 ? '-' : `${formatFractionLatex(a)}`;
  const correct = `y = ${aStr}${hTerm} ${kTerm}`.trim();

  // Distractors
  // Distractor 1: sign error on h (x + h)^2
  const wrongHTerm = `(x ${h >= 0 ? '+ ' + h : '- ' + Math.abs(h)})^2`;
  // Distractor 2: inverted a (divided by dx instead of dx^2)
  const wrongA = makeFraction(y1Num - k * a.den, a.den * Math.abs(dx));
  const wrongAStr = formatFractionLatex(wrongA);
  // Distractor 3: sign flip on a
  const negAStr = formatFractionLatex(makeFraction(-a.num, a.den));

  const distractors = [
    `y = ${aStr}${wrongHTerm} ${kTerm}`.trim(),
    `y = ${wrongAStr}${hTerm} ${kTerm}`.trim(),
    `y = ${negAStr}${hTerm} ${kTerm}`.trim()
  ];

  const { options, correctIndex } = createOptions(correct, distractors);

  return {
    id: `q10-${Math.random().toString(36).substring(2, 7)}`,
    categoryId: 10,
    categoryTitle: 'Parabola Equations (Turning Point Form)',
    difficulty,
    promptLatex: prompt,
    options,
    correctOptionIndex: correctIndex,
    workedSolutionLatex: [
      `\\text{Turning Point Form: } y = a(x - h)^2 + k`,
      `\\text{1. Substitute turning point } (h, k) = (${h}, ${k}):`,
      `\\quad y = a${hTerm} ${kTerm}`,
      `\\text{2. Substitute passing point } P(${x1}, ${formatFractionLatex(y1)}):`,
      `\\quad ${formatFractionLatex(y1)} = a(${x1} - (${h}))^2 ${kTerm}`,
      `\\quad ${formatFractionLatex(y1)} = a(${dx})^2 ${kTerm} \\implies ${dx * dx}a = ${formatFractionLatex(makeFraction(y1Num - k * a.den, a.den))}`,
      `\\quad \\implies a = ${formatFractionLatex(a)}`,
      `\\text{3. Final equation in turning point form: } ${correct}`
    ]
  };
}

// ==========================================
// 11. Parabola Equations (Factorised Form)
// ==========================================
export function generateQuestion11(difficulty: 'standard' | 'challenging'): Alt5Question {
  const r1 = randomInt(-5, 2);
  let r2 = randomInt(r1 + 1, 6);
  if (r2 === r1) r2 = r1 + 2;

  let a: Fraction;
  if (difficulty === 'standard') {
    a = makeFraction(randomChoice([-2, -1, 1, 2]), 1);
  } else {
    a = makeFraction(randomChoice([-3, -1, 1, 3]), randomChoice([2, 4]));
  }

  // Passing point (x1, y1) with x1 != r1 and x1 != r2
  let x1 = 0;
  if (r1 === 0 || r2 === 0) x1 = r1 - 1;
  const prod = (x1 - r1) * (x1 - r2);
  const y1 = makeFraction(a.num * prod, a.den);

  const factor1 = r1 === 0 ? 'x' : `(x ${r1 > 0 ? '- ' + r1 : '+ ' + Math.abs(r1)})`;
  const factor2 = `(x ${r2 > 0 ? '- ' + r2 : '+ ' + Math.abs(r2)})`;
  const aStr = a.num === 1 && a.den === 1 ? '' : a.num === -1 && a.den === 1 ? '-' : `${formatFractionLatex(a)}`;
  const correct = `y = ${aStr}${factor1}${factor2}`;

  const prompt = `A parabola has $x$-intercepts at $(${r1}, 0)$ and $(${r2}, 0)$ and passes through $P${formatPointLatex(x1, y1)}$. Determine its equation in factorised form $y = a(x - r_1)(x - r_2)$.`;

  // Distractors
  const wrongFactor1 = `(x ${r1 >= 0 ? '+ ' + r1 : '- ' + Math.abs(r1)})`;
  const wrongFactor2 = `(x ${r2 >= 0 ? '+ ' + r2 : '- ' + Math.abs(r2)})`;
  const negAStr = formatFractionLatex(makeFraction(-a.num, a.den));

  const distractors = [
    `y = ${aStr}${wrongFactor1}${wrongFactor2}`,
    `y = ${negAStr}${factor1}${factor2}`,
    `y = 2${factor1}${factor2}`
  ];

  const { options, correctIndex } = createOptions(correct, distractors);

  return {
    id: `q11-${Math.random().toString(36).substring(2, 7)}`,
    categoryId: 11,
    categoryTitle: 'Parabola Equations (Factorised Form)',
    difficulty,
    promptLatex: prompt,
    options,
    correctOptionIndex: correctIndex,
    workedSolutionLatex: [
      `\\text{Factorised Form: } y = a(x - r_1)(x - r_2)`,
      `\\text{1. Substitute given roots } r_1 = ${r1}, \\, r_2 = ${r2}:`,
      `\\quad y = a${factor1}${factor2}`,
      `\\text{2. Substitute passing point } P(${x1}, ${formatFractionLatex(y1)}):`,
      `\\quad ${formatFractionLatex(y1)} = a(${x1} - (${r1}))(${x1} - (${r2}))`,
      `\\quad ${formatFractionLatex(y1)} = a(${x1 - r1})(${x1 - r2}) = ${prod}a`,
      `\\quad \\implies a = \\frac{${formatFractionLatex(y1)}}{${prod}} = ${formatFractionLatex(a)}`,
      `\\text{3. Final equation in factorised form: } ${correct}`
    ]
  };
}

// ==========================================
// 12. Point Transformations
// ==========================================
export function generateQuestion12(difficulty: 'standard' | 'challenging'): Alt5Question {
  const px = randomInt(-6, 6, true);
  const py = randomInt(-6, 6, true);

  const transTypes = ['translate_x', 'translate_y', 'reflect_x', 'reflect_y', 'dilate_x', 'dilate_y'];
  const transType = randomChoice(transTypes);

  let desc = '';
  let newX = makeFraction(px, 1);
  let newY = makeFraction(py, 1);
  let explanation = '';

  if (transType === 'translate_x') {
    const shift = randomInt(2, 6);
    const dir = Math.random() < 0.5 ? 'right' : 'left';
    desc = `translated ${shift} units ${dir}`;
    newX = dir === 'right' ? makeFraction(px + shift, 1) : makeFraction(px - shift, 1);
    explanation = `\\text{Translation ${dir} by } ${shift} \\implies x' = x ${dir === 'right' ? '+' : '-'} ${shift} = ${newX.num}, \\; y' = y = ${py}.`;
  } else if (transType === 'translate_y') {
    const shift = randomInt(2, 6);
    const dir = Math.random() < 0.5 ? 'up' : 'down';
    desc = `translated ${shift} units ${dir}`;
    newY = dir === 'up' ? makeFraction(py + shift, 1) : makeFraction(py - shift, 1);
    explanation = `\\text{Translation ${dir} by } ${shift} \\implies x' = x = ${px}, \\; y' = y ${dir === 'up' ? '+' : '-'} ${shift} = ${newY.num}.`;
  } else if (transType === 'reflect_x') {
    desc = `reflected in the $x$-axis`;
    newY = makeFraction(-py, 1);
    explanation = `\\text{Reflection in the } x\\text{-axis multiplies the } y\\text{-coordinate by } -1: (x, y) \\to (x, -y) = (${px}, ${-py}).`;
  } else if (transType === 'reflect_y') {
    desc = `reflected in the $y$-axis`;
    newX = makeFraction(-px, 1);
    explanation = `\\text{Reflection in the } y\\text{-axis multiplies the } x\\text{-coordinate by } -1: (x, y) \\to (-x, y) = (${-px}, ${py}).`;
  } else if (transType === 'dilate_x') {
    // Dilation from x-axis: factor k affects y!
    const k = randomChoice([2, 3, 4]);
    desc = `dilated by factor ${k} from the $x$-axis`;
    newY = makeFraction(py * k, 1);
    explanation = `\\text{Dilation by factor } ${k} \\text{ from the } x\\text{-axis stretches vertically, multiplying } y \\text{ by } ${k}: (x, y) \\to (x, ${k}y) = (${px}, ${py * k}).`;
  } else {
    // Dilation from y-axis: factor k affects x!
    const k = randomChoice([2, 3, 4]);
    desc = `dilated by factor ${k} from the $y$-axis`;
    newX = makeFraction(px * k, 1);
    explanation = `\\text{Dilation by factor } ${k} \\text{ from the } y\\text{-axis stretches horizontally, multiplying } x \\text{ by } ${k}: (x, y) \\to (${k}x, y) = (${px * k}, ${py}).`;
  }

  const prompt = `The point $P(${px}, ${py})$ is ${desc}. State the exact coordinates of the image point $P'$.`;

  const correct = formatPointLatex(newX, newY);
  const distractors = [
    formatPointLatex(newY, newX),
    formatPointLatex(makeFraction(-newX.num, newX.den), newY),
    formatPointLatex(newX, makeFraction(-newY.num, newY.den))
  ];

  const { options, correctIndex } = createOptions(correct, distractors);

  return {
    id: `q12-${Math.random().toString(36).substring(2, 7)}`,
    categoryId: 12,
    categoryTitle: 'Point Transformations',
    difficulty,
    promptLatex: prompt,
    options,
    correctOptionIndex: correctIndex,
    workedSolutionLatex: [
      `\\text{Initial point: } P(${px}, ${py})`,
      `\\text{Transformation: } \\text{${desc}}`,
      explanation,
      `\\text{Image point: } P'${correct}`
    ]
  };
}

// ==========================================
// 13. Equation Transformations
// ==========================================
export function generateQuestion13(difficulty: 'standard' | 'challenging'): Alt5Question {
  const transTypes = ['translate_v', 'translate_h', 'reflect_x', 'reflect_y', 'dilate_x', 'dilate_y'];
  const transType = randomChoice(transTypes);

  let desc = '';
  let correct = '';
  let explanation = '';
  let distractors: string[] = [];

  if (transType === 'translate_v') {
    const k = randomInt(2, 6);
    const dir = Math.random() < 0.5 ? 'up' : 'down';
    desc = `translated ${k} units ${dir}`;
    correct = dir === 'up' ? `y = x^2 + ${k}` : `y = x^2 - ${k}`;
    explanation = `\\text{Vertical translation: Add } ${dir === 'up' ? '+' : '-'}${k} \\text{ to the expression } \\implies ${correct}.`;
    distractors = [
      dir === 'up' ? `y = x^2 - ${k}` : `y = x^2 + ${k}`,
      dir === 'up' ? `y = (x + ${k})^2` : `y = (x - ${k})^2`,
      `y = ${k}x^2`
    ];
  } else if (transType === 'translate_h') {
    const h = randomInt(2, 6);
    const dir = Math.random() < 0.5 ? 'right' : 'left';
    desc = `translated ${h} units ${dir}`;
    correct = dir === 'right' ? `y = (x - ${h})^2` : `y = (x + ${h})^2`;
    explanation = `\\text{Horizontal translation: Replace } x \\text{ with } (x ${dir === 'right' ? '-' : '+'} ${h}) \\implies ${correct}.`;
    distractors = [
      dir === 'right' ? `y = (x + ${h})^2` : `y = (x - ${h})^2`,
      dir === 'right' ? `y = x^2 - ${h}` : `y = x^2 + ${h}`,
      `y = ${h}x^2`
    ];
  } else if (transType === 'reflect_x') {
    desc = `reflected in the $x$-axis`;
    correct = `y = -x^2`;
    explanation = `\\text{Reflection in the } x\\text{-axis multiplies the entire function by } -1: y = -(x^2) = -x^2.`;
    distractors = [
      `y = (-x)^2 = x^2`,
      `y = -x`,
      `y = \\frac{1}{x^2}`
    ];
  } else if (transType === 'reflect_y') {
    desc = `reflected in the $y$-axis`;
    correct = `y = x^2`;
    explanation = `\\text{Reflection in the } y\\text{-axis replaces } x \\text{ with } (-x): y = (-x)^2 = x^2. The graph is symmetric about the } y\\text{-axis.}`;
    distractors = [
      `y = -x^2`,
      `y = -(x)^2`,
      `y = -x`
    ];
  } else if (transType === 'dilate_x') {
    const k = randomChoice([2, 3, 4, 5]);
    desc = `dilated by factor ${k} from the $x$-axis`;
    correct = `y = ${k}x^2`;
    explanation = `\\text{Dilation by factor } ${k} \\text{ from the } x\\text{-axis multiplies } y \\text{ by } ${k}: y = ${k}(x^2) = ${k}x^2.`;
    distractors = [
      `y = \\frac{x^2}{${k}}`,
      `y = \\frac{x^2}{${k * k}}`,
      `y = ${k * k}x^2`
    ];
  } else {
    // Dilation from y-axis: replace x with x / k
    const k = randomChoice([2, 3, 4]);
    desc = `dilated by factor ${k} from the $y$-axis`;
    const kSq = k * k;
    correct = `y = \\frac{x^2}{${kSq}}`;
    explanation = `\\text{Dilation by factor } ${k} \\text{ from the } y\\text{-axis replaces } x \\text{ with } \\frac{x}{${k}}: y = \\left(\\frac{x}{${k}}\\right)^2 = \\frac{x^2}{${kSq}}.`;
    distractors = [
      `y = ${kSq}x^2`,
      `y = ${k}x^2`,
      `y = \\frac{x^2}{${k}}`
    ];
  }

  const prompt = `The parabola $y = x^2$ is ${desc}. State the equation of the transformed parabola in simplest form.`;

  const { options, correctIndex } = createOptions(correct, distractors);

  return {
    id: `q13-${Math.random().toString(36).substring(2, 7)}`,
    categoryId: 13,
    categoryTitle: 'Equation Transformations',
    difficulty,
    promptLatex: prompt,
    options,
    correctOptionIndex: correctIndex,
    workedSolutionLatex: [
      `\\text{Base parabola: } y = x^2`,
      `\\text{Transformation: } \\text{${desc}}`,
      explanation,
      `\\text{Final transformed equation: } ${correct}`
    ]
  };
}

// ==========================================
// Main Quiz Generator: Section of 15 Questions
// ==========================================
export function generateQuestionByCategory(catId: number, difficulty: 'standard' | 'challenging'): Alt5Question {
  switch (catId) {
    case 1: return generateQuestion1(difficulty);
    case 2: return generateQuestion2(difficulty);
    case 3: return generateQuestion3(difficulty);
    case 4: return generateQuestion4(difficulty);
    case 5: return generateQuestion5(difficulty);
    case 6: return generateQuestion6(difficulty);
    case 7: return generateQuestion7(difficulty);
    case 8: return generateQuestion8(difficulty);
    case 9: return generateQuestion9(difficulty);
    case 10: return generateQuestion10(difficulty);
    case 11: return generateQuestion11(difficulty);
    case 12: return generateQuestion12(difficulty);
    case 13: return generateQuestion13(difficulty);
    default: return generateQuestion1(difficulty);
  }
}

export function generateAlt5Round(difficultyMode: 'standard' | 'challenging' | 'mixed'): Alt5Question[] {
  // We need 15 questions per round.
  // There are 13 categories. To ensure every category is practiced and totals 15:
  // Include all 13 categories (1 to 13), and pick 2 categories at random to appear twice!
  const all13 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const extras = shuffleArray(all13).slice(0, 2);
  const roundCategoryIds = shuffleArray([...all13, ...extras]);

  return roundCategoryIds.map(catId => {
    let diff: 'standard' | 'challenging';
    if (difficultyMode === 'mixed') {
      diff = Math.random() < 0.5 ? 'standard' : 'challenging';
    } else {
      diff = difficultyMode;
    }
    return generateQuestionByCategory(catId, diff);
  });
}
