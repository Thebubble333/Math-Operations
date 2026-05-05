import * as fs from 'fs';
const file = fs.readFileSync('components/FractionAdditionGame.tsx', 'utf-8');
const toJSMatch = file.match(/function toJS\([\s\S]*?\n\}/);
let code = `
${toJSMatch[0]}
console.log(toJS("x2"));
`;
fs.writeFileSync('test_tojs2.ts', code);
