// Mathematical helper functions for ALT 5: Sketching Linear and Quadratic Graphs

export interface Fraction {
  num: number;
  den: number;
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x || 1;
}

export function makeFraction(num: number, den: number = 1): Fraction {
  if (den === 0) throw new Error("Denominator cannot be zero");
  let n = Math.round(num);
  let d = Math.round(den);
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { num: n / g, den: d / g };
}

export function formatFractionLatex(frac: Fraction, alwaysSign: boolean = false): string {
  const { num, den } = frac;
  if (den === 1) {
    if (alwaysSign && num > 0) return `+${num}`;
    return `${num}`;
  }
  const isNeg = num < 0;
  const absNum = Math.abs(num);
  const sign = isNeg ? '-' : (alwaysSign ? '+' : '');
  return `${sign}\\frac{${absNum}}{${den}}`;
}

export function formatLinearTerm(frac: Fraction, variable: string = 'x', isLeading: boolean = true): string {
  const { num, den } = frac;
  if (num === 0) return '';
  if (den === 1) {
    if (num === 1) return isLeading ? variable : `+ ${variable}`;
    if (num === -1) return isLeading ? `-${variable}` : `- ${variable}`;
    if (num > 0) return isLeading ? `${num}${variable}` : `+ ${num}${variable}`;
    return isLeading ? `-${Math.abs(num)}${variable}` : `- ${Math.abs(num)}${variable}`;
  }
  const absNum = Math.abs(num);
  const fracStr = absNum === 1
    ? `\\frac{1}{${den}}${variable}`
    : `\\frac{${absNum}}{${den}}${variable}`;
  if (num > 0) return isLeading ? fracStr : `+ ${fracStr}`;
  return isLeading ? `-${fracStr}` : `- ${fracStr}`;
}

export function formatConstantTerm(frac: Fraction, isLeading: boolean = false): string {
  const { num, den } = frac;
  if (num === 0) return isLeading ? '0' : '';
  const isNeg = num < 0;
  const absNum = Math.abs(num);
  const valStr = den === 1 ? `${absNum}` : `\\frac{${absNum}}{${den}}`;
  if (isLeading) {
    return isNeg ? `-${valStr}` : `${valStr}`;
  }
  return isNeg ? `- ${valStr}` : `+ ${valStr}`;
}

export function formatLineEq(m: Fraction, c: Fraction): string {
  const mTerm = formatLinearTerm(m, 'x', true);
  if (mTerm === '') {
    return `y = ${formatConstantTerm(c, true)}`;
  }
  if (c.num === 0) {
    return `y = ${mTerm}`;
  }
  const cTerm = formatConstantTerm(c, false);
  return `y = ${mTerm} ${cTerm}`;
}

export function formatPointLatex(x: Fraction | number, y: Fraction | number): string {
  const fx = typeof x === 'number' ? makeFraction(x) : x;
  const fy = typeof y === 'number' ? makeFraction(y) : y;
  if (fx.den === 1 && fy.den === 1) {
    return `(${fx.num}, ${fy.num})`;
  }
  return `\\left(${formatFractionLatex(fx)}, ${formatFractionLatex(fy)}\\right)`;
}

export function simplifySurd(n: number): { coeff: number; rad: number; latex: string } {
  const val = Math.abs(Math.round(n));
  if (val === 0) return { coeff: 0, rad: 0, latex: '0' };
  
  let coeff = 1;
  let rad = val;
  for (let i = Math.floor(Math.sqrt(val)); i >= 2; i--) {
    if (rad % (i * i) === 0) {
      coeff *= i;
      rad /= (i * i);
      break;
    }
  }
  
  if (rad === 1) {
    return { coeff, rad: 1, latex: `${coeff}` };
  }
  if (coeff === 1) {
    return { coeff: 1, rad, latex: `\\sqrt{${rad}}` };
  }
  return { coeff, rad, latex: `${coeff}\\sqrt{${rad}}` };
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomInt(min: number, max: number, excludeZero: boolean = false): number {
  let val = Math.floor(Math.random() * (max - min + 1)) + min;
  if (excludeZero && val === 0) {
    val = Math.random() < 0.5 ? min : max;
    if (val === 0) val = 1;
  }
  return val;
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
