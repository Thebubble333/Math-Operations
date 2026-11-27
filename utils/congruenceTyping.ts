/* ----------------------------------------------------------------------------
 * Typing logic for the 9 SEAL congruence pages (no React in here, so it can be
 * tested on its own: see scripts/test-congruence-typing.mjs).
 *
 * Students only type symbols. Keys flow into the current part of the answer
 * without choosing a box:
 *   - a key that can never be right (a letter that is not a vertex, a letter
 *     already used) is rejected at once: flash red, nothing typed;
 *   - a part is checked the moment it is complete (3 mapping letters, 3 test
 *     letters, both sides of a pair...);
 *   - if it is wrong only the wrong part is cleared, and a one-line message is
 *     shown only for a named misconception (e.g. ASA, a shared corner moved).
 * Parts are never cut short when finishing them IS the misconception
 * (e.g. typing ASA in full).
 * -------------------------------------------------------------------------- */
import CB, { CBQuestion } from './congruenceBank';

export type Stage = 'left' | 'right' | 'reason' | 'done';
export interface Row {
  left: string; right: string; reason: string; stage: Stage;
  prefilled: boolean;
  kind: 'S' | 'A' | null;      // what the student is writing: side or angle (null = not known yet)
  engineKind: string | null;   // kind passed to the checker (S, A, R, H, or null = infer)
}
export interface MappingPart { kind: 'mapping'; rows: string[]; choices: string[]; vals: string[]; locked: boolean[]; done: boolean; proposed?: Record<string, string> }
export interface LettersPart { kind: 'letters'; prefix: string; choices: string[]; vals: string[]; locked: boolean[]; done: boolean }
export interface TestPart { kind: 'test'; allowNone: boolean; buf: string; done: boolean }
export interface PairsPart { kind: 'pairs'; rows: Row[]; askReasons: boolean; done: boolean; order: number[] }
export interface FactPart { kind: 'fact'; row: Row; expect: 'side' | 'angle'; done: boolean }
export type Part = MappingPart | LettersPart | TestPart | PairsPart | FactPart;

export interface TypingState {
  parts: Part[];
  cur: number;            // index of the part being typed
  misses: number[];       // wrong attempts per part
  message: string;        // one-line message (named misconceptions only)
  reveal: string;         // answer for the current part, shown after 3 misses
  solved: boolean;
  wrongCount: number;     // wrong attempts this question
  flash: number;          // bumps on every reject/wrong, so the page can shake
  flashKind: 'reject' | 'wrong' | 'good' | null;
}
export type PressEvent = 'none' | 'typed' | 'reject' | 'wrong' | 'part' | 'solved';
export interface PressResult { state: TypingState; event: PressEvent; code?: string }

export const REVEAL_AFTER = 3;

/** One key per reason. C becomes "common side" or "common angle" from the row. */
export const REASON_KEYS: { key: string; label: string }[] = [
  { key: 'G', label: 'Given' },
  { key: 'C', label: 'Common side / angle' },
  { key: 'V', label: 'Vertically opposite' },
  { key: 'A', label: 'Alternate (parallel)' },
  { key: 'R', label: 'Right angle' },
];
const REASON_TEXT: Record<string, string> = {
  given: 'Given', 'common-side': 'Common side', 'common-angle': 'Common angle', 'vert-opp': 'Vert. opp.',
  alternate: 'Alternate', 'right-given': 'Right angle',
};
export const reasonText = (r: string) => REASON_TEXT[r] || '';
function reasonFromKey(k: string, row: Row): string | null {
  if (k === 'G') return 'given';
  if (k === 'C') return row.kind === 'S' ? 'common-side' : 'common-angle';
  if (k === 'V') return 'vert-opp';
  if (k === 'A') return 'alternate';
  if (k === 'R') return 'right-given';
  return null;
}

/** Misconceptions that earn a one-line message. Everything else is just a red flash. */
const NAMED = new Set([
  'from-same-triangle', 'shared-should-stay', 'shared-should-swap', 'shared-swapped', 'alphabetical',
  'letters-order', 'true-but-not-marked', 'ambiguous-angle', 'same-triangle', 'type-mismatch', 'duplicate',
  'asa', 'ssa', 'aaa', 'already-marked', 'other-test', 'test-order', 'none-wrong', 'not-enough', 'rhs-sas',
]);

