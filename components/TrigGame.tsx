import React from 'react';
import Latex from 'react-latex-next';
import { MathProblem } from '../types';

interface TrigGameProps {
  problem: MathProblem;
  onAnswer: (val: string) => void;
  isSuccess: boolean;
  isInverse?: boolean;
  showingAnswer?: boolean;
  correctAnswer?: string;
}

const TrigGame: React.FC<TrigGameProps> = ({ problem, onAnswer, isSuccess, isInverse, showingAnswer, correctAnswer }) => {
  // Flattened options for grid layout
  // Row 1: 0, 1/2, 1/sqrt(3), sqrt(2)/2, sqrt(3)/2, 1, sqrt(3)
  // Row 2: Undefined, -1/2, -1/sqrt(3), -sqrt(2)/2, -sqrt(3)/2, -1, -sqrt(3)
  const regularOptions = [
    '0', '\\frac{1}{2}', '\\frac{1}{\\sqrt{3}}', '\\frac{\\sqrt{2}}{2}', '\\frac{\\sqrt{3}}{2}', '1', '\\sqrt{3}',
    'Undefined', '-\\frac{1}{2}', '-\\frac{1}{\\sqrt{3}}', '-\\frac{\\sqrt{2}}{2}', '-\\frac{\\sqrt{3}}{2}', '-1', '-\\sqrt{3}'
  ];

  const inverseOptions = [
    '0', '\\frac{\\pi}{6}', '\\frac{\\pi}{4}', '\\frac{\\pi}{3}', '\\frac{\\pi}{2}', '\\frac{2\\pi}{3}', '\\frac{3\\pi}{4}', '\\frac{5\\pi}{6}', '\\pi',
    'Undefined', '-\\frac{\\pi}{6}', '-\\frac{\\pi}{4}', '-\\frac{\\pi}{3}', '-\\frac{\\pi}{2}', '-\\frac{2\\pi}{3}', '-\\frac{3\\pi}{4}', '-\\frac{5\\pi}{6}', '-\\pi'
  ];

  const options = isInverse ? inverseOptions : regularOptions;

  // Unit Circle Visualization
  const renderUnitCircle = () => {
    const radius = 80;
    const center = 100;
    
    // Calculate position of the point
    // problem.angle is in radians
    // SVG coordinate system: y increases downwards.
    // Math: x = r cos(theta), y = r sin(theta) (y increases upwards)
    // SVG: cx + r cos(theta), cy - r sin(theta)
    
    const angle = problem.angle || 0;
    const x = center + radius * Math.cos(angle);
    const y = center - radius * Math.sin(angle);

    return (
      <div className="flex flex-col items-center">
        <svg width="200" height="200" className="mx-auto mb-6 overflow-visible">
          {/* Circle */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-slate-600" />
          {/* Axes */}
          <line x1={center - radius - 20} y1={center} x2={center + radius + 20} y2={center} stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-slate-600" />
          <line x1={center} y1={center - radius - 20} x2={center} y2={center + radius + 20} stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-slate-600" />
          
          {/* Angle Ray and Point - Only show if success */}
          {isSuccess && (
            <>
              <line x1={center} y1={center} x2={x} y2={y} stroke="#6366f1" strokeWidth="3" />
              <circle cx={x} cy={y} r="6" fill="#6366f1" />
            </>
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
      {renderUnitCircle()}
      
      <div className={`grid ${isInverse ? 'grid-cols-9' : 'grid-cols-7'} gap-2 sm:gap-3 w-full`}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onAnswer(opt)}
            disabled={showingAnswer}
            className={`aspect-[4/3] p-1 sm:p-2 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 border text-sm sm:text-xl font-bold whitespace-nowrap flex items-center justify-center
              ${showingAnswer && opt === correctAnswer 
                ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-800' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700'
              }
              ${showingAnswer && opt !== correctAnswer ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
             {opt === 'Undefined' ? (
               <span className="text-[10px] sm:text-sm font-bold uppercase tracking-wider">Undef</span>
             ) : (
               <Latex>{`$${opt}$`}</Latex>
             )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrigGame;
