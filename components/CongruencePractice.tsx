import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameType } from '../types';
import { CBQuestion } from '../utils/congruenceBank';
import {
  createTyping, press, keypadKeys, showEl, reasonText, currentRow, REASON_KEYS,
  TypingState, Part, Row,
} from '../utils/congruenceTyping';
import { CONGRUENCE_MODES, MODE_ALIASES, Level, pickQuestion } from './congruenceLevels';

/* ----------------------------------------------------------------------------
 * 9 SEAL congruence practice. Works like the arithmetic pages: type symbols
 * only, each part is checked the moment it is complete, Fixed or Time rounds,
 * streak and questions per minute. The typing rules live in
 * utils/congruenceTyping.ts; the levels in components/congruenceLevels.ts.
 * -------------------------------------------------------------------------- */

const SLIP_LABELS: Record<string, string> = {
  'shared-swapped': 'Swapping corners that both triangles share',
  'shared-should-stay': 'Moving a shared corner that should map to itself',
  'shared-should-swap': 'Missing that the ends of a shared side swap',
  alphabetical: 'Matching letters in alphabetical order',
  'two-swapped': 'Two corners the wrong way round',
  'wrong-vertex': 'Matching a corner to the wrong vertex',
  'from-same-triangle': 'Using a letter from the same triangle',
  'letters-order': 'Statement letters in the wrong order',
  'not-matching': 'Pairs that do not correspond',
  'true-but-not-marked': 'Using a fact that is not marked',
  'same-triangle': 'Both sides of a pair from the same triangle',
  'ambiguous-angle': 'One-letter angle names at a busy corner',
  duplicate: 'Using the same pair twice',
  'wrong-test': 'Choosing the wrong test',
  'test-order': 'Writing the test letters in the wrong order',
  'rhs-sas': 'Calling it RHS when the right angle is between the sides',
  'none-wrong': 'Saying "not enough information" when there is',
  'not-enough': 'Naming a test when there is not enough information',
  asa: 'Using a side BETWEEN the two angles (ASA is not one of our tests)',
  ssa: 'Using an angle that is not between the two sides',
  aaa: 'Using three angles (AAA is not a test)',
  'already-marked': 'Naming a pair that is already marked',
  'other-test': 'A pair that proves a different test',
  reason: 'Choosing the wrong reason',
  format: 'Typing a side or angle in the wrong format',
  'type-mismatch': 'Setting a side equal to an angle',
};

interface Session { correct: number; attempts: number; combo: number; best: number; start: number; end: number | null }
const newSession = (): Session => ({ correct: 0, attempts: 0, combo: 0, best: 0, start: Date.now(), end: null });

// Each section remembers the level a student is up to, so the menu needs no level picker
const LEVEL_KEY = (mode: string) => `cb-level-${mode}`;
const savedLevel = (mode: string): Level => {
  try { const v = Number(localStorage.getItem(LEVEL_KEY(mode))); return (v === 2 || v === 3 ? v : 1) as Level; } catch { return 1; }
};
const saveLevel = (mode: string, l: Level) => { try { localStorage.setItem(LEVEL_KEY(mode), String(l)); } catch { /* storage blocked */ } };
// A round at this accuracy (and, in Time rounds, at least this many correct) moves the student up a level
const LEVEL_UP_ACCURACY = 80, LEVEL_UP_MIN_TIMED = 10;

// ---------------------------------------------------------------- small display pieces
const Slot: React.FC<{ text: string; active?: boolean; state?: 'ok' | 'bad' | ''; wide?: boolean }> = ({ text, active, state, wide }) => (
  <span className={`inline-flex items-end justify-center ${wide ? 'min-w-[3.2rem]' : 'min-w-[1.6rem]'} h-10 px-0.5 border-b-[3px] font-serif italic text-3xl leading-none pb-1 transition-colors
    ${state === 'ok' ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
      : state === 'bad' ? 'border-rose-500 text-rose-600'
        : active ? 'border-indigo-500 text-slate-900 dark:text-white' : 'border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'}`}>
    {text || (active ? <span className="w-0.5 h-7 bg-indigo-500 animate-pulse not-italic" /> : '')}
  </span>
);
const Sym: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-2xl text-slate-400 dark:text-slate-500 px-2 font-serif">{children}</span>
);