// ---------------------------------------------------------------- building
const emptyRow = (prefill?: { left: string | null; kind: string }): Row => {
  if (prefill && prefill.left) {
    const left = prefill.left.replace('∠', '');
    const k = prefill.kind === 'A' || prefill.kind === 'R' ? 'A' : 'S';
    return { left, right: '', reason: '', stage: 'right', prefilled: true, kind: k, engineKind: prefill.kind };
  }
  return { left: '', right: '', reason: '', stage: 'left', prefilled: false, kind: null, engineKind: null };
};

function mappingPart(spec: any, q: CBQuestion): MappingPart {
  return { kind: 'mapping', rows: spec.rows, choices: spec.choices, vals: spec.rows.map(() => ''), locked: spec.rows.map(() => false), done: false,
    proposed: q.type === 'map-fix' ? (q as any).proposed : undefined };
}
function pairsPart(spec: any): PairsPart {
  return { kind: 'pairs', rows: spec.rows.map((r: any) => emptyRow(r.left ? r : undefined)), askReasons: !!spec.askReasons, done: false, order: [] };
}
function testPart(options: { value: string }[]): TestPart {
  return { kind: 'test', allowNone: options.some(o => o.value === 'NONE'), buf: '', done: false };
}

export function createTyping(q: CBQuestion): TypingState {
  const inp = q.input;
  let parts: Part[] = [];
  if (inp.kind === 'mapping') parts = [mappingPart(inp, q)];
  else if (inp.kind === 'letters') parts = [{ kind: 'letters', prefix: inp.prefix, choices: inp.choices, vals: ['', '', ''], locked: [false, false, false], done: false }];
  else if (inp.kind === 'test') parts = [testPart(inp.options)];
  else if (inp.kind === 'pairs') parts = inp.askTest === false ? [pairsPart(inp)] : [pairsPart(inp), testPart(inp.options)];
  else if (inp.kind === 'fact') {
    const expect = inp.expect === 'angle' ? 'angle' : 'side';
    const row = emptyRow(); row.engineKind = q.answer.pair.kind;
    parts = [{ kind: 'fact', row, expect, done: false }];
  } else if (inp.kind === 'steps') parts = [mappingPart(inp.steps[0], q), pairsPart(inp.steps[1]), testPart(inp.steps[2].options)];
  return { parts, cur: 0, misses: parts.map(() => 0), message: '', reveal: '', solved: false, wrongCount: 0, flash: 0, flashKind: null };
}

// ---------------------------------------------------------------- helpers
const clone = (s: TypingState): TypingState => JSON.parse(JSON.stringify(s));
export const figureLetters = (q: CBQuestion): string[] => Object.keys(q.figure.points).sort();

const reject = (s: TypingState, msg = ''): PressResult => {
  s.flash++; s.flashKind = 'reject'; if (msg) s.message = msg; return { state: s, event: 'reject' };
};
function wrong(s: TypingState, q: CBQuestion, code: string, msg?: string): PressResult {
  s.flash++; s.flashKind = 'wrong'; s.wrongCount++;
  s.misses[s.cur]++;
  s.message = msg && NAMED.has(code) ? oneLine(msg) : '';
  if (s.misses[s.cur] >= REVEAL_AFTER && !s.reveal) s.reveal = revealText(q, s.parts[s.cur]);
  return { state: s, event: 'wrong', code };
}
function partDone(s: TypingState): PressResult {
  s.parts[s.cur].done = true; s.message = ''; s.reveal = '';
  s.flash++; s.flashKind = 'good';
  if (s.cur + 1 >= s.parts.length) { s.solved = true; return { state: s, event: 'solved' }; }
  s.cur++;
  return { state: s, event: 'part' };
}
/** Keep messages to one line: the first sentence (or two short ones). */
function oneLine(m: string): string {
  const parts = m.split(/(?<=\.)\s+/);
  return parts[0].length < 60 && parts[1] ? parts[0] + ' ' + parts[1] : parts[0];
}

