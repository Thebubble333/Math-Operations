import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameType } from '../types';
import { TPQuestion, TypingState, Part, createTyping, press, keypadKeys, showPath } from '../utils/typedParts';
import { SEAL9_TOPICS, Level } from './seal9Topics';

/* ----------------------------------------------------------------------------
 * 9 SEAL pages built from typed parts (Polygon Angles, Dijkstra's Algorithm).
 * Works like the arithmetic and congruence pages: type the answer only, each
 * part is checked the moment it is complete, Fixed or Time rounds, streak and
 * pace. The typing rules live in utils/typedParts.ts; topics and levels in
 * components/seal9Topics.ts.
 * -------------------------------------------------------------------------- */

interface Session { correct: number; attempts: number; combo: number; best: number; done: number; start: number; end: number | null }
const newSession = (): Session => ({ correct: 0, attempts: 0, combo: 0, best: 0, done: 0, start: Date.now(), end: null });

const LEVEL_KEY = (topic: string) => `tp-level-${topic}`;
const savedLevel = (topic: string): Level => {
  try { const v = Number(localStorage.getItem(LEVEL_KEY(topic))); return (v === 2 || v === 3 ? v : 1) as Level; } catch { return 1; }
};
const saveLevel = (topic: string, l: Level) => { try { localStorage.setItem(LEVEL_KEY(topic), String(l)); } catch { /* storage blocked */ } };
const LEVEL_UP_ACCURACY = 80, LEVEL_UP_MIN_TIMED = 10;

// single letters in a label (x, n, B) are maths, so they are set in serif italic (but not the word "a")
const Mathy: React.FC<{ text: string }> = ({ text }) => (
  <>{text.split(/((?<![\w'’])[A-Zb-z](?![\w'’]))/).map((t, i) => (/^[A-Zb-z]$/.test(t) ? <span key={i} className="font-serif italic">{t}</span> : <React.Fragment key={i}>{t}</React.Fragment>))}</>
);

const PartLine: React.FC<{ p: Part; i: number; t: TypingState; bad: boolean }> = ({ p, i, t, bad }) => {
  const done = t.solved || i < t.cur;
  const active = !t.solved && i === t.cur;
  const isPath = p.kind === 'path';
  const letters = p.kind !== 'number';
  let shown = '';
  if (done) shown = isPath ? showPath(p.answer) : p.answer;
  else if (active) shown = isPath ? showPath(p.start + t.buf) : t.buf;
  const width = `${Math.max(2.2, (isPath ? p.answer.length * 1.6 : p.answer.length) * 0.95 + 1)}rem`;
  return (
    <div className="flex items-end justify-center flex-wrap gap-x-2 gap-y-1">
      <span className="text-2xl text-slate-700 dark:text-slate-200 pb-1"><Mathy text={p.label} /></span>
      <span style={{ minWidth: width }}
        className={`inline-flex items-end justify-center h-11 px-1 border-b-[3px] text-3xl leading-none pb-1 transition-colors ${letters ? 'font-serif italic' : 'font-bold tabular-nums'}
          ${done ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300' : bad && active ? 'border-rose-500 text-rose-600' : active ? 'border-indigo-500 text-slate-900 dark:text-white' : 'border-slate-300 dark:border-slate-600'}`}>
        {shown}
        {active && !isPath && !t.buf && <span className="w-0.5 h-8 bg-indigo-500 animate-pulse" />}
        {active && isPath && <span className="w-0.5 h-8 bg-indigo-500 animate-pulse ml-1" />}
      </span>
      {p.suffix && <span className="text-2xl text-slate-500 dark:text-slate-400 pb-1">{p.suffix}</span>}
    </div>
  );
};

