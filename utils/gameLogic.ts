
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

const generateTrigProblem = (forceQuadrant1: boolean = false): MathProblem => {
  // Angles in radians and their LaTeX representation
  // We want multiples of pi/6 and pi/4 from -2pi to 2pi
  
  // Helper to simplify fraction and format as LaTeX
  const formatAngle = (num: number, den: number): string => {
    if (num === 0) return '0';
    
    // Simplify fraction
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const common = Math.abs(gcd(num, den));
    num /= common;
    den /= common;

    if (den === 1) {
      if (num === 1) return '\\pi';
      if (num === -1) return '-\\pi';
      return `${num}\\pi`;
    }

    const sign = num < 0 ? '-' : '';
    const absNum = Math.abs(num);
    const numStr = absNum === 1 ? '' : absNum;
    return `${sign}\\frac{${numStr}\\pi}{${den}}`;
  };

  let angles: { rad: number, latex: string }[] = [];
  
  if (forceQuadrant1) {
    angles = [
      { rad: 0, latex: '0' },
      { rad: Math.PI / 6, latex: '\\frac{\\pi}{6}' },
      { rad: Math.PI / 4, latex: '\\frac{\\pi}{4}' },
      { rad: Math.PI / 3, latex: '\\frac{\\pi}{3}' },
      { rad: Math.PI / 2, latex: '\\frac{\\pi}{2}' }
    ];
  } else {
    // Multiples of pi/6: -12 to 12
    for (let i = -12; i <= 12; i++) {
      angles.push({ rad: i * Math.PI / 6, latex: formatAngle(i, 6) });
    }
    
    // Multiples of pi/4: -8 to 8
    for (let i = -8; i <= 8; i++) {
      const rad = i * Math.PI / 4;
      if (!angles.some(a => Math.abs(a.rad - rad) < 1e-9)) {
         angles.push({ rad, latex: formatAngle(i, 4) });
      }
    }
  }

  const angleObj = angles[Math.floor(Math.random() * angles.length)];
  const funcs = ['\\sin', '\\cos', '\\tan'];
  const func = funcs[Math.floor(Math.random() * funcs.length)];

  let answer = '';
  // Calculate exact value
  // We can use a lookup or just calculate based on reference angle
  // Normalize angle to [0, 2pi) for easier calculation, but keep original for display
  let normRad = angleObj.rad % (2 * Math.PI);
  if (normRad < 0) normRad += 2 * Math.PI;

  // Round to avoid floating point issues
  normRad = Math.round(normRad * 10000) / 10000;

  const getExactValue = (func: string, rad: number): string => {
    // Special cases
    if (func === '\\tan') {
      // Undefined at pi/2, 3pi/2
      if (Math.abs(rad - Math.PI/2) < 1e-4 || Math.abs(rad - 3*Math.PI/2) < 1e-4) return 'Undefined';
    }

    let val = 0;
    if (func === '\\sin') val = Math.sin(rad);
    if (func === '\\cos') val = Math.cos(rad);
    if (func === '\\tan') val = Math.tan(rad);

    // Round to handle floating point
    val = Math.round(val * 10000) / 10000;

    // Map to exact strings
    if (Math.abs(val) < 1e-4) return '0';
    if (Math.abs(val - 0.5) < 1e-4) return '\\frac{1}{2}';
    if (Math.abs(val + 0.5) < 1e-4) return '-\\frac{1}{2}';
    if (Math.abs(val - 1) < 1e-4) return '1';
    if (Math.abs(val + 1) < 1e-4) return '-1';
    
    // Sqrt(2)/2 approx 0.7071
    if (Math.abs(val - Math.sqrt(2)/2) < 1e-4) return '\\frac{\\sqrt{2}}{2}';
    if (Math.abs(val + Math.sqrt(2)/2) < 1e-4) return '-\\frac{\\sqrt{2}}{2}';
    
    // Sqrt(3)/2 approx 0.8660
    if (Math.abs(val - Math.sqrt(3)/2) < 1e-4) return '\\frac{\\sqrt{3}}{2}';
    if (Math.abs(val + Math.sqrt(3)/2) < 1e-4) return '-\\frac{\\sqrt{3}}{2}';

    // Sqrt(3) approx 1.732
    if (Math.abs(val - Math.sqrt(3)) < 1e-4) return '\\sqrt{3}';
    if (Math.abs(val + Math.sqrt(3)) < 1e-4) return '-\\sqrt{3}';

    // 1/Sqrt(3) = Sqrt(3)/3 approx 0.5773
    if (Math.abs(val - 1/Math.sqrt(3)) < 1e-4) return '\\frac{1}{\\sqrt{3}}';
    if (Math.abs(val + 1/Math.sqrt(3)) < 1e-4) return '-\\frac{1}{\\sqrt{3}}';

    return 'Error';
  };

  answer = getExactValue(func, normRad);

  return {
    question: `${func}(${angleObj.latex})`,
    answer: answer,
    type: 'trig',
    angle: angleObj.rad
  };
};

