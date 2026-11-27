/* Key-by-key typing rules shared by the 9 SEAL "typed parts" pages (polygon angles,
 * Dijkstra's algorithm, ...). Pure functions with no React, so they can be tested in Node.
 *
 * A question is a list of parts. Each part is one short typed answer:
 *   number: digits, checked the moment the answer is complete
 *   letter: one vertex letter
 *   path:   a route through a network, typed vertex by vertex
 */

export interface Slip { value: string; code: string; message: string }

interface PartBase {
  label: string;            // shown before the answer, e.g. "x ="
  suffix?: string;          // shown after the answer, e.g. "Â°"
  ask?: string;             // the grey instruction line for this part
  code?: string;            // recorded for a plain slip on this part
  slips?: Slip[];           // named misconceptions and their one-line message
}
export type NumberPart = PartBase & { kind: 'number'; answer: string };
export type LetterPart = PartBase & { kind: 'letter'; answer: string; allowed: string[] };
export type PathPart = PartBase & {
  kind: 'path'; start: string; end: string; answer: string;   // answer includes the start letter, e.g. "ACBDF"
  adj: Record<string, string[]>;
  pathSlip?: (path: string) => Slip | null;
};
export type Part = NumberPart | LetterPart | PathPart;

export interface TPQuestion {
  prompt: string;
  parts: Part[];
  svg?: string;                                        // a diagram that never changes
  render?: (cur: number, solved: boolean) => string;   // a diagram that follows the student's progress
  figureLabel?: string;
  onlyCurrent?: boolean;                               // show only the part being typed
  pauseMs?: number;                                    // how long the finished question stays up
  meta?: any;                                          // extra data for the tests
}

export interface TypingState {
  cur: number; buf: string; misses: number;
  message: string; reveal: string; solved: boolean; flash: number;
}
export type TypingEvent = 'none' | 'typed' | 'reject' | 'wrong' | 'part' | 'solved';
export interface PressResult { state: TypingState; event: TypingEvent; code?: string }

export const createTyping = (): TypingState => ({ cur: 0, buf: '', misses: 0, message: '', reveal: '', solved: false, flash: 0 });

export const showPath = (letters: string) => letters.split('').join('–');
export const showAnswer = (p: Part) => (p.kind === 'path' ? showPath(p.answer) : p.answer + (p.suffix || ''));

/** Misconceptions the student can actually finish typing. A value that starts with the
 * answer, or that is the start of the answer or of another misconception, is never reached. */
export function reachableSlips(p: Part): Slip[] {
  const all = p.slips || [];
  if (p.kind !== 'number') return all;
  return all.filter(sl => !sl.value.startsWith(p.answer) && !p.answer.startsWith(sl.value)
    && !all.some(o => o !== sl && o.value.length > sl.value.length && o.value.startsWith(sl.value)));
}

const allowsDot =(p: NumberPart) => p.answer.includes('.') || (p.slips || []).some(s => s.value.includes('.'));

function complete(s: TypingState, q: TPQuestion): PressResult {
  const last = s.cur === q.parts.length - 1;
  return {
    state: { ...s, cur: last ? s.cur : s.cur + 1, buf: '', misses: 0, message: '', reveal: '', solved: last },
    event: last ? 'solved' : 'part',
  };
}

function wrong(s: TypingState, p: Part, slip?: Slip | null): PressResult {
  const misses = s.misses + 1;
  return {
    state: { ...s, buf: '', misses, message: slip ? slip.message : '', reveal: misses >= 3 ? showAnswer(p) : '', flash: s.flash + 1 },
    event: 'wrong',
    code: slip ? slip.code : p.code || 'slip',
  };
}

const reject = (s: TypingState): PressResult => ({ state: { ...s, flash: s.flash + 1 }, event: 'reject' });
const typed = (s: TypingState, buf: string): PressResult => ({ state: { ...s, buf }, event: 'typed' });

/** Letters still open to the student on a path part. */
export function pathChoices(p: PathPart, buf: string): string[] {
  const seen = p.start + buf;
  const lastV = seen[seen.length - 1];
  return (p.adj[lastV] || []).filter(v => !seen.includes(v));
}

export function press(s: TypingState, q: TPQuestion, key: string): PressResult {
  const none: PressResult = { state: s, event: 'none' };
  if (s.solved) return none;
  const p = q.parts[s.cur];
  if (!p) return none;
  if (key === 'Backspace') return s.buf ? typed(s, s.buf.slice(0, -1)) : none;
  if (key.length !== 1) return none;

  if (p.kind === 'number') {
    const isDigit = /[0-9]/.test(key);
    const isDot = key === '.' && allowsDot(p) && !s.buf.includes('.') && s.buf.length > 0;
    if (!isDigit && !isDot) return /[a-zA-Z.=]/.test(key) ? reject(s) : none;
    // a whole number never starts with 0
    if (isDigit && s.buf === '0' && !allowsDot(p)) return reject(s);
    if (key === '0' && !s.buf && p.answer !== '0' && !allowsDot(p)) return reject(s);
    const nb = s.buf + key;
    if (nb === p.answer) return complete(s, q);
    if (p.answer.startsWith(nb)) return typed(s, nb);
    const slips = reachableSlips(p);
    // early-stop rule: let a misconception be typed in full before it is checked
    if (slips.some(sl => sl.value.length > nb.length && sl.value.startsWith(nb))) return typed(s, nb);
    const slip = slips.find(sl => sl.value === nb);
    if (slip) return wrong(s, p, slip);
    if (nb.length >= p.answer.length) return wrong(s, p);
    return typed(s, nb);
  }

  if (!/[a-zA-Z]/.test(key)) return /[0-9.=]/.test(key) ? reject(s) : none;
  const k = key.toUpperCase();

  if (p.kind === 'letter') {
    if (!p.allowed.includes(k)) return reject(s);
    if (k === p.answer) return complete(s, q);
    return wrong(s, p, (p.slips || []).find(sl => sl.value === k));
  }

  // path
  if (!pathChoices(p, s.buf).includes(k)) return reject(s);
  const nb = s.buf + k;
  const full = p.start + nb;
  if (k === p.end) {
    if (full === p.answer) return complete(s, q);
    return wrong(s, p, p.pathSlip ? p.pathSlip(full) : null);
  }
  if (pathChoices(p, nb).length === 0) return wrong(s, p);   // a dead end
  return typed(s, nb);
}

/** The keys that can be used right now (for the phone keypad). */
export function keypadKeys(s: TypingState, q: TPQuestion): string[] {
  if (s.solved) return [];
  const p = q.parts[s.cur];
  if (!p) return [];
  if (p.kind === 'number') return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ...(allowsDot(p) ? ['.'] : [])];
  if (p.kind === 'letter') return p.allowed;
  return pathChoices(p, s.buf);
}

/** Small seeded random number generator, so questions can be replayed in tests. */
export function makeRng(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const randInt = (rng: () => number, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
export const pick = <T,>(rng: () => number, list: T[]): T => list[Math.floor(rng() * list.length)];
