import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TexEngine } from '../utils/textEngine';

const texEngine = new TexEngine();

type Mode = 'EDIT' | 'CANCEL';

type FractionData = { num: string[], den: string[] };

import { evaluate, simplify } from 'mathjs';

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
    const rBool = () => Math.random() < 0.5;
    const rSign = () => Math.random() < 0.5 ? 1 : -1;
    const rNonZero = (min: number, max: number) => {
        let v = rInt(min, max);
        while (v === 0) v = rInt(min, max);
        return v * rSign();
    };
    const fmt = (num: number) => num < 0 ? `${num}` : `+${num}`;
    const fmtB = (num: number, v: string) => num < 0 ? `(${v}${num})` : `(${v}+${num})`;
    
    const vars = ['a', 'b', 'c', 'm', 'n', 'p', 'q', 'x', 'y', 'z', 't', 's', 'u', 'v'];
    let v1 = vars[rInt(0, vars.length - 1)];
    let v2 = vars[rInt(0, vars.length - 1)];
    while (v2 === v1) v2 = vars[rInt(0, vars.length - 1)];

    const factorisingTemplates = [
        () => {
            let a = rNonZero(2, 5); let c = rNonZero(2, 5);
            let b = rNonZero(2, 5); let B = rNonZero(1, 5);
            let n1 = [`${a * c}`, v1, fmt(a * c * B)]; 
            let d1 = [`${b}`, v2];
            let k = rNonZero(1, 3);
            let n2 = [`${b * k}`, `${v2}^2`];
            let m = rNonZero(1, 3);
            let d2 = [`${a * m}`, v1, fmt(a * m * B)]; 
            let finalExpr = getFinal(
                (a*c)*(b*k), {[v1]:0, [v2]:2},
                b * a * m,   {[v1]:0, [v2]:1},
                fmtB(B, v1), 1, 1
            );
            return {
                f1: { num: autoWrap(n1), den: autoWrap(d1) },
                f2: { num: autoWrap(n2), den: autoWrap(d2) },
                op: '\\times',
                finalExpr
            };
        },
        () => {
            let k = rNonZero(2, 5);
            let B = rNonZero(1, 5);
            let n1 = [`${k}`, v2];
            let d1 = [v1, fmt(B)];
            let k2 = rNonZero(2, 4);
            let n2 = [`${k * k2}`, `${v2}^2`];
            let m2 = rNonZero(2, 4);
            let d2 = [`${m2}${v1}`, fmt(m2 * B)]; 
            let finalExpr = getFinal(
                k * m2, {[v1]:0, [v2]:1},
                k * k2, {[v1]:0, [v2]:2},
                fmtB(B, v1), 1, 1
            );
            return {
                f1: { num: autoWrap(n1), den: autoWrap(d1) },
                f2: { num: autoWrap(n2), den: autoWrap(d2) },
                op: '\\div',
                finalExpr
            };
        },
        () => {
            let c = rNonZero(2, 5);
            let k = rNonZero(2, 5);
            let m = rNonZero(1, 5);
            let n1 = [`${c}`, `${v1}^2`];
            let d1 = [`${c}`, v1, fmt(c*m)];
            let n2 = [`${k}`, v1, fmt(k*m)];
            let d2 = [`${k}`, v1];
            let isT = rBool();

            let finalExpr = isT ?
                getFinal(c*k, {[v1]:2}, c*k, {[v1]:1}, fmtB(m, v1), 1, 1) :
                getFinal(c*k, {[v1]:3}, c*k, {}, fmtB(m, v1), 0, 2);

            return {
                f1: { num: autoWrap(n1), den: autoWrap(d1) },
                f2: { num: autoWrap(n2), den: autoWrap(d2) },
                op: isT ? '\\times' : '\\div',
                finalExpr
            };
        },
        () => {
            // ax / ((x-1)(bx-2)) * (x-1) / (cx)
            let a = rNonZero(2, 6);
            let b = rNonZero(2, 4);
            let c = rNonZero(2, 6);
            let k = rNonZero(1, 4);
            let d = rNonZero(1, 5) * -1; // -1
            let e = rNonZero(1, 5) * -1; // -2
            
            // let's simplify a/c
            a = a * k; c = c * k;
            
            let bracket1 = fmtB(d, v1); // (x-1)
            let bracket2 = `(${b}${v1}${fmt(e)})`; // (bx-2)
            
            let isT = rBool();

            let finalExpr = isT ? getFinal(
                a, {}, c, {}, bracket2, 0, 1
            ) : getFinal(
                a*c, {[v1]:2}, 1, {}, bracket1, 0, 2, bracket2, 0, 1
            );
            
            let d1 = [bracket1, bracket2];
            let n2 = [bracket1];
            
            return {
                f1: { num: autoWrap([`${a}`, v1]), den: d1 },
                f2: { num: n2, den: autoWrap([`${c}`, v1]) },
                op: isT ? '\\times' : '\\div',
                finalExpr
            };
        },
        () => {
            // ax / ((x-c)(bx+d)) * (bx+d) / x
            let a = rNonZero(2, 6);
            let b = rNonZero(2, 4);
            let c = rNonZero(1, 5) * -1;
            let d = rNonZero(1, 5);
            
            let bracket1 = fmtB(c, v1); // (x-3)
            let bracket2 = `(${b}${v1}${fmt(d)})`; // (4x+7)
            
            let isT = rBool();

            let finalExpr = isT ? getFinal(
                a, {}, 1, {}, bracket1, 0, 1
            ) : getFinal(
                a, {[v1]:2}, 1, {}, bracket1, 0, 1, bracket2, 0, 2
            );
            
            return {
                f1: { num: autoWrap([`${a}`, v1]), den: [bracket1, bracket2] },
                f2: { num: [bracket2], den: autoWrap([v1]) },
                op: isT ? '\\times' : '\\div',
                finalExpr
            };
        },
        () => {
            // (x+a) / ((x+b)(x+c)) * (x+b) / (x+a)
            let a = rNonZero(1, 5);
            let b = rNonZero(1, 5);
            let c = rNonZero(1, 5);
            while(b===a) b = rNonZero(1, 5);
            while(c===a || c===b) c = rNonZero(1, 5);
            
            let ba = fmtB(a, v1);
            let bb = fmtB(b, v1);
            let bc = fmtB(c, v1);

            let isT = rBool();

            let finalExpr = isT ? getFinal(
                1, {}, 1, {}, bc, 0, 1
            ) : `\\frac{${ba}^2}{${bb}^2${bc}}`;
            
            return {
                f1: { num: [ba], den: [bb, bc] },
                f2: { num: [bb], den: [ba] },
                op: isT ? '\\times' : '\\div',
                finalExpr
            };
        },
        () => {
            // a / (x(bx-c)) * x(x+d) / f
            let a = rNonZero(2, 5);
            let f = rNonZero(2, 5);
            let k = rNonZero(2, 3);
            a = a * k; f = f * k;
            
            let b = rNonZero(2, 4);
            let c = rNonZero(1, 5) * -1;
            let d = rNonZero(1, 5);
            
            let b1 = `(${b}${v1}${fmt(c)})`;
            let b2 = fmtB(d, v1);
            
            let finalExpr = getFinal(
                a, {}, f, {}, b2, 1, 0, b1, 0, 1
            );
            
            return {
                f1: { num: autoWrap([`${a}`]), den: [v1, b1] },
                f2: { num: [v1, b2], den: autoWrap([`${f}`]) },
                op: '\\times',
                finalExpr
            };
        },
        () => {
            // (a x^2) / (b(x-c)^2) * (d(x-c)) / (f x^4)
            let a = rNonZero(2, 6);
            let b = rNonZero(2, 6);
            let d = rNonZero(2, 6);
            let f = rNonZero(2, 6);
            
            let k = rNonZero(2, 4);
            a = a * k; b = b * k;
            let m = rNonZero(2, 4);
            d = d * m; f = f * m;
            
            let c = rNonZero(1, 5) * -1;
            let b1 = fmtB(c, v1);
            
            let finalExpr = getFinal(
                a*d, {}, b*f, {[v1]:2}, b1, 0, 1
            );
            
            return {
                f1: { num: autoWrap([`${a}`, `${v1}^2`]), den: autoWrap([`${b}`, `${b1}^2`]) },
                f2: { num: autoWrap([`${d}`, b1]), den: autoWrap([`${f}`, `${v1}^4`]) },
                op: '\\times',
                finalExpr
            };
        },
        () => {
             // (a(x-b)^2) / ((x+c)(x-d)) div (e(x-b)) / (f(x-d))
             let a = rNonZero(2, 6);
             let e = rNonZero(2, 6);
             let k = rNonZero(2,4);
             a *= k; e *= k;
             
             let f = rNonZero(2, 6);
             
             let b = rNonZero(1, 5) * -1;
             let c = rNonZero(1, 5);
             let d = rNonZero(1, 5) * -1;
             
             let bb = fmtB(b, v1);
             let bc = fmtB(c, v1);
             let bd = fmtB(d, v1);
             
             let finalExpr = getFinal(
                 a*f, {}, e, {}, bb, 1, 0, bc, 0, 1
             );
             
             return {
                 f1: { num: autoWrap([`${a}`, `${bb}^2`]), den: autoWrap([bc, bd]) },
                 f2: { num: autoWrap([`${e}`, bb]), den: autoWrap([`${f}`, bd]) },
                 op: '\\div',
                 finalExpr
             };
        },
        () => {
            // e.g. 4t / (5(x-1)) div 12t / (x-1)
            let a = rNonZero(2, 6);
            let a_factor = rNonZero(2, 4);
            let b = rNonZero(2, 6);
            let d = a * a_factor;
            let c = rNonZero(1, 5) * rSign();
            
            let vOther = vars[rInt(0, vars.length - 1)];
            while (vOther === v1 || vOther === v2) vOther = vars[rInt(0, vars.length - 1)];
            
            let bracket = fmtB(c, v1);
            let n1 = [`${a}`, vOther];
            let d1 = [`${b}`, bracket];
            let n2 = [`${d}`, vOther];
            let d2 = [bracket];

            let finalExpr = `\\frac{1}{${b * a_factor}}`;
            
            return {
                f1: { num: autoWrap(n1), den: autoWrap(d1) },
                f2: { num: autoWrap(n2), den: autoWrap(d2) },
                op: '\\div',
                finalExpr
            };
        },
        () => {
            // e.g. (3x(y+2)) / (4t) * (8t^2) / (9x)
            let a = rNonZero(2, 5);
            let b = rNonZero(2, 5);
            let k = rNonZero(2, 4);
            let m = rNonZero(2, 4);
            let d = b * k;
            let f = a * m;
            let c = rNonZero(1, 5);
            
            let vOther = vars[rInt(0, vars.length - 1)];
            while (vOther === v1 || vOther === v2) vOther = vars[rInt(0, vars.length - 1)];
            
            let bracket = fmtB(c, v2);
            let n1 = [`${a}`, v1, bracket];
            let d1 = [`${b}`, vOther];
            let n2 = [`${d}`, `${vOther}^2`];
            let d2 = [`${f}`, v1];

            let finalExpr = `\\frac{${k}${vOther}${bracket}}{${m}}`;
            if (m === 1) finalExpr = `${k}${vOther}${bracket}`;

            return {
                f1: { num: autoWrap(n1), den: autoWrap(d1) },
                f2: { num: autoWrap(n2), den: autoWrap(d2) },
                op: '\\times',
                finalExpr
            };
        }
    ];

    const simpleTemplates = [
        () => {
            let a = rNonZero(2, 5); 
            let n1 = [`${a}`, v1]; 
            let d1 = [`${a}`, v1, fmt(1)]; 
            let B1 = rNonZero(1, 5); let B2 = rNonZero(1, 5);
            while (B1 === B2) B2 = rNonZero(1, 5);
            let n2 = [v1, fmt(B1)];
            let d2 = [v1, fmt(B2)];
            let isT = rBool();
            let finalExpr = isT ? 
                `\\frac{${a}${v1}${fmtB(B1, v1)}}{(${a}${v1}+1)${fmtB(B2, v1)}}` : 
                `\\frac{${a}${v1}${fmtB(B2, v1)}}{(${a}${v1}+1)${fmtB(B1, v1)}}`;
            return {
                f1: { num: autoWrap(n1), den: autoWrap(d1) },
                f2: { num: autoWrap(n2), den: autoWrap(d2) },
                op: isT ? '\\times' : '\\div',
                finalExpr
            };
        },
        () => {
            let a = rNonZero(2, 7);
            let b = rNonZero(2, 7);
            let n1 = [`${a * b}`, v1];
            let d1 = [`${b}`, v2];
            let n2 = [v2];
            let d2 = [`${a}`, v1];
            let finalExpr = getFinal(
                a*b, {[v1]:1, [v2]:1},
                a*b, {[v1]:1, [v2]:1},
                "", 0, 0
            );
            return {
                f1: { num: autoWrap(n1), den: autoWrap(d1) },
                f2: { num: autoWrap(n2), den: autoWrap(d2) },
                op: '\\times',
                finalExpr
            };
        },
        () => {
            // ax / b * c / (dy)
            let a = rNonZero(1, 5) * rSign(); let b = rNonZero(2, 5);
            let c = rNonZero(2, 5) * rSign(); let d = rNonZero(1, 5);
            
            // force some canceling
            let k = rNonZero(2, 4);
            c = c * k; b = b * k;
            
            let isT = rBool();

            let finalExpr = isT ? getFinal(
                a*c, {[v1]:1}, b*d, {[v2]:1}, "", 0, 0
            ) : getFinal(
                a*d, {[v1]:1, [v2]:1}, b*c, {}, "", 0, 0
            );
            
            return {
                f1: { num: autoWrap([`${a}`, v1]), den: autoWrap([`${b}`]) },
                f2: { num: autoWrap([`${c}`]), den: autoWrap([`${d}`, v2]) },
                op: isT ? '\\times' : '\\div',
                finalExpr
            };
        },
        () => {
            // ax / b * (cy) / (-dx)
            let a = rNonZero(1, 5) * rSign(); let b = rNonZero(2, 5);
            let c = rNonZero(2, 5) * rSign(); let d = rNonZero(1, 5) * -1;
            
            let isT = rBool();

            let finalExpr = isT ? getFinal(
                a*c, {[v1]:1, [v2]:1}, b*d, {[v1]:1}, "", 0, 0
            ) : getFinal(
                a*d, {[v1]:2}, b*c, {[v2]:1}, "", 0, 0
            );
            
            return {
                f1: { num: autoWrap([`${a}`, v1]), den: autoWrap([`${b}`]) },
                f2: { num: autoWrap([`${c}`, v2]), den: autoWrap([`${d}`, v1]) },
                op: isT ? '\\times' : '\\div',
                finalExpr
            };
        },
        () => {
            // a / (cx) div (b / dx) -> a/(cx) * (dx)/b
            let a = rNonZero(1, 5) * rSign(); let b = rNonZero(2, 5);
            let c = rNonZero(1, 5); let d = rNonZero(1, 5) * rSign();
            let k = rNonZero(2, 4);
            b = b * k; d = d * k;

            let isT = rBool();

            let finalExpr = isT ? getFinal(
                a*b, {}, c*d, {[v1]:2}, "", 0, 0
            ) : getFinal(
                a*d, {[v1]:1}, c*b, {[v1]:1}, "", 0, 0
            );
            
            return {
                f1: { num: autoWrap([`${a}`]), den: autoWrap([`${c}`, v1]) },
                f2: { num: autoWrap([`${b}`]), den: autoWrap([`${d}`, v1]) },
                op: isT ? '\\times' : '\\div',
                finalExpr
            };
        },
        () => {
            // (a * x * y) / b div (c * x) / (d * y)
            let a = rNonZero(1, 5); let b = rNonZero(2, 5);
            let c = rNonZero(2, 5); let d = rNonZero(1, 5);
            
            let isT = rBool();

            let finalExpr = isT ? getFinal(
                a*c, {[v1]:2, [v2]:1}, b*d, {[v2]:1}, "", 0, 0
            ) : getFinal(
                a*d, {[v1]:1, [v2]:2}, b*c, {[v1]:1}, "", 0, 0
            );
            
            return {
                f1: { num: autoWrap([`${a}`, v1, v2]), den: autoWrap([`${b}`]) },
                f2: { num: autoWrap([`${c}`, v1]), den: autoWrap([`${d}`, v2]) },
                op: isT ? '\\times' : '\\div',
                finalExpr
            };
        },
        () => {
            // (cx)/(dy) * (ax) / (by)
            let a = rNonZero(1, 4); let b = rNonZero(2, 5);
            let c = rNonZero(2, 5) * -1; let d = rNonZero(1, 5);
            
            let isT = rBool();

            let finalExpr = isT ? getFinal(
                a*c, {[v1]:2}, b*d, {[v2]:2}, "", 0, 0
            ) : getFinal(
                c*b, {[v1]:1, [v2]:1}, d*a, {[v1]:1, [v2]:1}, "", 0, 0
            );
            
            return {
                f1: { num: autoWrap([`${c}`, v1]), den: autoWrap([`${d}`, v2]) },
                f2: { num: autoWrap([`${a}`, v1]), den: autoWrap([`${b}`, v2]) },
                op: isT ? '\\times' : '\\div',
                finalExpr
            };
        },
        () => {
            let v3 = vars[rInt(0, vars.length - 1)];
            while (v3 === v1 || v3 === v2) v3 = vars[rInt(0, vars.length - 1)];

            //  (a*v1)/(b*v3) * (c*v3)/(d*v2)
            let a = rNonZero(1, 4) * rSign(); let b = rNonZero(2, 5);
            let c = rNonZero(2, 5) * rSign(); let d = rNonZero(1, 5);
            
            let k = rNonZero(2, 3);
            b = b * k; c = c * k;

            let isT = rBool();

            let finalExpr = isT ? getFinal(
                a*c, {[v1]:1, [v3]:1}, b*d, {[v3]:1, [v2]:1}, "", 0, 0
            ) : getFinal(
                a*d, {[v1]:1, [v2]:1}, b*c, {[v3]:2}, "", 0, 0
            );
            
            return {
                f1: { num: autoWrap([`${a}`, v1]), den: autoWrap([`${b}`, v3]) },
                f2: { num: autoWrap([`${c}`, v3]), den: autoWrap([`${d}`, v2]) },
                op: isT ? '\\times' : '\\div',
                finalExpr
            };
        }
    ];

    const allTemplates = [...factorisingTemplates, ...simpleTemplates];

    let t = allTemplates;
    if (questionIndex % 2 === 1) { // 0-indexed: index 1 is 2nd question
        t = factorisingTemplates;
    }

    return t[rInt(0, t.length - 1)]();
}

