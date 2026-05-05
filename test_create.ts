import * as fs from 'fs';
const file = fs.readFileSync('components/FractionAdditionGame.tsx', 'utf-8');
const evaluateEditMatch = file.match(/const evaluateEdit = [\s\S]*?\n  \}/);
const evaluateStrMatch = file.match(/function evaluateStr\([\s\S]*?\n\}/);
const getTestPointsMatch = file.match(/function getTestPoints\([\s\S]*?\n\}/);
const toJSMatch = file.match(/function toJS\([\s\S]*?\n\}/);
const splitFactorsMatch = file.match(/function splitFactors\([\s\S]*?\n\}/);

let code = `
${getTestPointsMatch[0]}
${toJSMatch[0]}
${evaluateStrMatch[0]}
${splitFactorsMatch[0]}
function checkEquivalent(expr1: string, expr2: string) {
    const pts = getTestPoints();
    for (let pt of pts) {
        let v1 = evaluateStr(expr1, pt);
        let v2 = evaluateStr(expr2, pt);
        if (isNaN(v1) || isNaN(v2)) return false;
        if (Math.abs(v1 - v2) > 1e-4) return false;
    }
    return true;
}
${evaluateEditMatch[0]}
console.log("factors:", splitFactors("2x+2-3x-2"));
console.log(evaluateEdit(["(2x+2)-(3x+2)"], "2x+2-3x-2"));
`;
fs.writeFileSync('test_eval2.ts', code);