const MappingView: React.FC<{ p: Extract<Part, { kind: 'mapping' }>; active: boolean; bad: boolean }> = ({ p, active, bad }) => {
  const next = p.vals.findIndex(v => !v);
  return (
    <div className="inline-grid grid-cols-[auto_auto_auto] items-end gap-x-1 gap-y-2">
      {p.rows.map((l, i) => (
        <React.Fragment key={l}>
          <span className="text-3xl font-serif italic text-right text-slate-800 dark:text-slate-100 pb-1">{l}</span>
          <Sym>↦</Sym>
          <Slot text={p.vals[i]} active={active && i === next} state={p.done || p.locked[i] ? 'ok' : bad && i === next ? 'bad' : ''} />
        </React.Fragment>
      ))}
    </div>
  );
};

const RowView: React.FC<{ r: Row; active: boolean; bad: boolean; askReasons: boolean }> = ({ r, active, bad, askReasons }) => {
  const done = r.stage === 'done';
  const st = done ? 'ok' : '';
  const leftActive = active && r.stage === 'left', rightActive = active && r.stage === 'right', reasonActive = active && r.stage === 'reason';
  return (
    <div className="flex items-end flex-wrap gap-y-2">
      <Slot wide text={showEl(r.left, r.kind)} active={leftActive} state={done ? 'ok' : bad && leftActive ? 'bad' : ''} />
      <Sym>=</Sym>
      <Slot wide text={showEl(r.right, r.kind)} active={rightActive} state={st || (r.stage === 'reason' ? 'ok' : bad && rightActive ? 'bad' : '')} />
      {askReasons && (
        <span className="ml-3 inline-flex items-end">
          <Sym>(</Sym>
          <span className={`min-w-[5rem] h-10 border-b-[3px] text-base font-bold pb-1.5 px-1 inline-flex items-end justify-center ${done ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300' : reasonActive ? (bad ? 'border-rose-500' : 'border-indigo-500') : 'border-slate-300 dark:border-slate-600'} text-slate-700 dark:text-slate-200`}>
            {r.reason ? reasonText(r.reason) : reasonActive ? <span className="inline-block w-0.5 h-6 bg-indigo-500 animate-pulse" /> : ''}
          </span>
          <Sym>)</Sym>
        </span>
      )}
    </div>
  );
};

const TestView: React.FC<{ p: Extract<Part, { kind: 'test' }>; q: CBQuestion; active: boolean; bad: boolean; inProof: boolean }> = ({ p, q, active, bad, inProof }) => {
  const shown = p.done ? (q.answer.test === 'NONE' ? 'Not enough information' : '') : '';
  return (
    <div className="flex items-end flex-wrap gap-x-1 gap-y-2">
      {inProof && <span className="text-2xl font-serif text-slate-800 dark:text-slate-100 pb-1 mr-2">∴ {q.statement}</span>}
      {shown ? <span className="text-2xl font-bold text-emerald-600 pb-1">{shown}</span> : (
        <>
          <Sym>(</Sym>
          {[0, 1, 2].map(i => (
            <Slot key={i} text={p.done ? String(q.answer.test)[i] : p.buf[i] || ''} active={active && i === p.buf.length} state={p.done ? 'ok' : bad && i === p.buf.length ? 'bad' : ''} />
          ))}
          <Sym>)</Sym>
        </>
      )}
    </div>
  );
};