export function revealText(q: CBQuestion, p: Part): string {
  if (p.kind === 'mapping') return p.rows.map(l => `${l} ↦ ${q.answer.mapping[l]}`).join(',  ');
  if (p.kind === 'letters') return `${p.prefix}${q.answer.letters}`;
  if (p.kind === 'test') return q.answer.test === 'NONE' ? 'N (not enough information)' : q.answer.test;
  if (p.kind === 'pairs') return q.facts.map((f: any) => `${f.left} = ${f.right}${p.askReasons ? ` (${f.reasonText})` : ''}`).join(';  ');
  const a = q.answer.accept[0];
  return `${a.left} = ${a.right}`;
}

// ---------------------------------------------------------------- the current row of a pairs/fact part
function curRowIndex(p: PairsPart): number { return p.rows.findIndex(r => r.stage !== 'done'); }
export function currentRow(s: TypingState): { row: Row; index: number } | null {
  const p = s.parts[s.cur];
  if (!p || p.done) return null;
  if (p.kind === 'fact') return { row: p.row, index: 0 };
  if (p.kind === 'pairs') { const i = curRowIndex(p); return i < 0 ? null : { row: p.rows[i], index: i }; }
  return null;
}
const rowResp = (r: Row, withReason: boolean) => ({ left: r.left, right: r.right, kind: r.engineKind, reason: withReason && r.reason ? r.reason : undefined });
const clearRow = (r: Row) => {
  r.right = ''; r.reason = '';
  if (r.prefilled) { r.stage = 'right'; return; }
  r.left = ''; r.kind = null; r.stage = 'left';
};

/** Typing a letter or "=" into a row. Returns 'complete' when both sides are in. */
function typeIntoRow(s: TypingState, q: CBQuestion, r: Row, key: string, expect: 'side' | 'angle' | null): PressResult | 'complete' {
  const letters = figureLetters(q);
  if (r.stage === 'left') {
    if (key === '=') {
      const n = r.left.length;
      if (n === 0 || (expect === 'side' && n !== 2) || (expect === 'angle' && n === 2)) return reject(s);
      r.kind = n === 2 ? 'S' : 'A'; r.stage = 'right'; return { state: s, event: 'typed' };
    }
    if (!letters.includes(key) || r.left.includes(key)) return reject(s);
    r.left += key;
    const n = r.left.length;
    if (n === 3 || (expect === 'side' && n === 2)) { r.kind = n === 2 ? 'S' : 'A'; r.stage = 'right'; }
    return { state: s, event: 'typed' };
  }
  if (r.stage === 'right') {
    if (key === '=') return r.right.length === 0 ? { state: s, event: 'none' } : reject(s);
    if (!letters.includes(key) || r.right.includes(key)) return reject(s);
    r.right += key;
    return r.right.length === r.left.length ? 'complete' : { state: s, event: 'typed' };
  }
  return reject(s);
}

// ---------------------------------------------------------------- checks when a part (or row) is complete
function checkMappingPart(s: TypingState, q: CBQuestion, p: MappingPart): PressResult {
  const resp: Record<string, string> = {}; p.rows.forEach((l, i) => { resp[l] = p.vals[i]; });
  const r = CB.checkMapping(q, resp);
  if (r.correct) return partDone(s);
  let code: string = r.code, msg = '';
  if (r.code === 'alphabetical' || r.code === 'shared-swapped') msg = r.messages[0];
  else {
    const named = p.rows.map(l => r.rows[l]).find((x: any) => x.status === 'wrong' && NAMED.has(x.code));
    const first = p.rows.map(l => r.rows[l]).find((x: any) => x.status === 'wrong');
    if (named) { code = named.code; msg = named.message; } else if (first) code = code === 'partial' ? first.code : code;
  }
  p.rows.forEach((l, i) => { if (r.rows[l].status === 'correct') p.locked[i] = true; else p.vals[i] = ''; });
  return wrong(s, q, code || 'wrong-vertex', msg);
}

function checkLettersPart(s: TypingState, q: CBQuestion, p: LettersPart): PressResult {
  const r = CB.checkLetters(q, p.vals.join(''));
  if (r.correct) return partDone(s);
  const sameLetters = p.vals.slice().sort().join('') === String(q.answer.letters).split('').sort().join('');
  r.positions.forEach((st: string, i: number) => { if (st === 'correct') p.locked[i] = true; else p.vals[i] = ''; });
  return wrong(s, q, sameLetters ? 'letters-order' : 'wrong-vertex', sameLetters ? r.messages[0] : '');
}

