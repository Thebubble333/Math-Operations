
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

const pts = getTestPoints();
let pt = pts[0];
console.log("pt", pt);
console.log("2x+2-3x-2 js:", toJS("2x+2-3x-2"));
console.log("val1:", evaluateStr("2x+2-3x-2", pt));
console.log("(2x+2)-(3x+2) js:", toJS("(2x+2)-(3x+2)"));
console.log("val2:", evaluateStr("(2x+2)-(3x+2)", pt));
console.log("val2 again:", evaluateStr("((2x+2)-(3x+2))", pt));

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

console.log("is eq:", checkEquivalent("((2x+2)-(3x+2))", "(2x+2-3x-2)"));
