
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

const generateInverseTrigProblem = (): MathProblem => {
  const funcs = ['\\sin^{-1}', '\\cos^{-1}', '\\tan^{-1}', '\\arcsin', '\\arccos', '\\arctan'];
  const func = funcs[Math.floor(Math.random() * funcs.length)];
  
  const isSin = func.includes('sin');
  const isCos = func.includes('cos');
  const isTan = func.includes('tan');

  let values: { val: string, ans: string, rad: number }[] = [];

  if (isSin) {
    values = [
      { val: '0', ans: '0', rad: 0 },
      { val: '\\frac{1}{2}', ans: '\\frac{\\pi}{6}', rad: Math.PI/6 },
      { val: '\\frac{\\sqrt{2}}{2}', ans: '\\frac{\\pi}{4}', rad: Math.PI/4 },
      { val: '\\frac{\\sqrt{3}}{2}', ans: '\\frac{\\pi}{3}', rad: Math.PI/3 },
      { val: '1', ans: '\\frac{\\pi}{2}', rad: Math.PI/2 },
      { val: '-\\frac{1}{2}', ans: '-\\frac{\\pi}{6}', rad: -Math.PI/6 },
      { val: '-\\frac{\\sqrt{2}}{2}', ans: '-\\frac{\\pi}{4}', rad: -Math.PI/4 },
      { val: '-\\frac{\\sqrt{3}}{2}', ans: '-\\frac{\\pi}{3}', rad: -Math.PI/3 },
      { val: '-1', ans: '-\\frac{\\pi}{2}', rad: -Math.PI/2 },
    ];
  } else if (isCos) {
    values = [
      { val: '1', ans: '0', rad: 0 },
      { val: '\\frac{\\sqrt{3}}{2}', ans: '\\frac{\\pi}{6}', rad: Math.PI/6 },
      { val: '\\frac{\\sqrt{2}}{2}', ans: '\\frac{\\pi}{4}', rad: Math.PI/4 },
      { val: '\\frac{1}{2}', ans: '\\frac{\\pi}{3}', rad: Math.PI/3 },
      { val: '0', ans: '\\frac{\\pi}{2}', rad: Math.PI/2 },
      { val: '-\\frac{1}{2}', ans: '\\frac{2\\pi}{3}', rad: 2*Math.PI/3 },
      { val: '-\\frac{\\sqrt{2}}{2}', ans: '\\frac{3\\pi}{4}', rad: 3*Math.PI/4 },
      { val: '-\\frac{\\sqrt{3}}{2}', ans: '\\frac{5\\pi}{6}', rad: 5*Math.PI/6 },
      { val: '-1', ans: '\\pi', rad: Math.PI },
    ];
  } else if (isTan) {
    values = [
      { val: '0', ans: '0', rad: 0 },
      { val: '\\frac{1}{\\sqrt{3}}', ans: '\\frac{\\pi}{6}', rad: Math.PI/6 },
      { val: '1', ans: '\\frac{\\pi}{4}', rad: Math.PI/4 },
      { val: '\\sqrt{3}', ans: '\\frac{\\pi}{3}', rad: Math.PI/3 },
      { val: '-\\frac{1}{\\sqrt{3}}', ans: '-\\frac{\\pi}{6}', rad: -Math.PI/6 },
      { val: '-1', ans: '-\\frac{\\pi}{4}', rad: -Math.PI/4 },
      { val: '-\\sqrt{3}', ans: '-\\frac{\\pi}{3}', rad: -Math.PI/3 },
    ];
  }

  const selected = values[Math.floor(Math.random() * values.length)];

  return {
    question: `${func}\\left(${selected.val}\\right)`,
    answer: selected.ans,
    type: 'trig',
    angle: selected.rad
  };
};

