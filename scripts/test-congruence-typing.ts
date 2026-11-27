/* Simulates students typing on the 9 SEAL congruence pages, for every question
 * type at every level. Run:  npm run test:congruence
 *
 * Checks that:
 *  - every correct answer is accepted (every valid set of three pairs, in any order,
 *    either way round, angles named either direction), with no rejected key;
 *  - impossible keys are rejected without typing anything;
 *  - a wrong part is cleared and correct parts are kept;
 *  - ASA / SSA sets of pairs are refused with a message, and only the offending row is cleared;
 *  - unmarked-but-true pairs and non-matching pairs are refused;
 *  - the answer is shown after 3 misses on a part.
 */
import CB, { CBQuestion } from '../utils/congruenceBank';
import { createTyping, press, TypingState, figureLetters, REVEAL_AFTER } from '../utils/congruenceTyping';
import { CONGRUENCE_MODES, pickQuestion } from '../components/congruenceLevels';

let checks = 0, failures = 0;
const fail = (msg: string, q?: CBQuestion) => { failures++; if (failures <= 25) console.log('FAIL', msg, q ? `[${q.id}]` : ''); };
const ok = (cond: any, msg: string, q?: CBQuestion) => { checks++; if (!cond) fail(msg, q); };

let seed = 1;
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];
const shuffle = <T,>(a: T[]) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

function typeAll(s: TypingState, q: CBQuestion, keys: string[]) {
  const events: string[] = [];
  for (const k of keys) { const r = press(s, q, k); s = r.state; events.push(r.event + (r.code ? ':' + r.code : '')); }
  return { s, events };
}
const bad = (events: string[]) => events.filter(e => e.startsWith('reject') || e.startsWith('wrong'));

const REASON_KEY: Record<string, string[]> = {
  given: ['G'], 'common-side': ['C'], 'common-angle': ['C'], 'vert-opp': ['V'], alternate: ['A'], 'right-given': ['R', 'G'],
};
const elLetters = (e: any, flip: boolean) => e.t === 'side' ? (flip ? [e.p[1], e.p[0]] : e.p) : (flip ? [e.c, e.v, e.a] : [e.a, e.v, e.c]);
function rowKeys(f: any, withReason: boolean, opts: { swap?: boolean; flip?: boolean; prefilled?: boolean } = {}): string[] {
  const L = elLetters(f.leftEl, !!opts.flip), R = elLetters(f.rightEl, !!opts.flip);
  if (opts.prefilled) return [...R, ...(withReason ? [pick(REASON_KEY[f.reason])] : [])];
  const [a, b] = opts.swap ? [R, L] : [L, R];
  return [...a, ...(a.length < 3 ? ['='] : []), ...b, ...(withReason ? [pick(REASON_KEY[f.reason])] : [])];
}
function combos3<T>(a: T[]): T[][] { const out: T[][] = []; for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) for (let k = j + 1; k < a.length; k++) out.push([a[i], a[j], a[k]]); return out; }
const classify = (t: any[]) => CB.classifyFacts(t.map(f => ({ kind: f.kind, el: f.leftEl })));

/** Keys that answer a part correctly. For a pairs part, `triple` chooses which three pairs. */
function partKeys(q: CBQuestion, s: TypingState, triple?: any[]): string[] {
  const p = s.parts[s.cur];
  if (p.kind === 'mapping') return p.rows.map(l => q.answer.mapping[l]);
  if (p.kind === 'letters') return String(q.answer.letters).split('');
  if (p.kind === 'test') return q.answer.test === 'NONE' ? ['N'] : String(q.answer.test).split('');
  if (p.kind === 'fact') return rowKeys(pick(q.answer.accept), false, { swap: rand() < 0.3, flip: rand() < 0.3 });
  // pairs
  if (p.rows[0].prefilled) {
    const spec = q.input.kind === 'steps' ? q.input.steps[1] : q.input;
    return spec.rows.flatMap((r: any, i: number) => rowKeys(q.facts[i], p.askReasons, { prefilled: true, flip: false }));
  }
  const t = triple || pick(validTriples(q));
  return shuffle(t).flatMap(f => rowKeys(f, p.askReasons, { swap: rand() < 0.3, flip: rand() < 0.4 }));
}
const validTriples = (q: CBQuestion) => combos3(q.pool).filter(t => classify(t) === q.test);

