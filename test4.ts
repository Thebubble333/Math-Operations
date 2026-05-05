import * as fs from 'fs';
const file = fs.readFileSync('components/FractionAdditionGame.tsx', 'utf-8');

function splitFactorsFixed(input: string): string[] {
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
        
        let hasOp = false;
        let d = 0;
        for (let i = 1; i < p.length; i++) {
            if (p[i] === '(') d++;
            if (p[i] === ')') d--;
            if (d === 0 && (p[i] === '+' || p[i] === '-')) {
                hasOp = true; break;
            }
        }
        
        if (!hasOp) {
            let match = p.match(/^([-+]?\d+)([a-zA-Z].*)$/);
            if (match) {
                subParts.push(match[1]);
                subParts.push(match[2]);
                continue;
            }
        }
        subParts.push(p);
    }
    return subParts;
}

console.log("2x", splitFactorsFixed("2x"));
console.log("2x+2", splitFactorsFixed("2x+2"));
console.log("2x+2-3x-2", splitFactorsFixed("2x+2-3x-2"));
console.log("x(2x+2)", splitFactorsFixed("x(2x+2)"));
console.log("-2x", splitFactorsFixed("-2x"));

