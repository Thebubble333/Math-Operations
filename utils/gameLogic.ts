
import { GameMode, MathProblem, GraphType, GraphParams } from '../types';

const generateGraphProblem = (): MathProblem => {
  const types: GraphType[] = ['linear', 'quadratic', 'cubic', 'hyperbola', 'truncus', 'sqrt'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  // Parameters
  const a = Math.random() < 0.5 ? 1 : -1;
  const h = Math.floor(Math.random() * 7) - 3; // -3 to 3
  const k = Math.floor(Math.random() * 7) - 3; // -3 to 3

  let question = '';
  const formatNumber = (n: number) => n < 0 ? `(${n})` : `${n}`;
  const formatShift = (val: number) => val === 0 ? '' : val > 0 ? ` - ${val}` : ` + ${Math.abs(val)}`;
  const formatVertical = (val: number) => val === 0 ? '' : val > 0 ? ` + ${val}` : ` - ${Math.abs(val)}`;
  
  switch (type) {
    case 'linear':
      // y = a(x - h) + k -> y = ax - ah + k
      const intercept = -a * h + k;
      question = `y = ${a === 1 ? '' : '-'}x ${formatVertical(intercept)}`;
      break;
    case 'quadratic':
      question = `y = ${a === 1 ? '' : '-'} (x${formatShift(h)})^2${formatVertical(k)}`;
      break;
    case 'cubic':
      question = `y = ${a === 1 ? '' : '-'} (x${formatShift(h)})^3${formatVertical(k)}`;
      break;
    case 'hyperbola':
      // Remove parentheses if h is 0 for cleaner look: 1/x vs 1/(x-2)
      const denomH = h === 0 ? 'x' : `x${formatShift(h)}`;
      // If h is not 0, we might want parentheses around the denominator if it's complex, but for 1/(x-h) it's standard.
      // Actually, standard LaTeX for 1/(x-h) is \frac{1}{x-h}.
      question = `y = ${a === 1 ? '' : '-'}\\frac{1}{${denomH}}${formatVertical(k)}`;
      break;
    case 'truncus':
      const denomT = h === 0 ? 'x^2' : `(x${formatShift(h)})^2`;
      question = `y = ${a === 1 ? '' : '-'}\\frac{1}{${denomT}}${formatVertical(k)}`;
      break;
    case 'sqrt':
      question = `y = ${a === 1 ? '' : '-'}\\sqrt{x${formatShift(h)}}${formatVertical(k)}`;
      break;
  }

  // Clean up double spaces or empty parts
  question = question.replace(/\s+/g, ' ').trim();

  const correctParams: GraphParams = { type, a, h, k };
  const options: GraphParams[] = [correctParams];

  // Generate distractors
  while (options.length < 4) {
    const da = Math.random() < 0.5 ? 1 : -1;
    const dh = Math.floor(Math.random() * 7) - 3;
    const dk = Math.floor(Math.random() * 7) - 3;
    
    // Ensure uniqueness
    const isDuplicate = options.some(o => o.a === da && o.h === dh && o.k === dk);
    if (!isDuplicate && (da !== a || dh !== h || dk !== k)) {
      options.push({ type, a: da, h: dh, k: dk });
    }
  }

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const answerIndex = options.findIndex(o => o.a === a && o.h === h && o.k === k);

  return {
    question,
    answer: answerIndex, // The index of the correct option (0-3)
    options,
    type: 'graph'
  };
};

export const generateProblem = (mode: GameMode): MathProblem => {
  if (mode === GameMode.METHODS_GRAPHS) {
    return generateGraphProblem();
  }

  let a: number, b: number, answer: number, question: string;
  let activeMode = mode;

  if (mode === GameMode.MIXED) {
    const modes = [GameMode.ADDITION, GameMode.SUBTRACTION, GameMode.MULTIPLICATION, GameMode.DIVISION];
    activeMode = modes[Math.floor(Math.random() * modes.length)];
  }

  switch (activeMode) {
    case GameMode.ADDITION:
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a + b;
      question = `${a} + ${b}`;
      break;

    case GameMode.SUBTRACTION:
      a = Math.floor(Math.random() * 20) + 5;
      b = Math.floor(Math.random() * (a - 1)) + 1;
      answer = a - b;
      question = `${a} - ${b}`;
      break;

    case GameMode.MULTIPLICATION:
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
      question = `${a} × ${b}`;
      break;

    case GameMode.DIVISION:
      // Generate answer and divisor first to ensure whole numbers
      answer = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 11) + 2; // Divisor 2-12
      a = answer * b;
      question = `${a} ÷ ${b}`;
      break;

    default:
      return { question: '?', answer: 0, type: 'arithmetic' };
  }

  return { question, answer, type: 'arithmetic' };
};