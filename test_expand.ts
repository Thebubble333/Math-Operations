import * as math from 'mathjs';

function expandPolynomial(expr) {
    // A somewhat hacky way to expand polynomials algebraically without grouping like terms
    // We can parse the mathjs tree, and explicitly apply distributivity.
    const node = math.parse(expr);
    
    function expand(node) {
        if (node.isParenthesisNode) {
            return expand(node.content);
        }
        if (node.isOperatorNode) {
            if (node.op === '+' || node.op === '-') {
                return new math.OperatorNode(node.op, node.fn, [expand(node.args[0]), expand(node.args[1])]);
            }
            if (node.op === '*') {
                let left = expand(node.args[0]);
                let right = expand(node.args[1]);
                
                // if left or right is +/- we distribute
                // left could be A + B, right could be C + D
                let leftTerms = getTerms(left);
                let rightTerms = getTerms(right);
                
                if (leftTerms.length > 1 || rightTerms.length > 1) {
                    let resultTerms = [];
                    for (let l of leftTerms) {
                        for (let r of rightTerms) {
                            let sign1 = l.sign;
                            let sign2 = r.sign;
                            let finalSign = sign1 === sign2 ? '+' : '-';
                            let mul = new math.OperatorNode('*', 'multiply', [l.node, r.node]);
                            resultTerms.push({ sign: finalSign, node: mul });
                        }
                    }
                    return buildFromTerms(resultTerms);
                }
                return new math.OperatorNode('*', 'multiply', [left, right]);
            }
        }
        return node;
    }
    
    function getTerms(node, currentSign = '+') {
        if (node.isOperatorNode && node.op === '+') {
            return [...getTerms(node.args[0], currentSign), ...getTerms(node.args[1], '+')];
        } else if (node.isOperatorNode && node.op === '-') {
            // Unary minus?
            if (node.args.length === 1) {
                return getTerms(node.args[0], currentSign === '+' ? '-' : '+');
            }
            return [...getTerms(node.args[0], currentSign), ...getTerms(node.args[1], currentSign === '+' ? '-' : '+')];
        }
        return [{ sign: currentSign, node: node }];
    }
    
    function buildFromTerms(terms) {
        if (terms.length === 0) return new math.ConstantNode(0);
        let root = terms[0].sign === '-' ? new math.OperatorNode('-', 'unaryMinus', [terms[0].node]) : terms[0].node;
        for (let i = 1; i < terms.length; i++) {
            root = new math.OperatorNode(terms[i].sign, terms[i].sign === '+' ? 'add' : 'subtract', [root, terms[i].node]);
        }
        return root;
    }
    
    let expanded = expand(node);
    
    // Now we want to simplify each term a bit (e.g. 2*x*3 -> 6*x, x*x -> x^2)
    // We can do this by using math.simplify on the individual terms!
    let finalTerms = getTerms(expanded);
    let finalSimplified = finalTerms.map(t => ({ sign: t.sign, node: math.simplify(t.node) }));
    
    // rebuild
    let res = buildFromTerms(finalSimplified);
    return res.toString();
}

console.log(expandPolynomial('(x+2)*(x+3)'));
console.log(expandPolynomial('2*x*(x-5)'));
console.log(expandPolynomial('(x+1)*(x+4) + (x-1)*(x+1)'));
console.log(expandPolynomial('(x+1)*(3*x-1) - (2*x-5)*(x+2)'));
