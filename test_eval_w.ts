import * as fs from 'fs';
const file = fs.readFileSync('components/FractionAdditionGame.tsx', 'utf-8');
const evaluateCancelMatch = file.match(/const evaluateCancel = [\s\S]*?\n  \};/);
const evaluateStrMatch = file.match(/function evaluateStr\([\s\S]*?\n\}/);
const getTestPointsMatch = file.match(/function getTestPoints\([\s\S]*?\n\}/);
const toJSMatch = file.match(/function toJS\([\s\S]*?\n\}/);

let code = `
${toJSMatch[0]}
${getTestPointsMatch[0]}
${evaluateStrMatch[0]}

const selectedTerms = [0, 1];
const termGroups = [{terms: [0], groupId: 'f1.num'}, {terms: [1], groupId: 'f1.den'}];

${evaluateCancelMatch[0]}
console.log(evaluateCancel(["(w-5)", "(w-5)"], ["1", "1"]));
`;

fs.writeFileSync('test_eval_w2.ts', code);
