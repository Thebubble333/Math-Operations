const math = require('mathjs');

function isFullySimplified(exprStr) {
    if (exprStr.includes('(') || exprStr.includes(')')) return false;
    
    // remove spaces
    exprStr = exprStr.replace(/\s/g, '');
    
    // check for multiple occurrences of the same variable/power combo
    // Actually, just compare length of user terms vs rationalized terms
    let s = exprStr.replace(/^\s*-\s*/, '');
    const userTerms = s.split(/[+-]/).filter(x => x !== '');
    
    let r = math.rationalize(exprStr).toString().replace(/\s/g, '').replace(/^\s*-\s*/, '');
    const ratTerms = r.split(/[+-]/).filter(x => x !== '');
    
    return userTerms.length === ratTerms.length;
}

console.log(isFullySimplified('x^2+3x+2x+6'));
console.log(isFullySimplified('x^2+5x+6'));
console.log(isFullySimplified('x^2+5*x+6'));
console.log(isFullySimplified('2*x+1+x'));
console.log(isFullySimplified('3x+1'));
console.log(isFullySimplified('-3x+1'));
