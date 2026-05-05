import * as fs from 'fs';
const file = fs.readFileSync('components/FractionAdditionGame.tsx', 'utf-8');
const evaluateStrMatch = file.match(/function evaluateStr\([\s\S]*?\n\}/);
const getTestPointsMatch = file.match(/function getTestPoints\([\s\S]*?\n\}/);
const toJSMatch = file.match(/function toJS\([\s\S]*?\n\}/);
const evaluateEditMatch = file.match(/const evaluateEdit = [\s\S]*?\n  \}/);
const splitFactorsMatch = file.match(/function splitFactors\([\s\S]*?\n\}/);
let code = `
${toJSMatch[0]}
${getTestPointsMatch[0]}
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
console.log("Edit:", evaluateEdit(["x*2-(x)"], "x2-(x)"));
`;
fs.writeFileSync('test_tojs3.ts', code);
