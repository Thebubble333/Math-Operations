/* Types every answer on the 9 SEAL typed-parts pages (Polygon Angles, Dijkstra) key by key.
 * Run with: npm run test:seal9 */
import { press, createTyping, keypadKeys, reachableSlips, TPQuestion, TypingState, Part } from '../utils/typedParts';
import { generatePolygon, POLYGON_TYPES, measuredAngles, labelPoints } from '../utils/polygonBank';
import { generateDijkstra, routeLength, layoutProblems, Edge } from '../utils/dijkstraBank';
import { SEAL9_TOPICS } from '../components/seal9Topics';

let checks = 0, failures = 0;
const fail = (msg: string) => { failures++; if (failures <= 25) console.log('FAIL', msg); };
const ok = (cond: boolean, msg: string) => { checks++; if (!cond) fail(msg); };

const keysFor = (p: Part, answer = p.answer) => (p.kind === 'path' ? answer.slice(1) : answer).split('');

/** Type all parts before `upTo` correctly. */
function advanceTo(q: TPQuestion, upTo: number): TypingState {
  let s = createTyping();
  for (let i = 0; i < upTo; i++) for (const k of keysFor(q.parts[i])) s = press(s, q, k).state;
  return s;
}

function checkQuestion(q: TPQuestion, tag: string) {
  // 1. the right answers are accepted, with no rejected key, and the question ends solved
  let s = createTyping();
  q.parts.forEach((p, i) => {
    const ks = keysFor(p);
    ks.forEach((k, j) => {
      ok(keypadKeys(s, q).includes(k), `${tag} part ${i}: key ${k} missing from keypad`);
      const r = press(s, q, k);
      const want = j < ks.length - 1 ? 'typed' : i < q.parts.length - 1 ? 'part' : 'solved';
      ok(r.event === want, `${tag} part ${i} (${p.label}) key ${k}: got ${r.event}, want ${want}`);
      s = r.state;
    });
  });
  ok(s.solved, `${tag}: not solved after typing every answer`);
  ok(press(s, q, '1').event === 'none', `${tag}: keys still accepted after solving`);

  q.parts.forEach((p, i) => {
    const base = advanceTo(q, i);
    ok(base.cur === i && !base.solved, `${tag}: could not reach part ${i}`);

    // 2. impossible keys are rejected and change nothing
    const bogus = p.kind === 'number' ? 'Q' : '7';
    const rj = press(base, q, bogus);
    ok(rj.event === 'reject' && rj.state.buf === base.buf && rj.state.misses === 0, `${tag} part ${i}: ${bogus} not rejected`);
    if (p.kind === 'letter') {
      const notAllowed = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('').find(c => !p.allowed.includes(c))!;
      ok(press(base, q, notAllowed).event === 'reject', `${tag} part ${i}: letter ${notAllowed} not rejected`);
    }
    if (p.kind === 'path') {
      ok(press(base, q, p.start).event === 'reject', `${tag} part ${i}: start letter not rejected`);
      const unjoined = Object.keys(p.adj).find(v => v !== p.start && !p.adj[p.start].includes(v));
      if (unjoined) ok(press(base, q, unjoined).event === 'reject', `${tag} part ${i}: ${unjoined} is not joined to ${p.start} but was accepted`);
    }

    // 3. each named misconception gives its message, keeps earlier parts, and clears the answer
    for (const sl of reachableSlips(p)) {
      let st = base, last = '';
      for (const k of sl.value.split('')) { const r = press(st, q, k); last = r.event; st = r.state; if (r.event !== 'typed') break; }
      ok(last === 'wrong' && st.message === sl.message && st.cur === i && st.buf === '', `${tag} part ${i}: slip ${sl.value} (${sl.code}) gave ${last} "${st.message}"`);
    }

    // 4. after 3 misses the answer is shown, and typing it still works
    if (p.kind === 'number') {
      // a plain slip: not a misconception and not the start of one
      let wrongVal = String(Number(p.answer) + 1);
      while ((p.slips || []).some(sl => sl.value.startsWith(wrongVal))) wrongVal = String(Number(wrongVal) + 1);
      let st = base;
      for (let m = 0; m < 3; m++) for (const k of wrongVal.split('')) { const r = press(st, q, k); st = r.state; if (r.event !== 'typed') break; }
      ok(st.misses === 3 && st.reveal.startsWith(p.answer), `${tag} part ${i}: no reveal after 3 misses (${st.misses}, "${st.reveal}")`);
      let r = { state: st, event: 'none' as string };
      for (const k of p.answer.split('')) r = press(r.state, q, k);
      ok(r.event === 'part' || r.event === 'solved', `${tag} part ${i}: revealed answer not accepted`);
    }
    if (p.kind === 'letter') {
      const wrongL = p.allowed.find(c => c !== p.answer);
      if (wrongL) {
        let st = base;
        for (let m = 0; m < 3; m++) st = press(st, q, wrongL).state;
        ok(st.misses === 3 && st.reveal === p.answer, `${tag} part ${i}: no reveal for letter part`);
      }
    }
  });
}

