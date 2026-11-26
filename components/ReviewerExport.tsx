import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import katex from 'katex';
import { GameMode, GraphParams, NormalDiagramConfig } from '../types';
import MathText from './MathText';
import GraphCard from './GraphCard';
import Alt5GraphCard from './Alt5GraphCard';
import { Alt5Graph } from './Alt5Graph';
import {
  buildExportDump,
  CURRICULUM_SECTIONS,
  CurriculumSectionId,
  FormattedSample,
  ModeExportBundle,
} from '../utils/reviewerExportData';

const SafeKatex: React.FC<{
  tex: string;
  displayMode?: boolean;
  className?: string;
}> = ({ tex, displayMode = false, className = '' }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return tex;
    }
  }, [tex, displayMode]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

// Renders strings that mix plain text and $...$ inline math (used by ALT 5 prompts)
const MixedTextKatex: React.FC<{ content: string; className?: string }> = ({
  content,
  className = '',
}) => {
  if (!content) return null;
  if (!content.includes('$')) {
    return <MathText content={content} className={className} />;
  }
  const parts = content.split(/(\$[^$]+\$)/g);
  return (
    <span className={`leading-relaxed ${className}`}>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          return <SafeKatex key={i} tex={part.slice(1, -1)} />;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
};

const NormalDiagramPreview: React.FC<{ diag: NormalDiagramConfig }> = ({ diag }) => {
  const width = 420;
  const height = 165;
  const baseY = 128;
  const centerX = width / 2;
  const scaleX = 52;
  const peakHeight = 96;

  const zToX = (z: number) => centerX + z * scaleX;
  const zToY = (z: number) => baseY - peakHeight * Math.exp(-0.5 * z * z);

  const buildCurvePoints = (zStart: number, zEnd: number, steps = 60) => {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const z = zStart + ((zEnd - zStart) * i) / steps;
      pts.push({ x: zToX(z), y: zToY(z) });
    }
    return pts;
  };

  const buildShadedPath = (z1: number, z2: number) => {
    const pts = buildCurvePoints(z1, z2, 40);
    if (pts.length === 0) return '';
    const d = pts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
    return `${d} L ${zToX(z2).toFixed(1)} ${baseY} L ${zToX(z1).toFixed(1)} ${baseY} Z`;
  };

  const fullPts = buildCurvePoints(-3.4, 3.4, 90);
  const fullCurvePath = fullPts
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const leftZ = diag.leftZ ?? -1.2;
  const rightZ = diag.rightZ ?? 1.2;

  return (
    <div className="my-3 flex justify-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[340px] h-auto overflow-visible"
      >
        {diag.leftZ !== undefined && diag.leftAreaLabel && (
          <path d={buildShadedPath(-3.3, leftZ)} fill="rgba(244, 63, 94, 0.2)" />
        )}
        {diag.rightZ !== undefined && diag.rightAreaLabel && (
          <path d={buildShadedPath(rightZ, 3.3)} fill="rgba(245, 158, 11, 0.2)" />
        )}
        {diag.shadeRegion === 'between' &&
          diag.leftZ !== undefined &&
          diag.rightZ !== undefined && (
            <path d={buildShadedPath(leftZ, rightZ)} fill="rgba(79, 70, 229, 0.22)" />
          )}
        {diag.shadeRegion === 'left' && diag.leftZ !== undefined && (
          <path d={buildShadedPath(-3.3, leftZ)} fill="rgba(79, 70, 229, 0.26)" />
        )}
        {diag.shadeRegion === 'right' && diag.rightZ !== undefined && (
          <path d={buildShadedPath(rightZ, 3.3)} fill="rgba(79, 70, 229, 0.26)" />
        )}
        {diag.shadeRegion === 'both_tails' &&
          diag.leftZ !== undefined &&
          diag.rightZ !== undefined && (
            <>
              <path d={buildShadedPath(-3.3, leftZ)} fill="rgba(79, 70, 229, 0.26)" />
              <path d={buildShadedPath(rightZ, 3.3)} fill="rgba(79, 70, 229, 0.26)" />
            </>
          )}

        {diag.meanLabel && (
          <>
            <line
              x1={centerX}
              y1={zToY(0)}
              x2={centerX}
              y2={baseY}
              strokeDasharray="4 3"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />
            <text
              x={centerX}
              y={baseY + 20}
              textAnchor="middle"
              fill="#64748b"
              fontSize="12"
              fontWeight="700"
              fontStyle="italic"
            >
              {diag.meanLabel === '\\mu' ? 'μ' : diag.meanLabel}
            </text>
          </>
        )}

        {diag.leftZ !== undefined && (
          <>
            <line
              x1={zToX(leftZ)}
              y1={zToY(leftZ)}
              x2={zToX(leftZ)}
              y2={baseY}
              stroke="#4f46e5"
              strokeWidth="2"
            />
            {diag.leftLabel && (
              <text
                x={zToX(leftZ)}
                y={baseY + 20}
                textAnchor="middle"
                fill="#4338ca"
                fontSize="12"
                fontWeight="700"
                fontStyle="italic"
              >
                {diag.leftLabel.replace('\\mu-c\\sigma', 'μ−cσ').replace('_', '')}
              </text>
            )}
            {diag.leftAreaLabel && (
              <text
                x={zToX(leftZ - 0.55)}
                y={baseY - 14}
                textAnchor="middle"
                fill="#be123c"
                fontSize="12"
                fontWeight="700"
                fontStyle="italic"
              >
                {diag.leftAreaLabel}
              </text>
            )}
          </>
        )}

        {diag.rightZ !== undefined && (
          <>
            <line
              x1={zToX(rightZ)}
              y1={zToY(rightZ)}
              x2={zToX(rightZ)}
              y2={baseY}
              stroke="#4f46e5"
              strokeWidth="2"
            />
            {diag.rightLabel && (
              <text
                x={zToX(rightZ)}
                y={baseY + 20}
                textAnchor="middle"
                fill="#4338ca"
                fontSize="12"
                fontWeight="700"
                fontStyle="italic"
              >
                {diag.rightLabel.replace('\\mu+c\\sigma', 'μ+cσ').replace('_', '')}
              </text>
            )}
            {diag.rightAreaLabel && (
              <text
                x={zToX(rightZ + 0.55)}
                y={baseY - 14}
                textAnchor="middle"
                fill="#b45309"
                fontSize="12"
                fontWeight="700"
                fontStyle="italic"
              >
                {diag.rightAreaLabel}
              </text>
            )}
          </>
        )}

        <path
          d={fullCurvePath}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <line
          x1={20}
          y1={baseY}
          x2={width - 20}
          y2={baseY}
          stroke="#64748b"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

const UnitCirclePreview: React.FC<{ angle: number }> = ({ angle }) => {
  const cx = 60;
  const cy = 60;
  const r = 42;
  const px = cx + r * Math.cos(angle);
  const py = cy - r * Math.sin(angle);

  return (
    <svg viewBox="0 0 120 120" className="w-24 h-24 shrink-0">
      <line x1="10" y1={cy} x2="110" y2={cy} stroke="#cbd5e1" strokeWidth="1" />
      <line x1={cx} y1="10" x2={cx} y2="110" stroke="#cbd5e1" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#64748b" strokeWidth="1.4" />
      <line x1={cx} y1={cy} x2={px} y2={py} stroke="#4f46e5" strokeWidth="2.2" />
      <line
        x1={px}
        y1={py}
        x2={px}
        y2={cy}
        stroke="#059669"
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />
      <circle cx={px} cy={py} r="3.2" fill="#4f46e5" />
    </svg>
  );
};

const ReviewerExport: React.FC = () => {
  const navigate = useNavigate();
  const exportRootRef = useRef<HTMLDivElement>(null);

  const [samplesPerMode, setSamplesPerMode] = useState<number>(3);
  const [seedCounter, setSeedCounter] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<'all' | CurriculumSectionId>('all');
  const [showAnswers, setShowAnswers] = useState<boolean>(true);
  const [showRawSpecs, setShowRawSpecs] = useState<boolean>(true);
  const [showAudit, setShowAudit] = useState<boolean>(true);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const dump = useMemo(
    () => buildExportDump(samplesPerMode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [samplesPerMode, seedCounter]
  );

  const visibleSections = useMemo(() => {
    if (activeFilter === 'all') return CURRICULUM_SECTIONS;
    return CURRICULUM_SECTIONS.filter((s) => s.id === activeFilter);
  }, [activeFilter]);

  const totalSampleCount = useMemo(() => {
    const coreCount = dump.coreModes.reduce((acc, m) => acc + m.samples.length, 0);
    const standaloneCount = dump.standaloneModules.reduce(
      (acc, m) => acc + m.samples.length,
      0
    );
    const alt5Count = dump.alt5Bank.reduce((acc, c) => acc + c.samples.length, 0);
    return coreCount + standaloneCount + alt5Count + dump.partialFractionsBank.length;
  }, [dump]);

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dateStamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(dump, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mathflow-reviewer-dump-${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportStatus('JSON dump downloaded.');
    setTimeout(() => setExportStatus(null), 3000);
  };

  const handleDownloadHtml = () => {
    if (!exportRootRef.current) return;
    const dateStamp = new Date().toISOString().slice(0, 10);

    // Collect active compiled CSS rules from same-origin stylesheets so Tailwind utilities render faithfully standalone
    let compiledCss = '';
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        if (sheet.cssRules) {
          for (const rule of Array.from(sheet.cssRules)) {
            compiledCss += rule.cssText + '\n';
          }
        }
      } catch {
        // Cross-origin stylesheet (KaTeX CDN) — linked directly below
      }
    }

    const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MathFlow Trainer — Complete Curriculum &amp; Question Formatting Export (${dateStamp})</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
  <style>
    ${compiledCss}
    body {
      background: #ffffff;
      color: #0f172a;
      margin: 0;
      padding: 24px 16px 48px;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .standalone-shell {
      max-width: 1120px;
      margin: 0 auto;
    }
    @media print {
      body { padding: 0; }
      .standalone-shell { max-width: none; }
    }
  </style>
</head>
<body>
  <div class="standalone-shell">
    ${exportRootRef.current.innerHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mathflow-reviewer-export-${dateStamp}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportStatus('Self-contained HTML report downloaded.');
    setTimeout(() => setExportStatus(null), 3000);
  };

  const renderCoreSampleCard = (bundle: ModeExportBundle, sample: FormattedSample, idx: number) => {
    const { spec } = bundle;
    const { problem } = sample;
    const isPlainArithmetic =
      spec.section === 'essential' && !problem.question.includes('\\');
    const isGraphOptions =
      spec.mode === GameMode.METHODS_GRAPHS && Array.isArray(problem.options);
    const isTextOptions =
      !isGraphOptions && Array.isArray(problem.options) && problem.options.length > 0;

    return (
      <div
        key={sample.id}
        className="print-avoid-break rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between gap-3"
      >
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2 tabular-nums">
            <span>
              Sample {idx + 1}
              {sample.comboTier !== undefined ? ` · Combo tier ${sample.comboTier}` : ''}
            </span>
            {problem.type && <span>Type: {problem.type}</span>}
          </div>

          {/* Prompt */}
          <div className="py-2 text-slate-900 dark:text-slate-100 text-base font-medium overflow-x-auto">
            {isPlainArithmetic ? (
              <span className="text-xl font-bold tabular-nums tracking-tight">
                {problem.question}
              </span>
            ) : (
              <MathText content={problem.question} />
            )}
          </div>

          {/* Visual Aids */}
          {problem.graph && (
            <div className="my-2 max-w-[180px] mx-auto">
              <GraphCard params={problem.graph} />
            </div>
          )}

          {problem.normalDiagram && (
            <NormalDiagramPreview diag={problem.normalDiagram} />
          )}

          {typeof problem.angle === 'number' && !Number.isNaN(problem.angle) && (
            <div className="my-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <UnitCirclePreview angle={problem.angle} />
              <span className="tabular-nums">
                Unit circle ray shown on answer reveal ({((problem.angle * 180) / Math.PI).toFixed(0)}°)
              </span>
            </div>
          )}

          {/* Graph MC Options */}
          {isGraphOptions && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {(problem.options as GraphParams[]).map((gOpt, optIdx) => {
                const letter = ['A', 'B', 'C', 'D'][optIdx] || String(optIdx + 1);
                const isRight = showAnswers && sample.correctOptionIndex === optIdx;
                return (
                  <div key={optIdx} className="flex flex-col gap-1">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center justify-between">
                      <span>Option {letter}</span>
                      {isRight && (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          Correct
                        </span>
                      )}
                    </div>
                    <GraphCard
                      params={gOpt}
                      selected={isRight}
                      isCorrect={isRight}
                      className="pointer-events-none"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Text / KaTeX MC Options */}
          {isTextOptions && (
            <div
              className={`grid gap-1.5 mt-2 ${
                problem.options!.length >= 6 ? 'grid-cols-2' : 'grid-cols-2'
              }`}
            >
              {(problem.options as string[]).map((opt, optIdx) => {
                const letter = ['A', 'B', 'C', 'D', 'E', 'F'][optIdx] || String(optIdx + 1);
                const isRight = showAnswers && sample.correctOptionIndex === optIdx;
                return (
                  <div
                    key={optIdx}
                    className={`rounded-lg border px-2.5 py-1.5 text-sm overflow-x-auto ${
                      isRight
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-slate-900 dark:text-slate-100'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-semibold text-xs text-slate-500 dark:text-slate-400 mr-1.5">
                      {letter}.
                    </span>
                    <MathText content={opt} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Answer & Working */}
        {showAnswers && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-2 text-sm">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Answer:
              </span>
              <span className="text-slate-900 dark:text-slate-100 font-medium overflow-x-auto">
                {isPlainArithmetic ? (
                  <span className="font-mono tabular-nums">{sample.formattedAnswerPlain}</span>
                ) : (
                  <MathText content={sample.formattedAnswerLatex} />
                )}
              </span>
            </div>

            {sample.workingLinesLatex && sample.workingLinesLatex.length > 0 && (
              <div className="pt-1 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <div className="font-medium text-slate-500 dark:text-slate-400">
                  Step-by-step simplification:
                </div>
                <div className="space-y-1 pl-2">
                  {sample.workingLinesLatex.map((line, lIdx) => (
                    <div key={lIdx} className="overflow-x-auto">
                      <SafeKatex tex={line} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Raw Formatting Metadata */}
        {showRawSpecs && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-0.5 break-all">
            <div>Prompt raw: {problem.question}</div>
            <div>Answer raw: {sample.rawAnswer}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Bar (3-zone contract, hidden on print) */}
      <header className="no-print sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
          <button
            onClick={() => navigate('/')}
            className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0"
          >
            MathFlow Trainer
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a
              href="#section-inventory"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Inventory
            </a>
            <a
              href="#section-audit"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Audit
            </a>
            <a
              href="#section-questions"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Question Bank
            </a>
            <a
              href="#section-alt5"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              ALT 5 Bank
            </a>
          </nav>

          <button
            onClick={handlePrintPdf}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Print / Save PDF
          </button>
        </div>
      </header>

      {/* Workspace Control Deck (hidden on print) */}
      <div className="no-print border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                Back to Menu
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {dump.summaryMetrics.coreEngineModes} core modes · {dump.summaryMetrics.standaloneModules} standalone modules · {totalSampleCount} live samples rendered
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSeedCounter((c) => c + 1)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                Regenerate Samples
              </button>
              <button
                onClick={handleDownloadHtml}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                Download HTML
              </button>
              <button
                onClick={handleDownloadJson}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                Download JSON
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* Section Filter */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Sections
              </button>
              {CURRICULUM_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveFilter(sec.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeFilter === sec.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {sec.shortLabel}
                </button>
              ))}
            </div>

            {/* Samples & Display Toggles */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400">Samples / mode:</span>
                <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                  {[2, 3, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setSamplesPerMode(n)}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors tabular-nums ${
                        samplesPerMode === n
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showAnswers}
                  onChange={(e) => setShowAnswers(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Answers &amp; Solutions</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showRawSpecs}
                  onChange={(e) => setShowRawSpecs(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Raw LaTeX &amp; Specs</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showAudit}
                  onChange={(e) => setShowAudit(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Inventory &amp; Audit</span>
              </label>
            </div>
          </div>

          {exportStatus && (
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {exportStatus}
            </div>
          )}
        </div>
      </div>

      {/* Main Exportable Document Body */}
      <main
        ref={exportRootRef}
        className="max-w-6xl mx-auto px-6 py-10 space-y-12"
      >
        {/* Document Cover Header */}
        <section className="pb-8 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Curriculum &amp; Formatting Specification · Generated {new Date(dump.generatedAt).toLocaleDateString()} · Print-ready export for external review
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
            MathFlow Trainer — Complete Question Bank &amp; Feature Audit
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            Comprehensive export of every active problem generator, standalone practice module, visual graph/diagram format, input mechanic, answer encoding, and identified improvement opportunity across the site.
          </p>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4">
            {[
              { label: 'Core Engine Modes', value: dump.summaryMetrics.coreEngineModes },
              { label: 'Standalone Modules', value: dump.summaryMetrics.standaloneModules },
              { label: 'ALT 5 Categories', value: dump.summaryMetrics.alt5Categories },
              { label: 'Partial Fractions Bank', value: dump.summaryMetrics.partialFractionsBankSize },
              { label: 'Rendered Samples', value: totalSampleCount },
              { label: 'Audit Findings', value: dump.improvementAudit.length },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
              >
                <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 01: Site Feature & Architecture Inventory */}
        {showAudit && (
          <section id="section-inventory" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                01. Site Architecture &amp; Feature Inventory
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Core session mechanics, custom builder, rendering engines, and input UX patterns.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dump.siteInventory.map((area) => (
                <div
                  key={area.title}
                  className="print-avoid-break rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {area.title}
                    </h3>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {area.route}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {area.summary}
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 list-disc pl-4">
                    {area.details.map((d, i) => (
                      <li key={i} className="leading-relaxed">
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 02: Improvement Areas & Known Issues */}
        {showAudit && (
          <section id="section-audit" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                02. Prioritized Areas for Improvement &amp; Known Bugs
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Actionable technical, UX, and curriculum gaps identified from full codebase inspection.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900/50">
                    <th className="py-3 px-4 font-semibold w-24">Priority</th>
                    <th className="py-3 px-4 font-semibold w-40">Category</th>
                    <th className="py-3 px-4 font-semibold">Finding &amp; Impact</th>
                    <th className="py-3 px-4 font-semibold">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {dump.improvementAudit.map((item) => (
                    <tr key={item.id} className="print-avoid-break align-top">
                      <td className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap">
                        <span
                          className={
                            item.priority === 'High'
                              ? 'text-rose-700 dark:text-rose-400'
                              : item.priority === 'Medium'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {item.impact}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.recommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section 03+: Curriculum Question Banks */}
        <section id="section-questions" className="space-y-12">
          {visibleSections.map((sec, secIdx) => {
            if (sec.id === 'alt5') {
              return (
                <div
                  key={sec.id}
                  id="section-alt5"
                  className="print-break-before space-y-8 pt-4"
                >
                  <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Standalone Module · Route /8seal/alt5-practice · Direct KaTeX + SVG Diagrams
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                      {String(secIdx + 3).padStart(2, '0')}. {sec.label}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {sec.subtitle}. Supports Standard, Challenging, and Mixed difficulty modes, Multiple Choice or Self-Check reveal, 15-question rounds, and category mastery tracking.
                    </p>
                  </div>

                  <div className="space-y-8">
                    {dump.alt5Bank.map((cat) => (
                      <div key={cat.categoryId} className="space-y-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Category {cat.categoryId}. {cat.categoryTitle}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            {cat.samples.length} procedural samples (Standard &amp; Challenging)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {cat.samples.map((q) => (
                            <div
                              key={q.id}
                              className="print-avoid-break rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
                            >
                              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>
                                  Difficulty: <strong className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{q.difficulty}</strong>
                                </span>
                                <span>
                                  {q.graphOptions
                                    ? '4 Graph Options'
                                    : q.tableData
                                    ? 'Table + Restricted Graph'
                                    : '4 KaTeX Options'}
                                </span>
                              </div>

                              <div className="text-sm text-slate-900 dark:text-slate-100">
                                <MixedTextKatex content={q.promptLatex} />
                              </div>

                              {/* Optional Table Data (Category 8) */}
                              {q.tableData && q.tableData.length > 0 && (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-center border border-slate-200 dark:border-slate-700 tabular-nums">
                                    <tbody>
                                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                                        <th className="py-1 px-2 font-semibold italic">x</th>
                                        {q.tableData.map((row, rIdx) => (
                                          <td key={rIdx} className="py-1 px-2 border-l border-slate-200 dark:border-slate-700">
                                            {row.x}
                                          </td>
                                        ))}
                                      </tr>
                                      <tr>
                                        <th className="py-1 px-2 font-semibold italic">y</th>
                                        {q.tableData.map((row, rIdx) => (
                                          <td key={rIdx} className="py-1 px-2 border-l border-slate-200 dark:border-slate-700">
                                            {row.y}
                                          </td>
                                        ))}
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* Graph Options (Categories 1 & 9) */}
                              {q.graphOptions && q.graphOptions.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                  {q.graphOptions.map((gData, gIdx) => {
                                    const letter = ['A', 'B', 'C', 'D'][gIdx];
                                    const isRight = showAnswers && q.correctOptionIndex === gIdx;
                                    return (
                                      <Alt5GraphCard
                                        key={gIdx}
                                        graphData={gData}
                                        label={letter}
                                        isCorrect={isRight}
                                        disabled
                                      />
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-1.5">
                                  {q.options.map((opt, optIdx) => {
                                    const letter = ['A', 'B', 'C', 'D'][optIdx];
                                    const isRight = showAnswers && q.correctOptionIndex === optIdx;
                                    return (
                                      <div
                                        key={optIdx}
                                        className={`rounded-lg border px-2.5 py-1.5 text-xs overflow-x-auto ${
                                          isRight
                                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-slate-900 dark:text-slate-100'
                                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        <span className="font-semibold text-slate-500 mr-1.5">
                                          {letter}.
                                        </span>
                                        <SafeKatex tex={opt} />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Accompanying Solution Graph (e.g. Category 8) */}
                              {showAnswers && q.graphData && !q.graphOptions && (
                                <div className="max-w-[320px] mx-auto">
                                  <Alt5Graph graphData={q.graphData} width={360} height={270} />
                                </div>
                              )}

                              {/* Worked Solution */}
                              {showAnswers && q.workedSolutionLatex && q.workedSolutionLatex.length > 0 && (
                                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                    Worked Solution (Correct: {['A', 'B', 'C', 'D'][q.correctOptionIndex]}):
                                  </div>
                                  <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                                    {q.workedSolutionLatex.map((step, sIdx) => (
                                      <div key={sIdx} className="overflow-x-auto">
                                        <SafeKatex tex={step} />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {showRawSpecs && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 break-all">
                                  Prompt raw: {q.promptLatex}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            const sectionCoreModes = dump.coreModes.filter((m) => m.spec.section === sec.id);
            const sectionStandalones = dump.standaloneModules.filter((m) => m.section === sec.id);
            const includePartialFractions = sec.id === 'spec11';

            return (
              <div
                key={sec.id}
                className={`${secIdx > 0 ? 'print-break-before' : ''} space-y-8 pt-4`}
              >
                <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    Curriculum Section · {sectionCoreModes.length} core modes
                    {sectionStandalones.length + (includePartialFractions ? 1 : 0) > 0
                      ? ` · ${sectionStandalones.length + (includePartialFractions ? 1 : 0)} standalone modules`
                      : ''}
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                    {String(secIdx + 3).padStart(2, '0')}. {sec.label}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {sec.subtitle}
                  </p>
                </div>

                {/* Core Engine Modes in this Section */}
                <div className="space-y-8">
                  {sectionCoreModes.map((bundle) => (
                    <div key={bundle.spec.mode} className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {bundle.spec.title}
                          </h3>
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            GameMode.{bundle.spec.mode.toUpperCase()} · {bundle.spec.route}
                          </span>
                        </div>

                        {showRawSpecs && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1">
                            <div>
                              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                                Question Format:
                              </strong>{' '}
                              {bundle.spec.questionFormat}
                            </div>
                            <div>
                              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                                Input Mechanic:
                              </strong>{' '}
                              {bundle.spec.inputMechanic}
                            </div>
                            <div>
                              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                                Validation:
                              </strong>{' '}
                              {bundle.spec.validationNotes}
                            </div>
                            <div>
                              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                                Visual Aid:
                              </strong>{' '}
                              {bundle.spec.visualAid}
                            </div>
                            <div>
                              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                                Progression:
                              </strong>{' '}
                              {bundle.spec.difficultyProgression}
                            </div>
                            <div>
                              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                                Source:
                              </strong>{' '}
                              <span className="font-mono">{bundle.spec.generatorSource}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div
                        className={`grid gap-4 ${
                          bundle.spec.mode === GameMode.METHODS_GRAPHS
                            ? 'grid-cols-1 lg:grid-cols-2'
                            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        }`}
                      >
                        {bundle.samples.map((sample, idx) =>
                          renderCoreSampleCard(bundle, sample, idx)
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Standalone Modules in this Section */}
                {sectionStandalones.map((mod) => (
                  <div key={mod.id} className="space-y-4 pt-4 border-t border-slate-200/70 dark:border-slate-800/70">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {mod.title}
                        </h3>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          Standalone Route · {mod.route}
                        </span>
                      </div>

                      {showRawSpecs && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1">
                          <div>
                            <strong className="font-semibold text-slate-800 dark:text-slate-200">
                              Renderer:
                            </strong>{' '}
                            {mod.rendererEngine}
                          </div>
                          <div>
                            <strong className="font-semibold text-slate-800 dark:text-slate-200">
                              Bank / Templates:
                            </strong>{' '}
                            {mod.bankSize}
                          </div>
                          <div>
                            <strong className="font-semibold text-slate-800 dark:text-slate-200">
                              Question Format:
                            </strong>{' '}
                            {mod.questionFormat}
                          </div>
                          <div>
                            <strong className="font-semibold text-slate-800 dark:text-slate-200">
                              Input Mechanic:
                            </strong>{' '}
                            {mod.inputMechanic}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mod.samples.map((item) => (
                        <div
                          key={item.id}
                          className="print-avoid-break rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
                        >
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {item.label}
                          </div>
                          <div className="py-1 text-base overflow-x-auto">
                            <SafeKatex tex={item.promptLatex} displayMode />
                          </div>
                          {showAnswers && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                              <div className="flex items-baseline gap-2 text-sm">
                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                  Final:
                                </span>
                                <SafeKatex tex={item.answerLatex} />
                              </div>
                              {item.stages && (
                                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                  {item.stages.map((st, sIdx) => (
                                    <div key={sIdx} className="overflow-x-auto">
                                      <span className="font-medium text-slate-500 dark:text-slate-400 mr-1.5">
                                        {st.label}:
                                      </span>
                                      <SafeKatex tex={st.contentLatex} />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Complete 11 Specialist Partial Fractions Curated Bank */}
                {includePartialFractions && (
                  <div className="space-y-4 pt-4 border-t border-slate-200/70 dark:border-slate-800/70">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          Partial Fraction Decompositions (Full 11-Problem Curated Bank)
                        </h3>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          Standalone Route · /11spec/partial-fractions
                        </span>
                      </div>
                      {showRawSpecs && (
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          <strong className="font-semibold text-slate-800 dark:text-slate-200">
                            Workflow:
                          </strong>{' '}
                          2-step interactive workspace — Step 1 auto-bracket denominator factorisation (mathjs equivalence verified) → Step 2 dynamic partial fraction term builder validating constant (A) vs linear (Bx+C) numerator degree per factor.
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dump.partialFractionsBank.map((pf) => {
                        const setupLatex = pf.expectedTerms
                          .map((t) => `\\frac{${t.suggestedNumerator}}{${t.latexDenominator}}`)
                          .join(' + ');
                        return (
                          <div
                            key={pf.id}
                            className="print-avoid-break rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2.5"
                          >
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {pf.title}
                              </span>
                              <span className="capitalize">
                                {pf.category} · {pf.difficulty}
                              </span>
                            </div>

                            <div className="py-1 overflow-x-auto">
                              <SafeKatex
                                tex={`\\frac{${pf.numeratorLatex}}{${pf.denominatorUnfactoredLatex}}`}
                                displayMode
                              />
                            </div>

                            {showAnswers && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                                <div className="overflow-x-auto">
                                  <span className="font-semibold text-slate-500 mr-1.5">
                                    Step 1 (Factored):
                                  </span>
                                  <SafeKatex tex={pf.denominatorFactoredLatex} />
                                </div>
                                <div className="overflow-x-auto">
                                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 mr-1.5">
                                    Step 2 (Setup Form):
                                  </span>
                                  <SafeKatex tex={setupLatex} />
                                </div>
                                {pf.solvedCoefficientsLatex && (
                                  <div className="overflow-x-auto">
                                    <span className="font-semibold text-slate-500 mr-1.5">
                                      Solved Coefficients:
                                    </span>
                                    <SafeKatex tex={pf.solvedCoefficientsLatex} />
                                  </div>
                                )}
                                {pf.discriminantInfo && (
                                  <div className="overflow-x-auto text-slate-500 dark:text-slate-400">
                                    <SafeKatex tex={pf.discriminantInfo} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Quiet Document Footer */}
        <footer className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>MathFlow Trainer — External Reviewer Specification &amp; Question Dump</span>
          <span className="tabular-nums">
            Generated {new Date(dump.generatedAt).toLocaleString()}
          </span>
        </footer>
      </main>
    </div>
  );
};

export default ReviewerExport;
