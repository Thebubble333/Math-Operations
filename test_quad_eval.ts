import { evaluate, simplify } from 'mathjs';

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

function makeQuad(c1: number, c2: number) {
    let sum = c1 + c2;
    let prod = c1 * c2;
    let sumTerm = sum === 0 ? '' : (sum === 1 ? '+x' : (sum === -1 ? '-x' : `${fmt(sum)}x`));
    let prodTerm = prod === 0 ? '' : `${fmt(prod)}`;
    return `x^2${sumTerm}${prodTerm}`;
}

const templates = [
    () => { // Template 1: User example
       let a = Math.abs(rNonZero(1, 5)); // to ensure x^2 - a^2
       let b = rNonZero(1, 5);
       while (b === a || b === -a) b = rNonZero(1, 5);
       let k = rNonZero(2, 6);
       let m = rNonZero(2, 6);
       
       let sum = b - a;
       let prod = -a * b;
       
       return {
           f1: { num: [makeQuad(a, -a)], den: [`${k}x^2${fmt(k*a)}x`] },
           f2: { num: [makeQuad(-a, b)], den: [`${m}x`] },
           op: '\\div',
           finalExpr: getFinal(m, {}, k, {}, fmtB(b, 'x'), 0, 1)
       };
    },
    () => { // Template 2: Multiplication with quadratics
       // (x^2 + (a+b)x + ab) / (x^2 - b^2) * (x - b) / (kx + ka)
       let a = rNonZero(1, 5);
       let b = Math.abs(rNonZero(1, 5));
       while (Math.abs(a) === b) b = Math.abs(rNonZero(1, 5));
       let k = rNonZero(2, 6);
       
       return {
           f1: { num: [makeQuad(a, b)], den: [makeQuad(b, -b)] },
           f2: { num: [`x${fmt(-b)}`], den: [`${k}x${fmt(k*a)}`] },
           op: '\\times',
           finalExpr: getFinal(1, {}, k, {}, "", 0, 0) // cancels completely!
       };
    },
    () => { // Template 3: Div DOPS and Monic
       // (kx^2 - k*a^2) / (x^2 + (a+b)x + ab) \div (kx - ka) / (x + b)
       let a = Math.abs(rNonZero(1, 5));
       let b = rNonZero(1, 5);
       while (a === Math.abs(b)) b = rNonZero(1, 5);
       let k = rNonZero(2, 5);
       
       return {
           f1: { num: [`${k}x^2${fmt(-k*a*a)}`], den: [makeQuad(a, b)] },
           f2: { num: [`${k}x${fmt(-k*a)}`], den: [`x${fmt(b)}`] },
           op: '\\div',
           finalExpr: "1" 
       };
    },
    () => { // Template 4: Two Monics
       // (x^2 + (a+b)x + ab) / (x^2 + (a+c)x + ac) * (x+c)/(x+b)
       let a = rNonZero(1, 5);
       let b = rNonZero(1, 5);
       let c = rNonZero(1, 5);
       while (new Set([Math.abs(a), Math.abs(b), Math.abs(c)]).size !== 3) {
           b = rNonZero(1, 5);
           c = rNonZero(1, 5);
       }
       
       return {
           f1: { num: [makeQuad(a, b)], den: [makeQuad(a, c)] },
           f2: { num: [`x${fmt(c)}`], den: [`x${fmt(b)}`] },
           op: '\\times',
           finalExpr: "1"
       };
    },
    () => { // Template 5: Quad and HCF Division
       // (x^2 + (a+b)x + ab) / (kx^2 + kax) \div (x + b) / (m x^2)
       let a = rNonZero(1, 5);
       let b = rNonZero(1, 5);
       while(Math.abs(a) === Math.abs(b)) b = rNonZero(1, 5);
       let k = rNonZero(2, 5);
       let m = rNonZero(2, 5);
       
       return {
           f1: { num: [makeQuad(a, b)], den: [`${k}x^2${fmt(k*a)}x`] },
           f2: { num: [`x${fmt(b)}`], den: [`${m}x^2`] },
           op: '\\div',
           finalExpr: getFinal(m, {'x': 1}, k, {}, "", 0, 0)
       };
    }
];

console.log(templates.map(t => t()));