// ---------------------------------------------------------------- polygons
const N = Number(process.env.N || 400);
for (const level of [1, 2, 3] as const) {
  for (let seed = 1; seed <= N; seed++) {
    const q = generatePolygon(level, seed * 31 + level);
    checkQuestion(q, `polygons L${level} seed ${seed}`);
  }
}
for (const type of POLYGON_TYPES) {
  for (let seed = 1; seed <= N; seed++) {
    const q = generatePolygon(1, seed * 7 + 3, type);
    const m = q.meta, n = m.n;
    const ans = q.parts[q.parts.length - 1].answer;
    const tag = `polygons ${type} seed ${seed}`;
    // the maths, worked out a second way
    if (type === 'sum') ok(Number(ans) === (n - 2) * 180, `${tag}: wrong sum`);
    if (type === 'sides-from-sum' || type === 'sides-from-exterior' || type === 'sides-from-interior') ok(Number(ans) === n, `${tag}: wrong n`);
    if (type === 'exterior') ok(Number(ans) * n === 360, `${tag}: wrong exterior`);
    if (type === 'interior') ok(Number(ans) * n === (n - 2) * 180, `${tag}: wrong interior`);
    if (type === 'missing') {
      ok(m.given.reduce((a: number, b: number) => a + b, 0) + Number(ans) === (n - 2) * 180, `${tag}: angles do not add up`);
      ok(Number(ans) > 0 && Number(ans) < 180 && m.given.every((g: number) => g > 0 && g < 180), `${tag}: an angle is not between 0° and 180°`);
      ok(q.svg!.includes(`${q.parts[1].label[0]}°`), `${tag}: unknown not labelled in the diagram`);
      // the diagram is drawn to scale: every corner measures what its label says
      const all = [...m.given]; all.splice(m.unknown, 0, m.x);
      const drawn = measuredAngles(m.pts);
      ok(drawn.every((d: number, i: number) => Math.abs(d - all[i]) < 0.5), `${tag}: drawn angles ${drawn.map((d: number) => d.toFixed(0))} do not match ${all}`);
      ok(m.pts.every((p: number[]) => p[0] > 20 && p[0] < 320 && p[1] > 15 && p[1] < 235), `${tag}: a corner is off the picture`);
      const lp = labelPoints(m.pts);
      ok(lp.every((p, i) => lp.every((r, j) => j <= i || Math.hypot(p[0] - r[0], p[1] - r[1]) >= 52)), `${tag}: two angle labels are too close`);
    }
    q.parts.forEach(p => ok(/^\d+$/.test(p.answer), `${tag}: answer ${p.answer} is not a whole number`));
  }
}