function instruction(s: TypingState): React.ReactNode {
  const p = s.parts[s.cur];
  if (!p || s.solved) return null;
  if (p.kind === 'mapping') return 'Type a letter for each corner.';
  if (p.kind === 'letters') return 'Type the three letters in matching order.';
  if (p.kind === 'test') return <>Type the test, e.g. SAS.{p.allowNone && <> Type <b>N</b> if there is not enough information.</>}</>;
  const cr = currentRow(s);
  if (cr?.row.stage === 'reason') return (
    <span className="inline-flex flex-wrap gap-x-4 gap-y-1 justify-center">
      {REASON_KEYS.map(k => <span key={k.key}><b className="font-black text-indigo-600 dark:text-indigo-400">{k.key}</b> {k.label}</span>)}
    </span>
  );
  if (cr?.row.prefilled) return 'Type the matching side or angle.';
  if (p.kind === 'fact') return p.expect === 'side' ? 'Type the pair of sides, like AB=XY.' : 'Type the pair of angles, like ABC=XYZ.';
  return 'Type a pair, like AB=XY or ABC=XYZ.';
}

// ---------------------------------------------------------------- page
const CongruenceGame: React.FC<{ modeKey: string; level: Level; gameType: GameType; timeLimit: number }> = ({ modeKey, level, gameType, timeLimit }) => {
  const navigate = useNavigate();
  const mode = CONGRUENCE_MODES[modeKey];
  const lv = mode.levels[level];
  const target = mode.roundLength;

  const [q, setQ] = useState<CBQuestion>(() => pickQuestion(modeKey, level));
  const [typing, setTyping] = useState<TypingState>(() => createTyping(q));
  const [session, setSession] = useState<Session>(newSession);
  const [slips, setSlips] = useState<Record<string, number>>({});
  const [bad, setBad] = useState(false);
  const [glow, setGlow] = useState(false);
  const [now, setNow] = useState(Date.now());
  const advancing = useRef(false);
  const typingRef = useRef(typing); typingRef.current = typing;
  const qRef = useRef(q); qRef.current = q;
  const sessionRef = useRef(session); sessionRef.current = session;

  useEffect(() => {
    try { if (localStorage.getItem('cbTest') === '1') (window as any).__cbq = q; } catch { /* storage blocked */ }
  }, [q]);
  useEffect(() => { saveLevel(modeKey, level); }, [modeKey, level]);

  // clock for QPM and Time rounds
  useEffect(() => {
    if (session.end) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [session.end]);
  const elapsed = Math.max(0, ((session.end || now) - session.start) / 1000);
  useEffect(() => {
    if (gameType === 'TIME_ATTACK' && !session.end && elapsed >= timeLimit) setSession(s => ({ ...s, end: Date.now() }));
  }, [elapsed, gameType, timeLimit, session.end]);
  const qpm = session.correct > 0 && elapsed > 0 ? Math.round(session.correct / (elapsed / 60)) : 0;

  const nextQuestion = useCallback(() => {
    const nq = pickQuestion(modeKey, level);
    setQ(nq); setTyping(createTyping(nq)); advancing.current = false;
  }, [modeKey, level]);

  const handleKey = useCallback((key: string) => {
    if (advancing.current || sessionRef.current.end) return;
    const r = press(typingRef.current, qRef.current, key);
    if (r.event === 'none') return;
    setTyping(r.state);
    if (r.event === 'reject' || r.event === 'wrong') { setBad(true); setTimeout(() => setBad(false), 350); }
    if (r.event === 'wrong') {
      setSession(s => ({ ...s, combo: 0, attempts: s.attempts + 1 }));
      if (r.code) setSlips(s => ({ ...s, [r.code!]: (s[r.code!] || 0) + 1 }));
    }
    if (r.event === 'part') { setGlow(true); setTimeout(() => setGlow(false), 300); }
    if (r.event === 'solved') {
      advancing.current = true;
      setGlow(true);
      setSession(s => {
        const correct = s.correct + 1, combo = s.combo + 1;
        const end = gameType === 'FIXED_PROBLEMS' && correct >= target ? Date.now() : null;
        return { ...s, correct, attempts: s.attempts + 1, combo, best: Math.max(s.best, combo), end };
      });
      setTimeout(() => { setGlow(false); if (!sessionRef.current.end) nextQuestion(); }, 450);
    }
  }, [gameType, target, nextQuestion]);

  // physical keyboard (laptops, Chromebooks): no box to click, just type
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Backspace' || e.key === '=' || /^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); handleKey(e.key); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleKey]);

  // tap a vertex in the diagram to type it
  const onFigureDown = (e: React.MouseEvent | React.TouchEvent) => {
    const t = (e.target as Element).closest('.cb-letter');
    if (!t) return;
    e.preventDefault();
    handleKey(t.getAttribute('data-vertex') || '');
  };

  const restart = (l: Level = level) => {
    if (l !== level) { navigate(`/9seal/congruence/${modeKey}/${l}`); return; }
    setSession(newSession()); setSlips({}); nextQuestion();
  };

  // ---------------------------------------------------------------- summary
  if (session.end) {
    const accuracy = session.attempts ? Math.round((session.correct / session.attempts) * 100) : 100;
    const levelUp = level < 3 && accuracy >= LEVEL_UP_ACCURACY && (gameType === 'FIXED_PROBLEMS' || session.correct >= LEVEL_UP_MIN_TIMED);
    const nextLv = (level + 1) as Level;
    const topSlips = (Object.entries(slips) as [string, number][]).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const secs = Math.round(elapsed);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[3rem] p-10 shadow-2xl border-b-8 border-slate-200 dark:border-slate-700 text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-xl">✓</div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 italic">{gameType === 'TIME_ATTACK' ? "TIME'S UP" : 'SESSION CLEAR'}</h2>
          <span className="inline-block mt-2 mb-6 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest rounded-full">
            {mode.title} · Level {level}
          </span>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl col-span-2 flex justify-between items-center px-8">
              <div className="text-left">
                <div className="text-4xl font-black text-slate-800 dark:text-white">{session.correct}<span className="text-slate-300 dark:text-slate-600 text-2xl">/{session.attempts}</span></div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Score</div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-indigo-500">{accuracy}%</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accuracy</div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl">
              <div className="text-3xl font-black text-orange-500">{qpm}</div>
              <div className="text-[9px] uppercase font-bold text-slate-400">Avg QPM</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl">
              <div className="text-3xl font-black text-emerald-500">{gameType === 'TIME_ATTACK' ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` : `${secs}s`}</div>
              <div className="text-[9px] uppercase font-bold text-slate-400">Time</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl col-span-2">
              <div className="text-3xl font-black text-violet-500">{session.best}</div>
              <div className="text-[9px] uppercase font-bold text-slate-400">Best Streak</div>
            </div>
          </div>
          {levelUp && (
            <div className="bg-violet-50 dark:bg-violet-950/40 rounded-3xl p-5 mb-6">
              <div className="text-xl font-black text-violet-600 dark:text-violet-300 italic">LEVEL UP!</div>
              <div className="text-sm text-violet-800 dark:text-violet-200">Next round: Level {nextLv} · {mode.levels[nextLv].name}</div>
            </div>
          )}
          {topSlips.length > 0 && (
            <div className="text-left bg-amber-50 dark:bg-amber-950/30 rounded-3xl p-5 mb-6">
              <div className="text-[10px] uppercase font-black tracking-wider text-amber-700 dark:text-amber-400 mb-2">Things to watch</div>
              <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-200">
                {topSlips.map(([code, n]) => <li key={code}>• {SLIP_LABELS[code] || code} <span className="opacity-60">({n})</span></li>)}
              </ul>
            </div>
          )}
          {levelUp ? (
            <>
              <button onClick={() => restart(nextLv)} className="w-full py-5 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-3xl shadow-lg transition-all active:scale-95 mb-4 uppercase tracking-tight">Next Round: Level {nextLv}</button>
              <button onClick={() => restart()} className="w-full py-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-black rounded-3xl transition-all active:scale-95 mb-4 uppercase tracking-tight text-sm">Stay on Level {level}</button>
            </>
          ) : (
            <button onClick={() => restart()} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl shadow-lg transition-all active:scale-95 mb-4 uppercase tracking-tight">Play Again</button>
          )}
          <button onClick={() => navigate('/9seal')} className="w-full py-5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-3xl transition-all uppercase tracking-tight">Back to Menu</button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- playing
  const progress = gameType === 'TIME_ATTACK' ? Math.min(100, (elapsed / timeLimit) * 100) : (session.correct / target) * 100;
  const left = Math.max(0, Math.ceil(timeLimit - elapsed));
  const keys = keypadKeys(typing, q);
  const inProof = typing.parts.length > 1;

  return (
    <div className="min-h-screen flex flex-col p-4 bg-slate-50 dark:bg-slate-900">
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-200 dark:bg-slate-800 z-50">
        <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex justify-between items-center mb-2 pt-6 mx-auto w-full max-w-4xl gap-3">
        <button onClick={() => navigate('/9seal')} aria-label="Back to 9 SEAL menu"
          className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight truncate">{mode.title}</div>
          <div className="flex items-center gap-1 mt-1">
            {([1, 2, 3] as Level[]).map(l => (
              <button key={l} onClick={() => { if (l !== level) restart(l); }} aria-label={`Level ${l}: ${mode.levels[l].name}`} title={mode.levels[l].name}
                className={`w-7 h-7 rounded-lg text-xs font-black transition active:scale-95 ${l === level ? `${mode.color} text-white shadow` : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-500 shadow-sm'}`}>
                {l}
              </button>
            ))}
            <button onClick={() => navigate(`/9seal/congruence/${modeKey}/levels`)} title="What's in each level?"
              className="ml-1 text-xs text-slate-400 hover:text-indigo-500 truncate">{lv.name} <span className="font-bold">ⓘ</span></button>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-white dark:bg-slate-800 px-5 py-2 rounded-2xl shadow-sm border-b-4 border-indigo-100 dark:border-slate-950 text-center">
            <div className="text-xl font-black text-indigo-500 italic leading-none">{qpm}</div>
            <div className="text-[9px] uppercase tracking-tighter text-slate-400 font-black">QPM</div>
          </div>
          <div className="bg-white dark:bg-slate-800 px-5 py-2 rounded-2xl shadow-sm border-b-4 border-orange-100 dark:border-slate-950 text-center">
            <div className="text-xl font-black text-orange-500 italic leading-none">{session.combo}</div>
            <div className="text-[9px] uppercase tracking-tighter text-slate-400 font-black">Streak</div>
          </div>
        </div>
      </div>

      <div className="text-center text-[12px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em] mb-3">
        {gameType === 'TIME_ATTACK' ? `Time: ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : `Problem ${Math.min(session.correct + 1, target)} / ${target}`}
      </div>

      <div className={`mx-auto w-full max-w-3xl bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-5 sm:p-7 transition-shadow ${glow ? 'ring-4 ring-emerald-400/60' : ''}`}>
        <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200 mb-3">{q.prompt}</p>

        {q.showFigure !== false && (
          <div className="flex justify-center mb-4 bg-white rounded-2xl p-1 select-none [&_.cb-letter]:cursor-pointer [&_svg]:max-w-[520px] [&_svg]:w-full"
            onMouseDown={onFigureDown} onTouchStart={onFigureDown}
            role="img" aria-label="two congruent triangles"
            dangerouslySetInnerHTML={{ __html: q.svg }} />
        )}

        {typing.parts[0].kind === 'mapping' && (typing.parts[0] as any).proposed && (
          <div className="mb-3 text-slate-500 dark:text-slate-400">
            Their mapping: <span className="font-serif italic text-xl text-slate-700 dark:text-slate-200">
              {(typing.parts[0] as any).rows.map((l: string) => `${l} ↦ ${(typing.parts[0] as any).proposed[l]}`).join(',  ')}
            </span>
          </div>
        )}

        <div key={typing.flash} className={`flex flex-col gap-4 items-start ${bad ? 'animate-shake' : ''}`}>
          {typing.parts.map((p, i) => {
            if (i > typing.cur && !typing.solved) return null;
            const active = i === typing.cur && !typing.solved;
            const isBad = active && bad;
            if (p.kind === 'mapping') return <MappingView key={i} p={p} active={active} bad={isBad} />;
            if (p.kind === 'letters') return (
              <div key={i} className="flex items-end flex-wrap gap-x-1">
                <span className="text-2xl font-serif text-slate-800 dark:text-slate-100 pb-1 mr-1">{p.prefix}</span>
                {p.vals.map((v, j) => <Slot key={j} text={v} active={active && j === p.vals.findIndex(x => !x)} state={p.done || p.locked[j] ? 'ok' : isBad && j === p.vals.findIndex(x => !x) ? 'bad' : ''} />)}
              </div>
            );
            if (p.kind === 'test') return <TestView key={i} p={p} q={q} active={active} bad={isBad} inProof={inProof} />;
            if (p.kind === 'fact') return <RowView key={i} r={p.row} active={active} bad={isBad} askReasons={false} />;
            const cur = p.rows.findIndex(r => r.stage !== 'done');
            return (
              <div key={i} className="flex flex-col gap-3">
                {p.rows.map((r, j) => <RowView key={j} r={r} active={active && j === cur} bad={isBad && j === cur} askReasons={p.askReasons} />)}
              </div>
            );
          })}
        </div>

        <div className="mt-5 min-h-[1.5rem] text-center text-sm text-slate-400 dark:text-slate-500">{instruction(typing)}</div>
        {typing.message && <div className="mt-3 rounded-2xl px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-center">{typing.message}</div>}
        {typing.reveal && <div className="mt-3 rounded-2xl px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-center">Answer: <span className="font-serif italic">{typing.reveal}</span> (type it in)</div>}
      </div>

      {/* phone keypad: only the keys that can be used right now */}
      {keys.length > 0 && (
        <div className={`grid ${keys.length > 8 ? 'grid-cols-5' : 'grid-cols-4'} gap-1.5 w-full max-w-sm mx-auto mt-6 md:hidden`}>
          {keys.map(k => (
            <button key={k} onClick={() => handleKey(k)}
              className={`h-14 flex items-center justify-center text-xl font-bold rounded-xl active:scale-95 transition-transform ${k === '=' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-white text-slate-800 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 font-serif italic'}`}>
              {k}
            </button>
          ))}
          <button onClick={() => handleKey('Backspace')} aria-label="Delete" className="h-14 flex items-center justify-center text-xl font-bold rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 active:scale-95">⌫</button>
        </div>
      )}
    </div>
  );
};

// Remount on a new mode or level, so each starts a fresh round
const CongruencePractice: React.FC<{ gameType?: GameType; timeLimit?: number }> = ({ gameType = 'FIXED_PROBLEMS', timeLimit = 180 }) => {
  const { mode, level } = useParams();
  const aliased = mode ? MODE_ALIASES[mode] || mode : 'mappings';
  const modeKey = CONGRUENCE_MODES[aliased] ? aliased : 'mappings';
  const lv = (['1', '2', '3'].includes(level || '') ? Number(level) : savedLevel(modeKey)) as Level;
  return <CongruenceGame key={`${modeKey}-${lv}-${gameType}`} modeKey={modeKey} level={lv} gameType={gameType} timeLimit={timeLimit} />;
};

export default CongruencePractice;