function checkTestPart(s: TypingState, q: CBQuestion, p: TestPart): PressResult {
  const got = p.buf === 'N' ? 'NONE' : p.buf;
  const r = CB.checkTest(q, got);
  if (r.correct) return partDone(s);
  p.buf = '';
  const want = q.answer.test;
  let code = 'wrong-test', msg = '';
  if (got === 'ASA') { code = 'asa'; msg = r.message; }
  else if (got === 'SSA' || got === 'ASS') { code = 'ssa'; msg = r.message; }
  else if (got === 'AAA') { code = 'aaa'; msg = 'AAA is not a test: triangles with equal angles can be different sizes.'; }
  else if (got === 'NONE') { code = 'none-wrong'; msg = 'There is enough information to prove they are congruent.'; }
  else if (want === 'NONE') { code = 'not-enough'; msg = r.message; }
  else if (want === 'SAS' && got === 'RHS' && q.facts.some((f: any) => f.kind === 'R')) { code = 'rhs-sas'; msg = r.message; }
  else if (got.split('').sort().join('') === String(want).split('').sort().join('')) { code = 'test-order'; msg = `We write this test as ${want}.`; }
  return wrong(s, q, code, msg);
}

/** A pairs row has both sides typed: is it one of the known pairs? */
function checkPairsRow(s: TypingState, q: CBQuestion, p: PairsPart, i: number): PressResult {
  const r = p.rows[i];
  const done = p.order.filter(j => j !== i).map(j => rowResp(p.rows[j], false));
  const res = CB.checkPairs(q, { pairs: [...done, rowResp(r, false)] });
  const rr = res.rows[res.rows.length - 1];
  if (rr.status === 'correct') {
    if (p.askReasons) { r.stage = 'reason'; s.message = ''; return { state: s, event: 'typed' }; }
    return finishRow(s, q, p, i);
  }
  const code = rr.code || rr.status;
  // keep the left side when it is a good element and only the match is wrong
  if (!r.prefilled && code === 'not-matching' && CB.poolHas(q, r.left)) { r.right = ''; r.stage = 'right'; }
  else clearRow(r);
  return wrong(s, q, code, rr.message);
}

function finishRow(s: TypingState, q: CBQuestion, p: PairsPart, i: number): PressResult {
  p.rows[i].stage = 'done';
  p.order = [...p.order.filter(j => j !== i), i];
  s.message = '';
  if (p.rows.some(r => r.stage !== 'done')) return { state: s, event: 'typed' };
  // all three rows are in: do they prove a test BY POSITION?
  const res = CB.checkPairs(q, { pairs: p.order.map(j => rowResp(p.rows[j], p.askReasons)) });
  if (res.correct) return partDone(s);
  const cls = res.classification;
  let clear = p.order[p.order.length - 1];
  if (cls === 'ASA') clear = p.order.find(j => p.rows[j].kind === 'S') ?? clear;
  if (cls === 'SSA') clear = p.order.find(j => p.rows[j].kind === 'A') ?? clear;
  clearRow(p.rows[clear]);
  p.order = p.order.filter(j => j !== clear);
  const code = cls === 'ASA' ? 'asa' : cls === 'SSA' ? 'ssa' : cls === 'AAA' ? 'aaa' : 'wrong-test';
  return wrong(s, q, code, res.messages[0]);
}

function checkReason(s: TypingState, q: CBQuestion, p: PairsPart, i: number): PressResult {
  const r = p.rows[i];
  const done = p.order.filter(j => j !== i).map(j => rowResp(p.rows[j], false));
  const res = CB.checkPairs(q, { pairs: [...done, rowResp(r, true)] });
  const rr = res.rows[res.rows.length - 1];
  if (rr.reasonCorrect !== false) return finishRow(s, q, p, i);
  r.reason = '';
  return wrong(s, q, 'reason');
}

function checkFactPart(s: TypingState, q: CBQuestion, p: FactPart): PressResult {
  const r = p.row;
  const res = CB.checkFact(q, { left: r.left, right: r.right });
  if (res.correct) return partDone(s);
  const row = res.row || {};
  let code = row.code || 'not-matching';
  const known = row.status === 'correct' || row.status === 'unused';
  if (known) {
    const m: string = res.message || '';
    code = m.startsWith('That pair is already') ? 'already-marked' : /ASA/.test(m) ? 'asa' : /SSA|between the two sides/.test(m) ? 'ssa' : 'other-test';
  }
  clearRow(r);
  return wrong(s, q, code, res.message);
}