const TypedPartsGame: React.FC<{ topicKey: string; level: Level; gameType: GameType; timeLimit: number }> = ({ topicKey, level, gameType, timeLimit }) => {
  const navigate = useNavigate();
  const topic = SEAL9_TOPICS[topicKey];
  const lv = topic.levels[level];
  const target = lv.roundLength;

  const [q, setQ] = useState<TPQuestion>(() => topic.generate(level));
  const [typing, setTyping] = useState<TypingState>(createTyping);
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
    try { if (localStorage.getItem('cbTest') === '1') (window as any).__tpq = q; } catch { /* storage blocked */ }
  }, [q]);
  useEffect(() => { saveLevel(topicKey, level); }, [topicKey, level]);

  useEffect(() => {
    if (session.end) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [session.end]);
  const elapsed = Math.max(0, ((session.end || now) - session.start) / 1000);
  useEffect(() => {
    if (gameType === 'TIME_ATTACK' && !session.end && elapsed >= timeLimit) setSession(s => ({ ...s, end: Date.now() }));
  }, [elapsed, gameType, timeLimit, session.end]);
  const pace = session.correct > 0 && elapsed > 0 ? Math.round(session.correct / (elapsed / 60)) : 0;
  const paceLabel = topic.countSteps ? 'Steps/min' : 'QPM';

  const nextQuestion = useCallback(() => {
    setQ(topic.generate(level)); setTyping(createTyping()); advancing.current = false;
  }, [topic, level]);

  const handleKey = useCallback((key: string) => {
    if (advancing.current || sessionRef.current.end) return;
    const r = press(typingRef.current, qRef.current, key);
    if (r.event === 'none') return;
    typingRef.current = r.state;   // keys pressed before the next render see the new state
    setTyping(r.state);
    if (r.event === 'reject' || r.event === 'wrong') { setBad(true); setTimeout(() => setBad(false), 350); }
    if (r.event === 'wrong') {
      setSession(s => ({ ...s, combo: 0, attempts: s.attempts + 1 }));
      if (r.code) setSlips(s => ({ ...s, [r.code!]: (s[r.code!] || 0) + 1 }));
    }
    if (r.event === 'part') {
      setGlow(true); setTimeout(() => setGlow(false), 300);
      if (topic.countSteps) setSession(s => ({ ...s, correct: s.correct + 1, attempts: s.attempts + 1, combo: s.combo + 1, best: Math.max(s.best, s.combo + 1) }));
    }
    if (r.event === 'solved') {
      advancing.current = true;
      setGlow(true);
      const finishedAt = Date.now();
      const done = sessionRef.current.done + 1;
      const ends = gameType === 'FIXED_PROBLEMS' && done >= target;
      setSession(s => {
        const correct = s.correct + 1, combo = s.combo + 1;
        return { ...s, correct, attempts: s.attempts + 1, combo, best: Math.max(s.best, combo), done };
      });
      setTimeout(() => {
        setGlow(false);
        if (ends) setSession(s => ({ ...s, end: finishedAt }));
        else if (!sessionRef.current.end) nextQuestion();
      }, qRef.current.pauseMs ?? 450);
    }
  }, [gameType, target, nextQuestion, topic.countSteps]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Backspace' || /^[a-zA-Z0-9.]$/.test(e.key)) { e.preventDefault(); handleKey(e.key); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleKey]);

  const onFigureDown = (e: React.MouseEvent | React.TouchEvent) => {
    const t = (e.target as Element).closest('.cb-letter');
    if (!t) return;
    e.preventDefault();
    handleKey(t.getAttribute('data-vertex') || '');
  };

  const restart = (l: Level = level) => {
    if (l !== level) { navigate(`/9seal/skill/${topicKey}/${l}`); return; }
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
            {topic.title} · Level {level}
          </span>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl col-span-2 flex justify-between items-center px-8">
              <div className="text-left">
                <div className="text-4xl font-black text-slate-800 dark:text-white">{session.correct}<span className="text-slate-300 dark:text-slate-600 text-2xl">/{session.attempts}</span></div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{topic.countSteps ? 'Steps right' : 'Score'}</div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-indigo-500">{accuracy}%</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accuracy</div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl">
              <div className="text-3xl font-black text-orange-500">{pace}</div>
              <div className="text-[9px] uppercase font-bold text-slate-400">Avg {paceLabel}</div>
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
              <div className="text-sm text-violet-800 dark:text-violet-200">Next round: Level {nextLv} · {topic.levels[nextLv].name}</div>
            </div>
          )}
          {topSlips.length > 0 && (
            <div className="text-left bg-amber-50 dark:bg-amber-950/30 rounded-3xl p-5 mb-6">
              <div className="text-[10px] uppercase font-black tracking-wider text-amber-700 dark:text-amber-400 mb-2">Things to watch</div>
              <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-200">
                {topSlips.map(([code, n]) => <li key={code}>• {topic.slipLabels[code] || code} <span className="opacity-60">({n})</span></li>)}
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
  const progress = gameType === 'TIME_ATTACK' ? Math.min(100, (elapsed / timeLimit) * 100) : (session.done / target) * 100;
  const left = Math.max(0, Math.ceil(timeLimit - elapsed));
  const keys = keypadKeys(typing, q);
  const part = q.parts[typing.cur];
  const svg = q.render ? q.render(typing.cur, typing.solved) : q.svg;
  const shownParts = q.parts.map((p, i) => ({ p, i })).filter(({ i }) =>
    q.onlyCurrent ? i === (typing.solved ? q.parts.length - 1 : typing.cur) : typing.solved || i <= typing.cur);

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
          <div className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight truncate">{topic.title}</div>
          <div className="flex items-center gap-1 mt-1">
            {([1, 2, 3] as Level[]).map(l => (
              <button key={l} onClick={() => { if (l !== level) restart(l); }} aria-label={`Level ${l}: ${topic.levels[l].name}`} title={topic.levels[l].name}
                className={`w-7 h-7 rounded-lg text-xs font-black transition active:scale-95 ${l === level ? `${topic.color} text-white shadow` : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-500 shadow-sm'}`}>
                {l}
              </button>
            ))}
            <button onClick={() => navigate(`/9seal/skill/${topicKey}/levels`)} title="What's in each level?"
              className="ml-1 text-xs text-slate-400 hover:text-indigo-500 truncate">{lv.name} <span className="font-bold">ⓘ</span></button>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl shadow-sm border-b-4 border-indigo-100 dark:border-slate-950 text-center">
            <div className="text-xl font-black text-indigo-500 italic leading-none">{pace}</div>
            <div className="text-[9px] uppercase tracking-tighter text-slate-400 font-black">{paceLabel}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl shadow-sm border-b-4 border-orange-100 dark:border-slate-950 text-center">
            <div className="text-xl font-black text-orange-500 italic leading-none">{session.combo}</div>
            <div className="text-[9px] uppercase tracking-tighter text-slate-400 font-black">Streak</div>
          </div>
        </div>
      </div>

      <div className="text-center text-[12px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em] mb-3">
        {gameType === 'TIME_ATTACK' ? `Time: ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : `${topic.noun} ${Math.min(session.done + 1, target)} / ${target}`}
      </div>

      <div className={`mx-auto w-full max-w-3xl bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-5 sm:p-7 transition-shadow ${glow ? 'ring-4 ring-emerald-400/60' : ''}`}>
        <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200 mb-3 text-center"><Mathy text={q.prompt} /></p>

        {svg && (
          <div className="flex justify-center mb-4 bg-white rounded-2xl p-1 select-none [&_svg]:max-w-[560px] [&_svg]:w-full"
            onMouseDown={onFigureDown} onTouchStart={onFigureDown}
            role="img" aria-label={q.figureLabel || 'diagram'}
            dangerouslySetInnerHTML={{ __html: svg }} />
        )}

        <div key={typing.flash} className={`flex flex-col gap-3 items-center ${bad ? 'animate-shake' : ''}`}>
          {shownParts.map(({ p, i }) => <PartLine key={i} p={p} i={i} t={typing} bad={bad} />)}
        </div>

        <div className="mt-4 min-h-[1.5rem] text-center text-sm text-slate-400 dark:text-slate-500">
          {!typing.solved && part?.ask && <Mathy text={part.ask} />}
          {q.onlyCurrent && !typing.solved && <span className="ml-2 text-slate-300 dark:text-slate-600">Step {typing.cur + 1} of {q.parts.length}</span>}
        </div>
        {typing.message && <div className="mt-3 rounded-2xl px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-center">{typing.message}</div>}
        {typing.reveal && <div className="mt-3 rounded-2xl px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-center">Answer: <span className="font-bold">{typing.reveal}</span> (type it in)</div>}
      </div>

      {/* phone keypad: only the keys that can be used right now */}
      {keys.length > 0 && (
        <div className={`grid ${keys.length > 8 ? 'grid-cols-4' : keys.length > 3 ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5 w-full max-w-sm mx-auto mt-6 md:hidden`}>
          {keys.map(k => (
            <button key={k} onClick={() => handleKey(k)}
              className={`h-14 flex items-center justify-center text-xl font-bold rounded-xl active:scale-95 transition-transform bg-white text-slate-800 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 ${/[A-Z]/.test(k) ? 'font-serif italic' : ''}`}>
              {k}
            </button>
          ))}
          <button onClick={() => handleKey('Backspace')} aria-label="Delete" className="h-14 flex items-center justify-center text-xl font-bold rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 active:scale-95">⌫</button>
        </div>
      )}
    </div>
  );
};

const TypedPartsPractice: React.FC<{ gameType?: GameType; timeLimit?: number }> = ({ gameType = 'FIXED_PROBLEMS', timeLimit = 180 }) => {
  const { topic, level } = useParams();
  const topicKey = topic && SEAL9_TOPICS[topic] ? topic : 'polygons';
  const lv = (['1', '2', '3'].includes(level || '') ? Number(level) : savedLevel(topicKey)) as Level;
  return <TypedPartsGame key={`${topicKey}-${lv}-${gameType}`} topicKey={topicKey} level={lv} gameType={gameType} timeLimit={timeLimit} />;
};

export default TypedPartsPractice;