// ---------------------------------------------------------------- Dijkstra
function shortest(E: Edge[], start: string, end: string): number {
  const d: Record<string, number> = { [start]: 0 };
  for (let k = 0; k < 10; k++) for (const e of E) {
    if (d[e.a] !== undefined && (d[e.b] === undefined || d[e.a] + e.w < d[e.b])) d[e.b] = d[e.a] + e.w;
    if (d[e.b] !== undefined && (d[e.a] === undefined || d[e.b] + e.w < d[e.a])) d[e.a] = d[e.b] + e.w;
  }
  return d[end];
}
function countShortest(E: Edge[], start: string, end: string, best: number): number {
  let count = 0;
  const walk = (route: string) => {
    const v = route[route.length - 1];
    const len = routeLength(E, route);
    if (len > best) return;
    if (v === end) { if (len === best) count++; return; }
    for (const e of E) {
      const u = e.a === v ? e.b : e.b === v ? e.a : '';
      if (u && !route.includes(u)) walk(route + u);
    }
  };
  walk(start);
  return count;
}
/** Dijkstra's algorithm written a second way: the expected answer for every step, in order. */
function expectedSteps(E: Edge[], start: string, end: string, level: number): string[] {
  const d: Record<string, number> = { [start]: 0 }, boxed = new Set([start]);
  const out: string[] = [];
  let cur = start;
  while (true) {
    const ns = E.filter(e => e.a === cur || e.b === cur).map(e => ({ v: e.a === cur ? e.b : e.a, w: e.w }))
      .filter(x => !boxed.has(x.v)).sort((a, b) => (a.v < b.v ? -1 : 1));
    for (const { v, w } of ns) { d[v] = d[v] === undefined ? d[cur] + w : Math.min(d[v], d[cur] + w); out.push(String(d[v])); }
    let best = '';
    for (const v of Object.keys(d)) if (!boxed.has(v) && (best === '' || d[v] < d[best])) best = v;
    if (level >= 2) out.push(best);
    boxed.add(best);
    if (best === end) break;
    cur = best;
  }
  return out;
}

const D = Number(process.env.D || 300);
for (const level of [1, 2, 3] as const) {
  let parts = 0;
  for (let seed = 1; seed <= D; seed++) {
    const q = generateDijkstra(level, seed * 13 + level);
    const tag = `dijkstra L${level} seed ${seed}`;
    checkQuestion(q, tag);
    const m = q.meta;
    const best = shortest(m.E, m.start, m.end);
    ok(best === m.dist, `${tag}: algorithm gave ${m.dist}, true shortest is ${best}`);
    ok(routeLength(m.E, m.path) === best, `${tag}: path ${m.path} is not the shortest`);
    ok(countShortest(m.E, m.start, m.end, best) === 1, `${tag}: more than one shortest path`);
    const lp = layoutProblems(m.V, m.E);
    ok(lp.length === 0, `${tag}: layout: ${lp.join('; ')}`);
    ok(q.parts[q.parts.length - 1].answer === String(best), `${tag}: final distance part is wrong`);
    const steps = q.parts.filter(p => p.kind !== 'path').slice(0, -1).map(p => p.answer);
    ok(steps.join(',') === expectedSteps(m.E, m.start, m.end, level).join(','), `${tag}: steps ${steps.join(',')} differ from a fresh run of the algorithm`);
    ok(q.parts.some(p => p.kind === 'letter') === (level >= 2), `${tag}: box steps at the wrong level`);
    ok(q.parts.some(p => p.kind === 'path') === (level === 3), `${tag}: path step at the wrong level`);
    for (let i = 0; i <= q.parts.length; i++) ok(q.render!(i, false).startsWith('<svg'), `${tag}: no diagram at step ${i}`);
    parts += q.parts.length;
  }
  console.log(`Dijkstra level ${level}: ${(parts / D).toFixed(1)} steps per graph on average`);
}

// topics hold together
for (const [key, t] of Object.entries(SEAL9_TOPICS)) {
  for (const l of [1, 2, 3] as const) ok(t.levels[l].roundLength > 0 && !!t.levels[l].name, `${key} L${l}: missing level data`);
}

console.log(`${checks} checks, ${failures} failures`);
if (failures) process.exit(1);
