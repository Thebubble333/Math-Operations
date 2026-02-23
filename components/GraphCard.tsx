import React, { useMemo } from 'react';
import { GraphParams, GraphConfig } from '../types';

interface GraphCardProps {
  params: GraphParams;
  config?: GraphConfig;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

const GridBackground = React.memo(({ config }: { config: GraphConfig }) => {
  // SVG 100x100. Center (50, 50). Scale 10px per unit. Range -5 to 5.
  const ticks = [-4, -3, -2, -1, 1, 2, 3, 4];
  
  return (
    <>
      {/* Grid Lines */}
      {Array.from({ length: 11 }).map((_, i) => {
        const val = i - 5;
        if (val === 0) return null; // Skip axis lines for grid
        const pos = 50 + val * 10;
        return (
          <React.Fragment key={i}>
            <line x1={pos} y1="0" x2={pos} y2="100" stroke="currentColor" strokeWidth={config.gridStrokeWidth} className="text-slate-200 dark:text-slate-700" />
            <line x1="0" y1={pos} x2="100" y2={pos} stroke="currentColor" strokeWidth={config.gridStrokeWidth} className="text-slate-200 dark:text-slate-700" />
          </React.Fragment>
        );
      })}

      {/* Axes */}
      <line x1="0" y1="50" x2="94" y2="50" stroke="currentColor" strokeWidth={config.axisStrokeWidth} className="text-slate-900 dark:text-slate-100" />
      <line x1="50" y1="6" x2="50" y2="100" stroke="currentColor" strokeWidth={config.axisStrokeWidth} className="text-slate-900 dark:text-slate-100" />
      
      {/* Arrows */}
      <path d="M 98 50 L 94 48 L 94 52 Z" fill="currentColor" className="text-slate-900 dark:text-slate-100" />
      <path d="M 50 2 L 48 6 L 52 6 Z" fill="currentColor" className="text-slate-900 dark:text-slate-100" />

      {/* Axis Labels */}
      <text x="94" y="58" fontSize={config.axisFontSize} className="fill-slate-800 dark:fill-slate-200 font-serif italic">x</text>
      <text x="56" y="8" fontSize={config.axisFontSize} className="fill-slate-800 dark:fill-slate-200 font-serif italic">y</text>

      {/* Ticks and Numbers */}
      {ticks.map(val => (
        <React.Fragment key={val}>
          {/* X Axis */}
          <line x1={50 + val * 10} y1="48.5" x2={50 + val * 10} y2="51.5" stroke="currentColor" strokeWidth="0.5" className="text-slate-700 dark:text-slate-300" />
          <text x={50 + val * 10} y="59" fontSize={config.fontSize} textAnchor="middle" className="fill-slate-700 dark:fill-slate-300 select-none font-serif">{val}</text>
          
          {/* Y Axis */}
          <line x1="48.5" y1={50 - val * 10} x2="51.5" y2={50 - val * 10} stroke="currentColor" strokeWidth="0.5" className="text-slate-700 dark:text-slate-300" />
          <text x="46" y={50 - val * 10 + 2} fontSize={config.fontSize} textAnchor="end" className="fill-slate-700 dark:fill-slate-300 select-none font-serif">{val}</text>
        </React.Fragment>
      ))}
      
      {/* Origin */}
      <text x="47" y="56" fontSize={config.fontSize} textAnchor="end" className="fill-slate-700 dark:fill-slate-300 select-none font-serif">0</text>
      
      {/* Border */}
      <rect x="0" y="0" width="100" height="100" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-slate-600" />
    </>
  );
});

const GraphCard: React.FC<GraphCardProps> = ({ 
  params, 
  onClick, 
  selected, 
  className = '',
  config = {
    gridColumns: 4,
    axisStrokeWidth: 1.2,
    gridStrokeWidth: 0.2,
    graphStrokeWidth: 2.5,
    fontSize: 6.5,
    axisFontSize: 9
  }
}) => {
  const { type, a, h, k } = params;

  // Coordinate conversion
  // SVG 100x100. Center (50, 50). Scale 10px per unit. Range -5 to 5.
  const toSvgX = (x: number) => 50 + x * 10;
  const toSvgY = (y: number) => 50 - y * 10;

  const extraElements = useMemo(() => {
    const elements: React.ReactNode[] = [];

    if (type === 'hyperbola' || type === 'truncus') {
      // Vertical Asymptote at x = h
      if (h >= -5 && h <= 5) {
        const xPos = toSvgX(h);
        elements.push(
          <line 
            key="va" 
            x1={xPos} y1="0" x2={xPos} y2="100" 
            stroke="currentColor" 
            strokeWidth={config.gridStrokeWidth * 2} 
            strokeDasharray="4,2" 
            className="text-slate-400 dark:text-slate-500 opacity-70" 
          />
        );
      }
      // Horizontal Asymptote at y = k
      if (k >= -5 && k <= 5) {
        const yPos = toSvgY(k);
        elements.push(
          <line 
            key="ha" 
            x1="0" y1={yPos} x2="100" y2={yPos} 
            stroke="currentColor" 
            strokeWidth={config.gridStrokeWidth * 2} 
            strokeDasharray="4,2" 
            className="text-slate-400 dark:text-slate-500 opacity-70" 
          />
        );
      }
    }

    if (type === 'sqrt') {
      // Endpoint at (h, k)
      if (h >= -5 && h <= 5 && k >= -5 && k <= 5) {
        elements.push(
          <circle 
            key="endpoint" 
            cx={toSvgX(h)} 
            cy={toSvgY(k)} 
            r={config.graphStrokeWidth * 0.8} 
            fill="#2563eb" 
          />
        );
      }
    }

    return elements;
  }, [type, a, h, k, config]);

  const paths = useMemo(() => {
    const points: string[] = [];
    const points2: string[] = []; // For discontinuous graphs
    
    // Coordinate conversion
    // SVG 100x100. Center (50, 50). Scale 10px per unit. Range -5 to 5.
    const toSvgX = (x: number) => 50 + x * 10;
    const toSvgY = (y: number) => 50 - y * 10;

    const step = 0.1;
    const minX = -5;
    const maxX = 5;

    const generatePoints = (start: number, end: number, func: (x: number) => number) => {
      const pts: string[] = [];
      for (let x = start; x <= end; x += step) {
        const y = func(x);
        // Clamp for rendering
        if (Math.abs(y) < 10) { // Only draw if within visible Y range (roughly)
          pts.push(`${toSvgX(x)},${toSvgY(y)}`);
        } else {
           // If out of bounds, we can either skip or clamp. 
           // For continuous lines, skipping creates gaps. 
           // Clamping to edge + margin is better.
           const clampedY = y > 0 ? 10 : -10;
           pts.push(`${toSvgX(x)},${toSvgY(clampedY)}`);
        }
      }
      return pts;
    };

    switch (type) {
      case 'linear':
        points.push(...generatePoints(minX, maxX, (x) => a * (x - h) + k));
        break;

      case 'quadratic':
        points.push(...generatePoints(minX, maxX, (x) => a * Math.pow(x - h, 2) + k));
        break;

      case 'cubic':
        points.push(...generatePoints(minX, maxX, (x) => a * Math.pow(x - h, 3) + k));
        break;

      case 'sqrt':
        const startX = Math.max(minX, h);
        if (startX <= maxX) {
          points.push(...generatePoints(startX, maxX, (x) => a * Math.sqrt(x - h) + k));
        }
        break;

      case 'hyperbola':
        // Discontinuity at x = h
        if (minX < h) {
           const leftPts = [];
           // Go close to asymptote
           for (let x = minX; x < h - 0.05; x += step) {
             const y = a / (x - h) + k;
             if (Math.abs(y) < 10) leftPts.push(`${toSvgX(x)},${toSvgY(y)}`);
             else leftPts.push(`${toSvgX(x)},${toSvgY(y > 0 ? 10 : -10)}`);
           }
           // Add point very close to asymptote for steep line
           const closeX = h - 0.02;
           const closeY = a / (closeX - h) + k;
           const clampedY = closeY > 0 ? 10 : -10;
           leftPts.push(`${toSvgX(closeX)},${toSvgY(clampedY)}`);
           
           points.push(...leftPts);
        }
        if (maxX > h) {
           const rightPts = [];
           const closeX = h + 0.02;
           const closeY = a / (closeX - h) + k;
           const clampedY = closeY > 0 ? 10 : -10;
           rightPts.push(`${toSvgX(closeX)},${toSvgY(clampedY)}`);

           for (let x = h + 0.05; x <= maxX; x += step) {
             const y = a / (x - h) + k;
             if (Math.abs(y) < 10) rightPts.push(`${toSvgX(x)},${toSvgY(y)}`);
             else rightPts.push(`${toSvgX(x)},${toSvgY(y > 0 ? 10 : -10)}`);
           }
           points2.push(...rightPts);
        }
        break;

      case 'truncus':
        if (minX < h) {
           const leftPts = [];
           for (let x = minX; x < h - 0.05; x += step) {
             const y = a / Math.pow(x - h, 2) + k;
             if (Math.abs(y) < 10) leftPts.push(`${toSvgX(x)},${toSvgY(y)}`);
             else leftPts.push(`${toSvgX(x)},${toSvgY(y > 0 ? 10 : -10)}`);
           }
           const closeX = h - 0.02;
           const closeY = a / Math.pow(closeX - h, 2) + k;
           const clampedY = closeY > 0 ? 10 : -10;
           leftPts.push(`${toSvgX(closeX)},${toSvgY(clampedY)}`);
           points.push(...leftPts);
        }
        if (maxX > h) {
           const rightPts = [];
           const closeX = h + 0.02;
           const closeY = a / Math.pow(closeX - h, 2) + k;
           const clampedY = closeY > 0 ? 10 : -10;
           rightPts.push(`${toSvgX(closeX)},${toSvgY(clampedY)}`);
           for (let x = h + 0.05; x <= maxX; x += step) {
             const y = a / Math.pow(x - h, 2) + k;
             if (Math.abs(y) < 10) rightPts.push(`${toSvgX(x)},${toSvgY(y)}`);
             else rightPts.push(`${toSvgX(x)},${toSvgY(y > 0 ? 10 : -10)}`);
           }
           points2.push(...rightPts);
        }
        break;
    }

    return [points.join(' '), points2.join(' ')];
  }, [type, a, h, k]);

  return (
    <div 
      onClick={onClick}
      className={`
        relative aspect-square bg-white dark:bg-slate-50 rounded-xl border-2 cursor-pointer transition-all
        hover:border-blue-400 hover:shadow-md
        ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}
        ${className}
      `}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full p-2" preserveAspectRatio="xMidYMid meet">
        <GridBackground config={config} />
        
        {/* Asymptotes and Endpoints */}
        {extraElements}

        {/* Graphs */}
        <polyline 
          points={paths[0]} 
          fill="none" 
          stroke="#2563eb" 
          strokeWidth={config.graphStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {paths[1] && (
          <polyline 
            points={paths[1]} 
            fill="none" 
            stroke="#2563eb" 
            strokeWidth={config.graphStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
};

export default GraphCard;
