
function toJS(expr: string) {
    let s = expr.replace(/\s/g, '');
    let prev = '';
    while (s !== prev) {
       prev = s;
       s = s.replace(/([0-9])([a-zA-Z\(])/g, '$1*$2');
       s = s.replace(/([a-zA-Z])([a-zA-Z0-9\(])/g, '$1*$2');
       s = s.replace(/(\))([a-zA-Z0-9\(])/g, '$1*$2');
    }
    s = s.replace(/\^/g, '**');
    return s;
}
function getTestPoints() {
    return [
        {a: 1.1, b: 1.2, c: 1.3, m: 1.4, n: 1.5, p: 1.6, q: 1.7, x: 3.14159, y: 2.71828, z: -1.2, t: 0.5, s: -0.5, u: 2.1, v: -2.3, w: 0.8},
        {a: 2.1, b: -1.2, c: 3.3, m: -1.4, n: 2.5, p: -1.6, q: 0.7, x: -1.234, y: 5.678, z: 2.2, t: -1.5, s: 1.5, u: -2.1, v: 2.3, w: -0.9},
        {a: -1.1, b: 2.2, c: -1.3, m: 2.4, n: -1.5, p: 2.6, q: -1.7, x: 0.5, y: -0.5, z: -0.2, t: 2.5, s: -2.5, u: 1.1, v: -1.3, w: 1.8}
    ];
}
function evaluateStr(str: string, vars: Record<string, number>): number {
    const js = toJS(str);
    try {
        const varNames = Object.keys(vars);
        const varValues = Object.values(vars);
        // eslint-disable-next-line no-new-func
        const fn = new Function(...varNames, `return ${js};`);
        return fn(...varValues);
    } catch(e) {
        return NaN;
    }
}

const selectedTerms = [0, 1];
const termGroups = [{terms: [0], groupId: 'f1.num'}, {terms: [1], groupId: 'f1.den'}];

const evaluateCancel = (contents: string[], inputs: string[]) => {
       let numCount = 0;
       let denCount = 0;
       selectedTerms.forEach(idx => {
           const g = termGroups.find(g => g.terms.includes(idx))?.groupId;
           if (g && g.includes('.num')) numCount++;
           if (g && g.includes('.den')) denCount++;
       });
       if (numCount === 0 || denCount === 0 || numCount !== denCount) return false;

       // Filter out empty inputs to treat them as '1'
       const cleanInputs = inputs.map(x => x.trim() === '' ? '1' : x);

       const pts = getTestPoints();
       for (const pt of pts) {
           let firstRatio: number | null = null;
           for (let i = 0; i < contents.length; i++) {
               let vSrc = evaluateStr(contents[i], pt);
               let vDst = evaluateStr(cleanInputs[i], pt);
               
               if (isNaN(vSrc) || isNaN(vDst) || Math.abs(vDst) < 1e-9) return false;
               
               let ratio = vSrc / vDst;
               
               if (firstRatio === null) {
                    firstRatio = ratio;
               } else {
                    if (Math.abs(firstRatio - ratio) > 1e-4) return false;
               }
           }
       }
       return true;
  };
console.log(evaluateCancel(["(w-5)", "(w-5)"], ["1", "1"]));
