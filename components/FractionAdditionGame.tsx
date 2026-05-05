import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TexEngine } from '../utils/textEngine';
import { expandPolynomial } from '../utils/expander';
import { simplify, rationalize, evaluate } from 'mathjs';

const texEngine = new TexEngine();

function TexRender({ expr }: { expr: string }) {
    const { width, height, els } = useMemo(() => {
        let fontSize = 28;
        let pad = 2;
        const measure = texEngine.measure(`$${expr}$`, fontSize);
        const els = texEngine.renderToSVG(`$${expr}$`, pad, pad + measure.box.ascent, fontSize, '#1e293b', 'start', false, 'text', false, {});
        return { width: measure.width + pad * 2, height: measure.height + pad * 2, els };
    }, [expr]);
    return <svg width={width} height={height} className="overflow-visible inline-block align-middle ml-1 mr-1">{els}</svg>;
}

type Mode = 'EDIT' | 'CANCEL';

type FractionData = { num: string[], den: string[] };

function toJS(expr: string) {
    let s = expr.replace(/\s/g, '');
    let prev = '';
    while (s !== prev) {
       prev = s;
       s = s.replace(/([0-9])([a-zA-Z\(])/g, '$1*$2');
       s = s.replace(/([a-zA-Z])([a-zA-Z0-9\(])/g, '$1*$2');
       s = s.replace(/(\))([a-zA-Z0-9\(])/g, '$1*$2');
    }
    return s;
}

function getTestPoints() {
    return [
        {a: 1.1, b: 1.2, c: 1.3, m: 1.4, n: 1.5, p: 1.6, q: 1.7, x: 3.14159, y: 2.71828, z: -1.2, t: 0.5, s: -0.5, u: 2.1, v: -2.3, w: 0.8},
        {a: 2.1, b: -1.2, c: 3.3, m: -1.4, n: 2.5, p: -1.6, q: 0.7, x: -1.234, y: 5.678, z: 2.2, t: -1.5, s: 1.5, u: -2.1, v: 2.3, w: -0.9},
        {a: -1.1, b: 2.2, c: -1.3, m: 2.4, n: -1.5, p: 2.6, q: -1.7, x: 0.5, y: -0.5, z: -0.2, t: 2.5, s: -2.5, u: 1.1, v: -1.3, w: 1.8}
    ];
}

function evaluateStr(str: string, vars: Record<string, number>): number {
    const js = toJS(str);
    try {
        return evaluate(js, vars);
    } catch(e) {
        try {
            const varNames = Object.keys(vars);
            const varValues = Object.values(vars);
            const fallbackJs = js.replace(/\^/g, '**');
            // eslint-disable-next-line no-new-func
            const fn = new Function(...varNames, `return ${fallbackJs};`);
            return fn(...varValues);
        } catch(e2) {
            return NaN;
        }
    }
}

function checkEquivalent(expr1: string, expr2: string, setDebug?: (msg: string) => void): boolean {
    const js1 = toJS(expr1);
    const js2 = toJS(expr2);
    try {
        const diffStr = simplify(`(${js1}) - (${js2})`).toString().replace(/\s/g, '');
        if (diffStr === '0' || diffStr === '0*w' || diffStr === '0*x' || diffStr === '0*y') return true;
        if (setDebug) setDebug(`diff: ${diffStr}`);
    } catch(e) {
        if (setDebug) setDebug(`simplify error: ${String(e)}`);
    }

    const pts = getTestPoints();
    let ptFailsMsg = '';
    for (let pt of pts) {
        const v1 = evaluateStr(expr1, pt);
        const v2 = evaluateStr(expr2, pt);
        if (isNaN(v1) || isNaN(v2)) {
            if (setDebug) setDebug(`eval NaN: v1=${v1}, v2=${v2}, pt=${JSON.stringify(pt)}`);
            return false;
        }
        if (Math.abs(v1 - v2) > 1e-4) {
            ptFailsMsg = `pts diff=${Math.abs(v1-v2)}`;
            if (setDebug) setDebug(ptFailsMsg);
            return false;
        }
    }
    return true;
}

function splitFactors(input: string): string[] {
    let parts = [];
    let current = "";
    let depth = 0;
    for (let i = 0; i < input.length; i++) {
        let char = input[i];
        if (char === '(') depth++;
        if (char === ')') depth--;

        if (depth === 0 && char === '*') {
            if (current) parts.push(current);
            current = "";
            continue;
        }
        current += char;
        if (depth === 0 && i < input.length - 1) {
            let nextChar = input[i+1];
            if ( ( /[0-9a-zA-Z\)]/.test(char) && nextChar === '(' ) ||
                 ( char === ')' && /[a-zA-Z]/.test(nextChar) ) ) {
                parts.push(current);
                current = "";
            }
        }
    }
    if (current) parts.push(current);
    
    let subParts: string[] = [];
    for (let p of parts) {
        if (p.startsWith('(') && p.endsWith(')')) {
            subParts.push(p);
            continue;
        }
        
        let hasOp = false;
        let d = 0;
        for (let i = 1; i < p.length; i++) {
            if (p[i] === '(') d++;
            if (p[i] === ')') d--;
            if (d === 0 && (p[i] === '+' || p[i] === '-')) {
                hasOp = true; break;
            }
        }
        
        if (!hasOp) {
            let match = p.match(/^([-+]?\d+)([a-zA-Z].*)$/);
            if (match) {
                subParts.push(match[1]);
                subParts.push(match[2]);
                continue;
            }
        }
        subParts.push(p);
    }
    return subParts;
}

function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

function gcdArray(arr: number[]): number {
    if (arr.length === 0) return 1;
    return arr.reduce((a, b) => gcd(Math.abs(a), Math.abs(b)));
}

function getMinPower(parsedTerms: {coef: number, varStr: string}[], variable: string): number {
    let minP = Infinity;
    for (const t of parsedTerms) {
        if (!t.varStr) return 0;
        let parts = t.varStr.split('*');
        let p = 0;
        for (let part of parts) {
            if (part === variable) p += 1;
            else if (part.startsWith(variable + '^')) {
                const ps = part.split('^');
                if (ps.length > 1) {
                    p += parseInt(ps[1]) || 0;
                }
            }
        }
        if (p < minP) minP = p;
    }
    return minP === Infinity ? 0 : minP;
}

function checkFractionFullySimplified(num: string, den: string): boolean {
    let pNum = parsePolynomialStr(num);
    let pDen = parsePolynomialStr(den);
    
    if (pNum.length === 0 || pDen.length === 0) return true;
    if (pNum.length === 1 && pNum[0].coef === 0) return true;
    
    let allCoefs = [...pNum.map(x => Math.abs(x.coef)), ...pDen.map(x => Math.abs(x.coef))].filter(x => x % 1 === 0);
    if (allCoefs.length === pNum.length + pDen.length && allCoefs.length > 0) {
        let g = gcdArray(allCoefs);
        if (g > 1) {
            return false;
        }
    }
    
    // Check variable powers
    const vars = new Set<string>();
    for (const t of [...pNum, ...pDen]) {
        if (t.varStr) {
            let parts = t.varStr.split('*');
            for (let part of parts) {
                if (part.includes('^')) vars.add(part.split('^')[0]);
                else vars.add(part);
            }
        }
    }
    
    for (const v of vars) {
        let minNum = getMinPower(pNum, v);
        let minDen = getMinPower(pDen, v);
        if (minNum > 0 && minDen > 0) return false;
    }
    
    // Also, if denominator has a negative coefficient factored throughout, we can typically simplify that wait...
    // Only if ALL coefficients of denominator are negative, you could factor out -1. But maybe not strictly required.
    
    return true;
}

export function getTermsCount(exprStr: string): number {
    if (exprStr.includes('(') || exprStr.includes(')')) {
        let depth = 0;
        let terms = 1;
        let s = exprStr.replace(/\s/g, '');
        for (let i = 0; i < s.length; i++) {
            let char = s[i];
            if (char === '(') depth++;
            if (char === ')') depth--;
            if (depth === 0 && (char === '+' || char === '-') && i > 0) {
                // Ignore leading signs
                if (!(s[i-1] === '*' || s[i-1] === '/' || s[i-1] === '+' || s[i-1] === '-')) {
                    terms++;
                }
            }
        }
        return terms;
    }
    let s = exprStr.replace(/\s/g, '').replace(/^-/, '');
    return s.split(/[+-]/).filter(x => x !== '').length;
}

export function needsCollection(exprStr: string): boolean {
    let tCount = getTermsCount(exprStr);
    let rCount;
    try {
        let r = rationalize(exprStr).toString().replace(/\s/g, '').replace(/^-/, '');
        rCount = r.split(/[+-]/).filter(x => x !== '').length;
    } catch(e) { return false; }
    
    if (tCount > rCount) return true;
    if (exprStr.includes('(')) {
        if (tCount > 1) return true; 
        return false; 
    }
    return false;
}

export function isFullySimplified(exprStr: string): boolean {
    if (exprStr.includes('(') || exprStr.includes(')')) return false;
    let s = exprStr.replace(/\s/g, '').replace(/^-/, '');
    const userTerms = s.split(/[+-]/).filter(x => x !== '');
    try {
        let r = rationalize(exprStr).toString().replace(/\s/g, '').replace(/^-/, '');
        const ratTerms = r.split(/[+-]/).filter(x => x !== '');
        return userTerms.length === ratTerms.length;
    } catch(e) {
        return false;
    }
}

function parsePolynomialStr(exprStr: string): {coef: number, varStr: string}[] {
    let simplified;
    try { simplified = rationalize(exprStr).toString(); }
    catch(e) { 
        simplified = simplify(exprStr).toString(); 
        if (simplified.startsWith('-(') && simplified.endsWith(')')) {
            let inner = simplified.substring(2, simplified.length - 1);
            simplified = simplify('-1 * (' + inner + ')').toString();
        }
    }
    
    let s = simplified.replace(/\s/g, '');
    s = s.replace(/(^|[^+])-/g, '$1+-');
    if (s.startsWith('+')) s = s.substring(1);
    
    let terms = s.split('+');
    let parsed = terms.map(t => {
        if (!t) return null;
        let coef = 1;
        let varStr = t;
        let match = t.match(/^([-+]?\d+(\.\d+)?)\*?(.*)$/);
        if (match) {
            coef = parseFloat(match[1]);
            varStr = match[3];
        } else if (t.startsWith('-')) {
            coef = -1;
            varStr = t.substring(t.startsWith('-*') ? 2 : 1);
        }
        return { coef, varStr };
    }).filter(x => x !== null) as {coef: number, varStr: string}[];
    
    parsed.sort((a,b) => {
        let degA = a.varStr.includes('^') ? parseInt(a.varStr.split('^')[1]) : (a.varStr.length > 0 ? 1 : 0);
        let degB = b.varStr.includes('^') ? parseInt(b.varStr.split('^')[1]) : (b.varStr.length > 0 ? 1 : 0);
        return degB - degA;
    });
    return parsed;
}
function getFactors(termStr: string) {
    let s = termStr.replace(/\s/g, '');
    let coef = 1;
    let vars: Record<string, number> = {};
    
    let sign = 1;
    if (s.startsWith('-')) { sign = -1; s = s.substring(1); }
    else if (s.startsWith('+')) { s = s.substring(1); }
    
    let match = s.match(/^(\d*)(.*)$/);
    if (!match) return {coef: 0, vars};
    if (match[1]) coef = parseInt(match[1], 10);
    
    let rest = match[2];
    let varMatches = rest.matchAll(/([a-zA-Z])(?:\^(\d+))?/g);
    for (const m of varMatches) {
        vars[m[1]] = m[2] ? parseInt(m[2], 10) : 1;
    }
    
    return { coef: coef * sign, vars };
}

function autoWrap(arr: string[]): string[] {
    if (arr.length <= 1) return arr; 
    let joined = arr.join('');
    
    let addTerms = [];
    let current = "";
    let depth = 0;
    for (let i = 0; i < joined.length; i++) {
        let char = joined[i];
        if (char === '(') depth++;
        if (char === ')') depth--;
        if (depth === 0 && (char === '+' || char === '-') && current.length > 0) {
            addTerms.push(current);
            current = char;
        } else {
            current += char;
        }
    }
    if (current) addTerms.push(current);

    if (addTerms.length <= 1) return arr;

    let parsed = addTerms.map(getFactors);
    if (parsed.some(p => p.coef === 0)) {
        if (joined.startsWith('(') && joined.endsWith(')')) return [joined];
        return ['(' + joined + ')'];
    }

    let gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    let commonCoef = Math.abs(parsed[0].coef);
    for (let p of parsed) commonCoef = gcd(commonCoef, Math.abs(p.coef));
    
    let allVars = new Set<string>();
    parsed.forEach(p => Object.keys(p.vars).forEach(v => allVars.add(v)));
    
    let hasCommonVar = false;
    for (let v of allVars) {
        let minExp = parsed[0].vars[v] || 0;
        for (let p of parsed) minExp = Math.min(minExp, p.vars[v] || 0);
        if (minExp > 0) {
            hasCommonVar = true;
            break;
        }
    }
    
    if (commonCoef > 1 || hasCommonVar) {
        return [joined]; 
    } else {
        if (joined.startsWith('(') && joined.endsWith(')')) return [joined];
        return ['(' + joined + ')'];
    }
}

function getFinal(numCoef: number, numVars: Record<string, number>, denCoef: number, denVars: Record<string, number>, bracket: string, bracketNum: number, bracketDen: number, otherBracket: string = "", oBNum: number = 0, oBDen: number = 0) {
    let gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    let commonNum = gcd(Math.abs(numCoef), Math.abs(denCoef));
    numCoef /= commonNum;
    denCoef /= commonNum;
    if (denCoef < 0) {
        numCoef *= -1;
        denCoef *= -1;
    }

    let allVars = new Set([...Object.keys(numVars), ...Object.keys(denVars)]);
    for (let v of allVars) {
        let nV = numVars[v] || 0;
        let dV = denVars[v] || 0;
        let cV = Math.min(nV, dV);
        numVars[v] = nV - cV;
        denVars[v] = dV - cV;
    }

    let cancelBracket = Math.min(bracketNum, bracketDen);
    bracketNum -= cancelBracket;
    bracketDen -= cancelBracket;

    let cancelOther = Math.min(oBNum, oBDen);
    oBNum -= cancelOther;
    oBDen -= cancelOther;

    const formatTerm = (c: number, v: Record<string, number>, bStr: string, bCount: number, obStr: string, obCount: number) => {
        let res = "";
        let absC = Math.abs(c);
        let hasVars = Object.values(v).some(exp => exp > 0);
        if (absC !== 1 || (!hasVars && bCount === 0 && obCount === 0)) res += absC;
        if (c < 0) res = "-" + res;
        
        let sortedVars = Object.keys(v).sort();
        for (let key of sortedVars) {
            let exp = v[key];
            if (exp === 1) res += key; else if (exp > 1) res += `${key}^{${exp}}`;
        }
        
        if (bCount === 1) res += bStr; else if (bCount > 1) res += `${bStr}^{${bCount}}`;
        if (obCount === 1) res += obStr; else if (obCount > 1) res += `${obStr}^{${obCount}}`;
        
        if (res === "" || res === "-") res += "1";
        return res;
    };

    let nStr = formatTerm(numCoef, numVars, bracket, bracketNum, otherBracket, oBNum);
    let dStr = formatTerm(denCoef, denVars, bracket, bracketDen, otherBracket, oBDen);
    
    if (dStr === "1") return nStr;
    return `\\frac{${nStr}}{${dStr}}`;
}

type ProblemParams = { f1: FractionData, f2: FractionData, op: string, finalExpr: string };

function generateProblem(questionIndex: number = 0): ProblemParams {
    const rInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const rSign = () => Math.random() < 0.5 ? 1 : -1;
    const vars = ['x', 'y', 'w'];
    let v1 = vars[rInt(0, vars.length - 1)];

    const fmtB = (num: number, v: string) => num < 0 ? `(${v}${num})` : `(${v}+${num})`;
    const fmtC = (coef: number, num: number, v: string) => {
         let p1 = coef === 1 ? v : (coef === -1 ? `-${v}` : `${coef}${v}`);
         let p2 = num < 0 ? `${num}` : `+${num}`;
         return `(${p1}${p2})`;
    };

    const templates = [
        () => {
            // like 2y/3 - y/4
            let a = rInt(1, 4);
            let b = rInt(2, 5);
            let c = rInt(1, 3);
            let d = rInt(2, 6);
            while (b === d) d = rInt(2, 6);
            let op = rSign() === 1 ? '+' : '-';
            return {
                f1: { num: autoWrap([`${a===1?'':a}${v1}`]), den: autoWrap([`${b}`]) },
                f2: { num: autoWrap([`${c===1?'':c}${v1}`]), den: autoWrap([`${d}`]) },
                op: op,
                finalExpr: ""
            };
        },
        () => {
            // like (x+1)/5 + (x+3)/2
            let b = rInt(2, 5);
            let d = rInt(2, 5);
            while (b === d) d = rInt(2, 5);
            let a1 = rInt(1, 5) * rSign();
            let a2 = rInt(1, 5) * rSign();
            let op = rSign() === 1 ? '+' : '-';
            return {
                f1: { num: autoWrap([fmtB(a1, v1)]), den: autoWrap([`${b}`]) },
                f2: { num: autoWrap([fmtB(a2, v1)]), den: autoWrap([`${d}`]) },
                op: op,
                finalExpr: ""
            };
        },
        () => {
            // like 4x/(x+7) + 3x/(x-5)
            let a = rInt(2, 6);
            let c = rInt(2, 5);
            let b1 = rInt(1, 7) * rSign();
            let d1 = rInt(1, 7) * rSign();
            let op = rSign() === 1 ? '+' : '-';
            return {
                f1: { num: autoWrap([`${a}${v1}`]), den: autoWrap([fmtB(b1, v1)]) },
                f2: { num: autoWrap([`${c}${v1}`]), den: autoWrap([fmtB(d1, v1)]) },
                op: op,
                finalExpr: ""
            };
        },
        () => {
            // like (x+2)/(x+1) + (x-1)/(x+4)
            let a = rInt(1, 5) * rSign();
            let b = rInt(1, 5) * rSign();
            let c = rInt(1, 5) * rSign();
            let d = rInt(1, 5) * rSign();
            let op = rSign() === 1 ? '+' : '-';
            return {
                f1: { num: autoWrap([fmtB(a, v1)]), den: autoWrap([fmtB(b, v1)]) },
                f2: { num: autoWrap([fmtB(c, v1)]), den: autoWrap([fmtB(d, v1)]) },
                op: op,
                finalExpr: ""
            };
        },
        () => {
            // like (x+1)/(x+2) - (2x-5)/(3x-1)
            let a = rInt(1, 5) * rSign();
            let b = rInt(1, 5) * rSign();
            let c1 = rInt(2, 4);
            let c2 = rInt(1, 5) * rSign();
            let d1 = rInt(2, 4);
            let d2 = rInt(1, 5) * rSign();
            let op = rSign() === 1 ? '+' : '-';
            return {
                f1: { num: autoWrap([fmtB(a, v1)]), den: autoWrap([fmtB(b, v1)]) },
                f2: { num: autoWrap([fmtC(c1, c2, v1)]), den: autoWrap([fmtC(d1, d2, v1)]) },
                op: op,
                finalExpr: ""
            };
        },
        () => {
            // Monomial denominators: (x+a)/(cx) + (x+b)/(dx)
            let a = rInt(1, 5) * rSign();
            let b = rInt(1, 5) * rSign();
            let c = rInt(2, 6);
            let d = rInt(2, 6);
            while (c === d) d = rInt(2, 6);
            let op = rSign() === 1 ? '+' : '-';
            return {
                f1: { num: autoWrap([fmtB(a, v1)]), den: autoWrap([`(${c}${v1})`]) },
                f2: { num: autoWrap([fmtB(b, v1)]), den: autoWrap([`(${d}${v1})`]) },
                op: op,
                finalExpr: ""
            };
        },
        () => {
            // Factorisable numerator with canceled x^2: (x+a)/(x+b) - (x+c)/(x+d)
            const myGcd = (x: number, y: number): number => y === 0 ? Math.abs(x) : myGcd(y, x % y);
            for (let i = 0; i < 500; i++) {
                let a = rInt(-7, 7);
                let b = rInt(-7, 7);
                let c = rInt(-7, 7);
                let d = rInt(-7, 7);
                if (a === b || c === d || b === d) continue;
                if (a === 0 || b === 0 || c === 0 || d === 0) continue;
                
                let K = a + d - b - c;
                let M = a * d - b * c;
                if (K === 0 || M === 0) continue;
                
                let h = myGcd(Math.abs(K), Math.abs(M));
                if (h > 1) { 
                    return {
                        f1: { num: autoWrap([fmtB(a, v1)]), den: autoWrap([fmtB(b, v1)]) },
                        f2: { num: autoWrap([fmtB(c, v1)]), den: autoWrap([fmtB(d, v1)]) },
                        op: '-',
                        finalExpr: ""
                    };
                }
            }
            return {
                f1: { num: autoWrap([fmtB(5, v1)]), den: autoWrap([fmtB(2, v1)]) },
                f2: { num: autoWrap([fmtB(1, v1)]), den: autoWrap([fmtB(4, v1)]) },
                op: '-',
                finalExpr: ""
            };
        }
    ];

    let t = templates;
    return t[rInt(0, t.length - 1)]();
}

type State = {
    f1: FractionData;
    f2?: FractionData;
    op?: string;
};

export default function FractionAdditionGame() {
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<Mode>('EDIT');
  const [problem, setProblem] = useState<ProblemParams>(() => generateProblem());
  
  // Selection states
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null); // 'f1.num', 'f1.den', 'f2.num', 'f2.den'
  const [selectedTerms, setSelectedTerms] = useState<number[]>([]); // For cancel mode
  
  const [history, setHistory] = useState<State[]>([
    {
      f1: problem.f1,
      f2: problem.f2,
      op: problem.op
    }
  ]);
  const [finalExprToRender, setFinalExprToRender] = useState<string>(problem.finalExpr);
  const [multiplyTarget, setMultiplyTarget] = useState<'f1' | 'f2' | null>(null);
  const [multiplyInput, setMultiplyInput] = useState<string>('');

  const currentState = history[history.length - 1];

  const stripSuperfluousBrackets = (str: string, isOnlyTerm: boolean) => {
      if (str.startsWith('(') && str.endsWith(')')) {
          let depth = 0;
          let enclosed = true;
          for (let i = 0; i < str.length - 1; i++) {
              if (str[i] === '(') depth++;
              else if (str[i] === ')') depth--;
              if (depth === 0) { enclosed = false; break; }
          }
          if (enclosed) {
              let inner = str.substring(1, str.length - 1);
              if (isOnlyTerm) return inner;
              
              let innerDepth = 0;
              let hasTopLevelPlusMinus = false;
              for (let i = 0; i < inner.length; i++) {
                  if (inner[i] === '(') innerDepth++;
                  else if (inner[i] === ')') innerDepth--;
                  else if (innerDepth === 0 && (inner[i] === '+' || inner[i] === '-')) {
                      if (i > 0) hasTopLevelPlusMinus = true; 
                  }
              }
              if (!hasTopLevelPlusMinus) return inner;
          }
      }
      return str;
  }

  const formatTerms = (terms: string[], forCancel: boolean) => {
      let res = [];
      let joined = "";
      let displayPrev = "";
      for (let i = 0; i < terms.length; i++) {
          let t = terms[i];
          let displayT = stripSuperfluousBrackets(t, terms.length === 1);
          if (i > 0) {
              let needsTimes = false;
              if (/^[+\-]/.test(displayT)) needsTimes = true;
              if (/[0-9]$/.test(displayPrev) && /^[0-9]/.test(displayT)) needsTimes = true;
              if (/[a-zA-Z]$/.test(displayPrev) && /^[0-9]/.test(displayT)) needsTimes = true;
              if (displayPrev.endsWith(')') && /^[0-9a-zA-Z]/.test(displayT)) needsTimes = true;
              
              if (needsTimes) {
                  if (forCancel) res.push(`\\times `);
                  else joined += `\\times `;
                  if (displayT.startsWith('+')) displayT = displayT.substring(1);
                  else if (displayT.startsWith('-')) displayT = `(${displayT})`;
              }
          }
          if (forCancel) res.push(`\\term{${displayT}}`);
          else joined += displayT;
          displayPrev = displayT;
      }
      let out = forCancel ? res.join('') : joined;
      out = out.replace(/-\((\d*\s*[a-zA-Z]\s*)\)/g, '-$1'); // e.g. -(6w) to -6w
      out = out.replace(/\)\s*\*?\s*\(/g, ')('); // e.g. (w-2)*(w+2) to (w-2)(w+2)
      return out;
  };

  // Helper to build the expression from state
  const buildExpr = (state: State) => {
      const g = (terms: string[]) => {
          if (mode === 'EDIT') {
               return `\\term{${formatTerms(terms, false)}}`;
          }
          return formatTerms(terms, true);
      };
      
      let f1Text = `\\frac{${g(state.f1.num)}}{${g(state.f1.den)}}`;
      if (!state.f2 || !state.op) return `$${f1Text}$`;

      let opStr = state.op.startsWith('\\') ? state.op : state.op; // op is '+' or '-'
      return `$${f1Text} \\term{${opStr}} \\frac{${g(state.f2.num)}}{${g(state.f2.den)}}$`;
  };

  const currentExpr = buildExpr(currentState);

  // Map term indexes to groups
  const termGroups = useMemo(() => {
     const groups: { groupId: string, terms: number[] }[] = [
         { groupId: 'f1.num', terms: [] },
         { groupId: 'f1.den', terms: [] }
     ];
     
     if (currentState.f2 && currentState.op) {
         groups.push({ groupId: 'op', terms: [] });
         groups.push({ groupId: 'f2.num', terms: [] });
         groups.push({ groupId: 'f2.den', terms: [] });
     }
     
     let idx = 0;
     const fillGroup = (gIdx: number, arr: string[], isOp: boolean = false) => {
         const count = (mode === 'EDIT' && !isOp) ? 1 : arr.length;
         for (let i = 0; i < count; i++) {
             groups[gIdx].terms.push(idx++);
         }
     };

     fillGroup(0, currentState.f1.num);
     fillGroup(1, currentState.f1.den);
     if (currentState.f2 && currentState.op) {
         fillGroup(2, [currentState.op], true);
         fillGroup(3, currentState.f2.num);
         fillGroup(4, currentState.f2.den);
     }

     return groups;
  }, [currentState, mode]);

  // Active SVG
  const { width: aW, height: aH, els: aEls, termContents } = useMemo(() => {
     let fontSize = 48;
     const measure = texEngine.measure(currentExpr, fontSize);
     const pad = 20;
     
     // Extract term contents for reference
     const contents: string[] = [];
     currentExpr.replace(/\\term{([^}]+)}/g, (match, c) => {
         contents.push(c);
         return match;
     });

     const isSelected = (idx: number) => {
         if (selectedGroup === 'op') {
             if (mode === 'EDIT') return idx === 2;
             return termGroups.find(g => g.groupId === 'op')?.terms.includes(idx) || false;
         }
         if (mode === 'EDIT') {
             if (!selectedGroup) return false;
             if (selectedGroup === 'f1.num') return idx === 0;
             if (selectedGroup === 'f1.den') return idx === 1;
             if (selectedGroup === 'f2.num') return idx === 3;
             if (selectedGroup === 'f2.den') return idx === 4;
             return false;
         } else {
             return selectedTerms.includes(idx);
         }
     };

     const handleBoxClick = (idx: number) => {
         if (mode === 'EDIT') {
             let clickedGroup: string | null = null;
             if (idx === 0) clickedGroup = 'f1.num';
             else if (idx === 1) clickedGroup = 'f1.den';
             else if (idx === 2) clickedGroup = 'op';
             else if (idx === 3) clickedGroup = 'f2.num';
             else if (idx === 4) clickedGroup = 'f2.den';

             if (clickedGroup === 'op') {
                 if (selectedGroup === 'op') setSelectedGroup(null);
                 else {
                     setSelectedGroup('op');
                     setSelectedTerms([]);
                 }
                 return;
             }

             if (clickedGroup) {
                 if (selectedGroup === clickedGroup) {
                     setSelectedGroup(null);
                 } else {
                     setSelectedGroup(clickedGroup);
                 }
             }
             return;
         }

         const group = termGroups.find(g => g.terms.includes(idx));
         
         if (group && group.groupId === 'op') {
              if (selectedGroup === 'op') setSelectedGroup(null);
              else {
                  setSelectedGroup('op');
                  setSelectedTerms([]);
              }
              return;
         }

         setSelectedGroup(null);
         setSelectedTerms(prev => {
            if (prev.includes(idx)) return prev.filter(i => i !== idx);
            return [...prev, idx].sort((a,b) => a-b);
         });
     };

     const getBoxSettings = (idx: number) => {
         if (mode === 'EDIT') {
             return {
                 selectedFillColor: 'rgba(56, 189, 248, 0.2)',
                 selectedStrokeColor: 'rgb(56, 189, 248)'
             };
         }
         return undefined;
     };

     const els = texEngine.renderToSVG(
       currentExpr, pad, pad + measure.box.ascent, fontSize, 
       '#1e293b', 'start', false, 'text', false, {}, 
       {
         isBoxSelected: isSelected,
         getBoxSettings: getBoxSettings,
         onBoxClick: (idx, e) => handleBoxClick(idx)
       }
     );
     return { width: measure.width + pad * 2, height: measure.height + pad * 2, els, termContents: contents };
  }, [currentExpr, selectedTerms, mode, selectedGroup, termGroups]);

  // UI state for inputs
  const [editInput, setEditInput] = useState<string>('');
  const [cancelInputs, setCancelInputs] = useState<Record<number, string>>({});
  const [coeffInputs, setCoeffInputs] = useState<Record<number, string>>({});
  const [hasError, setHasError] = useState(false);
  const [debugMsg, setDebugMsg] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [globalError, setGlobalError] = useState(false);

  // Clear inputs when selection changes
  useEffect(() => {
     setEditInput('');
     setCancelInputs({});
     setCoeffInputs({});
     setHasError(false);
  }, [selectedTerms, selectedGroup, mode]);
  
  const showCoeffEntry = selectedGroup && selectedGroup !== 'op' && needsCollection(toJS(
      selectedGroup === 'f1.num' ? currentState.f1.num.join('*') :
      selectedGroup === 'f1.den' ? currentState.f1.den.join('*') :
      selectedGroup === 'f2.num' ? currentState.f2?.num.join('*') || '' :
      selectedGroup === 'f2.den' ? currentState.f2?.den.join('*') || '' : ''
  ));
  
  const simplifiedTerms = useMemo(() => {
      if (showCoeffEntry) {
          try {
              const str = selectedGroup === 'f1.num' ? currentState.f1.num.join('*') :
                          selectedGroup === 'f1.den' ? currentState.f1.den.join('*') :
                          selectedGroup === 'f2.num' ? currentState.f2?.num.join('*') || '' :
                          selectedGroup === 'f2.den' ? currentState.f2?.den.join('*') || '' : '';
              return parsePolynomialStr(str);
          } catch(e) { console.error(e); }
      }
      return null;
  }, [showCoeffEntry, selectedGroup, currentState]);

  const handleModeSwitch = (m: Mode) => {
      if (isComplete) return;
      setMode(m);
      setSelectedTerms([]);
      setSelectedGroup(null);
  };

  const nextProblem = () => {
       const p = generateProblem();
       setProblem(p);
       setHistory([{ f1: p.f1, f2: p.f2, op: p.op }]);
       setFinalExprToRender(p.finalExpr); // Not used actively for completion
       setIsComplete(false);
       setMode('EDIT');
       setSelectedTerms([]);
       setSelectedGroup(null);
  };

  const evaluateDenominatorsEqual = () => {
      if (!currentState.f2) return false;
      let buildDen = (arr: string[]) => arr.map(x => `(${x})`).join('*') || '1';
      let d1 = buildDen(currentState.f1.den);
      let d2 = buildDen(currentState.f2.den);
      return checkEquivalent(d1, d2);
  };

  const handleCombine = () => {
      if (!evaluateDenominatorsEqual()) return;
      
      const joinForNumerator = (arr: string[]) => {
          if (!arr || arr.length === 0) return '1';
          let res = "";
          for (let i = 0; i < arr.length; i++) {
              let t = wrapIfContainsAddSub(arr[i]);
              if (i > 0) {
                  let prev = wrapIfContainsAddSub(arr[i-1]);
                  let needsStar = false;
                  if (/[0-9]$/.test(prev) && /^[0-9]/.test(t)) needsStar = true;
                  if (/[a-zA-Z]$/.test(prev) && /^[0-9]/.test(t)) needsStar = true;
                  if (needsStar) res += "*";
              }
              res += t;
          }
          return res;
      };

      const n1 = joinForNumerator(currentState.f1.num);
      let n2 = joinForNumerator(currentState.f2!.num);
      
      if (currentState.op === '-' && !n2.startsWith('(')) {
          n2 = `(${n2})`;
      }
      
      const combinedNum = `${n1}${currentState.op}${n2}`;
      
      const nextState: State = {
          f1: { num: [combinedNum], den: currentState.f1.den },
      };
      
      setHistory(prev => [...prev, nextState]);
  };

  const handleMultiplyFraction = (fractionId: 'f1' | 'f2', factor: string) => {
      factor = factor.trim();
      if (!factor) return;
      
      const nextState = JSON.parse(JSON.stringify(currentState));
      const wrap = (s: string) => wrapIfContainsAddSub(s);
      const factorWrapped = wrap(factor);
      
      if (fractionId === 'f1') {
          if (nextState.f1.num.length === 1 && nextState.f1.num[0] === '1') nextState.f1.num = [factorWrapped];
          else nextState.f1.num.unshift(factorWrapped);
          if (nextState.f1.den.length === 1 && nextState.f1.den[0] === '1') nextState.f1.den = [factorWrapped];
          else nextState.f1.den.unshift(factorWrapped);
      } else if (nextState.f2) {
          if (nextState.f2.num.length === 1 && nextState.f2.num[0] === '1') nextState.f2.num = [factorWrapped];
          else nextState.f2.num.unshift(factorWrapped);
          if (nextState.f2.den.length === 1 && nextState.f2.den[0] === '1') nextState.f2.den = [factorWrapped];
          else nextState.f2.den.unshift(factorWrapped);
      }
      
      setHistory(prev => [...prev, nextState]);
  };

  const handleMultiplyFractionSubmit = () => {
      if (!multiplyTarget) return;
      handleMultiplyFraction(multiplyTarget, multiplyInput);
      setMultiplyTarget(null);
      setMultiplyInput('');
  };



  const checkCompletion = () => {
       if (currentState.f2) {
           setGlobalError(true);
           setTimeout(() => setGlobalError(false), 2000);
           return;
       }

       const numJS = toJS(currentState.f1.num.join('*')); 
       const denJS = toJS(currentState.f1.den.join('*'));
       
       if (needsCollection(numJS) || needsCollection(denJS) || !checkFractionFullySimplified(numJS, denJS)) {
           setGlobalError(true);
           setDebugMsg('Simplify numerator and denominator further, and look for common factors.');
           setTimeout(() => setGlobalError(false), 3000);
           return;
       }

       try {
           const formatTex = (t: string) => {
               let tex = t.replace(/\\cdot/g, '').replace(/~/g, '');
               return tex.replace(/\\left\(\s*([a-zA-Z0-9 ]+)\s*\\right\)/g, (match, inner) => inner.replace(/\s+/g, ''));
           };
           const numTex = formatTex(simplify(numJS).toTex());
           const denTex = formatTex(simplify(denJS).toTex());
           
           if (numTex === '0') {
                setFinalExprToRender('0');
            } else if (denTex === '1') {
                setFinalExprToRender(numTex);
            } else {
               setFinalExprToRender(`\\frac{${numTex}}{${denTex}}`);
           }
       } catch (e) {
           console.error(e);
           setFinalExprToRender(buildExpr(currentState).replace(/\$/g, ''));
       }

       setIsComplete(true);
       setSelectedGroup(null);
       setSelectedTerms([]);
  };

  // For final animation
  const { width: finalW, height: finalH, els: finalEls } = useMemo(() => {
     let fontSize = 48;
     const measure = texEngine.measure(`$${finalExprToRender}$`, fontSize);
     const pad = 20;
     const els = texEngine.renderToSVG(
       `$${finalExprToRender}$`, pad, pad + measure.box.ascent, fontSize, 
       '#1e293b', 'start', false, 'text', false, {}
     );
     return { width: measure.width + pad * 2, height: measure.height + pad * 2, els };
  }, [finalExprToRender]);

  const { width: editW, height: editH, els: editEls } = useMemo(() => {
      if (!selectedGroup || selectedGroup === 'op') return { width: 0, height: 0, els: null };
      let arr: string[] = [];
      if (selectedGroup === 'f1.num') arr = currentState.f1.num;
      if (selectedGroup === 'f1.den') arr = currentState.f1.den;
      if (selectedGroup === 'f2.num') arr = currentState.f2.num;
      if (selectedGroup === 'f2.den') arr = currentState.f2.den;
      
      let joined = formatTerms(arr, false);

      let fontSize = 28;
      let pad = 10;
      let expr = `$${joined}$`;
      const measure = texEngine.measure(expr, fontSize);
      const els = texEngine.renderToSVG(expr, pad, pad + measure.box.ascent, fontSize, '#1e293b', 'start', false, 'text', false, {});
      return { width: measure.width + pad * 2, height: measure.height + pad * 2, els };
  }, [selectedGroup, currentState]);

   const evaluateEdit = (currentVals: string[], input: string) => {
        const j = currentVals.map(x => `(${x})`).join('*');
        const norm = input.toLowerCase().replace(/[\s\u200B-\u200D\uFEFF]/g, '');
        
        let debugTemp = "";
        const setDbg = (msg: string) => { debugTemp = msg; };
        
        if (!checkEquivalent(j, norm, setDbg)) {
            setDebugMsg(`Fail 1: j=${j}, norm=${norm}, msg=${debugTemp}`);
            return null;
        }
        const factors = splitFactors(norm);
        const fmap = factors.map(x => `(${x})`).join('*');
        if (!checkEquivalent(j, fmap, setDbg)) {
            setDebugMsg(`Fail 2: j=${j}, fmap=${fmap}, msg=${debugTemp}`);
            return null;
        }
        setDebugMsg("");
        return factors;
   }

  const handleEditSubmit = (overrideCoeffInputs?: Record<number, string>) => {
      if (!selectedGroup) return;
      
      let inputStr = editInput;
      if (showCoeffEntry && simplifiedTerms && simplifiedTerms.length > 0) {
          const coeffsToUse = overrideCoeffInputs || coeffInputs;
          inputStr = simplifiedTerms.map((t, idx) => {
              let c = (coeffsToUse[idx] || '').replace(/\s/g, '');
              if (!c && c !== '0') c = '1';
              if (c === '0') return '0';
              if (c === '+') return t.varStr ? t.varStr : '1';
              if (c === '-') return t.varStr ? '-' + t.varStr : '-1';
              if (c.startsWith('+')) c = c.substring(1);
              if (t.varStr === '') return c;
              if (c === '1') return t.varStr;
              if (c === '-1') return '-' + t.varStr;
              return c + t.varStr;
          }).filter(x => x !== '0').join('+').replace(/\+\s*\-/g, '-');
          if (inputStr === '') inputStr = '0';
      }
      
      let targetArray: string[] = [];
      if (selectedGroup === 'f1.num') targetArray = currentState.f1.num;
      if (selectedGroup === 'f1.den') targetArray = currentState.f1.den;
      if (selectedGroup === 'f2.num') targetArray = currentState.f2.num;
      if (selectedGroup === 'f2.den') targetArray = currentState.f2.den;
      
      const newTerms = evaluateEdit(targetArray, inputStr);
      
      if (newTerms) {
          const nextState = JSON.parse(JSON.stringify(currentState));
          
          if (selectedGroup === 'f1.num') nextState.f1.num = newTerms;
          if (selectedGroup === 'f1.den') nextState.f1.den = newTerms;
          if (selectedGroup === 'f2.num') nextState.f2.num = newTerms;
          if (selectedGroup === 'f2.den') nextState.f2.den = newTerms;
          
          setHistory(prev => [...prev, nextState]);
          setSelectedGroup(null);
      } else {
          setHasError(true);
          setTimeout(() => {
              setHasError(false);
              setDebugMsg("");
          }, 6000);
      }
  };

  const evaluateCancel = (contents: string[], inputs: string[]) => {
       let numCount = 0;
       let denCount = 0;
       selectedTerms.forEach(idx => {
           const g = termGroups.find(g => g.terms.includes(idx))?.groupId;
           if (g && g.includes('.num')) numCount++;
           if (g && g.includes('.den')) denCount++;
       });
       if (numCount === 0 || denCount === 0 || numCount !== denCount) return false;

       // Filter out empty inputs to treat them as '1'
       const cleanInputs = inputs.map(x => x.trim() === '' ? '1' : x);

       const pts = getTestPoints();
       for (const pt of pts) {
           let firstRatio: number | null = null;
           for (let i = 0; i < contents.length; i++) {
               let vSrc = evaluateStr(contents[i], pt);
               let vDst = evaluateStr(cleanInputs[i], pt);
               
               if (isNaN(vSrc) || isNaN(vDst) || Math.abs(vDst) < 1e-9) return false;
               
               let ratio = vSrc / vDst;
               
               if (firstRatio === null) {
                    firstRatio = ratio;
               } else {
                    if (Math.abs(firstRatio - ratio) > 1e-4) return false;
               }
           }
       }
       return true;
  };

  const wrapIfContainsAddSub = (str: string): string => {
       const isFullyBracketed = (s: string) => {
           if (!s.startsWith('(') || !s.endsWith(')')) return false;
           let depth = 0;
           for (let i = 0; i < s.length - 1; i++) {
               if (s[i] === '(') depth++;
               if (s[i] === ')') depth--;
               if (depth === 0) return false;
           }
           return depth === 1 && s[s.length-1] === ')';
       };

       if (str === '1' || str === '') return str;
       if (isFullyBracketed(str)) return str;

       let depth = 0;
       for (let i = 0; i < str.length; i++) {
           if (str[i] === '(') depth++;
           else if (str[i] === ')') depth--;
           else if ((str[i] === '+' || str[i] === '-') && depth === 0) {
               if (i === 0 && str[i] === '-') continue; 
               return '(' + str + ')';
           }
       }
       return str;
  };

  const handleCancelSubmit = () => {
      const contents = selectedTerms.map(idx => termContents[idx]);
      const inputs = selectedTerms.map(idx => cancelInputs[idx] || '');
      
      const normalizedInputs = inputs.map((x, i) => {
           let val = x.replace(/\s/g, '');
           if (val !== '' && !val.startsWith('+') && !val.startsWith('-') && contents[i].startsWith('+')) {
               return '+' + val;
           }
           return val;
      });

      const success = evaluateCancel(contents, normalizedInputs);
      
      if (success) {
          const nextState = JSON.parse(JSON.stringify(currentState));
          
          // Apply individual replacements based on global index
          selectedTerms.forEach((idx, i) => {
              const newVal = normalizedInputs[i];
              const finalVal = (newVal === '' || newVal === '1') ? '1' : wrapIfContainsAddSub(newVal); // Keep 1s internally for structure if needed, or omit if we had a more robust structure
              
              // Find which group and local index this corresponds to
              const groupLabel = termGroups.find(g => g.terms.includes(idx))?.groupId;
              if (groupLabel) {
                  const localIdx = termGroups.find(g => g.groupId === groupLabel)!.terms.indexOf(idx);
                  
                  if (groupLabel === 'f1.num') nextState.f1.num[localIdx] = finalVal;
                  if (groupLabel === 'f1.den') nextState.f1.den[localIdx] = finalVal;
                  if (groupLabel === 'f2.num') nextState.f2.num[localIdx] = finalVal;
                  if (groupLabel === 'f2.den') nextState.f2.den[localIdx] = finalVal;
              }
          });

          // Verify that overall mathematical value is preserved
          const buildMathStr = (state: any) => {
              // replace visually empty or '1' with '1' and handle arrays with length 0
              let num1 = state.f1.num.map((x: string) => `(${x})`).join('*') || '1';
              let den1 = state.f1.den.map((x: string) => `(${x})`).join('*') || '1';
              let num2 = state.f2.num.map((x: string) => `(${x})`).join('*') || '1';
              let den2 = state.f2.den.map((x: string) => `(${x})`).join('*') || '1';
              
              let f1Str = `((${num1})/(${den1}))`;
              let f2Str = `((${num2})/(${den2}))`;
              return state.op === '\\times' ? `${f1Str} * ${f2Str}` : `${f1Str} / ${f2Str}`;
          };

          if (!checkEquivalent(buildMathStr(currentState), buildMathStr(nextState))) {
              setHasError(true);
              setTimeout(() => setHasError(false), 800);
              return;
          }
          
          // Optionally clean out '1's if there are other terms in the array to simplify
          const cleanOnes = (arr: string[]) => {
              if (arr.length > 1) {
                  const filtered = arr.filter(t => t !== '1');
                  return filtered.length > 0 ? filtered : ['1'];
              }
              return arr;
          };
          
          const wrapInBrackets = (arr: string[]) => {
              if (arr.length === 1 && arr[0] !== '1') {
                  return [wrapIfContainsAddSub(arr[0])];
              }
              return arr;
          };

          if (nextState.f1) {
              nextState.f1.num = wrapInBrackets(cleanOnes(nextState.f1.num));
              nextState.f1.den = wrapInBrackets(cleanOnes(nextState.f1.den));
          }
          if (nextState.f2) {
              nextState.f2.num = wrapInBrackets(cleanOnes(nextState.f2.num));
              nextState.f2.den = wrapInBrackets(cleanOnes(nextState.f2.den));
          }
          
          setHistory(prev => [...prev, nextState]);
          setSelectedTerms([]);
      } else {
          setHasError(true);
          setTimeout(() => setHasError(false), 800);
      }
  };

  const handleKCF = () => {
      const nextState = JSON.parse(JSON.stringify(currentState));
      if (nextState.op === '\\div') {
          nextState.op = '\\times';
          const temp = nextState.f2.num;
          nextState.f2.num = nextState.f2.den;
          nextState.f2.den = temp;
      } else if (nextState.op === '\\times') {
          nextState.op = '\\div';
          const temp = nextState.f2.num;
          nextState.f2.num = nextState.f2.den;
          nextState.f2.den = temp;
      }
      setHistory(prev => [...prev, nextState]);
      setSelectedGroup(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-8 items-center font-sans">
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)} className="text-slate-500 font-bold hover:text-slate-800">
          ← Back
        </button>
        <h1 className="text-3xl font-black text-slate-800">Algebraic Fractions</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center w-full max-w-6xl relative">
        <div className="flex w-full mb-4 relative items-center justify-center">
          <div className="flex gap-4">
            <button 
              disabled={isComplete}
              onClick={() => handleModeSwitch('EDIT')}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${mode === 'EDIT' && !isComplete ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} ${isComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              EDIT MODE
            </button>
            <button 
              disabled={isComplete}
              onClick={() => handleModeSwitch('CANCEL')}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${mode === 'CANCEL' && !isComplete ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} ${isComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              CANCEL MODE
            </button>
          </div>
          <div className={`absolute right-0 flex gap-3 ${isComplete ? 'hidden' : ''}`}>
             <button 
                onClick={() => {
                   setHistory([history[0]]);
                   setSelectedGroup(null);
                   setSelectedTerms([]);
                   setMultiplyTarget(null);
                   setGlobalError(false);
                }}
                disabled={history.length === 1}
                className={`px-6 py-2 rounded-lg font-black transition-all shadow-md ${history.length > 1 ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
             >
                RESET
             </button>
             <button 
               onClick={checkCompletion}
               className={`px-6 py-2 rounded-lg font-black transition-all bg-emerald-500 text-white shadow-md hover:bg-emerald-600`}
             >
               FINISH
             </button>
          </div>
          <button 
            onClick={nextProblem}
            className={`absolute right-0 px-6 py-2 rounded-lg font-black transition-all bg-slate-800 text-white shadow-md hover:bg-slate-900 ${!isComplete ? 'hidden' : ''}`}
          >
            NEXT PROBLEM
          </button>
        </div>

        <p className="text-slate-500 mb-4 font-medium transition-all">
            {isComplete && 'Problem fully simplified! Great job.'}
        </p>

        {/* Math Display Area */}
        <div className={`bg-slate-50 p-4 rounded-xl border w-full flex flex-col justify-center items-center overflow-x-auto min-h-[160px] relative transition-all duration-300 ${globalError ? 'border-red-400 bg-red-50 shadow-[0_0_15px_rgba(248,113,113,0.5)] animate-shake' : 'border-slate-200'}`}>
            {globalError && <div className="absolute top-2 text-red-500 font-bold text-sm bg-red-100 px-3 py-1 rounded-full animate-in fade-in slide-in-from-top-2">{debugMsg || 'Simplify further!'}</div>}
            <div className="relative flex flex-col items-center">
                {/* Active Expression */}
                <div className="relative">
                    {isComplete ? (
                        <svg width={finalW} height={finalH} className="overflow-visible pointer-events-none transition-opacity">
                            {finalEls}
                        </svg>
                    ) : (
                        <svg width={aW} height={aH} className={`overflow-visible ${multiplyTarget ? 'pointer-events-none opacity-50' : 'pointer-events-auto'} transition-opacity`}>
                            {aEls}
                        </svg>
                    )}
                </div>
                
                {/* Action Buttons for Fractions */}
                {currentState.f2 && !isComplete && (
                    <div className="flex w-full justify-between items-center mt-6 gap-6 px-4">
                        <button 
                            onClick={() => { setMultiplyTarget('f1'); setSelectedGroup(null); setSelectedTerms([]); setMultiplyInput(''); }}
                            className="px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-bold rounded-lg text-sm transition-colors border border-indigo-200 shadow-sm"
                        >
                            Multiply F1 (Top & Bottom)
                        </button>
                        
                        {evaluateDenominatorsEqual() && (
                            <button 
                                onClick={handleCombine}
                                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-lg shadow-md transition-colors animate-pulse"
                            >
                                Combine Fractions
                            </button>
                        )}

                        <button 
                            onClick={() => { setMultiplyTarget('f2'); setSelectedGroup(null); setSelectedTerms([]); setMultiplyInput(''); }}
                            className="px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-bold rounded-lg text-sm transition-colors border border-indigo-200 shadow-sm"
                        >
                            Multiply F2 (Top & Bottom)
                        </button>
                    </div>
                )}

                {!currentState.f2 && !isComplete && (
                    <div className="flex flex-col items-center justify-center mt-8 gap-4 px-4 text-center">
                        <p className="text-indigo-600 font-bold text-lg">
                            Simplify the numerator with edit mode.
                        </p>
                        {toJS(currentState.f1.num.join('*')).includes('(') && (
                            <button 
                                onClick={() => {
                                    try {
                                        const numJS = toJS(currentState.f1.num.join('*'));
                                        const expanded = expandPolynomial(numJS).replace(/[\s\*]/g, '');
                                        const nextState = JSON.parse(JSON.stringify(currentState));
                                        nextState.f1.num = [expanded];
                                        setHistory(prev => [...prev, nextState]);
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }}
                                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-lg shadow-md transition-colors"
                            >
                                Expand Numerator
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Floating Input Panels */}
        <div className="min-h-[120px] w-full mt-6 flex justify-center">

            {multiplyTarget && !isComplete && (
                <div className={`bg-indigo-50 border-2 rounded-xl p-6 shadow-sm w-full max-w-lg flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-300 ${hasError ? 'border-red-400 bg-red-50 animate-shake' : 'border-indigo-200'}`}>
                    <p className="text-indigo-800 font-bold mb-4 uppercase tracking-wider text-sm">Multiply Top & Bottom of {multiplyTarget === 'f1' ? 'First' : 'Second'} Fraction By:</p>
                    <div className="w-full flex gap-3">
                        <input 
                            autoFocus
                            type="text" 
                            value={multiplyInput}
                            onChange={e => setMultiplyInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleMultiplyFractionSubmit();
                                if (e.key === 'Escape') setMultiplyTarget(null);
                            }}
                            placeholder="Factor (e.g. 4, x+2)..."
                            className="flex-1 px-4 py-3 text-xl font-bold bg-white border-2 border-indigo-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-center"
                        />
                        <button 
                            onClick={handleMultiplyFractionSubmit}
                            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
                        >
                            Multiply
                        </button>
                    </div>
                    {hasError && <p className="text-red-500 font-bold mt-3 text-sm">Invalid factor.</p>}
                </div>
            )}

            {mode === 'EDIT' && selectedGroup && selectedGroup !== 'op' && !isComplete && !multiplyTarget &&  (
                <div className={`bg-blue-50 border-2 rounded-xl p-6 shadow-sm w-full max-w-2xl flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-300 ${hasError ? 'border-red-400 bg-red-50 animate-shake' : 'border-blue-200'}`}>
                    <div className="text-xl font-black text-slate-800 mb-4 bg-white px-8 py-4 rounded shadow-inner flex items-center justify-center min-w-[200px] min-h-[60px]">
                        {editEls && <svg width={editW} height={editH} className="overflow-visible">{editEls}</svg>}
                    </div>
                    {showCoeffEntry && simplifiedTerms && simplifiedTerms.length > 0 ? (
                        <div className="w-full flex-col flex items-center justify-center gap-4">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                {simplifiedTerms.map((term, idx) => {
                                    const expected = idx === 0 ? term.coef.toString() : (term.coef > 0 ? '+' + term.coef : term.coef.toString());
                                    return (
                                        <div key={idx} className="flex items-center gap-1">
                                            <input
                                                id={`coeff-input-${idx}`}
                                                type="text"
                                                autoFocus={idx === 0}
                                                value={coeffInputs[idx] || ''}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\s/g, '');
                                                    const nextCoeffInputs = {...coeffInputs, [idx]: val};
                                                    setCoeffInputs(nextCoeffInputs);
                                                    
                                                    const checkIsAcceptable = (v: string, t: any, i: number) => {
                                                        const exp = i === 0 ? t.coef.toString() : (t.coef > 0 ? '+' + t.coef : t.coef.toString());
                                                        if (v === exp) return true;
                                                        if (t.varStr !== '') {
                                                            if (t.coef === 1 && (v === '+' || (i === 0 && v === '1') || (i === 0 && v === ''))) return true;
                                                            if (t.coef === -1 && v === '-') return true;
                                                        } else if (i > 0 && t.coef > 0 && v === t.coef.toString()) {
                                                            return true;
                                                        }
                                                        return false;
                                                    };
                                                    
                                                    const currentIsAcceptable = checkIsAcceptable(val, term, idx);
                                                    
                                                    if (val.length >= expected.length || currentIsAcceptable) {
                                                        const nextInput = document.getElementById(`coeff-input-${idx + 1}`);
                                                        if (nextInput) {
                                                            nextInput.focus();
                                                        }
                                                    }
                                                    
                                                    let allGood = true;
                                                    simplifiedTerms.forEach((t, i) => {
                                                        const v = (nextCoeffInputs[i] || '').replace(/\s/g, '');
                                                        if (!checkIsAcceptable(v, t, i)) {
                                                            allGood = false;
                                                        }
                                                    });
                                                    
                                                    if (allGood) {
                                                        handleEditSubmit(nextCoeffInputs);
                                                    }
                                                }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleEditSubmit();
                                                    if (e.key === 'Escape') setSelectedGroup(null);
                                                    if (e.key === 'Backspace' && (coeffInputs[idx] || '').length === 0) {
                                                        if (idx > 0) {
                                                            const prev = document.getElementById(`coeff-input-${idx - 1}`);
                                                            if (prev) {
                                                                e.preventDefault();
                                                                prev.focus();
                                                            }
                                                        }
                                                    }
                                                }}
                                                className="w-16 md:w-20 px-2 py-2 text-xl font-bold text-center bg-white border-2 border-blue-300 rounded-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-mono"
                                            />
                                            {term.varStr && (
                                                <TexRender expr={term.varStr} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <button 
                                onClick={() => handleEditSubmit()}
                                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                    ) : (
                        <div className="w-full flex gap-3">
                            <input 
                                autoFocus
                                type="text" 
                                value={editInput}
                                onChange={e => setEditInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleEditSubmit();
                                    if (e.key === 'Escape') setSelectedGroup(null);
                                }}
                                placeholder="Type new expression..."
                                className="flex-1 px-4 py-3 text-xl font-bold bg-white border-2 border-blue-300 rounded-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-center"
                            />
                            <button 
                                onClick={() => handleEditSubmit()}
                                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                    )}
                    {hasError && <p className="text-red-500 font-bold mt-3 text-sm">Not correct! {debugMsg}</p>}
                </div>
            )}

            {mode === 'CANCEL' && selectedTerms.length >= 2 && !isComplete && !multiplyTarget && (
                <div className={`bg-orange-50 border-2 rounded-xl p-6 shadow-sm w-full max-w-3xl flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-300 ${hasError ? 'border-red-400 bg-red-50 animate-shake' : 'border-orange-200'}`}>
                    <p className="text-slate-500 font-bold mb-4 uppercase tracking-wider text-sm">Divide by common factor</p>
                    <div className="flex flex-wrap justify-center gap-6 mb-6">
                        {selectedTerms.map((idx, i) => (
                            <div key={idx} className="flex flex-col items-center gap-2">
                                <div className="text-xl font-black text-slate-800 bg-white border border-slate-200 px-4 py-2 rounded shadow-inner min-w-[3rem] text-center">
                                    {termContents[idx]}
                                </div>
                                <div className="text-orange-400 text-xl font-bold">↓</div>
                                <input 
                                    autoFocus={i === 0}
                                    type="text"
                                    value={cancelInputs[idx] || ''}
                                    onChange={e => setCancelInputs(s => ({ ...s, [idx]: e.target.value }))}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleCancelSubmit();
                                        if (e.key === 'Escape') setSelectedTerms([]);
                                    }}
                                    className="w-20 px-2 py-2 text-xl font-bold bg-white border-2 border-orange-300 rounded-lg outline-none focus:border-orange-500 text-center text-slate-800"
                                />
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={handleCancelSubmit}
                        className="px-8 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 active:bg-orange-800 transition-colors w-full max-w-sm text-lg"
                    >
                        Check & Cancel
                    </button>
                    {hasError && <p className="text-red-500 font-bold mt-4 text-sm bg-red-100 px-4 py-1 rounded">Values incorrect or terms cannot be cancelled.</p>}
                </div>
            )}
        </div>

      </div>
    </div>
  );
}
