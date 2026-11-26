import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CB from '../utils/congruenceBank';
import type { CBQuestion } from '../utils/congruenceBank';

/* -----------------------------------------------------------------------------
 * 9 SEAL: Congruent triangles practice
 * Vertex mappings, choosing the congruence test, and writing out matching pairs.
 * All questions, diagrams and answer checking come from utils/congruenceBank.js.
 * -------------------------------------------------------------------------- */

type Level = 1 | 2 | 3;
interface ModeDef {
  title: string;
  blurb: string;
  fixedLevel?: Level;
  levels: Record<Level, { type: string; opts?: Record<string, unknown> }[]>;
}

export const CONGRUENCE_MODES: Record<string, ModeDef> = {
  mappings: {
    title: 'Vertex Mappings',
    blurb: 'Match each corner of one triangle to the matching corner of the other.',
    levels: {
      1: [{ type: 'map-from-statement' }, { type: 'map-pair' }, { type: 'statement-from-map' }],
      2: [{ type: 'map-pair' }, { type: 'map-pair' }, { type: 'statement-from-diagram' }, { type: 'map-fix', opts: { shared: false } }],
      3: [{ type: 'map-shared' }, { type: 'map-fix' }, { type: 'statement-from-diagram' }, { type: 'map-from-statement' }],
    },
  },
  shared: {
    title: 'Shared Corners & Sides',
    blurb: 'Kites, parallelograms, bowties and overlapping triangles. Does the shared corner stay put or swap?',
    fixedLevel: 3,
    levels: { 1: [], 2: [], 3: [{ type: 'map-shared' }, { type: 'map-shared' }, { type: 'map-fix', opts: { shared: true } }] },
  },
  tests: {
    title: 'Choose the Test',
    blurb: 'SSS, SAS, AAS or RHS? Read the markings carefully.',
    levels: {
      1: [{ type: 'choose-test' }],
      2: [{ type: 'choose-test' }],
      3: [{ type: 'choose-test', opts: { includeNotEnough: true } }],
    },
  },
  pairs: {
    title: 'Matching Pairs',
    blurb: 'Pick the test, then write the three pairs of equal sides and angles.',
    levels: {
      1: [{ type: 'write-pairs' }],
      2: [{ type: 'write-pairs' }, { type: 'write-pairs' }, { type: 'missing-fact' }],
      3: [{ type: 'write-pairs' }, { type: 'missing-fact' }],
    },
  },
  proofs: {
    title: 'Full Proofs',
    blurb: 'Mapping, three pairs with reasons, then the test.',
    fixedLevel: 3,
    levels: { 1: [], 2: [], 3: [{ type: 'full-proof' }, { type: 'full-proof' }, { type: 'write-pairs' }] },
  },
  mixed: {
    title: 'Mixed Practice',
    blurb: 'A bit of everything.',
    levels: {
      1: [{ type: 'map-pair' }, { type: 'map-from-statement' }, { type: 'choose-test' }, { type: 'write-pairs' }, { type: 'statement-from-map' }],
      2: [{ type: 'map-pair' }, { type: 'statement-from-diagram' }, { type: 'choose-test' }, { type: 'write-pairs' }, { type: 'missing-fact' }, { type: 'map-fix', opts: { shared: false } }],
      3: [{ type: 'map-shared' }, { type: 'map-fix' }, { type: 'choose-test', opts: { includeNotEnough: true } }, { type: 'write-pairs' }, { type: 'full-proof' }],
    },
  },
};

const LEVEL_NAMES: Record<Level, string> = { 1: 'Warm-up', 2: 'Core', 3: 'Shared sides' };
const ROUND_LENGTH = 10;

const SLIP_LABELS: Record<string, string> = {
  'shared-swapped': 'Swapping corners that both triangles share',
  'shared-should-stay': 'Moving a shared corner that should map to itself',
  'shared-should-swap': 'Missing that the ends of a shared side swap',
  alphabetical: 'Matching letters in alphabetical order',
  'two-swapped': 'Two corners the wrong way round',
  'wrong-vertex': 'Matching a corner to the wrong vertex',
  'from-same-triangle': 'Using a letter from the same triangle',
  'not-matching': 'Pairs that do not correspond',
  'true-but-not-marked': 'Using a fact that is not marked',
  'ambiguous-angle': 'One-letter angle names at a busy corner',
  'wrong-test': 'Choosing the wrong test',
  'letters-order': 'Statement letters in the wrong order',
  reason: 'Choosing the wrong reason',
  format: 'Typing a side or angle in the wrong format',
};

