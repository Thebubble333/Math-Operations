import React, { useMemo } from 'react';
import { GraphParams, GraphConfig } from '../types';

interface GraphCardProps {
  params: GraphParams;
  config?: GraphConfig;
  onClick?: () => void;
  selected?: boolean;
  isCorrect?: boolean;
  isError?: boolean;
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
  isCorrect,
  isError,
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
    const { type, a, h, k, domainContext } = params;

    // Coordinate conversion
    const toSvgX = (x: number) => 50 + x * 10;
    const toSvgY = (y: number) => 50 - y * 10;

    const extraElements = useMemo(() => {
      const asymptotes: React.ReactNode[] = [];
      const endpoints: React.ReactNode[] = [];

      if (type === 'hyperbola' || type === 'truncus' || type === 'exponential') {
        if (k >= -5 && k <= 5) {
          const yPos = toSvgY(k);
          asymptotes.push(
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
      
      if (type === 'hyperbola' || type === 'truncus') {
        if (h >= -5 && h <= 5) {
          const xPos = toSvgX(h);
          asymptotes.push(
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
      }

      if (domainContext) {
        const { type: dcType, startX, endX, startOpen, endOpen } = domainContext;
        
        // Draw endpoints if range/domain bounded
        const drawEndpoint = (xVal: number, isOpen: boolean, key: string) => {
          let yVal = 0;
          switch (type) {
            case 'linear': yVal = a * (xVal - h) + k; break;
            case 'quadratic': yVal = a * Math.pow(xVal - h, 2) + k; break;
            case 'cubic': yVal = a * Math.pow(xVal - h, 3) + k; break;
            case 'exponential': yVal = a * Math.exp(h * xVal) + k; break;
            case 'sin': yVal = a * Math.sin(h * xVal) + k; break;
            case 'cos': yVal = a * Math.cos(h * xVal) + k; break;
            case 'tan': yVal = a * Math.tan(h * xVal) + k; break;
            case 'sqrt': yVal = a * Math.sqrt(xVal - h) + k; break;
            case 'hyperbola': yVal = a / (xVal - h) + k; break;
            case 'truncus': yVal = a / Math.pow(xVal - h, 2) + k; break;
          }
          if (xVal >= -6 && xVal <= 6 && yVal >= -6 && yVal <= 6) {
             endpoints.push(
               <circle
                 key={key}
                 cx={toSvgX(xVal)}
                 cy={toSvgY(yVal)}
                 r={config.graphStrokeWidth * 1.5}
                 stroke="currentColor"
                 strokeWidth={config.graphStrokeWidth}
                 className={isOpen ? "text-indigo-600 dark:text-indigo-400 fill-white dark:fill-slate-800" : "text-indigo-600 dark:text-indigo-400 fill-current"}
               />
             );
          }
        };

        if (startX !== undefined && startX !== null) {
          drawEndpoint(startX, !!startOpen, 'start-endpoint');
        } else if (type === 'sqrt') {
          // Default sqrt start point
          drawEndpoint(h, false, 'start-endpoint-sqrt');
        }
        
        if (endX !== undefined && endX !== null) {
          drawEndpoint(endX, !!endOpen, 'end-endpoint');
        }

        // Draw Turning point if quadratic and within bounds
        if (type === 'quadratic' && dcType === 'range') {
          const isTpWithinBounds = (startX === undefined || startX === null || h > startX) && (endX === undefined || endX === null || h < endX);
          if (isTpWithinBounds) {
             endpoints.push(
               <circle
                 key="tp"
                 cx={toSvgX(h)}
                 cy={toSvgY(k)}
                 r={config.graphStrokeWidth * 1.5}
                 fill="currentColor"
                 className="text-pink-500"
               />
             );
          }
        }
      } else if (type === 'sqrt') {
        // default endpoint
        if (h >= -5 && h <= 5 && k >= -5 && k <= 5) {
          endpoints.push(
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

      return { asymptotes, endpoints };
    }, [type, a, h, k, config, domainContext, toSvgX, toSvgY]);

    const paths = useMemo(() => {
      const allPaths: string[][] = [];
      const step = 0.1;
      let minX = -6;
      let maxX = 6;
      
      if (domainContext) {
        if (domainContext.startX !== undefined && domainContext.startX !== null) minX = domainContext.startX;
        if (domainContext.endX !== undefined && domainContext.endX !== null) maxX = domainContext.endX;
      }

      const generateContinuousPaths = (start: number, end: number, func: (x: number) => number, isTan: boolean = false) => {
      const generatedPaths: string[][] = [];
      let currentPath: string[] = [];
      let prevY: number | null = null;
      
      for (let x = start; x <= end; x += step) {
        const y = func(x);
        
        if (isTan && prevY !== null && Math.abs(y - prevY) > 10 && (y * prevY < 0)) {
           // Asymptote crossed, start new path
           generatedPaths.push([...currentPath]);
           currentPath = [];
        }

        if (Math.abs(y) < 10) {
          currentPath.push(`${toSvgX(x)},${toSvgY(y)}`);
        } else {
           const clampedY = y > 0 ? 10 : -10;
           currentPath.push(`${toSvgX(x)},${toSvgY(clampedY)}`);
        }
        prevY = y;
      }
      if (currentPath.length > 0) {
        generatedPaths.push(currentPath);
      }
      return generatedPaths.map(p => p.join(' '));
    };

    switch (type) {
      case 'linear':
        allPaths.push(...generateContinuousPaths(minX, maxX, (x) => a * (x - h) + k));
        break;

      case 'quadratic':
        allPaths.push(...generateContinuousPaths(minX, maxX, (x) => a * Math.pow(x - h, 2) + k));
        break;

      case 'cubic':
        allPaths.push(...generateContinuousPaths(minX, maxX, (x) => a * Math.pow(x - h, 3) + k));
        break;

      case 'exponential':
        allPaths.push(...generateContinuousPaths(minX, maxX, (x) => a * Math.exp(h * x) + k));
        break;
        
      case 'sin':
        allPaths.push(...generateContinuousPaths(minX, maxX, (x) => a * Math.sin(h * x) + k));
        break;

      case 'cos':
        allPaths.push(...generateContinuousPaths(minX, maxX, (x) => a * Math.cos(h * x) + k));
        break;

      case 'tan':
        allPaths.push(...generateContinuousPaths(minX, maxX, (x) => a * Math.tan(h * x) + k, true));
        break;

      case 'sqrt':
        const startX = Math.max(minX, h);
        if (startX <= maxX) {
          allPaths.push(...generateContinuousPaths(startX, maxX, (x) => a * Math.sqrt(x - h) + k));
        }
        break;

      case 'hyperbola':
        if (minX < h) {
           const leftPts = [];
           for (let x = minX; x < h - 0.05; x += step) {
             const y = a / (x - h) + k;
             if (Math.abs(y) < 10) leftPts.push(`${toSvgX(x)},${toSvgY(y)}`);
             else leftPts.push(`${toSvgX(x)},${toSvgY(y > 0 ? 10 : -10)}`);
           }
           const closeX = h - 0.02;
           const closeY = a / (closeX - h) + k;
           const clampedY = closeY > 0 ? 10 : -10;
           leftPts.push(`${toSvgX(closeX)},${toSvgY(clampedY)}`);
           allPaths.push(leftPts.join(' '));
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
           allPaths.push(rightPts.join(' '));
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
           allPaths.push(leftPts.join(' '));
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
           allPaths.push(rightPts.join(' '));
        }
        break;
    }

    return allPaths;
  }, [type, a, h, k]);

  return (
    <div 
      onClick={selected ? undefined : onClick}
      className={`
        relative aspect-square bg-white dark:bg-slate-800 rounded-xl border-[4px] cursor-pointer transition-all
        hover:border-indigo-400 hover:shadow-xl
        ${
          selected && isCorrect ? 'border-emerald-500 bg-emerald-500/10 shadow-emerald-500/20 shadow-md ring-4 ring-emerald-500/30' :
          selected && isError ? 'border-rose-500 bg-rose-500/10 shadow-rose-500/20 shadow-md ring-4 ring-rose-500/30' :
          selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 dark:border-slate-700'
        }
        ${className}
      `}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full p-2" preserveAspectRatio="xMidYMid meet">
        <GridBackground config={config} />
        
        {/* Asymptotes */}
        {extraElements.asymptotes}

        {/* Graphs */}
        {paths.map((pathStr, i) => pathStr ? (
          <polyline 
            key={i}
            points={pathStr} 
            fill="none" 
            stroke="#2563eb" 
            strokeWidth={config.graphStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null)}

        {/* Endpoints and TP */}
        {extraElements.endpoints}
      </svg>
    </div>
  );
};

export default GraphCard;
