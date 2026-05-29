import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import katex from 'katex';

interface QuadraticProblem {
  a: number;
  b: number;
  c: number;
  discriminant: number;
  equation: string;
}

const generateProblem = (): QuadraticProblem => {
  let a = Math.floor(Math.random() * 5) + 1; // 1 to 5
  if (Math.random() > 0.5) a = -a;
  
  let b = Math.floor(Math.random() * 10) - 5; // -5 to 5
  if (b === 0) b = 2; 
  
  let c = Math.floor(Math.random() * 20) - 10; // -10 to 10
  if (c === 0) c = 3;

  const discriminant = b * b - 4 * a * c;
  
  const aStr = a === 1 ? 'x^2' : a === -1 ? '-x^2' : `${a}x^2`;
  const bStr = b === 1 ? '+ x' : b === -1 ? '- x' : b > 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`;
  const cStr = c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
  const equation = `${aStr} ${bStr} ${cStr} = 0`;

  return { a, b, c, discriminant, equation };
}

const parseAndEvaluate = (expr: string): number | null => {
  try {
    let cleanStr = expr.toLowerCase().replace(/x/gi, '*').replace(/\^/g, '**');
    // Replace roots: e.g. "2r5" -> "2*Math.sqrt(5)"
    cleanStr = cleanStr.replace(/(^|[^a-z0-9])[r√](\d+)/g, '$1Math.sqrt($2)');
    cleanStr = cleanStr.replace(/([0-9]+)[r√](\d+)/g, '$1*Math.sqrt($2)');
    cleanStr = cleanStr.replace(/sqrt\(/g, 'Math.sqrt(');
    
    // allow some spacing and math symbols, including Math.sqrt
    cleanStr = cleanStr.replace(/[^\d\+\-\*\/\(\)\.\sMathsqrt]/g, '');
    if (!cleanStr.trim()) return null;
    const result = new Function(`return ${cleanStr}`)();
    return typeof result === 'number' && !isNaN(result) ? result : null;
  } catch (e) {
    return null;
  }
}

export default function QuadraticFormula() {
  const navigate = useNavigate();
  const [problem, setProblem] = useState<QuadraticProblem>(generateProblem());
  
  // Stages
  // 0: Substitute Discriminant
  // 1: Simplify Discriminant Line by Line
  // 2: Choose Number of Solutions
  // 3: Substitute Quadratic Formula
  // 4: Simplify Formula Parts
  // 5: Simplify Roots & Finalize
  // 6: No Real Solutions
  const [stage, setStage] = useState(0);

  // Stage 0 inputs
  const [bInput, setBInput] = useState('');
  const [aInput, setAInput] = useState('');
  const [cInput, setCInput] = useState('');

  // Stage 1 working
  const [workingLines, setWorkingLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState('');
  const [lineError, setLineError] = useState(false);

  // Stage 3 inputs
  const [negBInput, setNegBInput] = useState('');
  const [deltaInput, setDeltaInput] = useState('');
  const [twoAInput, setTwoAInput] = useState('');

  // Stage 4 inputs
  const [evalNegB, setEvalNegB] = useState('');
  const [evalSqrtDelta, setEvalSqrtDelta] = useState('');
  const [evalTwoA, setEvalTwoA] = useState('');

  // Refs for auto-focus
  const inputA = useRef<HTMLInputElement>(null);
  const inputC = useRef<HTMLInputElement>(null);
  const currentWorkingInput = useRef<HTMLInputElement>(null);
  const rootDeltaInput = useRef<HTMLInputElement>(null);
  const rootAInput = useRef<HTMLInputElement>(null);
  const evalSqrtDeltaRef = useRef<HTMLInputElement>(null);
  const evalTwoARef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stage === 1 && currentWorkingInput.current) {
        currentWorkingInput.current.focus();
    }
  }, [stage, workingLines]);

  const handleStage0Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      parseInt(bInput) === problem.b &&
      parseInt(aInput) === problem.a &&
      parseInt(cInput) === problem.c
    ) {
      setStage(1);
    }
  };

  const handleStage1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseAndEvaluate(currentLine);
    if (val === problem.discriminant) {
      setWorkingLines([...workingLines, currentLine, val.toString()]);
      setCurrentLine('');
      setLineError(false);
      
      setTimeout(() => {
          setStage(2);
      }, 500);
    } else if (val !== null) {
      // It's a valid number but check if it's equal to discriminant.
      // E.g. b^2 - 4ac. Maybe they typed 9 - -40 which evaluates to 49.
      // We accept any evaluation that matches.
      // Wait, we only accept if it matches problem.discriminant exactly.
      // What if they are just doing `(-3)^2 - 4(1)(-10)`? That evaluates to 49.
      // Any mathematically correct equivalence will evaluate to discriminant!
      if (val === problem.discriminant) {
          // Wait, this was checked above
      } else {
         setLineError(true);
         setTimeout(() => setLineError(false), 500);
      }
    } else {
        // Evaluate failed or incomplete string
        setLineError(true);
        setTimeout(() => setLineError(false), 500);
    }
  };

  const handleLineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentLine(e.target.value);
      // If they typed the exact final answer, auto submit
      if (e.target.value.trim() === problem.discriminant.toString()) {
          setWorkingLines([...workingLines, e.target.value.trim()]);
          setCurrentLine('');
          setLineError(false);
          setTimeout(() => {
            setStage(2);
          }, 500);
      }
  };

  const handleStage2Choice = (choice: number) => {
      const isCorrect = 
          (problem.discriminant > 0 && choice === 2) ||
          (problem.discriminant === 0 && choice === 1) ||
          (problem.discriminant < 0 && choice === 0);
      
      if (isCorrect) {
          if (choice === 0) {
              setStage(6); // End state for no real roots
          } else {
              setStage(3);
          }
      }
  };

  const handleStage3Submit = (e: React.FormEvent) => {
      e.preventDefault();
      if (
          parseInt(negBInput) === problem.b &&
          parseInt(deltaInput) === problem.discriminant &&
          parseInt(twoAInput) === problem.a
      ) {
          const root = Math.sqrt(problem.discriminant);
          if (!Number.isInteger(root)) {
              setEvalSqrtDelta('√');
          }
          setStage(4);
      }
  };

  const handleStage4Submit = (e: React.FormEvent) => {
      e.preventDefault();
      const negBCompleted = parseInt(evalNegB) === -problem.b;
      const twoACompleted = parseInt(evalTwoA) === 2 * problem.a;
      
      const sdVal = parseAndEvaluate(evalSqrtDelta);
      let sqrtDeltaCompleted = false;
      if (sdVal !== null && Math.abs(sdVal - Math.sqrt(problem.discriminant)) < 0.0001) {
          sqrtDeltaCompleted = true;
      }

      if (negBCompleted && twoACompleted && sqrtDeltaCompleted) {
          setStage(5);
      }
  };

  const nextProblem = () => {
      setProblem(generateProblem());
      setStage(0);
      setBInput(''); setAInput(''); setCInput('');
      setWorkingLines([]); setCurrentLine('');
      setNegBInput(''); setDeltaInput(''); setTwoAInput('');
      setEvalNegB(''); setEvalSqrtDelta(''); setEvalTwoA('');
  };

  const renderKatex = (math: string) => {
    return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(math, { throwOnError: false }) }} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-8 flex flex-col items-center font-sans transition-colors">
      <div className="w-full max-w-3xl">
        <button 
          onClick={() => navigate('/8seal')}
          className="mb-8 px-4 py-2 bg-white dark:bg-slate-800 rounded shadow hover:shadow-md transition-all font-bold text-sm tracking-wider uppercase text-slate-500 dark:text-slate-400"
        >
          &larr; Back
        </button>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl flex flex-col items-center">
            <h1 className="text-2xl font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Quadratic Formula</h1>
            
            <div className="text-4xl sm:text-5xl font-black mb-12 text-indigo-600 dark:text-indigo-400">
                {renderKatex(problem.equation)}
            </div>

            {/* Stage 0 & 1: Discriminant */}
            <div className="w-full max-w-lg mb-8">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Step 1: Discriminant (\Delta = b^2 - 4ac)</div>
                {stage < 2 ? (
                    <>
                        <form onSubmit={handleStage0Submit} className="flex items-center justify-center space-x-2 text-3xl font-black">
                            <span className="text-slate-400 mr-2">Δ = </span>
                            <span className="text-slate-300">(</span>
                            <input 
                                className={`w-16 text-center bg-slate-100 dark:bg-slate-700 border-b-4 ${stage > 0 ? 'border-emerald-500 text-emerald-500' : 'border-slate-300 dark:border-slate-600'} outline-none rounded-t-lg mx-1`}
                                value={stage > 0 ? problem.b : bInput}
                                onChange={e => { setBInput(e.target.value); if(e.target.value === problem.b.toString()) inputA.current?.focus() }}
                                disabled={stage > 0}
                                placeholder="b"
                                autoFocus
                            />
                            <span className="text-slate-300">)</span>
                            <span>²</span>
                            <span className="mx-2 text-slate-400">-</span>
                            <span className="text-slate-400">4</span>
                            <span className="text-slate-300">(</span>
                            <input 
                                ref={inputA}
                                className={`w-16 text-center bg-slate-100 dark:bg-slate-700 border-b-4 ${stage > 0 ? 'border-emerald-500 text-emerald-500' : 'border-slate-300 dark:border-slate-600'} outline-none rounded-t-lg mx-1`}
                                value={stage > 0 ? problem.a : aInput}
                                onChange={e => { setAInput(e.target.value); if(e.target.value === problem.a.toString()) inputC.current?.focus() }}
                                disabled={stage > 0}
                                placeholder="a"
                            />
                            <span className="text-slate-300">)(</span>
                            <input 
                                ref={inputC}
                                className={`w-16 text-center bg-slate-100 dark:bg-slate-700 border-b-4 ${stage > 0 ? 'border-emerald-500 text-emerald-500' : 'border-slate-300 dark:border-slate-600'} outline-none rounded-t-lg mx-1`}
                                value={stage > 0 ? problem.c : cInput}
                                onChange={e => { setCInput(e.target.value); }}
                                disabled={stage > 0}
                                placeholder="c"
                            />
                            <span className="text-slate-300">)</span>
                            
                            {stage === 0 && (
                                <button type="submit" className="ml-4 opacity-0 w-0 h-0 p-0 m-0 overflow-hidden">Submit</button>
                            )}
                        </form>

                        {/* Stage 1: Working Lines */}
                        {stage >= 1 && (
                            <div className="mt-6 flex flex-col items-center space-y-3 pb-8 border-b-2 border-slate-100 dark:border-slate-700">
                                {workingLines.map((line, i) => (
                                    <div key={i} className="text-3xl font-black text-slate-600 dark:text-slate-300 flex items-center">
                                        <span className="text-slate-300 dark:text-slate-600 mr-4">=</span> {line}
                                    </div>
                                ))}
                                {stage === 1 && (
                                    <form onSubmit={handleStage1Submit} className="flex items-center">
                                        <span className="text-slate-300 dark:text-slate-600 mr-4 text-3xl font-black">=</span>
                                        <input 
                                            ref={currentWorkingInput}
                                            className={`w-48 text-center text-3xl font-black bg-slate-100 dark:bg-slate-700 border-b-4 ${lineError ? 'border-rose-500 text-rose-500 animate-shake' : 'border-indigo-400 text-indigo-600 dark:text-indigo-400'} outline-none rounded-t-lg px-2 py-1 transition-colors`}
                                            value={currentLine}
                                            onChange={handleLineChange}
                                            placeholder="simplify..."
                                        />
                                    </form>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center space-x-2 text-3xl font-black">
                        <span className="text-slate-400 mr-2">Δ = </span>
                        <span className="text-indigo-600 dark:text-indigo-400">{problem.discriminant}</span>
                    </div>
                )}
            </div>

            {/* Stage 2: Number of Solutions */}
            {stage >= 2 && (
                <div className="w-full max-w-lg mb-8 animate-fade-in">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Step 2: Number of Solutions</div>
                    
                    {stage === 2 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button onClick={() => handleStage2Choice(2)} className="py-4 bg-white dark:bg-slate-800 border-4 border-slate-200 dark:border-slate-700 rounded-2xl font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all active:scale-95">Two Real</button>
                            <button onClick={() => handleStage2Choice(1)} className="py-4 bg-white dark:bg-slate-800 border-4 border-slate-200 dark:border-slate-700 rounded-2xl font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all active:scale-95">One Real</button>
                            <button onClick={() => handleStage2Choice(0)} className="py-4 bg-white dark:bg-slate-800 border-4 border-slate-200 dark:border-slate-700 rounded-2xl font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all active:scale-95">None</button>
                        </div>
                    )}
                    
                    {stage >= 3 && (
                        <div className="text-center font-black text-xl text-emerald-500 uppercase tracking-widest">
                            {problem.discriminant > 0 ? "Two Real Solutions" : problem.discriminant === 0 ? "One Real Solution" : "No Real Solutions"}
                        </div>
                    )}
                </div>
            )}

            {/* Stage 3: Formula */}
            {stage >= 3 && stage !== 6 && (
                <div className="w-full max-w-lg animate-fade-in border-t-2 border-slate-100 dark:border-slate-700 pt-8">
                     <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Step 3: Quadratic Formula</div>
                     {stage === 3 ? (
                         <form onSubmit={handleStage3Submit} className="flex flex-col items-center justify-center text-3xl font-black">
                             <div className="flex items-center space-x-2">
                                 <span className="text-slate-400 mr-4">x = </span>
                                 <div className="flex flex-col items-center">
                                     <div className="flex items-center pb-2 border-b-4 border-slate-800 dark:border-slate-200 w-full justify-center space-x-2 px-4">
                                         <span className="text-slate-400">-</span>
                                         <span className="text-slate-300">(</span>
                                         <input 
                                             className={`w-16 text-center bg-slate-100 dark:bg-slate-700 border-b-4 ${stage > 3 ? 'border-emerald-500 text-emerald-500' : 'border-slate-300 dark:border-slate-600'} outline-none rounded-t-lg mx-1`}
                                             value={stage > 3 ? problem.b : negBInput}
                                             onChange={e => { setNegBInput(e.target.value); if(e.target.value === problem.b.toString()) rootDeltaInput.current?.focus() }}
                                             disabled={stage > 3}
                                             placeholder="b"
                                             autoFocus
                                         />
                                         <span className="text-slate-300">)</span>
                                         <span className="text-slate-400 mx-2 text-2xl font-serif leading-none mt-1">±</span>
                                         <span className="text-slate-400 mr-1 text-4xl leading-none mt-2">√</span>
                                         <input 
                                             ref={rootDeltaInput}
                                             className={`w-20 text-center bg-slate-100 dark:bg-slate-700 border-b-4 border-t-4 border-t-slate-800 dark:border-t-slate-200 mt-2 ${stage > 3 ? 'border-b-emerald-500 text-emerald-500' : 'border-b-slate-300 dark:border-b-slate-600'} outline-none rounded-tr-lg`}
                                             value={stage > 3 ? problem.discriminant : deltaInput}
                                             onChange={e => { setDeltaInput(e.target.value); if(e.target.value === problem.discriminant.toString()) rootAInput.current?.focus() }}
                                             disabled={stage > 3}
                                             placeholder="Δ"
                                         />
                                     </div>
                                     <div className="flex items-center space-x-1 pt-2">
                                        <span className="text-slate-400">2</span>
                                        <span className="text-slate-300">(</span>
                                        <input 
                                             ref={rootAInput}
                                             className={`w-16 text-center bg-slate-100 dark:bg-slate-700 border-b-4 ${stage > 3 ? 'border-emerald-500 text-emerald-500' : 'border-slate-300 dark:border-slate-600'} outline-none rounded-t-lg mx-1`}
                                             value={stage > 3 ? problem.a : twoAInput}
                                             onChange={e => { setTwoAInput(e.target.value); }}
                                             disabled={stage > 3}
                                             placeholder="a"
                                         />
                                         <span className="text-slate-300">)</span>
                                     </div>
                                 </div>
                             </div>
                             <button type="submit" className="mt-8 px-8 py-3 bg-indigo-500 text-white rounded-full font-bold uppercase tracking-widest shadow-lg hover:bg-indigo-600 hover:scale-105 transition-all">Check</button>
                         </form>
                     ) : (
                         <div className="flex flex-col items-center justify-center text-3xl font-black">
                             <div className="flex items-center space-x-2 opacity-60">
                                 <span className="text-slate-400 mr-4">x = </span>
                                 <div className="flex flex-col items-center">
                                     <div className="flex items-center pb-2 border-b-4 border-slate-800 dark:border-slate-200 w-full justify-center space-x-2 px-4">
                                         <span className="text-slate-400">-</span>
                                         <span className="text-slate-500">({problem.b})</span>
                                         <span className="text-slate-400 mx-2 text-2xl font-serif leading-none mt-1">±</span>
                                         <span className="text-slate-400 mr-1 text-4xl leading-none mt-2">√</span>
                                         <span className="text-slate-500">{problem.discriminant}</span>
                                     </div>
                                     <div className="flex items-center space-x-1 pt-2">
                                        <span className="text-slate-400">2({problem.a})</span>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}
                </div>
            )}

            {/* Stage 4: Simplify Parts */}
            {stage >= 4 && stage !== 6 && (
                <div className="w-full max-w-lg mb-8 animate-fade-in border-t-2 border-slate-100 dark:border-slate-700 pt-8 mt-4">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Step 4: Simplify Parts</div>
                    {stage === 4 ? (
                        <form onSubmit={handleStage4Submit} className="flex flex-col items-center justify-center text-3xl font-black">
                             <div className="flex items-center space-x-2 mt-2">
                                 <span className="text-slate-400 mr-4">x = </span>
                                 <div className="flex flex-col items-center">
                                     <div className="flex items-center pb-2 border-b-4 border-slate-800 dark:border-slate-200 w-full justify-center space-x-2 px-4">
                                         <input 
                                             className="w-20 text-center bg-slate-100 dark:bg-slate-700 border-b-4 border-indigo-400 text-indigo-600 dark:text-indigo-400 outline-none rounded-t-lg mx-1 py-1"
                                             value={evalNegB}
                                             onChange={e => { setEvalNegB(e.target.value); if (parseInt(e.target.value) === -problem.b) evalSqrtDeltaRef.current?.focus() }}
                                             placeholder="-b"
                                             autoFocus
                                         />
                                         <span className="text-slate-400 mx-2 text-2xl font-serif leading-none mt-1">±</span>
                                         <input 
                                             ref={evalSqrtDeltaRef}
                                             className="w-24 text-center bg-slate-100 dark:bg-slate-700 border-b-4 border-emerald-400 text-emerald-600 dark:text-emerald-400 outline-none rounded-t-lg mx-1 py-1"
                                             value={evalSqrtDelta}
                                             onChange={e => { 
                                                const val = e.target.value.replace(/r/i, '√').replace(/sqrt/i, '√');
                                                setEvalSqrtDelta(val); 
                                                const sdVal = parseAndEvaluate(val);
                                                if (sdVal !== null && Math.abs(sdVal - Math.sqrt(problem.discriminant)) < 0.0001) evalTwoARef.current?.focus();
                                             }}
                                             placeholder={`√Δ`}
                                         />
                                     </div>
                                     <div className="flex items-center space-x-1 pt-2 w-full justify-center">
                                         <input 
                                             ref={evalTwoARef}
                                             className="w-20 text-center bg-slate-100 dark:bg-slate-700 border-b-4 border-rose-400 text-rose-600 dark:text-rose-400 outline-none rounded-t-lg mx-1 py-1"
                                             value={evalTwoA}
                                             onChange={e => { setEvalTwoA(e.target.value); }}
                                             placeholder="2a"
                                         />
                                     </div>
                                 </div>
                             </div>
                             <button type="submit" className="mt-8 px-8 py-3 bg-indigo-500 text-white rounded-full font-bold uppercase tracking-widest shadow-lg hover:bg-indigo-600 hover:scale-105 transition-all">Check</button>
                        </form>
                    ) : (
                         <div className="flex flex-col items-center justify-center text-3xl font-black">
                             <div className="flex items-center space-x-2 opacity-80 mt-2">
                                 <span className="text-slate-400 mr-4">x = </span>
                                 <div className="flex flex-col items-center">
                                     <div className="flex items-center pb-2 border-b-4 border-slate-800 dark:border-slate-200 w-full justify-center space-x-2 px-4">
                                         <span className="text-indigo-600 dark:text-indigo-400">{evalNegB}</span>
                                         <span className="text-slate-400 mx-2 text-2xl font-serif leading-none mt-1">±</span>
                                         <span className="text-emerald-600 dark:text-emerald-400">{evalSqrtDelta}</span>
                                     </div>
                                     <div className="flex items-center justify-center pt-2 w-full">
                                        <span className="text-rose-600 dark:text-rose-400">{evalTwoA}</span>
                                     </div>
                                 </div>
                             </div>
                         </div>
                    )}
                </div>
            )}

            {/* Stage 5: Final Answers */}
            {stage === 5 && (
                <div className="w-full max-w-lg mt-8 animate-fade-in text-center flex flex-col items-center border-t-2 border-slate-100 dark:border-slate-700 pt-8">
                     <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Step 5: Evaluate & Simplify</div>
                     
                     <div className="flex flex-col space-y-4 mb-8 w-full">
                        <div className="flex items-center justify-center space-x-4">
                            <span className="text-3xl font-black text-slate-600 dark:text-slate-300">x₁ =</span>
                            <input 
                                className="w-32 text-center text-3xl font-black bg-slate-100 dark:bg-slate-700 border-b-4 border-indigo-400 text-indigo-600 dark:text-indigo-400 outline-none rounded-t-lg px-2 py-1"
                                placeholder="root 1"
                            />
                        </div>
                        {problem.discriminant > 0 && (
                            <div className="flex items-center justify-center space-x-4">
                                <span className="text-3xl font-black text-slate-600 dark:text-slate-300">x₂ =</span>
                                <input 
                                    className="w-32 text-center text-3xl font-black bg-slate-100 dark:bg-slate-700 border-b-4 border-indigo-400 text-indigo-600 dark:text-indigo-400 outline-none rounded-t-lg px-2 py-1"
                                    placeholder="root 2"
                                />
                            </div>
                        )}
                     </div>

                     <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-3xl border-2 border-indigo-200 dark:border-indigo-800 font-bold text-lg mb-8">
                         (Draft: Final answers can be typed above as fractions or exact values)
                     </div>
                     <button onClick={nextProblem} className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 hover:-translate-y-1 transition-all">Next Problem</button>
                </div>
            )}

            {/* Stage 6: No real roots completion */}
            {stage === 6 && (
                 <div className="w-full max-w-lg mt-12 animate-fade-in text-center flex flex-col items-center">
                     <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-3xl border-2 border-emerald-200 dark:border-emerald-800 font-bold text-lg mb-8">
                         Correct! Since Δ &lt; 0, there are no real solutions!
                     </div>
                     <button onClick={nextProblem} className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">Next Problem</button>
                 </div>
            )}

        </div>
      </div>
    </div>
  );
}
