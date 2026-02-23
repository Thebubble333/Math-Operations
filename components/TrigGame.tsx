import React from 'react';
import Latex from 'react-latex-next';
import { MathProblem } from '../types';

interface TrigGameProps {
  problem: MathProblem;
  onAnswer: (val: string) => void;
  isSuccess: boolean;
}

const TrigGame: React.FC<TrigGameProps> = ({ problem, onAnswer, isSuccess }) => {
  // Flattened options for grid layout
  // Row 1: 0, 1/2, 1/sqrt(3), sqrt(2)/2, sqrt(3)/2, 1, sqrt(3)
  // Row 2: Undefined, -1/2, -1/sqrt(3), -sqrt(2)/2, -sqrt(3)/2, -1, -sqrt(3)
  const options = [
    '0', '\\frac{1}{2}', '\\frac{1}{\\sqrt{3}}', '\\frac{\\sqrt{2}}{2}', '\\frac{\\sqrt{3}}{2}', '1', '\\sqrt{3}',
    'Undefined', '-\\frac{1}{2}', '-\\frac{1}{\\sqrt{3}}', '-\\frac{\\sqrt{2}}{2}', '-\\frac{\\sqrt{3}}{2}', '-1', '-\\sqrt{3}'
  ];

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
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
      {renderUnitCircle()}
      
      <div className="grid grid-cols-7 gap-3 w-full">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onAnswer(opt)}
            className="aspect-[4/3] p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-200 dark:border-slate-700 text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center"
          >
             {opt === 'Undefined' ? (
               <span className="text-sm sm:text-base font-bold uppercase tracking-wider">Undefined</span>
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