export default function FractionSimplifierGame() {
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<Mode>('EDIT');
  const [problem, setProblem] = useState<ProblemParams>(() => generateProblem());
  
  // Selection states
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null); // 'f1.num', 'f1.den', 'f2.num', 'f2.den'
  const [selectedTerms, setSelectedTerms] = useState<number[]>([]); // For cancel mode
  
  const [history, setHistory] = useState<{f1: FractionData, f2: FractionData, op: string}[]>([
    {
      f1: problem.f1,
      f2: problem.f2,
      op: problem.op
    }
  ]);
  const [finalExprToRender, setFinalExprToRender] = useState<string>(problem.finalExpr);

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
  const buildExpr = (state: {f1: FractionData, f2: FractionData, op: string}) => {
      const g = (terms: string[]) => {
          if (mode === 'EDIT') {
               return `\\term{${formatTerms(terms, false)}}`;
          }
          return formatTerms(terms, true);
      };
      let opStr = state.op.startsWith('\\') ? state.op : '\\' + state.op; // Ensure it has a backslash symbol if it's like div or times
      return `$\\frac{${g(state.f1.num)}}{${g(state.f1.den)}} \\term{${opStr}} \\frac{${g(state.f2.num)}}{${g(state.f2.den)}}$`;
  };

  const currentExpr = buildExpr(currentState);

  // Map term indexes to groups
  const termGroups = useMemo(() => {
     const groups: { groupId: string, terms: number[] }[] = [
         { groupId: 'f1.num', terms: [] },
         { groupId: 'f1.den', terms: [] },
         { groupId: 'op', terms: [] },
         { groupId: 'f2.num', terms: [] },
         { groupId: 'f2.den', terms: [] }
     ];
     
     let idx = 0;
     const fillGroup = (gIdx: number, arr: string[]) => {
         const count = (mode === 'EDIT' && gIdx !== 2) ? 1 : arr.length;
         for (let i = 0; i < count; i++) {
             groups[gIdx].terms.push(idx++);
         }
     };

     fillGroup(0, currentState.f1.num);
     fillGroup(1, currentState.f1.den);
     fillGroup(2, [currentState.op]);
     fillGroup(3, currentState.f2.num);
     fillGroup(4, currentState.f2.den);

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
  const [hasError, setHasError] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [globalError, setGlobalError] = useState(false);

  // Clear inputs when selection changes
  useEffect(() => {
     setEditInput('');
     setCancelInputs({});
     setHasError(false);
  }, [selectedTerms, selectedGroup, mode]);

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
       setFinalExprToRender(p.finalExpr);
       setIsComplete(false);
       setMode('EDIT');
       setSelectedTerms([]);
       setSelectedGroup(null);
  };

  const checkCompletion = () => {
       const userComplexity = [
           ...currentState.f1.num, ...currentState.f1.den,
           ...currentState.f2.num, ...currentState.f2.den
       ].filter(t => t !== '1' && t !== '').join('').length;

       const finalComplexity = problem.finalExpr.replace(/\\frac|{|}/g, '').replace(/(^|[^0-9])1([^0-9]|$)/g, '$1$2').length;

       if (currentState.op === '\\div' || userComplexity > finalComplexity + 4) {
           setGlobalError(true);
           setTimeout(() => setGlobalError(false), 2000);
           return;
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
        if (!checkEquivalent(j, factors.map(x => `(${x})`).join('*'), setDbg)) {
            setDebugMsg(`Fail 2: msg=${debugTemp}`);
            return null;
        }
        setDebugMsg("");
        return factors;
   }

  const handleEditSubmit = () => {
      if (!selectedGroup) return;
      
      let targetArray: string[] = [];
      if (selectedGroup === 'f1.num') targetArray = currentState.f1.num;
      if (selectedGroup === 'f1.den') targetArray = currentState.f1.den;
      if (selectedGroup === 'f2.num') targetArray = currentState.f2.num;
      if (selectedGroup === 'f2.den') targetArray = currentState.f2.den;
      
      const newTerms = evaluateEdit(targetArray, editInput);
      
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
          setTimeout(() => setHasError(false), 800);
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
              const joined = arr.join('');
              if (joined === 'x+3' || joined === '1x+3') {
                  return ['(x+3)'];
              }
              return arr;
          };

          nextState.f1.num = wrapInBrackets(cleanOnes(nextState.f1.num));
          nextState.f1.den = wrapInBrackets(cleanOnes(nextState.f1.den));
          nextState.f2.num = wrapInBrackets(cleanOnes(nextState.f2.num));
          nextState.f2.den = wrapInBrackets(cleanOnes(nextState.f2.den));
          
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
            {globalError && <div className="absolute top-2 text-red-500 font-bold text-sm bg-red-100 px-3 py-1 rounded-full animate-in fade-in slide-in-from-top-2">Simplify further!</div>}
            <div className="relative flex items-center">
                {/* Active Expression */}
                <div className="relative">
                    <svg width={aW} height={aH} className={`overflow-visible ${isComplete ? 'pointer-events-none' : 'pointer-events-auto'}`}>{aEls}</svg>
                </div>
                
                {/* Final Result (Out of flow, appears to the right) */}
                {isComplete && (
                    <div className="absolute left-full ml-12 flex items-center gap-6 animate-in fade-in zoom-in-50 slide-in-from-left-8 duration-700 whitespace-nowrap">
                        <div className="text-5xl font-normal text-slate-700 drop-shadow-sm">=</div>
                        <svg width={finalW} height={finalH} className="overflow-visible drop-shadow-sm">{finalEls}</svg>
                    </div>
                )}
            </div>
        </div>

        {/* Floating Input Panels */}
        <div className="min-h-[120px] w-full mt-6 flex justify-center">
            {selectedGroup === 'op' && !isComplete && (
                <div className="bg-purple-50 border-2 rounded-xl p-6 shadow-sm w-full max-w-lg flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-300 border-purple-200">
                    <p className="text-slate-500 font-bold mb-4 uppercase tracking-wider text-sm">Operation Selected</p>
                    {currentState.op === '\\div' ? (
                        <button 
                            onClick={handleKCF}
                            className="px-8 py-4 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 active:bg-purple-800 transition-all text-xl shadow-md w-full"
                        >
                            KEEP, CHANGE, FLIP
                        </button>
                    ) : (
                        <button 
                            onClick={handleKCF}
                            className="px-8 py-4 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 active:bg-purple-800 transition-all text-xl shadow-md w-full"
                        >
                            REVERT TO DIVISION
                        </button>
                    )}
                </div>
            )}

            {mode === 'EDIT' && selectedGroup && selectedGroup !== 'op' && !isComplete && (
                <div className={`bg-blue-50 border-2 rounded-xl p-6 shadow-sm w-full max-w-lg flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-300 ${hasError ? 'border-red-400 bg-red-50 animate-shake' : 'border-blue-200'}`}>
                    <div className="text-xl font-black text-slate-800 mb-4 bg-white px-8 py-4 rounded shadow-inner flex items-center justify-center min-w-[200px] min-h-[60px]">
                        {editEls && <svg width={editW} height={editH} className="overflow-visible">{editEls}</svg>}
                    </div>
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
                            onClick={handleEditSubmit}
                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                    {hasError && <p className="text-red-500 font-bold mt-3 text-sm">Not correct! {debugMsg}</p>}
                </div>
            )}

            {mode === 'CANCEL' && selectedTerms.length >= 2 && !isComplete && (
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