function solveAll(q: CBQuestion, triple?: any[]) {
  let s = createTyping(q); const all: string[] = [];
  let guard = 0;
  while (!s.solved && guard++ < 10) { const r = typeAll(s, q, partKeys(q, s, triple)); s = r.s; all.push(...r.events); }
  return { s, events: all };
}

// ---------------------------------------------------------------- run
const N = Number(process.argv[2] || 150);
const kinds: Record<string, number> = {};
for (const modeKey of Object.keys(CONGRUENCE_MODES)) {
  for (const level of [1, 2, 3] as const) {
    for (let n = 0; n < N; n++) {
      const q = pickQuestion(modeKey, level, 1 + Math.floor(rand() * 2e9));
      kinds[`${modeKey} L${level} ${q.type}`] = (kinds[`${modeKey} L${level} ${q.type}`] || 0) + 1;

      // 1. the canonical/random correct answer goes straight through
      const r = solveAll(q);
      ok(r.s.solved, `not solved by a correct answer (${modeKey} L${level} ${q.type})`, q);
      ok(bad(r.events).length === 0, `correct answer gave ${bad(r.events).join(',')} (${q.type})`, q);

      // 2. every valid triple is accepted (free pairs parts)
      const s0 = createTyping(q);
      const pairsIdx = s0.parts.findIndex(p => p.kind === 'pairs');
      if (pairsIdx >= 0 && !(s0.parts[pairsIdx] as any).rows[0].prefilled) {
        for (const t of validTriples(q)) {
          const rt = solveAll(q, t);
          ok(rt.s.solved && bad(rt.events).length === 0, `valid triple ${t.map((f: any) => f.left).join(',')} not accepted: ${bad(rt.events).join(',')}`, q);
        }
        // 3. ASA / SSA / AAA triples from what is known: refused, offending row cleared, then fixable
        for (const t of combos3(q.pool)) {
          const cls = classify(t);
          if (!['ASA', 'SSA', 'AAA'].includes(cls)) continue;
          let s = createTyping(q);
          for (let k = 0; k < pairsIdx; k++) s = typeAll(s, q, partKeys(q, s)).s;
          const p = s.parts[pairsIdx] as any;
          const ev = typeAll(s, q, t.flatMap((f: any) => rowKeys(f, p.askReasons)));
          const last = ev.events[ev.events.length - 1];
          ok(last === 'wrong:' + cls.toLowerCase(), `${cls} triple gave ${last}`, q);
          ok(ev.s.message.length > 0, `${cls} triple: no message`, q);
          const rows = (ev.s.parts[pairsIdx] as any).rows;
          ok(rows.filter((x: any) => x.stage === 'done').length === 2, `${cls}: should keep two rows`, q);
          if (cls === 'ASA') ok(rows.filter((x: any) => x.stage === 'done').every((x: any) => x.kind === 'A'), 'ASA: the side row should be the one cleared', q);
          if (cls === 'SSA') ok(rows.filter((x: any) => x.stage === 'done').every((x: any) => x.kind === 'S'), 'SSA: the angle row should be the one cleared', q);
        }
      }

      // 4. a key that is never right is rejected and changes nothing
      const letters = figureLetters(q);
      const stray = 'QWZXJVU'.split('').find(l => !letters.includes(l) && !(s0.parts[0].kind === 'test' && 'SARHN'.includes(l)));
      if (stray) {
        const rr = press(s0, q, stray);
        ok(rr.event === 'reject', `stray key ${stray} not rejected (${s0.parts[0].kind})`, q);
        ok(JSON.stringify(rr.state.parts) === JSON.stringify(s0.parts), 'stray key changed the answer', q);
      }

      // 5. wrong test letters: ASA always refused with a message; reveal after 3 misses
      let st = createTyping(q);
      const ti = st.parts.findIndex(p => p.kind === 'test');
      if (ti >= 0) {
        for (let k = 0; k < ti; k++) st = typeAll(st, q, partKeys(q, st)).s;
        const e1 = typeAll(st, q, ['A', 'S', 'A']);
        ok(e1.events[2] === 'wrong:asa' && e1.s.message.includes('ASA'), `ASA test not refused properly: ${e1.events[2]}`, q);
        ok((e1.s.parts[ti] as any).buf === '', 'test not cleared after wrong', q);
        let s2 = e1.s;
        for (let k = 1; k < REVEAL_AFTER; k++) s2 = typeAll(s2, q, ['A', 'S', 'A']).s;
        ok(s2.reveal.length > 0, 'no reveal after 3 misses', q);
        ok(typeAll(s2, q, partKeys(q, s2)).s.solved, 'cannot finish after reveal', q);
      }

      // 6. mapping: a wrong mapping keeps the right rows and clears the wrong ones
      const mi = s0.parts.findIndex(p => p.kind === 'mapping');
      if (mi === 0) {
        const p = s0.parts[0] as any;
        const right = p.rows.map((l: string) => q.answer.mapping[l]);
        const wrongMap = [right[1], right[0], right[2]];
        const e = typeAll(s0, q, wrongMap);
        const pp = e.s.parts[0] as any;
        ok(e.events[2].startsWith('wrong'), 'swapped mapping not refused', q);
        ok(pp.locked[2] && pp.vals[2] === right[2] && !pp.vals[0] && !pp.vals[1], 'swapped mapping: wrong rows not cleared / right row not kept', q);
        ok(typeAll(e.s, q, [right[0], right[1]]).s.parts[0].done, 'mapping not accepted after fixing', q);
      }

      // 7. pairs: a true but unmarked pair is refused; a non-matching right side keeps the left
      if (pairsIdx >= 0 && !(s0.parts[pairsIdx] as any).rows[0].prefilled && q.tri1.every(l => !q.tri2.includes(l))) {
        let s = createTyping(q);
        for (let k = 0; k < pairsIdx; k++) s = typeAll(s, q, partKeys(q, s)).s;
        const m = q.mapping, t1 = q.tri1;
        const sides = [[t1[0], t1[1]], [t1[1], t1[2]], [t1[0], t1[2]]];
        const known = new Set(q.pool.map((f: any) => f.leftEl.t === 'side' ? f.leftEl.p.slice().sort().join('') : ''));
        const unmarked = sides.find(sd => !known.has(sd.slice().sort().join('')));
        if (unmarked) {
          const e = typeAll(s, q, [...unmarked, '=', m[unmarked[0]], m[unmarked[1]]]);
          ok(e.events[e.events.length - 1] === 'wrong:true-but-not-marked', `unmarked side gave ${e.events[e.events.length - 1]}`, q);
        }
        const kSide = q.pool.find((f: any) => f.leftEl.t === 'side');
        if (kSide) {
          const L = kSide.leftEl.p, R = kSide.rightEl.p;
          const other = q.tri2.find(x => !R.includes(x))!;
          const e = typeAll(s, q, [...L, '=', R[0], other]);
          const row = (e.s.parts[pairsIdx] as any).rows[0];
          ok(e.events[e.events.length - 1] === 'wrong:not-matching', `non-matching gave ${e.events[e.events.length - 1]}`, q);
          ok(row.left === L.join('') && row.stage === 'right' && row.right === '', 'non-matching: left side should be kept', q);
        }
      }
    }
  }
}
console.log(Object.entries(kinds).map(([k, v]) => `${k}: ${v}`).join('\n'));
console.log(`${checks} checks, ${failures} failures`);
if (failures) process.exit(1);