export const generateProblem = (mode: GameMode, options?: { forceQuadrant1?: boolean }): MathProblem => {
  if (mode === GameMode.METHODS_GRAPHS) {
    return generateGraphProblem();
  }
  
  if (mode === GameMode.TRIG_EXACT_VALUES) {
    // If forceQuadrant1 is true, we only want angles in [0, pi/2]
    // That means 0, pi/6, pi/4, pi/3, pi/2
    if (options?.forceQuadrant1) {
      const q1Angles = [
        { rad: 0, latex: '0' },
        { rad: Math.PI / 6, latex: '\\frac{\\pi}{6}' },
        { rad: Math.PI / 4, latex: '\\frac{\\pi}{4}' },
        { rad: Math.PI / 3, latex: '\\frac{\\pi}{3}' },
        { rad: Math.PI / 2, latex: '\\frac{\\pi}{2}' }
      ];
      
      const angleObj = q1Angles[Math.floor(Math.random() * q1Angles.length)];
      const funcs = ['\\sin', '\\cos', '\\tan'];
      const func = funcs[Math.floor(Math.random() * funcs.length)];
      
      // Duplicate logic for exact value calculation (refactor if possible, but copy-paste is safer for now to avoid breaking scope)
      // Actually, let's just call a helper or reuse the logic. 
      // Since generateTrigProblem is scoped above, I can't easily pass arguments into it without changing its signature too.
      // Let's modify generateTrigProblem to accept the flag.
      return generateTrigProblem(true);
    }
    return generateTrigProblem(false);
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

    case GameMode.ADD_SUB_NEGATIVES:
      // Range -10 to 10
      a = Math.floor(Math.random() * 21) - 10;
      b = Math.floor(Math.random() * 21) - 10;
      if (Math.random() < 0.5) {
        answer = a + b;
        question = `${a} + ${b < 0 ? `(${b})` : b}`;
      } else {
        answer = a - b;
        question = `${a} - ${b < 0 ? `(${b})` : b}`;
      }
      break;

    case GameMode.MULT_DIV_NEGATIVES:
      if (Math.random() < 0.5) {
        // Multiplication: -12 to 12
        a = Math.floor(Math.random() * 25) - 12;
        b = Math.floor(Math.random() * 25) - 12;
        answer = a * b;
        question = `${a} × ${b < 0 ? `(${b})` : b}`;
      } else {
        // Division
        // Answer -12 to 12 (excluding 0)
        answer = Math.floor(Math.random() * 25) - 12;
        if (answer === 0) answer = 1;
        
        // Divisor -12 to 12 (excluding 0)
        b = Math.floor(Math.random() * 25) - 12;
        if (b === 0) b = 1;

        a = answer * b;
        question = `${a} ÷ ${b < 0 ? `(${b})` : b}`;
      }
      break;

    default:
      return { question: '?', answer: 0, type: 'arithmetic' };
  }

  return { question, answer, type: 'arithmetic' };
};