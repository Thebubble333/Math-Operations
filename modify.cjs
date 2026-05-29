const fs = require('fs');

const fp = 'components/AlgFractQuadGame.tsx';
let txt = fs.readFileSync(fp, 'utf-8');

const replacement = `function generateProblem(questionIndex: number = 0): ProblemParams {
    const rInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const rBool = () => Math.random() < 0.5;
    const rSign = () => Math.random() < 0.5 ? 1 : -1;
    const rNonZero = (min: number, max: number) => {
        let v = rInt(min, max);
        while (v === 0) v = rInt(min, max);
        return v * rSign();
    };

    const fmt = (num: number) => num < 0 ? \`\${num}\` : \`+\${num}\`;
    const fmtB = (num: number, v: string) => num < 0 ? \`(\${v}\${num})\` : \`(\${v}+\${num})\`;

    function makeQuad(c1: number, c2: number) {
        let sum = c1 + c2;
        let prod = c1 * c2;
        let sumTerm = sum === 0 ? '' : (sum === 1 ? '+x' : (sum === -1 ? '-x' : \`\${fmt(sum)}x\`));
        let prodTerm = prod === 0 ? '' : \`\${fmt(prod)}\`;
        return \`x^2\${sumTerm}\${prodTerm}\`;
    }

    const templates = [
        () => { // Template 1: User example
           let a = Math.abs(rNonZero(1, 5)); // to ensure x^2 - a^2
           let b = rNonZero(1, 5);
           while (b === a || b === -a) b = rNonZero(1, 5);
           let k = rNonZero(2, 6);
           let m = rNonZero(2, 6);
           
           return {
               f1: { num: [makeQuad(a, -a)], den: [\`\${k}x^2\${fmt(k*a)}x\`] },
               f2: { num: [makeQuad(-a, b)], den: [\`\${m}x\`] },
               op: '\\\\div',
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
               f2: { num: [\`x\${fmt(-b)}\`], den: [\`\${k}x\${fmt(k*a)}\`] },
               op: '\\\\times',
               finalExpr: getFinal(1, {}, k, {}, "", 0, 0)
           };
        },
        () => { // Template 3: Div DOPS and Monic
           // (kx^2 - k*a^2) / (x^2 + (a+b)x + ab) div (kx - ka) / (x + b)
           let a = Math.abs(rNonZero(1, 5));
           let b = rNonZero(1, 5);
           while (a === Math.abs(b)) b = rNonZero(1, 5);
           let k = rNonZero(2, 5);
           
           return {
               f1: { num: [\`\${k}x^2\${fmt(-k*a*a)}\`], den: [makeQuad(a, b)] },
               f2: { num: [\`\${k}x\${fmt(-k*a)}\`], den: [\`x\${fmt(b)}\`] },
               op: '\\\\div',
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
               f2: { num: [\`x\${fmt(c)}\`], den: [\`x\${fmt(b)}\`] },
               op: '\\\\times',
               finalExpr: "1"
           };
        },
        () => { // Template 5: Quad and HCF Division
           // (x^2 + (a+b)x + ab) / (kx^2 + kax) div (x + b) / (m x^2)
           let a = rNonZero(1, 5);
           let b = rNonZero(1, 5);
           while(Math.abs(a) === Math.abs(b)) b = rNonZero(1, 5);
           let k = rNonZero(2, 5);
           let m = rNonZero(2, 5);
           
           return {
               f1: { num: [makeQuad(a, b)], den: [\`\${k}x^2\${fmt(k*a)}x\`] },
               f2: { num: [\`x\${fmt(b)}\`], den: [\`\${m}x^2\`] },
               op: '\\\\div',
               finalExpr: getFinal(m, {'x': 1}, k, {}, "", 0, 0)
           };
        }
    ];

    return templates[rInt(0, templates.length - 1)]();
}`;


const match = txt.match(/function generateProblem\(questionIndex.*?return t\[rInt\(0, t.length - 1\)\]\(\);\n\}/s);

if (match) {
    txt = txt.replace(match[0], replacement);
    // Let's also replace FractionSimplifierGame with AlgFractQuadGame
    txt = txt.replace(/FractionSimplifierGame/g, 'AlgFractQuadGame');
    fs.writeFileSync(fp, txt);
    console.log("Success");
} else {
    console.log("Regex match failed");
}
