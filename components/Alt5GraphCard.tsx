import React from 'react';
import { Alt5GraphData } from '../utils/alt5Generators';

interface Alt5GraphCardProps {
  graphData: Alt5GraphData;
  label?: string; // 'A', 'B', 'C', 'D'
  onClick?: () => void;
  selected?: boolean;
  isCorrect?: boolean;
  isError?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Alt5GraphCard: React.FC<Alt5GraphCardProps> = ({
  graphData,
  label,
  onClick,
  selected,
  isCorrect,
  isError,
  disabled,
  className = '',
}) => {
  // Determine scale range: default -5 to 5, expand if intercepts exceed 5
  let maxCoord = 5;
  if (graphData.points && graphData.points.length > 0) {
    for (const p of graphData.points) {
      if (Math.abs(p.x) > maxCoord) maxCoord = Math.ceil(Math.abs(p.x));
      if (Math.abs(p.y) > maxCoord) maxCoord = Math.ceil(Math.abs(p.y));
    }
  }
  if (graphData.verticalX !== undefined && Math.abs(graphData.verticalX) > maxCoord) {
    maxCoord = Math.ceil(Math.abs(graphData.verticalX));
  }
  if (graphData.lineIntercept !== undefined && Math.abs(graphData.lineIntercept) > maxCoord) {
    maxCoord = Math.ceil(Math.abs(graphData.lineIntercept));
  }
  // Keep nice integer bounds: 5, 6, 8, 10
  const range = maxCoord <= 5 ? 5 : maxCoord <= 7 ? 7 : 10;
  
  // Coordinates mapping into 100x100 SVG, center at (50, 50)
  // 50 + x * (40 / range)
  const unitPx = 40 / range;
  const toSvgX = (x: number) => 50 + x * unitPx;
  const toSvgY = (y: number) => 50 - y * unitPx;

  // Grid ticks
  const tickStep = range <= 5 ? 1 : 2;
  const ticks: number[] = [];
  for (let t = -range + 1; t < range; t += tickStep) {
    if (t !== 0) ticks.push(t);
  }

  // Generate line / curve paths
  let linePath = '';
  if (graphData.type === 'linear') {
    if (graphData.isVertical && graphData.verticalX !== undefined) {
      const vx = toSvgX(graphData.verticalX);
      linePath = `M ${vx} 6 L ${vx} 94`;
    } else if (graphData.lineSlope !== undefined && graphData.lineIntercept !== undefined) {
      const m = graphData.lineSlope;
      const c = graphData.lineIntercept;
      // Find endpoints clipped to [-range - 1, range + 1]
      const x1 = -range - 1;
      const y1 = m * x1 + c;
      const x2 = range + 1;
      const y2 = m * x2 + c;
      linePath = `M ${toSvgX(x1)} ${toSvgY(y1)} L ${toSvgX(x2)} ${toSvgY(y2)}`;
    }
  } else if (graphData.type === 'parabola_restricted' || graphData.type === 'parabola_features') {
    const a = graphData.parabolaA ?? 1;
    const b = graphData.parabolaB ?? 0;
    const c = graphData.parabolaC ?? 0;
    const pts: string[] = [];
    const step = 0.2;
    for (let x = -range - 1; x <= range + 1; x += step) {
      const y = a * x * x + b * x + c;
      if (Math.abs(y) <= range * 1.5) {
        pts.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
      }
    }
    if (pts.length > 1) {
      linePath = `M ${pts.join(' L ')}`;
    }
  }

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        relative aspect-square bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all select-none
        ${!disabled && onClick ? 'cursor-pointer hover:border-indigo-500 hover:shadow-lg' : ''}
        ${
          selected && isCorrect
            ? 'border-emerald-500 bg-emerald-500/10 ring-4 ring-emerald-500/30 shadow-md'
            : selected && isError
            ? 'border-rose-500 bg-rose-500/10 ring-4 ring-rose-500/30 shadow-md'
            : isCorrect
            ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/5'
            : disabled && !selected
            ? 'border-slate-200 dark:border-slate-800 opacity-60'
            : 'border-slate-200 dark:border-slate-700 shadow-sm'
        }
        ${className}
      `}
    >
      {/* Letter badge / status indicator */}
      {label && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
          <span
            className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shadow-sm ${
              selected && isCorrect
                ? 'bg-emerald-600 text-white'
                : selected && isError
                ? 'bg-rose-600 text-white'
                : isCorrect
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {label}
          </span>
          {isCorrect && (
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shadow">
              ✓
            </span>
          )}
          {selected && isError && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow">
              ✗
            </span>
          )}
        </div>
      )}

      {/* SVG Cartesian plane */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full p-1.5 overflow-hidden"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <clipPath id="graph-clip">
            <rect x="0" y="0" width="100" height="100" rx="12" />
          </clipPath>
        </defs>

        <g clipPath="url(#graph-clip)">
          {/* Subtle Grid Lines */}
          {ticks.map(val => {
            const pos = toSvgX(val);
            const posY = toSvgY(val);
            return (
              <React.Fragment key={val}>
                <line
                  x1={pos}
                  y1="4"
                  x2={pos}
                  y2="96"
                  stroke="currentColor"
                  strokeWidth="0.25"
                  className="text-slate-200 dark:text-slate-800"
                />
                <line
                  x1="4"
                  y1={posY}
                  x2="96"
                  y2={posY}
                  stroke="currentColor"
                  strokeWidth="0.25"
                  className="text-slate-200 dark:text-slate-800"
                />
              </React.Fragment>
            );
          })}

          {/* Axes */}
          <line
            x1="4"
            y1="50"
            x2="94"
            y2="50"
            stroke="currentColor"
            strokeWidth="1.1"
            className="text-slate-800 dark:text-slate-200"
          />
          <line
            x1="50"
            y1="6"
            x2="50"
            y2="96"
            stroke="currentColor"
            strokeWidth="1.1"
            className="text-slate-800 dark:text-slate-200"
          />

          {/* Arrowheads */}
          <path
            d="M 97 50 L 93 48.2 L 93 51.8 Z"
            fill="currentColor"
            className="text-slate-800 dark:text-slate-200"
          />
          <path
            d="M 50 3 L 48.2 7 L 51.8 7 Z"
            fill="currentColor"
            className="text-slate-800 dark:text-slate-200"
          />

          {/* Axis Labels x and y */}
          <text
            x="94"
            y="57"
            fontSize="7"
            className="fill-slate-800 dark:fill-slate-200 font-serif italic"
          >
            x
          </text>
          <text
            x="54"
            y="8"
            fontSize="7"
            className="fill-slate-800 dark:fill-slate-200 font-serif italic"
          >
            y
          </text>

          {/* Ticks and Numbers */}
          {ticks.map(val => (
            <React.Fragment key={`tick-${val}`}>
              {/* X Axis Tick */}
              <line
                x1={toSvgX(val)}
                y1="48.8"
                x2={toSvgX(val)}
                y2="51.2"
                stroke="currentColor"
                strokeWidth="0.6"
                className="text-slate-700 dark:text-slate-300"
              />
              <text
                x={toSvgX(val)}
                y="57"
                fontSize="5"
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-400 select-none font-serif"
              >
                {val}
              </text>

              {/* Y Axis Tick */}
              <line
                x1="48.8"
                y1={toSvgY(val)}
                x2="51.2"
                y2={toSvgY(val)}
                stroke="currentColor"
                strokeWidth="0.6"
                className="text-slate-700 dark:text-slate-300"
              />
              <text
                x="47"
                y={toSvgY(val) + 1.5}
                fontSize="5"
                textAnchor="end"
                className="fill-slate-600 dark:fill-slate-400 select-none font-serif"
              >
                {val}
              </text>
            </React.Fragment>
          ))}

          {/* Origin */}
          <text
            x="47"
            y="56"
            fontSize="5"
            textAnchor="end"
            className="fill-slate-600 dark:fill-slate-400 select-none font-serif"
          >
            0
          </text>

          {/* Plotted Line / Parabola */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Intercept / Feature Points */}
          {graphData.points?.map((pt, idx) => {
            const px = toSvgX(pt.x);
            const py = toSvgY(pt.y);
            if (px < 4 || px > 96 || py < 4 || py > 96) return null;

            // Placement for label
            const labelY = pt.y >= 0 ? py - 4 : py + 7;
            const textAnchor = pt.x > 1 ? 'end' : pt.x < -1 ? 'start' : 'middle';
            const labelX = pt.x > 1 ? px - 3 : pt.x < -1 ? px + 3 : px;

            return (
              <g key={idx}>
                {/* Glow ring */}
                <circle cx={px} cy={py} r="3.2" fill="white" opacity="0.8" />
                {/* Point dot */}
                <circle
                  cx={px}
                  cy={py}
                  r="2"
                  className="fill-indigo-600 dark:fill-indigo-400"
                />
                {/* Label */}
                {pt.label && (
                  <text
                    x={labelX}
                    y={labelY}
                    fontSize="5"
                    fontWeight="bold"
                    textAnchor={textAnchor}
                    className="fill-slate-900 dark:fill-white font-mono drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]"
                  >
                    {pt.label.replace(/\\left|\\right/g, '').replace(/\\,/g, '')}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default Alt5GraphCard;