const generateIndexLawsProblem = (): MathProblem => {
  const types = ['multiply', 'divide', 'power'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  let a = Math.floor(Math.random() * 11) - 5; // -5 to 5
  let b = Math.floor(Math.random() * 11) - 5; // -5 to 5
  
  // Ensure we don't get 0 for both to make it slightly more interesting
  if (a === 0 && b === 0) a = 2;

  let question = '';
  let answer = 0;

  switch (type) {
    case 'multiply':
      question = `x^{${a}} \\times x^{${b}} = x^{?}`;
      answer = a + b;
      break;
    case 'divide':
      question = `\\frac{x^{${a}}}{x^{${b}}} = x^{?}`;
      answer = a - b;
      break;
    case 'power':
      question = `(x^{${a}})^{${b}} = x^{?}`;
      answer = a * b;
      break;
  }

  return {
    question,
    answer: answer.toString(),
    type: 'arithmetic' // We can treat it as arithmetic since the answer is just a number
  };
};

const generateSurdsProblem = (combo: number): MathProblem => {
  let a = 1;
  let perfectSquareBase = 2;
  let nonSquareFactor = 2;

  if (combo >= 7) {
    const largeOptions = [
      { sq: 10, ns: 2 }, // 200 -> 10r2
      { sq: 10, ns: 3 }, // 300 -> 10r3
      { sq: 10, ns: 5 }, // 500 -> 10r5
      { sq: 2, ns: 111 }, // 444 -> 2r111
      { sq: 3, ns: 111 }, // 999 -> 3r111
    ];
    const pick = largeOptions[Math.floor(Math.random() * largeOptions.length)];
    perfectSquareBase = pick.sq;
    nonSquareFactor = pick.ns;
    if (Math.random() < 0.5) {
      a = Math.floor(Math.random() * 4) + 2; // 2 to 5
    }
  } else if (combo >= 4) {
    a = Math.floor(Math.random() * 3) + 1; // 1 to 3
    const bases = [4, 6, 8, 9]; 
    perfectSquareBase = bases[Math.floor(Math.random() * bases.length)];
    const nsOptions = [2, 3, 5];
    nonSquareFactor = nsOptions[Math.floor(Math.random() * nsOptions.length)];
  } else if (combo >= 2) {
    a = Math.floor(Math.random() * 3) + 2; // 2 to 4
    const bases = [2, 3, 5]; 
    perfectSquareBase = bases[Math.floor(Math.random() * bases.length)];
    const nsOptions = [2, 3, 5, 6, 7, 10];
    nonSquareFactor = nsOptions[Math.floor(Math.random() * nsOptions.length)];
  } else {
    const bases = [2, 3, 5]; 
    perfectSquareBase = bases[Math.floor(Math.random() * bases.length)];
    const nsOptions = [2, 3, 5, 6, 7, 10];
    nonSquareFactor = nsOptions[Math.floor(Math.random() * nsOptions.length)];
  }

  const n = (perfectSquareBase * perfectSquareBase) * nonSquareFactor;
  
  let question = '';
  if (a === 1) {
    question = `\\sqrt{${n}}`;
  } else {
    question = `${a}\\sqrt{${n}}`;
  }

  const outA = a * perfectSquareBase;
  
  const answerObj = {
    v: a * a * n,
    o: outA,
    i: nonSquareFactor,
    a: a,
    n: n
  };

  return {
    question,
    answer: JSON.stringify(answerObj),
    type: 'arithmetic'
  };
};

const generateSigFigsProblem = (combo: number): MathProblem => {
  const types = ['round_dp', 'round_sf', 'count_sf', 'to_decimal', 'to_sci'];
  const type = types[Math.floor(Math.random() * types.length)];

  let question = '';
  let answerObj: any = {};

  const roundToDp = (numStr: string, dp: number) => {
    const num = parseFloat(numStr);
    const rounded = Number(Math.round(Number(num + 'e' + dp)) + 'e' + -dp);
    return rounded.toFixed(dp);
  };

  const roundToSf = (numStr: string, sf: number) => {
    const num = parseFloat(numStr);
    if (num === 0) return '0';
    const magnitude = Math.floor(Math.log10(Math.abs(num)));
    const dp = sf - 1 - magnitude;
    const rounded = Number(Math.round(Number(num + 'e' + dp)) + 'e' + -dp);
    
    if (dp > 0) {
      return rounded.toFixed(dp);
    } else {
      // For large numbers, toFixed(0) prevents scientific notation and ensures trailing zeros are kept
      return rounded.toFixed(0);
    }
  };

  if (type === 'round_dp') {
    const whole = Math.floor(Math.random() * 100);
    const dp = Math.floor(Math.random() * 3) + 1; // 1 to 3
    const extraDp = dp + Math.floor(Math.random() * 2) + 1; // dp + 1 or dp + 2
    let fracStr = '';
    for (let i=0; i<extraDp; i++) fracStr += Math.floor(Math.random() * 10).toString();
    const numStr = `${whole}.${fracStr}`;
    
    const ansStr = roundToDp(numStr, dp);
    
    question = `\\text{Round } ${numStr} \\text{ to } ${dp} \\text{ d.p.}`;
    answerObj = { type: 'normal', value: ansStr };
  } else if (type === 'round_sf') {
    const isDecimal = Math.random() < 0.5;
    const sf = Math.floor(Math.random() * 3) + 1; // 1 to 3
    
    let numStr = '';
    if (isDecimal) {
      const zeros = Math.floor(Math.random() * 3) + 1;
      let digits = '';
      for(let i=0; i<sf + 2; i++) {
        digits += (i===0 ? Math.floor(Math.random()*9)+1 : Math.floor(Math.random()*10)).toString();
      }
      numStr = `0.${'0'.repeat(zeros)}${digits}`;
    } else {
      let digits = '';
      for(let i=0; i<sf + 2; i++) {
        digits += (i===0 ? Math.floor(Math.random()*9)+1 : Math.floor(Math.random()*10)).toString();
      }
      const extraZeros = Math.floor(Math.random() * 3);
      numStr = digits + '0'.repeat(extraZeros);
    }
    
    const ansStr = roundToSf(numStr, sf);
    
    question = `\\text{Round } ${numStr} \\text{ to } ${sf} \\text{ s.f.}`;
    answerObj = { type: 'normal', value: ansStr };
  } else if (type === 'count_sf') {
    const isDecimal = Math.random() < 0.7;
    let numStr = '';
    let sfCount = 0;
    let sigStart = 0;
    let sigEnd = 0;
    
    if (isDecimal) {
      const leadingZeros = Math.floor(Math.random() * 4); // 0 to 3
      const sigDigits = Math.floor(Math.random() * 4) + 1; // 1 to 4
      const trailingZeros = Math.floor(Math.random() * 3); // 0 to 2
      
      let digits = (Math.floor(Math.random()*9)+1).toString();
      for(let i=1; i<sigDigits; i++) digits += Math.floor(Math.random()*10).toString();
      
      if (leadingZeros > 0) {
        numStr = `0.${'0'.repeat(leadingZeros - 1)}${digits}${'0'.repeat(trailingZeros)}`;
        sigStart = 2 + leadingZeros - 1;
      } else {
        numStr = `${digits[0]}.${digits.slice(1)}${'0'.repeat(trailingZeros)}`;
        sigStart = 0;
      }
      sigEnd = numStr.length;
      sfCount = sigDigits + trailingZeros;
    } else {
      const sigDigits = Math.floor(Math.random() * 4) + 2; // 2 to 5
      let digits = (Math.floor(Math.random()*9)+1).toString();
      for(let i=1; i<sigDigits-1; i++) digits += Math.floor(Math.random()*10).toString();
      digits += (Math.floor(Math.random()*9)+1).toString(); // Ensure last digit is non-zero
      
      const trailingZeros = Math.floor(Math.random() * 3);
      numStr = digits + '0'.repeat(trailingZeros);
      sigStart = 0;
      sigEnd = digits.length;
      sfCount = sigDigits;
    }
    question = `\\text{Sig figs in } ${numStr}?`;
    answerObj = { type: 'count_sf', value: sfCount.toString(), numStr, sigStart, sigEnd };
  } else if (type === 'to_decimal') {
    const aWhole = Math.floor(Math.random() * 9) + 1;
    let aFrac = Math.floor(Math.random() * 100);
    let aStr = aWhole.toString();
    if (aFrac > 0) {
      if (aFrac % 10 === 0) {
        aStr += `.${aFrac / 10}`;
      } else {
        aStr += `.${aFrac.toString().padStart(2, '0')}`;
      }
    }
    const n = Math.floor(Math.random() * 9) - 4; // -4 to 4
    
    question = `\\text{Decimal form of } ${aStr} \\times 10^{${n}}`;
    const val = parseFloat(aStr) * Math.pow(10, n);
    
    let ansStr = '';
    if (n >= 0) {
      ansStr = val.toString();
      // Avoid scientific notation from JS
      if (ansStr.includes('e')) {
        ansStr = val.toFixed(0);
      }
    } else {
      ansStr = val.toFixed(Math.abs(n) + (aFrac > 0 ? aStr.split('.')[1].length : 0));
      // Remove trailing zeros after decimal point
      if (ansStr.includes('.')) {
        ansStr = ansStr.replace(/0+$/, '').replace(/\.$/, '');
      }
    }
    
    answerObj = { type: 'normal', value: ansStr };
  } else if (type === 'to_sci') {
    const n = Math.floor(Math.random() * 11) - 5; // -5 to 5
    const aWhole = Math.floor(Math.random() * 9) + 1;
    let aFrac = Math.floor(Math.random() * 100);
    let aStr = aWhole.toString();
    if (aFrac > 0) {
      if (aFrac % 10 === 0) {
        aStr += `.${aFrac / 10}`;
      } else {
        aStr += `.${aFrac.toString().padStart(2, '0')}`;
      }
    }
    
    const val = parseFloat(aStr) * Math.pow(10, n);
    let numStr = '';
    if (n >= 0) {
      numStr = val.toString();
      if (numStr.includes('e')) {
        numStr = val.toFixed(0);
      }
    } else {
      numStr = val.toFixed(Math.abs(n) + (aFrac > 0 ? aStr.split('.')[1].length : 0));
      if (numStr.includes('.')) {
        numStr = numStr.replace(/0+$/, '').replace(/\.$/, '');
      }
    }
    
    question = `\\text{Sci notation of } ${numStr}`;
    answerObj = { type: 'sci', a: aStr, n: n.toString() };
  }

  return {
    question,
    answer: JSON.stringify(answerObj),
    type: 'arithmetic'
  };
};

const generateExpandingNegativesProblem = (): MathProblem => {
  const aOptions = [-5, -4, -3, -2, -1, 2, 3, 4, 5];
  const a = aOptions[Math.floor(Math.random() * aOptions.length)];
  
  let m = Math.floor(Math.random() * 10) - 5;
  if (m >= 0) m += 1; // 1 to 5, -5 to -1
  
  let n = Math.floor(Math.random() * 10) - 5;
  if (n >= 0) n += 1;
  
  // 20% chance of m = 1 or -1
  if (Math.random() < 0.2) m = Math.random() < 0.5 ? 1 : -1;
  
  const reverseOrder = Math.random() < 0.3; // 30% chance of (n + mx)
  
  const formatTerm = (coef: number, isFirst: boolean, hasX: boolean) => {
    let str = '';
    if (coef < 0) {
      str += isFirst ? '-' : ' - ';
    } else if (!isFirst) {
      str += ' + ';
    }
    
    const absCoef = Math.abs(coef);
    if (hasX) {
      if (absCoef !== 1) str += absCoef;
      str += 'x';
    } else {
      str += absCoef;
    }
    return str;
  };
  
  let inside = '';
  if (reverseOrder) {
    inside = formatTerm(n, true, false) + formatTerm(m, false, true);
  } else {
    inside = formatTerm(m, true, true) + formatTerm(n, false, false);
  }
  
  let outside = '';
  if (a === -1) outside = '-';
  else outside = a.toString();
  
  const question = `${outside}(${inside})`;
  
  const termX = a * m;
  const termC = a * n;
  
  const answerObj = { type: 'expand', x: termX, c: termC };
  
  return {
    question,
    answer: JSON.stringify(answerObj),
    type: 'algebra'
  };
};

const generateTwoStepEquationsProblem = (): MathProblem => {
  const isFractional = Math.random() < 0.5;
  let a = 0, b = 0, c = 0;
  while (a === 0 || (isFractional && Math.abs(a) === 1)) a = Math.floor(Math.random() * 21) - 10; // -10 to 10
  while (b === 0) b = Math.floor(Math.random() * 21) - 10;
  while (c === 0) c = Math.floor(Math.random() * 21) - 10;

  // 1: ax+b=c, 2: b+ax=c, 3: c=a+bx, 4: c=ax+b
  const form = Math.floor(Math.random() * 4) + 1;
  
  const formatTerm = (coef: number, isFirst: boolean, hasX: boolean, isFrac: boolean = false) => {
    let str = '';
    if (coef < 0) {
      str += isFirst ? '-' : '-';
    } else if (!isFirst) {
      str += '+';
    }
    
    const absCoef = Math.abs(coef);
    if (hasX) {
      if (isFrac) {
        str += `\\frac{x}{${absCoef}}`;
      } else {
        if (absCoef !== 1) str += absCoef;
        str += 'x';
      }
    } else {
      str += absCoef;
    }
    return str;
  };

  let question = '';
  if (form === 1) {
    question = `${formatTerm(a, true, true, isFractional)}${formatTerm(b, false, false)}=${c}`;
  } else if (form === 2) {
    question = `${formatTerm(b, true, false)}${formatTerm(a, false, true, isFractional)}=${c}`;
  } else if (form === 3) {
    question = `${c}=${formatTerm(b, true, false)}${formatTerm(a, false, true, isFractional)}`;
  } else {
    question = `${c}=${formatTerm(a, true, true, isFractional)}${formatTerm(b, false, false)}`;
  }

  let num, den;
  if (isFractional) {
    num = (c - b) * a;
    den = 1;
  } else {
    num = c - b;
    den = a;
  }
  
  // Simplify fraction
  const gcd = (x: number, y: number): number => y === 0 ? Math.abs(x) : gcd(y, x % y);
  const divisor = gcd(num, den);
  
  let simpNum = num / divisor;
  let simpDen = den / divisor;
  
  if (simpDen < 0) {
    simpNum = -simpNum;
    simpDen = -simpDen;
  }

  const answerObj = { type: 'equation', num: simpNum, den: simpDen };

  return {
    question,
    answer: JSON.stringify(answerObj),
    type: 'algebra'
  };
};

export const generateProblem = (mode: GameMode, options?: { forceQuadrant1?: boolean, combo?: number }): MathProblem => {
  let problem: MathProblem;

  if (mode === GameMode.TWO_STEP_EQUATIONS) {
    problem = generateTwoStepEquationsProblem();
  } else if (mode === GameMode.EXPANDING_NEGATIVES) {
    problem = generateExpandingNegativesProblem();
  } else if (mode === GameMode.SIMPLIFY_SURDS) {
    problem = generateSurdsProblem(options?.combo || 0);
  } else if (mode === GameMode.SIG_FIGS_SCI_NOTATION) {
    problem = generateSigFigsProblem(options?.combo || 0);
  } else if (mode === GameMode.INDEX_LAWS) {
    problem = generateIndexLawsProblem();
  } else if (mode === GameMode.METHODS_GRAPHS) {
    problem = generateGraphProblem();
  } else if (mode === GameMode.INVERSE_TRIG_EXACT_VALUES) {
    problem = generateInverseTrigProblem();
  } else if (mode === GameMode.TRIG_EXACT_VALUES) {
    if (options?.forceQuadrant1) {
      problem = generateTrigProblem(true);
    } else {
      problem = generateTrigProblem(false);
    }
  } else {
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
        answer = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 11) + 2;
        a = answer * b;
        question = `${a} ÷ ${b}`;
        break;

      case GameMode.ADD_SUB_NEGATIVES:
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
          a = Math.floor(Math.random() * 25) - 12;
          b = Math.floor(Math.random() * 25) - 12;
          answer = a * b;
          question = `${a} × ${b < 0 ? `(${b})` : b}`;
        } else {
          answer = Math.floor(Math.random() * 25) - 12;
          if (answer === 0) answer = 1;
          b = Math.floor(Math.random() * 25) - 12;
          if (b === 0) b = 1;
          a = answer * b;
          question = `${a} ÷ ${b < 0 ? `(${b})` : b}`;
        }
        break;

      default:
        problem = { question: '?', answer: 0, type: 'arithmetic' };
        break;
    }
    
    if (!problem) {
        problem = { question, answer: answer!, type: 'arithmetic' };
    }
  }

  return { ...problem, mode };
};