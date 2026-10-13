import { GameMode, MathProblem } from '../types';

export const generateCalculusProblem = (mode: GameMode): MathProblem => {
  let isAnti = false;
  if (mode === GameMode.METHODS_ANTIDERIVATIVES) {
    isAnti = true;
  } else if (mode === GameMode.METHODS_MIXED_CALCULUS) {
    isAnti = Math.random() < 0.5;
  }

  const types = ['poly', 'chain_poly', 'sqrt', 'inverse', 'sin', 'cos', 'exp'];
  const type = types[Math.floor(Math.random() * types.length)];

  const nonzeroRand = (min: number, max: number) => {
    let v = 0;
    while (v === 0) {
      v = Math.floor(Math.random() * (max - min + 1)) + min;
    }
    return v;
  };

  const a = nonzeroRand(-5, 5);
  // Ensure m is an integer >= 2 or <= -2 to avoid identical distractors or strings
  const mChoices = [-4, -3, -2, 2, 3, 4];
  const m = mChoices[Math.floor(Math.random() * mChoices.length)];
  const c = nonzeroRand(-5, 5);
  const n = nonzeroRand(2, 5);

  const gcd = (x: number, y: number) => {
    x = Math.abs(x); y = Math.abs(y);
    while (y) {
      let t = y;
      y = x % y;
      x = t;
    }
    return x;
  };

  const fmtPoly = (coeff: number, exp: number) => {
    if (coeff === 0) return '0';
    let s = coeff === 1 ? '' : coeff === -1 ? '-' : coeff.toString();
    if (exp === 0) return coeff.toString();
    if (exp === 1) return s + 'x';
    return s + 'x^{' + exp + '}';
  };

  const fmtInside = (mx: number, cx: number) => {
    let ms = mx === 1 ? 'x' : mx === -1 ? '-x' : mx + 'x';
    if (cx > 0) return ms + ' + ' + cx;
    if (cx < 0) return ms + ' - ' + Math.abs(cx);
    return ms;
  };

  const fmtSimpleProd = (coeff: number, str: string) => {
    if (coeff === 0) return '0';
    if (coeff === 1) return str;
    if (coeff === -1) return '-' + str;
    return coeff + str;
  };

  const fmtFracWithDenomVar = (num: number, den: number, denomVar: string) => {
    let g = gcd(num, den);
    num /= g;
    den /= g;
    if (den < 0) { num = -num; den = -den; }
    
    if (num < 0) {
        return `-\\frac{${Math.abs(num)}}{${den === 1 ? '' : den}${denomVar}}`;
    }
    return `\\frac{${num}}{${den === 1 ? '' : den}${denomVar}}`;
  };

  const fmtFracCoeff = (num: number, den: number, suffix: string) => {
    let g = gcd(num, den);
    num /= g;
    den /= g;
    if (den < 0) { num = -num; den = -den; }
    
    let frac = '';
    if (den === 1) {
        if (num === 1 && suffix !== "") frac = "";
        else if (num === -1 && suffix !== "") frac = "-";
        else frac = num.toString();
    } else {
        if (num < 0) frac = `-\\frac{${Math.abs(num)}}{${den}}`;
        else frac = `\\frac{${num}}{${den}}`;
    }
    return frac + suffix;
  };

  let qStr = '';
  let aStr = '';
  let distractors: string[] = [];

  // fallback clean uniquely
  const addDistractors = (d1: string, d2: string, d3: string) => {
    distractors = [d1, d2, d3];
  };

  if (type === 'poly') {
    let F = fmtPoly(a, n);
    let f = fmtPoly(a * n, n - 1);
    if (!isAnti) {
      qStr = `\\frac{d}{dx} \\left( ${F} \\right)`;
      aStr = f;
      addDistractors(
        fmtPoly(a, n - 1), 
        fmtPoly(a * n, n + 1), 
        fmtPoly(a * n * n, n - 2)
      );
    } else {
      qStr = `\\int ${f} \\, dx`;
      aStr = F + ' + c';
      addDistractors(
        F, 
        fmtPoly(a * n * n, n - 2) + ' + c', 
        fmtPoly(a * n, n) + ' + c'
      );
    }
  } else if (type === 'chain_poly') {
    let inside = fmtInside(m, c);
    let F = fmtSimpleProd(a, `(${inside})^{${n}}`);
    let fCoeff = a * m * n;
    let f = fmtSimpleProd(fCoeff, `(${inside})^{${n - 1}}`);

    if (!isAnti) {
      qStr = `\\frac{d}{dx} \\left( ${F} \\right)`;
      aStr = f;
      // ensure we don't accidentally match distractors by adding slight deterministic offsets if needed, 
      // but with m>=2 and n>=2, these are largely distinct
      addDistractors(
        fmtSimpleProd(a * n, `(${inside})^{${n - 1}}`),
        fmtSimpleProd(a * m, `(${inside})^{${n - 1}}`),
        fmtSimpleProd(a * m * n, `(${inside})^{${n + 1}}`)
      );
    } else {
      qStr = `\\int ${f} \\, dx`;
      aStr = F + ' + c';
      let wrongCoeff1 = a * n;
      addDistractors(
        F, 
        fmtSimpleProd(a * m, `(${inside})^{${n}}`) + ' + c', 
        fmtSimpleProd(wrongCoeff1 === a ? 2 * a : wrongCoeff1, `(${inside})^{${n}}`) + ' + c'
      );
    }
  } else if (type === 'sqrt') {
    let F = fmtSimpleProd(a, '\\sqrt{x}');
    let f = fmtFracWithDenomVar(a, 2, '\\sqrt{x}');

    if (!isAnti) {
      qStr = `\\frac{d}{dx} \\left( ${F} \\right)`;
      aStr = f;
      addDistractors(
        fmtFracWithDenomVar(a, 1, '\\sqrt{x}'),
        fmtSimpleProd(a * 2, '\\sqrt{x}'),
        fmtFracWithDenomVar(-a, 2, 'x^{\\frac{3}{2}}')
      );
    } else {
      f = fmtFracWithDenomVar(a, 1, '\\sqrt{x}');
      F = fmtSimpleProd(2 * a, '\\sqrt{x}');
      qStr = `\\int ${f} \\, dx`;
      aStr = F + ' + c';
      addDistractors(
        F, 
        fmtFracWithDenomVar(a, 2, '\\sqrt{x}') + ' + c', 
        fmtSimpleProd(-a, 'x^{-\\frac{3}{2}}') + ' + c'
      );
    }
  } else if (type === 'inverse') {
    let F = fmtSimpleProd(a, '\\ln_e(x)');
    let f = fmtFracWithDenomVar(a, 1, 'x');

    if (!isAnti) {
      qStr = `\\frac{d}{dx} \\left( ${F} \\right)`;
      aStr = f;
      addDistractors(
        fmtFracWithDenomVar(a, 1, 'x^2'),
        fmtFracWithDenomVar(-a, 1, 'x^2'),
        fmtSimpleProd(a * 2, '\\ln_e(x)')
      );
    } else {
      f = fmtFracWithDenomVar(a, 1, 'x');
      F = fmtSimpleProd(a, '\\ln_e(x)');
      qStr = `\\int ${f} \\, dx`;
      aStr = F + ' + c';
      addDistractors(
        F, 
        fmtFracWithDenomVar(-a, 1, 'x^2') + ' + c', 
        fmtFracWithDenomVar(a, 1, 'x^2') + ' + c'
      );
    }
  } else if (type === 'sin') {
     let inside = fmtInside(m, c);
     let F = fmtSimpleProd(a, `\\sin(${inside})`);
     let f = fmtSimpleProd(a * m, `\\cos(${inside})`);

     if (!isAnti) {
       qStr = `\\frac{d}{dx} \\left( ${F} \\right)`;
       aStr = f;
       addDistractors(
         fmtSimpleProd(-a * m, `\\cos(${inside})`),
         fmtSimpleProd(a * m, `\\sin(${inside})`),
         fmtSimpleProd(a, `\\cos(${inside})`)
       );
     } else {
       f = fmtSimpleProd(a, `\\sin(${inside})`);
       F = fmtFracCoeff(-a, m, `\\cos(${inside})`);
       qStr = `\\int ${f} \\, dx`;
       aStr = F + ' + c';
       addDistractors(
         F,
         fmtFracCoeff(a, m, `\\cos(${inside})`) + ' + c',
         fmtFracCoeff(-a * m, 1, `\\cos(${inside})`) + ' + c'
       );
     }
  } else if (type === 'cos') {
     let inside = fmtInside(m, c);
     let F = fmtSimpleProd(a, `\\cos(${inside})`);
     let f = fmtSimpleProd(-a * m, `\\sin(${inside})`);

     if (!isAnti) {
       qStr = `\\frac{d}{dx} \\left( ${F} \\right)`;
       aStr = f;
       addDistractors(
         fmtSimpleProd(a * m, `\\sin(${inside})`),
         fmtSimpleProd(a * m, `\\cos(${inside})`),
         fmtSimpleProd(-a, `\\sin(${inside})`)
       );
     } else {
       f = fmtSimpleProd(a, `\\cos(${inside})`);
       F = fmtFracCoeff(a, m, `\\sin(${inside})`);
       qStr = `\\int ${f} \\, dx`;
       aStr = F + ' + c';
       addDistractors(
         F,
         fmtFracCoeff(-a, m, `\\sin(${inside})`) + ' + c',
         fmtFracCoeff(a * m, 1, `\\sin(${inside})`) + ' + c'
       );
     }
  } else if (type === 'exp') {
     let expTerm = m === 1 ? 'x' : (m === -1 ? '-x' : m + 'x');
     let F = fmtSimpleProd(a, `e^{${expTerm}}`);
     let f = fmtSimpleProd(a * m, `e^{${expTerm}}`);

     let fakePower = m - 1;
     let fakeExpTerm = fakePower === 1 ? 'x' : (fakePower === -1 ? '-x' : fakePower + 'x');
     let polyMistake = fmtSimpleProd(a * m, `e^{${fakeExpTerm}}`);

     if (!isAnti) {
       qStr = `\\frac{d}{dx} \\left( ${F} \\right)`;
       aStr = f;
       addDistractors(
         fmtSimpleProd(a, `e^{${expTerm}}`),
         polyMistake,
         fmtSimpleProd(a * m * m, `e^{${expTerm}}`)
       );
     } else {
       f = fmtSimpleProd(a, `e^{${expTerm}}`);
       F = fmtFracCoeff(a, m, `e^{${expTerm}}`);
       qStr = `\\int ${f} \\, dx`;
       aStr = F + ' + c';
       addDistractors(
         F,
         fmtFracCoeff(a * m, 1, `e^{${expTerm}}`) + ' + c',
         fmtFracCoeff(a, m * m, `e^{${expTerm}}`) + ' + c'
       );
     }
  }

  let options: string[] = [];

  if (!isAnti) {
    options = [aStr, ...distractors];
    let uniqueOptions = Array.from(new Set(options));
    let fallbackCount = 1;
    while (uniqueOptions.length < 4) {
        uniqueOptions.push(aStr + ` + ${fallbackCount}`);
        fallbackCount++;
    }
    for (let i = uniqueOptions.length - 1; i > 0; i--) {
       const j = Math.floor(Math.random() * (i + 1));
       [uniqueOptions[i], uniqueOptions[j]] = [uniqueOptions[j], uniqueOptions[i]];
    }
    options = uniqueOptions;
  } else {
    // isAnti === true
    // Parse out F, D1, D2 from aStr and distractors
    let F = aStr.replace(' + c', '');
    let f = qStr.replace('\\int ', '').replace(' \\, dx', '');
    let D1 = distractors[1].replace(' + c', '');
    let D2 = distractors[2].replace(' + c', '');

    let bases = [F, D1, D2];
    let uniqueBases = Array.from(new Set(bases));
    let fallbackCount = 1;
    while (uniqueBases.length < 3) {
      uniqueBases.push(F + ` + ${fallbackCount}x`);
      fallbackCount++;
    }

    // shuffle bases
    for (let i = uniqueBases.length - 1; i > 0; i--) {
       const j = Math.floor(Math.random() * (i + 1));
       [uniqueBases[i], uniqueBases[j]] = [uniqueBases[j], uniqueBases[i]];
    }

    let promptMode = Math.floor(Math.random() * 3);
    if (promptMode === 0) {
      qStr = `\\text{Find an antiderivative of } ${f}`;
      aStr = F; // correct answer NO + c
    } else if (promptMode === 1) {
      qStr = `\\text{Find the antiderivative of } ${f}`;
      aStr = F + ' + c'; // correct answer WITH + c
    } else {
      qStr = `\\int ${f} \\, dx`;
      aStr = F + ' + c'; // correct answer WITH + c
    }

    options = [...uniqueBases, ...uniqueBases.map(b => b + ' + c')];
  }

  const answerIndex = options.indexOf(aStr);

  return {
    question: qStr,
    answer: answerIndex.toString(),
    options: options,
    type: 'algebra'
  };
};
