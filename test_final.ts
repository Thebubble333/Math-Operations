import { simplify } from 'mathjs';

function toJS(expr: string) {
    let s = expr.replace(/\s/g, '');
    let prev = '';
    while (s !== prev) {
       prev = s;
       s = s.replace(/([0-9])([a-zA-Z\(])/g, '$1*$2');
       s = s.replace(/([a-zA-Z\)])([0-9a-zA-Z\(])/g, (match, p1, p2) => {
           if (p1 === ')' && /^[+\-\*\/]$/.test(p2)) return match;
           if (/^[a-zA-Z]$/.test(p1) && /^[+\-\*\/]$/.test(p2)) return match;
           return p1 + '*' + p2;
       });
    }
    return s;
}

console.log(simplify(toJS("2x")).toTex().replace(/\\cdot /g, ''));
console.log(simplify(toJS("x*y")).toTex().replace(/\\cdot /g, ''));
