import React from 'react';
import { Alt5GraphData } from '../utils/alt5Generators';

interface Alt5GraphProps {
  graphData: Alt5GraphData;
  width?: number;
  height?: number;
}

export const Alt5Graph: React.FC<Alt5GraphProps> = ({
  graphData,
  width = 460,
  height = 360,
}) => {
  // Determine dynamic coordinate bounds
  let minX = -6;
  let maxX = 6;
  let minY = -6;
  let maxY = 6;

  // Adapt bounds based on points in graphData
  if (graphData.points && graphData.points.length > 0) {
    const xs = graphData.points.map(p => p.x);
    const ys = graphData.points.map(p => p.y);
    if (graphData.xMinDomain !== undefined) xs.push(graphData.xMinDomain);
    if (graphData.xMaxDomain !== undefined) xs.push(graphData.xMaxDomain);
    if (graphData.horizontalY !== undefined) ys.push(graphData.horizontalY);
    if (graphData.isVertical && graphData.verticalX !== undefined) xs.push(graphData.verticalX);

    const minXVal = Math.min(...xs, -5);
    const maxXVal = Math.max(...xs, 5);
    const minYVal = Math.min(...ys, -5);
    const maxYVal = Math.max(...ys, 5);

    minX = Math.floor(minXVal - 1.5);
    maxX = Math.ceil(maxXVal + 1.5);
    minY = Math.floor(minYVal - 1.5);
    maxY = Math.ceil(maxYVal + 1.5);
  }

  // Ensure minimum range
  if (maxX - minX < 8) {
    minX = -5;
    maxX = 5;
  }
  if (maxY - minY < 8) {
    minY = -5;
    maxY = 5;
  }

  const padding = 36;
  const plotWidth = width - 2 * padding;
  const plotHeight = height - 2 * padding;

  const toSvgX = (x: number) => padding + ((x - minX) / (maxX - minX)) * plotWidth;
  const toSvgY = (y: number) => height - padding - ((y - minY) / (maxY - minY)) * plotHeight;

  const originX = toSvgX(0);
  const originY = toSvgY(0);

  // Generate grid ticks
  const xTicks: number[] = [];
  const xStep = maxX - minX > 14 ? 2 : 1;
  for (let x = Math.ceil(minX); x <= Math.floor(maxX); x += xStep) {
    if (x !== 0) xTicks.push(x);
  }

  const yTicks: number[] = [];
  const yStep = maxY - minY > 14 ? 2 : 1;
  for (let y = Math.ceil(minY); y <= Math.floor(maxY); y += yStep) {
    if (y !== 0) yTicks.push(y);
  }

  // Generate curve path
  let pathD = '';
  if (graphData.type === 'linear') {
    if (graphData.isVertical && graphData.verticalX !== undefined) {
      const vx = toSvgX(graphData.verticalX);
      pathD = `M ${vx} ${toSvgY(minY)} L ${vx} ${toSvgY(maxY)}`;
    } else if (graphData.lineSlope !== undefined && graphData.lineIntercept !== undefined) {
      const m = graphData.lineSlope;
      const c = graphData.lineIntercept;
      const xStart = minX;
      const yStart = m * xStart + c;
      const xEnd = maxX;
      const yEnd = m * xEnd + c;
      pathD = `M ${toSvgX(xStart)} ${toSvgY(yStart)} L ${toSvgX(xEnd)} ${toSvgY(yEnd)}`;
    }
  } else if (graphData.type === 'parabola_restricted' || graphData.type === 'parabola_features') {
    const a = graphData.parabolaA ?? 1;
    const b = graphData.parabolaB ?? 0;
    const c = graphData.parabolaC ?? 0;

    const startX = graphData.type === 'parabola_restricted' && graphData.xMinDomain !== undefined
      ? graphData.xMinDomain
      : minX;
    const endX = graphData.type === 'parabola_restricted' && graphData.xMaxDomain !== undefined
      ? graphData.xMaxDomain
      : maxX;

    const steps = 60;
    const dx = (endX - startX) / steps;
    const points: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = startX + i * dx;
      const y = a * x * x + b * x + c;
      const sx = toSvgX(x);
      const sy = toSvgY(y);
      points.push(`${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
    }
    pathD = points.join(' ');
  }

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden my-3">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[480px] h-auto select-none"
      >
        <defs>
          <clipPath id="plot-clip">
            <rect x={padding - 5} y={padding - 5} width={plotWidth + 10} height={plotHeight + 10} />
          </clipPath>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
          </marker>
        </defs>

        {/* Grid lines */}
        <g stroke="#e2e8f0" strokeWidth="0.8" className="dark:stroke-slate-800">
          {xTicks.map(x => (
            <line
              key={`grid-x-${x}`}
              x1={toSvgX(x)}
              y1={padding}
              x2={toSvgX(x)}
              y2={height - padding}
            />
          ))}
          {yTicks.map(y => (
            <line
              key={`grid-y-${y}`}
              x1={padding}
              y1={toSvgY(y)}
              x2={width - padding}
              y2={toSvgY(y)}
            />
          ))}
        </g>

        {/* Axes */}
        <g stroke="#64748b" strokeWidth="1.5" className="dark:stroke-slate-400">
          {/* X Axis */}
          <line
            x1={padding - 10}
            y1={originY}
            x2={width - padding + 15}
            y2={originY}
            markerEnd="url(#arrow)"
          />
          {/* Y Axis */}
          <line
            x1={originX}
            y1={height - padding + 10}
            x2={originX}
            y2={padding - 15}
            markerEnd="url(#arrow)"
          />
        </g>

        {/* Axis Labels */}
        <text
          x={width - padding + 18}
          y={originY + 4}
          fill="#475569"
          className="dark:fill-slate-300 font-bold text-xs"
        >
          x
        </text>
        <text
          x={originX - 4}
          y={padding - 20}
          fill="#475569"
          className="dark:fill-slate-300 font-bold text-xs"
        >
          y
        </text>
        <text
          x={originX - 10}
          y={originY + 12}
          fill="#94a3b8"
          className="text-[10px] font-semibold"
        >
          0
        </text>

        {/* Tick numbers */}
        <g fill="#94a3b8" className="text-[9px] font-medium select-none">
          {xTicks.map(x => (
            <text
              key={`tick-x-${x}`}
              x={toSvgX(x)}
              y={originY + 12}
              textAnchor="middle"
            >
              {x}
            </text>
          ))}
          {yTicks.map(y => (
            <text
              key={`tick-y-${y}`}
              x={originX - 6}
              y={toSvgY(y) + 3}
              textAnchor="end"
            >
              {y}
            </text>
          ))}
        </g>

        {/* Main curve clipped */}
        <g clipPath="url(#plot-clip)">
          {/* Horizontal line for restricted domain if present */}
          {graphData.horizontalY !== undefined && (
            <line
              x1={toSvgX(minX)}
              y1={toSvgY(graphData.horizontalY)}
              x2={toSvgX(maxX)}
              y2={toSvgY(graphData.horizontalY)}
              stroke="#f59e0b"
              strokeWidth="1.8"
              strokeDasharray="4 4"
            />
          )}

          {/* Curve path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>

        {/* Points and labels */}
        {graphData.points?.map((pt, idx) => {
          const px = toSvgX(pt.x);
          const py = toSvgY(pt.y);
          const isOpen = pt.isOpen ?? false;

          return (
            <g key={`pt-${idx}`}>
              {isOpen ? (
                <circle
                  cx={px}
                  cy={py}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#ef4444"
                  strokeWidth="2.2"
                />
              ) : (
                <circle
                  cx={px}
                  cy={py}
                  r="4.5"
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              )}
              {/* Coordinate label tag */}
              <text
                x={px + (pt.x > 0 ? -6 : 6)}
                y={py + (pt.y > 0 ? -10 : 14)}
                textAnchor={pt.x > 0 ? 'end' : 'start'}
                fill="#1e293b"
                className="dark:fill-slate-100 font-bold text-[10px]"
              >
                {pt.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
        Cartesian Plane with labeled intercepts and key features
      </div>
    </div>
  );
};