// ---------------------------------------------------------------- the one entry point
/** key: a letter A-Z, "=", or "Backspace". */
export function press(state: TypingState, q: CBQuestion, rawKey: string): PressResult {
  if (state.solved) return { state, event: 'none' };
  const s = clone(state);
  const key = rawKey === 'Backspace' ? 'Backspace' : rawKey.length === 1 ? rawKey.toUpperCase() : '';
  if (!key) return { state, event: 'none' };
  const p = s.parts[s.cur];
  s.flashKind = null; // the last message stays until the part is finished or replaced

  if (p.kind === 'mapping' || p.kind === 'letters') {
    if (key === 'Backspace') {
      for (let i = p.vals.length - 1; i >= 0; i--) if (p.vals[i] && !p.locked[i]) { p.vals[i] = ''; break; }
      return { state: s, event: 'typed' };
    }
    if (!/^[A-Z]$/.test(key)) return reject(s);
    if (!p.choices.includes(key)) {
      if (p.kind === 'mapping' && q.tri1.includes(key) && figureLetters(q).includes(key)) {
        const slot = p.vals.findIndex(v => !v);
        const r = CB.checkMappingRow(q, p.rows[Math.max(slot, 0)], key);
        if (r.code === 'from-same-triangle') return wrong(s, q, r.code, r.message);
      }
      return reject(s);
    }
    if (p.vals.includes(key)) return reject(s);
    const slot = p.vals.findIndex(v => !v);
    if (slot < 0) return reject(s);
    p.vals[slot] = key;
    if (p.vals.every(Boolean)) return p.kind === 'mapping' ? checkMappingPart(s, q, p) : checkLettersPart(s, q, p);
    return { state: s, event: 'typed' };
  }

  if (p.kind === 'test') {
    if (key === 'Backspace') { p.buf = p.buf.slice(0, -1); return { state: s, event: 'typed' }; }
    if (key === 'N' && p.allowNone && !p.buf) { p.buf = 'N'; return checkTestPart(s, q, p); }
    if (!'SARH'.includes(key)) return reject(s);
    p.buf += key;
    if (p.buf.length === 3) return checkTestPart(s, q, p);
    return { state: s, event: 'typed' };
  }

  // pairs or fact: one row at a time
  const cr = currentRow(s)!;
  const r = cr.row;
  if (key === 'Backspace') {
    if (r.stage === 'right' && r.right) r.right = r.right.slice(0, -1);
    else if (r.stage === 'right' && !r.prefilled) { r.stage = 'left'; r.kind = null; r.left = r.left.slice(0, -1); }
    else if (r.stage === 'left') r.left = r.left.slice(0, -1);
    return { state: s, event: 'typed' };
  }
  if (p.kind === 'pairs' && r.stage === 'reason') {
    const reason = reasonFromKey(key, r);
    if (!reason) return reject(s);
    r.reason = reason;
    return checkReason(s, q, p, cr.index);
  }
  const expect = p.kind === 'fact' ? p.expect : r.prefilled ? (r.kind === 'S' ? 'side' : 'angle') : null;
  const t = typeIntoRow(s, q, r, key, expect);
  if (t !== 'complete') return t;
  return p.kind === 'fact' ? checkFactPart(s, q, p) : checkPairsRow(s, q, p, cr.index);
}

/** Keys for the on-screen keypad (phones), for whatever is being typed now. */
export function keypadKeys(s: TypingState, q: CBQuestion): string[] {
  const p = s.parts[s.cur];
  if (!p || s.solved) return [];
  if (p.kind === 'mapping' || p.kind === 'letters') return p.choices.slice().sort();
  if (p.kind === 'test') return p.allowNone ? ['S', 'A', 'R', 'H', 'N'] : ['S', 'A', 'R', 'H'];
  const cr = currentRow(s);
  if (cr && cr.row.stage === 'reason') return REASON_KEYS.map(k => k.key);
  return [...figureLetters(q), '='];
}

/** How the element is shown: ∠ in front once we know it is an angle. */
export function showEl(text: string, kind: 'S' | 'A' | null): string {
  return kind === 'A' && text ? '∠' + text : text;
}
