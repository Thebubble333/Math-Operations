
function getTestPoints() {
    return [
        {a: 1.1, b: 1.2, c: 1.3, m: 1.4, n: 1.5, p: 1.6, q: 1.7, x: 3.14159, y: 2.71828, z: -1.2, t: 0.5, s: -0.5, u: 2.1, v: -2.3},
        {a: 2.1, b: -1.2, c: 3.3, m: -1.4, n: 2.5, p: -1.6, q: 0.7, x: -1.234, y: 5.678, z: 2.2, t: -1.5, s: 1.5, u: -2.1, v: 2.3},
        {a: -1.1, b: 2.2, c: -1.3, m: 2.4, n: -1.5, p: 2.6, q: -1.7, x: 0.5, y: -0.5, z: -0.2, t: 2.5, s: -2.5, u: 1.1, v: -1.3}
    ];
}
function toJS(expr: string) {
    let s = expr.replace(/\s/g, '');
    let prev = '';
    while (s !== prev) {
       prev = s;
       s = s.replace(/([0-9])([a-zA-Z\(])/g, '$1*$2');
       s = s.replace(/([a-zA-Z])([a-zA-Z0-9\(])/g, '$1*$2');
       s = s.replace(/(\))([a-zA-Z0-9\(])/g, '$1*$2');
    }
    s = s.replace(/\^/g, '**');
    return s;
}
function evaluateStr(str: string, vars: Record<string, number>): number {
    const js = toJS(str);
    try {
        const varNames = Object.keys(vars);
        const varValues = Object.values(vars);
        // eslint-disable-next-line no-new-func
        const fn = new Function(...varNames, `return ${js};`);
        return fn(...varValues);
    } catch(e) {
        return NaN;
    }
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
        let match = p.match(/^([-+]?\d+)([a-zA-Z].*)$/);
        if (match) {
            subParts.push(match[1]);
            subParts.push(match[2]);
        } else {
            subParts.push(p);
        }
    }
    return subParts;
}

function checkEquivalent(expr1: string, expr2: string) {
    const pts = getTestPoints();
    for (let pt of pts) {
        const v1 = evaluateStr(expr1, pt);
        const v2 = evaluateStr(expr2, pt);
        if (isNaN(v1) || isNaN(v2)) return false;
        if (Math.abs(v1 - v2) > 1e-4) return false;
    }
    return true;
}

const evaluateEdit = (currentVals: string[], input: string) => {
       const j = currentVals.map(x => `(${x})`).join('*');
       const norm = input.replace(/\s/g, '');
       if (!checkEquivalent(j, norm)) return null;
       const factors = splitFactors(norm);
       if (!checkEquivalent(j, factors.map(x => `(${x})`).join('*'))) return null;
       return factors;
  }

console.log(evaluateEdit(["(2x+2)-(3x+2)"], "2x+2-3x-2"));

// wait, how evaluates:
console.log("val1: ", checkEquivalent("((2x+2)-(3x+2))", "2x+2-3x-2"));
const factors = splitFactors("2x+2-3x-2");
console.log("factors:", factors);
console.log("val2: ", checkEquivalent("((2x+2)-(3x+2))", factors.map(x => `(${x})`).join('*')));
