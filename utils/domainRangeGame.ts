import { GameMode, MathProblem, GraphParams } from '../types';

export const generateDomainRangeProblem = (mode: GameMode): MathProblem => {
  // Types: maximal_domain, range
  const problemType = mode === GameMode.YEAR12_MAXIMAL_DOMAIN ? 'maximal_domain' : 'range';
  
  const nonzeroRand = (min: number, max: number) => {
    let v = 0;
    while (v === 0) {
      v = Math.floor(Math.random() * (max - min + 1)) + min;
    }
    return v;
  };

  const randInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  let qStr = '';
  let aStr = '';
  let distractors: string[] = [];
  let graphParams: GraphParams | undefined;

  const fmtInt = (x: number) => x.toString();

  if (problemType === 'maximal_domain') {
    // Functions: sqrt, ln (log_e), 1/x (hyperbola), truncus
    const types = ['sqrt', 'log', 'hyperbola'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // a * func(b(x - h)) + k
    let a = nonzeroRand(-3, 3);
    let h = randInt(-4, 4);
    let k = randInt(-3, 3);
    let b = Math.random() < 0.5 ? 1 : -1;

    if (type === 'sqrt') {
      let inner = b === 1 ? `x${h < 0 ? '+'+(-h) : (h > 0 ? '-'+h : '')}` : `${h === 0 ? '' : h}-x`;
      qStr = `\\text{Find the maximal domain of } y = ${a === 1 ? '' : a === -1 ? '-' : a}\\sqrt{${inner}}${k > 0 ? '+'+k : k < 0 ? k : ''}`;
      
      if (b === 1) {
        aStr = `[${h}, \\infty)`;
        distractors = [`(${h}, \\infty)`, `(-\\infty, ${h}]`, `(-\\infty, ${h})`];
      } else {
        aStr = `(-\\infty, ${h}]`;
        distractors = [`(-\\infty, ${h})`, `[${h}, \\infty)`, `(${h}, \\infty)`];
      }
      
      if (b === 1) {
        graphParams = {
          type: 'sqrt',
          a: a,
          h: h,
          k: k,
        };
      }

    } else if (type === 'log') {
      let inner = b === 1 ? `x${h < 0 ? '+'+(-h) : (h > 0 ? '-'+h : '')}` : `${h === 0 ? '' : h}-x`;
      qStr = `\\text{Find the maximal domain of } y = ${a === 1 ? '' : a === -1 ? '-' : a}\\ln_e(${inner})${k > 0 ? '+'+k : k < 0 ? k : ''}`;
      
      if (b === 1) {
        aStr = `(${h}, \\infty)`;
        distractors = [`[${h}, \\infty)`, `(-\\infty, ${h})`, `(-\\infty, ${h}]`];
      } else {
        aStr = `(-\\infty, ${h})`;
        distractors = [`(-\\infty, ${h}]`, `(${h}, \\infty)`, `[${h}, \\infty)`];
      }
      graphParams = undefined;

    } else if (type === 'hyperbola') {
      qStr = `\\text{Find the maximal domain of } y = \\frac{${a}}{x${h < 0 ? '+'+(-h) : (h > 0 ? '-'+h : '')}}${k > 0 ? '+'+k : k < 0 ? k : ''}`;
      aStr = `\\mathbb{R} \\setminus \\{${h}\\}`;
      distractors = [`\\mathbb{R} \\setminus \\{${-h}\\}`, `\\mathbb{R} \\setminus \\{0\\}`, `(${h}, \\infty)`];
      graphParams = {
        type: 'hyperbola', a, h, k
      };
    }
  } else {
    // type === 'range'
    const types: ('quadratic' | 'linear')[] = ['quadratic', 'linear'];
    const type = types[Math.floor(Math.random() * types.length)];

    let h = randInt(-2, 2);
    let k = randInt(-2, 2);
    let a = Math.random() < 0.5 ? 1 : -1;
    if (Math.random() < 0.2) a = Math.random() < 0.5 ? 2 : -2;

    let startX: number | null = null;
    let endX: number | null = null;
    let startOpen = false;
    let endOpen = false;

    if (type === 'linear') {
       startX = randInt(-4, h - 1);
       endX = randInt(h + 1, 4);
       startOpen = Math.random() < 0.5;
       endOpen = Math.random() < 0.5;

       let y1 = a * (startX - h) + k;
       let y2 = a * (endX - h) + k;

       let minY = Math.min(y1, y2);
       let maxY = Math.max(y1, y2);
       let minOpen = y1 < y2 ? startOpen : endOpen;
       let maxOpen = y1 > y2 ? startOpen : endOpen;

       aStr = `${minOpen ? '(' : '['}${minY}, ${maxY}${maxOpen ? ')' : ']'}`;
       
       distractors = [
         `${!minOpen ? '(' : '['}${minY}, ${maxY}${maxOpen ? ')' : ']'}`,
         `${minOpen ? '(' : '['}${minY}, ${maxY}${!maxOpen ? ')' : ']'}`,
         `${!minOpen ? '(' : '['}${minY}, ${maxY}${!maxOpen ? ')' : ']'}`
       ];
       qStr = `\\text{Find the range of the restricted function.}`;

    } else { // quadratic
       let tpInside = Math.random() < 0.7;
       if (tpInside) {
         startX = randInt(-4, h - 1);
         endX = randInt(h + 1, 4);
       } else {
         if (Math.random() < 0.5) {
           startX = h + 1;
           endX = h + 3;
         } else {
           startX = h - 3;
           endX = h - 1;
         }
       }
       startOpen = Math.random() < 0.5;
       endOpen = Math.random() < 0.5;

       let y1 = a * Math.pow(startX - h, 2) + k;
       let y2 = a * Math.pow(endX - h, 2) + k;

       let minY: number, maxY: number;
       let minOpen: boolean, maxOpen: boolean;

       if (tpInside) {
         if (a > 0) {
           minY = k;
           minOpen = false;
           maxY = Math.max(y1, y2);
           maxOpen = y1 > y2 ? startOpen : (y2 > y1 ? endOpen : (startOpen && endOpen)); // if y1 == y2
           if (y1 === y2) maxOpen = startOpen || endOpen; // If either is open, is the max open? No, it's open only if both are open actually. Wait, if y1=y2, the max value is achieved twice. So it is included if AT LEAST ONE is closed! So it's open if BOTH are open.
           if (y1 === y2) maxOpen = startOpen && endOpen;
         } else {
           maxY = k;
           maxOpen = false;
           minY = Math.min(y1, y2);
           minOpen = y1 < y2 ? startOpen : (y2 < y1 ? endOpen : (startOpen && endOpen));
           if (y1 === y2) minOpen = startOpen && endOpen;
         }
       } else {
         minY = Math.min(y1, y2);
         maxY = Math.max(y1, y2);
         minOpen = y1 < y2 ? startOpen : endOpen;
         maxOpen = y1 > y2 ? startOpen : endOpen;
       }

       aStr = `${minOpen ? '(' : '['}${minY}, ${maxY}${maxOpen ? ')' : ']'}`;

       let falseMinOpen = !minOpen;
       let falseMaxOpen = !maxOpen;

       let d1 = `${falseMinOpen ? '(' : '['}${minY}, ${maxY}${maxOpen ? ')' : ']'}`;
       let d2 = `${minOpen ? '(' : '['}${minY}, ${maxY}${falseMaxOpen ? ')' : ']'}`;
       let d3 = `${falseMinOpen ? '(' : '['}${minY}, ${maxY}${falseMaxOpen ? ')' : ']'}`;

       let fakeMinY = Math.min(y1, y2);
       let fakeMaxY = Math.max(y1, y2);
       let fakeMinOpen = y1 < y2 ? startOpen : endOpen;
       let fakeMaxOpen = y1 > y2 ? startOpen : endOpen;
       let d4 = `${fakeMinOpen ? '(' : '['}${fakeMinY}, ${fakeMaxY}${fakeMaxOpen ? ')' : ']'}`;

       distractors = [d1, d2, d3];
       if (tpInside && d4 !== aStr && !distractors.includes(d4)) distractors[2] = d4;

       qStr = `\\text{Find the range of } y = ${a === 1 ? '' : a === -1 ? '-' : a}(x${h < 0 ? '+'+(-h) : (h > 0 ? '-'+h : '')})^2${k > 0 ? '+'+k : k < 0 ? k : ''}`;
       
       let domainStr = `${startOpen ? '(' : '['}${startX}, ${endX}${endOpen ? ')' : ']'}`;
       qStr += ` \\text{ on domain } ${domainStr}`;
    }

    graphParams = {
      type, a, h, k,
      domainContext: {
        type: 'range',
        startX, endX, startOpen, endOpen
      }
    };
  }

  let options = [aStr, ...distractors];
  let uniqueOptions = Array.from(new Set(options));
  
  let fallbackIndex = uniqueOptions.length;
  while(uniqueOptions.length < 4) {
      if (!uniqueOptions.includes(`(${fallbackIndex}, ${fallbackIndex+2})`)) {
          uniqueOptions.push(`(${fallbackIndex}, ${fallbackIndex+2})`);
      }
      fallbackIndex++;
  }

  // Shuffle
  for (let i = uniqueOptions.length - 1; i > 0; i--) {
     const j = Math.floor(Math.random() * (i + 1));
     [uniqueOptions[i], uniqueOptions[j]] = [uniqueOptions[j], uniqueOptions[i]];
  }

  return {
    question: qStr,
    answer: uniqueOptions.indexOf(aStr).toString(),
    options: uniqueOptions,
    graph: graphParams,
    type: 'algebra',
    mode: mode
  };
};