function pickQuestion(modeKey: string, level: Level, seed?: number): CBQuestion {
  const mode = CONGRUENCE_MODES[modeKey] || CONGRUENCE_MODES.mixed;
  const lv = mode.fixedLevel || level;
  const list = mode.levels[lv];
  const item = list[Math.floor(Math.random() * list.length)];
  const allowed = CB.TYPES[item.type].difficulties;
  const d = allowed.includes(lv) ? lv : allowed.reduce((a, b) => (Math.abs(b - lv) < Math.abs(a - lv) ? b : a));
  return CB.generate(item.type, { difficulty: d, ...(item.opts || {}), ...(seed !== undefined ? { seed } : {}) });
}

// ---------------------------------------------------------------- shared bits
type Report = { wrong: (code?: string) => void; solved: () => void };
type FocusTarget = React.MutableRefObject<((letter: string) => void) | null>;

const letterBox =
  'w-12 h-12 sm:w-14 sm:h-14 text-center text-2xl font-serif italic uppercase rounded-xl border-2 outline-none transition-colors bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100';
const boxState = (s?: string) =>
  s === 'correct'
    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
    : s === 'wrong'
      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40'
      : 'border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20';

const clean = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, '');

// ---------------------------------------------------------------- mapping rows (vertical, aligned on the arrow)
const MappingInput: React.FC<{
  q: CBQuestion; spec: { rows: string[]; prefill?: Record<string, string>; allowConfirm?: boolean };
  report: Report; focusTarget: FocusTarget; setMsg: (tone: string, m: string) => void;
}> = ({ q, spec, report, focusTarget, setMsg }) => {
  const [vals, setVals] = useState<Record<string, string>>(() => ({ ...(spec.prefill || {}) }));
  const [state, setState] = useState<Record<string, { status: string; code?: string; message?: string }>>({});
  const [done, setDone] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const evaluate = useCallback((next: Record<string, string>, changed?: string) => {
    const st: Record<string, { status: string; code?: string; message?: string }> = {};
    spec.rows.forEach(l => { st[l] = CB.checkMappingRow(q, l, next[l] || ''); });
    setState(st);
    if (changed && st[changed].status === 'wrong') report.wrong(st[changed].code);
    if (spec.rows.every(l => next[l])) {
      const r = CB.checkMapping(q, next);
      if (r.correct) { setDone(true); report.solved(); }
      else if (r.messages.length) { setMsg('bad', r.messages.join(' ')); if (r.code === 'shared-swapped' || r.code === 'alphabetical') report.wrong(r.code); }
    }
  }, [q, spec.rows, report, setMsg]);

  const setLetter = (i: number, raw: string) => {
    if (done) return;
    const l = spec.rows[i];
    const letter = clean(raw).slice(-1);
    const next = { ...vals, [l]: letter };
    setVals(next);
    evaluate(next, letter ? l : undefined);
    if (letter && i + 1 < spec.rows.length) refs.current[i + 1]?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-grid grid-cols-[2rem_2rem_auto_1fr] items-center gap-x-2 gap-y-3">
        {spec.rows.map((l, i) => (
          <React.Fragment key={l}>
            <span className="text-3xl font-serif italic text-right text-slate-800 dark:text-slate-100">{l}</span>
            <span className="text-2xl text-center text-slate-400">↦</span>
            <input
              ref={el => { refs.current[i] = el; }}
              aria-label={`${l} maps to`}
              autoComplete="off" autoCapitalize="characters" inputMode="text"
              value={vals[l] || ''}
              disabled={done}
              onFocus={() => { focusTarget.current = (v: string) => setLetter(i, v); }}
              onChange={e => setLetter(i, e.target.value)}
              onKeyDown={e => { if (e.key === 'Backspace' && !vals[l] && i > 0) refs.current[i - 1]?.focus(); }}
              className={`${letterBox} ${boxState(state[l]?.status)}`}
            />
            <span className={`text-sm font-medium ${state[l]?.status === 'correct' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {state[l]?.status === 'correct' ? '✓' : state[l]?.status === 'wrong' ? state[l]?.message : ''}
            </span>
          </React.Fragment>
        ))}
      </div>
      {spec.allowConfirm && !done && (
        <button
          onClick={() => {
            const r = CB.checkMapping(q, vals);
            if (r.correct) { setDone(true); report.solved(); }
            else { report.wrong(q.proposedError && q.proposedError !== 'none' ? q.proposedError : 'two-swapped'); evaluate(vals); setMsg('bad', 'Not yet: at least one row is wrong. Check each corner against the markings.'); }
          }}
          className="self-start px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 transition"
        >
          It’s correct
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- statement letters
const LettersInput: React.FC<{ q: CBQuestion; spec: { prefix: string; count: number }; report: Report; focusTarget: FocusTarget; setMsg: (t: string, m: string) => void }> =
  ({ q, spec, report, focusTarget, setMsg }) => {
    const [vals, setVals] = useState<string[]>(Array(spec.count).fill(''));
    const [pos, setPos] = useState<string[]>([]);
    const [done, setDone] = useState(false);
    const refs = useRef<(HTMLInputElement | null)[]>([]);
    const setLetter = (i: number, raw: string) => {
      if (done) return;
      const next = vals.slice(); next[i] = clean(raw).slice(-1); setVals(next);
      const r = CB.checkLetters(q, next.map(v => v || '?').join(''));
      setPos(r.positions);
      if (next[i] && r.positions[i] === 'wrong') report.wrong('letters-order');
      if (next.every(Boolean)) {
        const full = CB.checkLetters(q, next.join(''));
        if (full.correct) { setDone(true); report.solved(); } else if (full.messages[0]) setMsg('bad', full.messages[0]);
      }
      if (next[i] && i + 1 < spec.count) refs.current[i + 1]?.focus();
    };
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-2xl font-serif text-slate-800 dark:text-slate-100 mr-1">{spec.prefix}</span>
        {vals.map((v, i) => (
          <input key={i} ref={el => { refs.current[i] = el; }} value={v} disabled={done} autoComplete="off"
            aria-label={`letter ${i + 1}`}
            onFocus={() => { focusTarget.current = (x: string) => setLetter(i, x); }}
            onChange={e => setLetter(i, e.target.value)}
            onKeyDown={e => { if (e.key === 'Backspace' && !v && i > 0) refs.current[i - 1]?.focus(); }}
            className={`${letterBox} ${boxState(v ? (pos[i] === 'correct' ? 'correct' : pos[i] === 'wrong' ? 'wrong' : '') : '')}`} />
        ))}
      </div>
    );
  };

// ---------------------------------------------------------------- test buttons
const TestButtons: React.FC<{ q: CBQuestion; options: { value: string; label: string }[]; report: Report; setMsg: (t: string, m: string) => void; quietSuccess?: boolean }> =
  ({ q, options, report, setMsg, quietSuccess }) => {
    const [marks, setMarks] = useState<Record<string, 'ok' | 'no'>>({});
    const [done, setDone] = useState(false);
    return (
      <div className="flex flex-wrap gap-3">
        {options.map(o => (
          <button key={o.value} disabled={done}
            onClick={() => {
              const r = CB.checkTest(q, o.value);
              setMarks(m => ({ ...m, [o.value]: r.correct ? 'ok' : 'no' }));
              if (r.correct) { setDone(true); report.solved(); if (!quietSuccess) setMsg('good', r.message); }
              else { report.wrong('wrong-test'); setMsg('bad', r.message); }
            }}
            className={`min-w-[5.5rem] px-5 py-4 rounded-2xl border-b-4 text-xl font-black tracking-tight shadow-md transition active:scale-95 ${
              marks[o.value] === 'ok' ? 'bg-emerald-500 border-emerald-700 text-white'
                : marks[o.value] === 'no' ? 'bg-rose-100 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
            }`}>
            {o.label}
          </button>
        ))}
      </div>
    );
  };

// ---------------------------------------------------------------- one "left = right" element box
const ElBox: React.FC<{ kind: string; value: string; readOnly?: boolean; status?: string; onChange: (v: string) => void; onCommit: () => void; focusTarget: FocusTarget; label: string }> =
  ({ kind, value, readOnly, status, onChange, onCommit, focusTarget, label }) => {
    const isAngle = kind === 'A' || kind === 'R';
    const max = isAngle ? 3 : 2;
    return (
      <span className={`inline-flex items-center rounded-xl border-2 px-2 bg-white dark:bg-slate-900 ${boxState(status)}`}>
        {isAngle && <span className="text-xl font-serif text-slate-400 mr-0.5">∠</span>}
        <input value={value} readOnly={readOnly} aria-label={label} autoComplete="off" placeholder={isAngle ? 'ABC' : 'AB'}
          onFocus={() => { if (!readOnly) focusTarget.current = (x: string) => { onChange((value + x).slice(0, max)); }; }}
          onChange={e => onChange(clean(e.target.value).slice(0, max))}
          onBlur={onCommit}
          onKeyDown={e => { if (e.key === 'Enter') onCommit(); }}
          className="w-16 h-11 bg-transparent outline-none text-xl font-serif italic uppercase text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:not-italic" />
      </span>
    );
  };

// ---------------------------------------------------------------- matching pairs (+ optional test and reasons)
const PairsInput: React.FC<{ q: CBQuestion; spec: any; report: Report; focusTarget: FocusTarget; setMsg: (t: string, m: string) => void; quietSuccess?: boolean }> =
  ({ q, spec, report, focusTarget, setMsg, quietSuccess }) => {
    const [rows, setRows] = useState<{ left: string; right: string; reason: string }[]>(
      () => spec.rows.map((r: any) => ({ left: r.left ? r.left.replace('∠', '') : '', right: '', reason: '' })));
    const [status, setStatus] = useState<{ status?: string; message?: string; reasonOk?: boolean }[]>([]);
    const [testDone, setTestDone] = useState(!spec.askTest);
    const [done, setDone] = useState(false);

    const lastSeen = useRef<string[]>([]);
    const evaluateRow = (i: number, list = rows, force = false) => {
      const r = list[i];
      if (!r.left || !r.right) return;
      const sig = `${r.left}=${r.right}|${r.reason}|${testDone}`;
      if (!force && lastSeen.current[i] === sig) return;
      lastSeen.current[i] = sig;
      const res = CB.checkPair(q, r.left, r.right, spec.rows[i].kind);
      let reasonOk: boolean | undefined;
      if (res.status === 'correct' && spec.askReasons && r.reason) {
        const want = (q.answer.pairs as any[]).find(p => CB.checkPair(q, p.left, p.right, p.kind).key === res.key);
        reasonOk = want ? want.reason === r.reason : undefined;
        if (reasonOk === false) report.wrong('reason');
      }
      if (res.status !== 'correct') report.wrong(res.code || 'not-matching');
      setStatus(s => { const n = s.slice(); n[i] = { status: res.status, message: res.message, reasonOk }; return n; });
      const all = CB.checkPairs(q, { pairs: list.map(x => ({ left: x.left, right: x.right, reason: spec.askReasons ? x.reason : undefined })) });
      const reasonsFilled = !spec.askReasons || list.every(x => x.reason);
      if (all.correct && reasonsFilled && testDone && !done) { setDone(true); report.solved(); if (!quietSuccess) setMsg('good', q.explanation); }
      else if (!all.correct && all.messages.length && list.every(x => x.left && x.right)) setMsg('bad', all.messages.join(' '));
    };

    // the last row may complete the answer only after the test is chosen
    useEffect(() => { if (testDone) rows.forEach((_, i) => evaluateRow(i, rows, true)); // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testDone]);

    const update = (i: number, patch: Partial<{ left: string; right: string; reason: string }>, commit = false) => {
      const next = rows.map((r, j) => (j === i ? { ...r, ...patch } : r));
      setRows(next);
      if (commit) evaluateRow(i, next);
    };

    return (
      <div className="flex flex-col gap-4">
        {spec.askTest && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-black uppercase tracking-widest text-slate-400">Which test?</span>
            <TestButtons q={q} options={spec.options} report={{ wrong: report.wrong, solved: () => setTestDone(true) }} setMsg={setMsg} quietSuccess />
          </div>
        )}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-black uppercase tracking-widest text-slate-400">Matching pairs</span>
          {spec.rows.map((row: any, i: number) => {
            const st = status[i]?.status === 'correct' ? (status[i]?.reasonOk === false ? 'wrong' : 'correct') : status[i]?.status ? 'wrong' : '';
            return (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <span className="w-24 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{row.kindLabel}</span>
                <ElBox kind={row.kind} value={rows[i].left} readOnly={!!row.left} status={st} label={`${row.kindLabel} ${i + 1}, left`}
                  focusTarget={focusTarget} onChange={v => update(i, { left: v })} onCommit={() => evaluateRow(i)} />
                <span className="text-xl text-slate-400">=</span>
                <ElBox kind={row.kind} value={rows[i].right} status={st} label={`${row.kindLabel} ${i + 1}, right`}
                  focusTarget={focusTarget} onChange={v => update(i, { right: v }, v.length === (row.kind === 'A' || row.kind === 'R' ? 3 : 2))} onCommit={() => evaluateRow(i)} />
                {spec.askReasons && (
                  <select value={rows[i].reason} onChange={e => update(i, { reason: e.target.value }, true)}
                    className={`h-12 rounded-xl border-2 px-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 ${status[i]?.reasonOk === false ? 'border-rose-500' : status[i]?.reasonOk ? 'border-emerald-500' : 'border-slate-200 dark:border-slate-600'}`}>
                    <option value="">Reason…</option>
                    {spec.reasonOptions.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                )}
                <span className={`basis-full sm:basis-auto text-sm ${st === 'correct' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {st === 'correct' ? '✓' : status[i]?.reasonOk === false ? 'Check the reason.' : status[i]?.message || ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

// ---------------------------------------------------------------- missing fact
const FactInput: React.FC<{ q: CBQuestion; spec: { expect: string }; report: Report; focusTarget: FocusTarget; setMsg: (t: string, m: string) => void }> =
  ({ q, spec, report, focusTarget, setMsg }) => {
    const kind = spec.expect === 'angle' ? 'A' : 'S';
    const [l, setL] = useState(''); const [r, setR] = useState(''); const [st, setSt] = useState('');
    const [done, setDone] = useState(false);
    const go = () => {
      if (!l || !r || done) return;
      const res = CB.checkFact(q, { left: l, right: r });
      setSt(res.correct ? 'correct' : 'wrong');
      if (res.correct) { setDone(true); report.solved(); setMsg('good', res.message); }
      else { report.wrong(res.row?.code || 'not-matching'); setMsg('bad', res.message); }
    };
    return (
      <div className="flex flex-wrap items-center gap-2">
        <ElBox kind={kind} value={l} status={st} label="left" focusTarget={focusTarget} onChange={setL} onCommit={go} />
        <span className="text-xl text-slate-400">=</span>
        <ElBox kind={kind} value={r} status={st} label="right" focusTarget={focusTarget} onChange={setR} onCommit={go} />
        <button onClick={go} className="px-5 h-12 rounded-xl bg-indigo-600 text-white font-bold active:scale-95">Check</button>
      </div>
    );
  };

// ---------------------------------------------------------------- full proof: three steps unlock in turn
const StepsInput: React.FC<{ q: CBQuestion; spec: any; report: Report; focusTarget: FocusTarget; setMsg: (t: string, m: string) => void }> =
  ({ q, spec, report, focusTarget, setMsg }) => {
    const [stage, setStage] = useState(0);
    const sub = (k: number): Report => ({
      wrong: report.wrong,
      solved: () => { setStage(s => Math.max(s, k + 1)); if (k === 2) report.solved(); else setMsg('good', k === 0 ? 'Mapping correct. Now the three pairs.' : 'Pairs correct. Which test is it?'); },
    });
    const titles = ['1. Vertex mapping', '2. Three matching pairs, with reasons', '3. Congruence test'];
    return (
      <div className="flex flex-col gap-5">
        {[0, 1, 2].map(k => (
          <div key={k} className={k > stage ? 'opacity-40 pointer-events-none' : ''}>
            <div className="text-sm font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">{titles[k]}</div>
            {k === 0 && <MappingInput q={q} spec={spec.steps[0]} report={sub(0)} focusTarget={focusTarget} setMsg={setMsg} />}
            {k === 1 && <PairsInput q={q} spec={spec.steps[1]} report={sub(1)} focusTarget={focusTarget} setMsg={setMsg} quietSuccess />}
            {k === 2 && <TestButtons q={q} options={spec.steps[2].options} report={sub(2)} setMsg={setMsg} quietSuccess />}
          </div>
        ))}
      </div>
    );
  };

// ---------------------------------------------------------------- page
const CongruencePracticeInner: React.FC = () => {
  const navigate = useNavigate();
  const { mode: modeParam } = useParams();
  const modeKey = modeParam && CONGRUENCE_MODES[modeParam] ? modeParam : 'mixed';
  const mode = CONGRUENCE_MODES[modeKey];

  const [level, setLevel] = useState<Level>(mode.fixedLevel || 2);
  const [q, setQ] = useState<CBQuestion>(() => pickQuestion(modeKey, mode.fixedLevel || 2));
  const [qKey, setQKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [slips, setSlips] = useState<Record<string, number>>({});
  const [wrongThisQ, setWrongThisQ] = useState(false);
  const [solved, setSolved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [msg, setMsgState] = useState<{ tone: string; text: string } | null>(null);
  const [hintIdx, setHintIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const focusTarget = useRef<((letter: string) => void) | null>(null);

  const setMsg = useCallback((tone: string, text: string) => setMsgState({ tone, text }), []);

  const report = useMemo<Report>(() => ({
    wrong: (code?: string) => {
      setWrongThisQ(true);
      if (code) setSlips(s => ({ ...s, [code]: (s[code] || 0) + 1 }));
    },
    solved: () => setSolved(true),
  }), []);

  useEffect(() => { if (solved) setMsg('good', 'Correct! ' + q.explanation); }, [solved]); // eslint-disable-line react-hooks/exhaustive-deps

  const startQuestion = (lv: Level) => {
    setQ(pickQuestion(modeKey, lv));
    setQKey(k => k + 1);
    setWrongThisQ(false); setSolved(false); setRevealed(false); setMsgState(null); setHintIdx(0);
    focusTarget.current = null;
  };

  const next = () => {
    const nextResults = [...results, solved && !wrongThisQ && !revealed];
    setResults(nextResults);
    if (nextResults.length >= ROUND_LENGTH) { setFinished(true); return; }
    setIndex(i => i + 1);
    startQuestion(level);
  };

  const restart = (lv: Level = level) => {
    setLevel(lv); setResults([]); setSlips({}); setIndex(0); setFinished(false); startQuestion(lv);
  };

  // tap a vertex letter in the diagram to type it into the focused box
  const onFigureDown = (e: React.MouseEvent | React.TouchEvent) => {
    const t = (e.target as Element).closest('.cb-letter') as SVGTextElement | null;
    if (!t || !focusTarget.current) return;
    e.preventDefault();
    focusTarget.current(t.getAttribute('data-vertex') || '');
  };

  const kind = q.input.kind;
  const firstTry = results.filter(Boolean).length;
  const topSlips = (Object.entries(slips) as [string, number][]).sort((a, b) => b[1] - a[1]).slice(0, 3);

  if (finished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center">
          <div className="text-sm font-black uppercase tracking-widest text-indigo-500 mb-2">{mode.title}</div>
          <div className="text-6xl font-black text-slate-800 dark:text-slate-100 mb-1">{firstTry}/{ROUND_LENGTH}</div>
          <div className="text-slate-500 dark:text-slate-400 mb-6">correct first time</div>
          {topSlips.length > 0 ? (
            <div className="text-left bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-5 mb-6">
              <div className="font-bold text-amber-800 dark:text-amber-300 mb-2">Things to watch</div>
              <ul className="space-y-1 text-amber-900 dark:text-amber-200">
                {topSlips.map(([code, n]) => <li key={code}>• {SLIP_LABELS[code] || code} <span className="opacity-60">({n})</span></li>)}
              </ul>
            </div>
          ) : <div className="mb-6 text-emerald-600 dark:text-emerald-400 font-bold">No slips at all. Brilliant!</div>}
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => restart()} className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-wide active:scale-95">Another round</button>
            {!mode.fixedLevel && level < 3 && (
              <button onClick={() => restart((level + 1) as Level)} className="px-6 py-3 rounded-2xl bg-violet-600 text-white font-black uppercase tracking-wide active:scale-95">Level up: {LEVEL_NAMES[(level + 1) as Level]}</button>
            )}
            <button onClick={() => navigate('/9seal')} className="px-6 py-3 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black uppercase tracking-wide active:scale-95">9 SEAL menu</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-900">
      {/* top bar */}
      <div className="w-full max-w-3xl flex flex-wrap items-center gap-3 mb-4">
        <button onClick={() => navigate('/9seal')} className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 shadow font-bold text-slate-600 dark:text-slate-300 active:scale-95">← 9 SEAL</button>
        <div className="flex-1 min-w-[10rem]">
          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-tight">{mode.title}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{mode.blurb}</div>
        </div>
        {!mode.fixedLevel && (
          <div className="flex rounded-xl bg-white dark:bg-slate-800 shadow p-1">
            {([1, 2, 3] as Level[]).map(lv => (
              <button key={lv} onClick={() => restart(lv)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide ${level === lv ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                {LEVEL_NAMES[lv]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* progress */}
      <div className="w-full max-w-3xl flex gap-1.5 mb-4">
        {Array.from({ length: ROUND_LENGTH }).map((_, i) => (
          <div key={i} className={`h-2 flex-1 rounded-full ${i < results.length ? (results[i] ? 'bg-emerald-500' : 'bg-amber-400') : i === index ? 'bg-indigo-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
        ))}
      </div>

      {/* question card */}
      <div key={qKey} className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-5 sm:p-7">
        <div className="flex items-baseline gap-3 flex-wrap mb-2">
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{q.title}</h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">Question {index + 1} of {ROUND_LENGTH}</span>
        </div>
        <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200 mb-3">{q.prompt}</p>

        {q.showFigure !== false && (
          <div className="flex justify-center mb-5 bg-white rounded-2xl p-2 select-none [&_.cb-letter]:cursor-pointer [&_svg]:max-w-[560px]"
            onMouseDown={onFigureDown} onTouchStart={onFigureDown}
            role="img" aria-label={q.statementGiven || q.type.includes('statement') ? q.statement : 'two congruent triangles'}
            dangerouslySetInnerHTML={{ __html: q.svg }} />
        )}

        <div className="mb-2">
          {kind === 'mapping' && <MappingInput q={q} spec={q.input} report={report} focusTarget={focusTarget} setMsg={setMsg} />}
          {kind === 'letters' && <LettersInput q={q} spec={q.input} report={report} focusTarget={focusTarget} setMsg={setMsg} />}
          {kind === 'test' && <TestButtons q={q} options={q.input.options} report={report} setMsg={setMsg} />}
          {kind === 'pairs' && <PairsInput q={q} spec={q.input} report={report} focusTarget={focusTarget} setMsg={setMsg} />}
          {kind === 'fact' && <FactInput q={q} spec={q.input} report={report} focusTarget={focusTarget} setMsg={setMsg} />}
          {kind === 'steps' && <StepsInput q={q} spec={q.input} report={report} focusTarget={focusTarget} setMsg={setMsg} />}
        </div>

        {msg && (
          <div className={`mt-4 rounded-2xl px-4 py-3 text-base leading-relaxed ${
            msg.tone === 'good' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
              : msg.tone === 'bad' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'}`}>
            {msg.text}
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-5">
          <button onClick={() => { if (!q.hints?.length) return; setMsg('info', q.hints[hintIdx % q.hints.length]); setHintIdx(h => h + 1); }}
            className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 active:scale-95">Hint</button>
          <button onClick={() => { setRevealed(true); setMsg('info', 'Answer: ' + q.explanation); }}
            className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 active:scale-95">Show answer</button>
          <button onClick={next} disabled={!solved && !revealed}
            className="ml-auto px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-wide shadow-md disabled:opacity-40 active:scale-95">
            {results.length + 1 >= ROUND_LENGTH ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400 dark:text-slate-600 max-w-3xl text-center">
        Tip: tap a letter in the diagram to type it into the box you are on. Write mappings one row per corner, lined up on the arrow.
      </p>
    </div>
  );
};

// Remount when the mode in the URL changes, so each mode starts a fresh round
const CongruencePractice: React.FC = () => {
  const { mode } = useParams();
  return <CongruencePracticeInner key={mode || 'mixed'} />;
};

export default CongruencePractice;
