import * as fs from 'fs';
const file = fs.readFileSync('components/FractionAdditionGame.tsx', 'utf-8');
const formatTermsMatch = file.match(/const formatTerms = [\s\S]*?\n  \};/);
let code = `
${formatTermsMatch[0]}
console.log(formatTerms(["x", "2"], false));
console.log(formatTerms(["3", "2"], false));
`;
fs.writeFileSync('test_format2.ts', code);
