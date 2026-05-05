import * as math from 'mathjs';

function isSingleTerm(node: any): boolean {
    let hasAddSub = false;
    node.traverse(function(child: any) {
        if (child.isOperatorNode && (child.op === '+' || child.op === '-')) {
            if (child.fn !== 'unaryMinus' && child.fn !== 'unaryPlus') {
                hasAddSub = true;
            }
        }
    });
    return !hasAddSub;
}

export function expandPolynomial(exprStr: string): string {
    const node = math.parse(exprStr);
    
    function expand(node: any): any {
        if (node.isParenthesisNode) return expand(node.content);
        if (node.isOperatorNode) {
            if (node.op === '+' || node.op === '-') {
                if (node.fn === 'unaryMinus' || node.fn === 'unaryPlus') {
                    // pass unary minus down into terms
                    let inner = expand(node.args[0]);
                    let terms = getTerms(inner, node.op === '-' ? '-' : '+');
                    return buildFromTerms(terms);
                }
                return new math.OperatorNode(node.op, node.fn, [expand(node.args[0]), expand(node.args[1])]);
            }
            if (node.op === '*') {
                let left = expand(node.args[0]);
                let right = expand(node.args[1]);
                
                let leftTerms = getTerms(left);
                let rightTerms = getTerms(right);
                
                if (leftTerms.length > 1 || rightTerms.length > 1) {
                    let resultTerms: any[] = [];
                    for (let l of leftTerms) {
                        for (let r of rightTerms) {
                            let sign1 = l.sign;
                            let sign2 = r.sign;
                            let finalSign = sign1 === sign2 ? '+' : '-';
                            let mul = new math.OperatorNode('*', 'multiply', [l.node, r.node]);
                            let simMul = math.simplify(mul);
                            
                            let combined = false;
                            for (let i = 0; i < resultTerms.length; i++) {
                                let existing = resultTerms[i];
                                let sumStr = (existing.sign === '+' ? '' : '-') + existing.node.toString() + (finalSign === '+' ? ' + ' : ' - ') + simMul.toString();
                                let sim = math.simplify(sumStr);
                                if (isSingleTerm(sim)) {
                                    if (sim.isConstantNode && sim.value === 0) {
                                        resultTerms.splice(i, 1);
                                    } else {
                                        let newSign = '+';
                                        let newNode = sim;
                                        if (sim.isOperatorNode && sim.op === '-' && sim.fn === 'unaryMinus') {
                                            newSign = '-';
                                            newNode = sim.args[0];
                                        } else if (sim.isConstantNode && sim.value < 0) {
                                            newSign = '-';
                                            newNode = new math.ConstantNode(Math.abs(sim.value));
                                        }
                                        resultTerms[i] = { sign: newSign, node: newNode };
                                    }
                                    combined = true;
                                    break;
                                }
                            }
                            if (!combined) {
                                resultTerms.push({ sign: finalSign, node: simMul });
                            }
                        }
                    }
                    if (resultTerms.length === 0) return new math.ConstantNode(0);
                    return buildFromTerms(resultTerms);
                }
                return new math.OperatorNode('*', 'multiply', [left, right]);
            }
        }
        return node;
    }
    
    function getTerms(node: any, currentSign = '+'): any[] {
        if (node.isOperatorNode && node.op === '+') {
            return [...getTerms(node.args[0], currentSign), ...getTerms(node.args[1], currentSign)];
        } else if (node.isOperatorNode && node.op === '-') {
            if (node.fn === 'unaryMinus') {
                return getTerms(node.args[0], currentSign === '+' ? '-' : '+');
            }
            return [...getTerms(node.args[0], currentSign), ...getTerms(node.args[1], currentSign === '+' ? '-' : '+')];
        }
        return [{ sign: currentSign, node: node }];
    }
    
    function buildFromTerms(terms: any[]): any {
        if (terms.length === 0) return new math.ConstantNode(0);
        let root = terms[0].sign === '-' ? new math.OperatorNode('-', 'unaryMinus', [terms[0].node]) : terms[0].node;
        for (let i = 1; i < terms.length; i++) {
            root = new math.OperatorNode(terms[i].sign, terms[i].sign === '+' ? 'add' : 'subtract', [root, terms[i].node]);
        }
        return root;
    }
    
    let expanded = expand(node);
    
    let finalTerms = getTerms(expanded);
    let finalSimplified = finalTerms.map(t => {
        let simNode = math.simplify(t.node);
        return { sign: t.sign, node: simNode };
    });
    
    let res = buildFromTerms(finalSimplified);
    return res.toString();
}

// For tests:
// console.log(expandPolynomial('(x+2)*(x+3)'));
// console.log(expandPolynomial('2*x*(x-5)'));
// console.log(expandPolynomial('(x+1)*(x+4) + (x-1)*(x+1)'));
// console.log(expandPolynomial('(x+1)*(3*x-1) - (2*x-5)*(x+2)'));

