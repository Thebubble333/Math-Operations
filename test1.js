import { readFileSync } from 'fs';
const file = readFileSync('components/FractionAdditionGame.tsx', 'utf-8');
const toJSMatch = file.match(/function toJS\([\s\S]*?\n\}/);
const evaluateStrMatch = file.match(/function evaluateStr\([\s\S]*?\n\}/);
const getTestPointsMatch = file.match(/function getTestPoints\([\s\S]*?\n\}/);

let code = `
${getTestPointsMatch[0]}
${toJSMatch[0].replace('function toJS', 'const toJS = function')}
${evaluateStrMatch[0].replace('function evaluateStr', 'const evaluateStr = function')}

const pts = getTestPoints();
let pt = pts[0];
console.log("pt", pt);
console.log("2x+2-3x-2 js:", toJS("2x+2-3x-2"));
console.log("val1:", evaluateStr("2x+2-3x-2", pt));
console.log("(2x+2)-(3x+2) js:", toJS("(2x+2)-(3x+2)"));
console.log("val2:", evaluateStr("(2x+2)-(3x+2)", pt));
console.log("val2 again:", evaluateStr("((2x+2)-(3x+2))", pt));

function checkEquivalent(expr1, expr2) {
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
`;

import('fs').then(fs => fs.writeFileSync('test.js', code));
