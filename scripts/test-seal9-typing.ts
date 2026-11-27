/* Types every answer on the 9 SEAL typed-parts pages (Polygon Angles, Angle Chase, Dijkstra, Networks) key by key.
 * Run with: npm run test:seal9 */
import { press, choose, createTyping, keypadKeys, reachableSlips, showPath, TPQuestion, TypingState, Part, ChoicePart, RoutePart } from '../utils/typedParts';
import { generateDegrees, generateWalks, LAYOUTS, layoutProblems as netLayoutProblems, findRoutes, Graph } from '../utils/networkBank';
import { generatePolygon, POLYGON_TYPES, measuredAngles, labelPoints } from '../utils/polygonBank';
import { generateDijkstra, routeLength, layoutProblems, Edge } from '../utils/dijkstraBank';
import { SEAL9_TOPICS } from '../components/seal9Topics';
import { ANGLE_LEVEL_ITEMS, ANGLE_TYPES, arcRadius, layoutProblems as anglesLayoutProblems, Fig as AngleFig, Seg as AngleSeg } from '../utils/angleBank';

let checks = 0, failures = 0;
const fail = (msg: string) => { failures++; if (failures <= 25) console.log('FAIL', msg); };
const ok = (cond: boolean, msg: string) => { checks++; if (!cond) fail(msg); };

/** The shortest start of an option's word that no other option shares. */
function uniquePrefix(p: ChoicePart, value: string): string {
  const o = p.options.find(x => x.value === value)!;
  const w = o.keys[0];
  for (let n = 1; n <= w.length; n++) {
    const pre = w.slice(0, n);
    if (p.options.filter(x => x.keys.some(k => k.startsWith(pre))).length === 1) return pre;
  }
  return w;
}
const keysFor = (p: Part, answer = p.answer) =>
  (p.kind === 'path' ? answer.slice(1) : p.kind === 'choice' ? uniquePrefix(p, answer) : answer).split('');

/** Is this a finished route that does the job? Checked from scratch, not with the page's own code. */
function validRoute(p: RoutePart, r: string): boolean {
  for (let i = 0; i + 1 < r.length; i++) if (!p.adj[r[i]].includes(r[i + 1])) return false;
  const verts = Object.keys(p.adj);
  if (p.mode === 'euler') {
    const all = new Set(verts.flatMap(v => p.adj[v].map(u => [v, u].sort().join(''))));
    const used = r.split('').slice(1).map((c, i) => [r[i], c].sort().join(''));
    return used.length === all.size && new Set(used).size === all.size && (!p.closed || r[0] === r[r.length - 1]);
  }
  const body = p.closed ? r.slice(0, -1) : r;
  return body.length === verts.length && new Set(body).size === verts.length && (!p.closed || r[0] === r[r.length - 1]);
}

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
      if (p.kind !== "choice") ok(keypadKeys(s, q).includes(k), `${tag} part ${i}: key ${k} missing from keypad`);
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
    if (p.kind === 'choice') {
      const dead = 'abcdefghijklmnopqrstuvwxyz'.split('').find(c => !p.options.some(o => o.keys.some(k => k.startsWith(c))))!;
      ok(press(base, q, dead).event === 'reject', `${tag} part ${i}: ${dead} fits no option but was not rejected`);
      ok(keypadKeys(base, q).length === 0, `${tag} part ${i}: keypad shown for a choice`);
      // every option can be picked by typing its word and by clicking; only the answer is right
      p.options.forEach((o, oi) => {
        let st = base, last = '';
        for (const k of o.keys[0].split('')) { const r = press(st, q, k); last = r.event; st = r.state; if (r.event !== 'typed') break; }
        const c = choose(base, q, oi);
        const right = o.value === p.answer;
        const sl = (p.slips || []).find(x => x.value === o.value);
        ok(right ? last !== 'wrong' && last !== 'typed' : last === 'wrong', `${tag} part ${i}: typing "${o.keys[0]}" gave ${last}`);
        ok(right ? c.event === 'part' || c.event === 'solved' : c.event === 'wrong' && c.state.cur === i, `${tag} part ${i}: clicking ${o.label} gave ${c.event}`);
        if (!right) ok(c.state.message === (sl ? sl.message : ''), `${tag} part ${i}: clicking ${o.label} gave "${c.state.message}"`);
        if (!right && !sl) fail(`${tag} part ${i}: wrong option ${o.label} has no message`);
      });
      const wrongI = p.options.findIndex(o => o.value !== p.answer);
      let st = base;
      for (let m = 0; m < 3; m++) st = choose(st, q, wrongI).state;
      ok(st.misses === 3 && st.reveal === p.options.find(o => o.value === p.answer)!.label, `${tag} part ${i}: no reveal for a choice`);
    }
    if (p.kind === 'route') {
      ok(press(base, q, 'Z').event === 'reject', `${tag} part ${i}: Z not rejected`);
      // every right route is accepted
      const starts = Object.keys(p.adj).filter(v => !p.startSlip || !p.startSlip(v));
      const routes = findRoutes(p.adj, p.mode, p.closed, starts, 25);
      ok(routes.length > 0 && routes.includes(p.answer) || validRoute(p, p.answer), `${tag} part ${i}: the shown answer ${p.answer} is not a right route`);
      for (const r of routes) {
        let st = base, last = '';
        for (const k of r.split('')) { const x = press(st, q, k); last = x.event; st = x.state; if (x.event !== 'typed') break; }
        ok(last === 'part' || last === 'solved', `${tag} part ${i}: right route ${r} gave ${last}`);
      }
      // random typing: whatever the page accepts as finished really is right; getting stuck clears it
      let rng = 7;
      for (let trial = 0; trial < 12; trial++) {
        let st = base, route = '', last = 'typed';
        while (last === 'typed') {
          if (route.length > 40) { fail(`${tag} part ${i}: route ${route.slice(0, 20)}… never ends`); break; }
          const ks = keypadKeys(st, q);
          if (!ks.length) { fail(`${tag} part ${i}: no keys while typing ${route}`); break; }
          rng = (rng * 1103515245 + 12345) % 2147483648;
          const k = ks[rng % ks.length];
          const x = press(st, q, k); last = x.event; st = x.state; route += k;
          ok(x.event !== 'reject', `${tag} part ${i}: keypad key ${k} rejected after ${route.slice(0, -1)}`);
        }
        if (last === 'part' || last === 'solved') ok(validRoute(p, route), `${tag} part ${i}: accepted ${route}, which is not right`);
        if (last === 'wrong') ok(st.buf === '' && st.cur === i && !!st.message && !validRoute(p, route), `${tag} part ${i}: stuck at ${route} without a message`);
      }
      if (p.startSlip) for (const v of Object.keys(p.adj)) {
        const sl = p.startSlip(v);
        if (!sl) continue;
        ok(findRoutes(p.adj, p.mode, p.closed, [v], 1).length === 0, `${tag} part ${i}: start ${v} called wrong but a route from it exists`);
        const x = press(base, q, v);
        ok(x.event === 'wrong' && x.state.message === sl.message, `${tag} part ${i}: start ${v} gave ${x.event}`);
      }
      // 3 dead ends reveal the answer
      const deadRoute = (() => {
        const all = Object.keys(p.adj);
        let budget = 3000;
        const go = (r: string): string | null => {
          if (--budget < 0 || r.length > 40) return null;
          let st = base, last = '';
          for (const k of r.split('')) { const x = press(st, q, k); last = x.event; st = x.state; }
          if (last === 'wrong') return r;
          if (last !== 'typed') return null;
          for (const k of keypadKeys(st, q)) { const f = go(r + k); if (f) return f; }
          return null;
        };
        for (const v of all) { const f = go(v); if (f) return f; }
        return null;
      })();
      if (deadRoute) {
        let st = base;
        for (let m = 0; m < 3; m++) for (const k of deadRoute.split('')) st = press(st, q, k).state;
        ok(st.misses === 3 && st.reveal === showPath(p.answer), `${tag} part ${i}: no reveal after 3 dead ends`);
      }
    }
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

// ---------------------------------------------------------------- networks
/** Faces of a straight-line drawing, traced round the edges (not from Euler's formula). */
function countFaces(g: Graph): number {
  const at = Object.fromEntries(g.V.map(v => [v.id, v]));
  const nb: Record<string, string[]> = {};
  for (const v of g.V) {
    nb[v.id] = g.E.filter(e => e.includes(v.id)).map(e => (e[0] === v.id ? e[1] : e[0]))
      .sort((a, b) => Math.atan2(at[a].y - v.y, at[a].x - v.x) - Math.atan2(at[b].y - v.y, at[b].x - v.x));
  }
  const seen = new Set<string>();
  let faces = 0;
  for (const [a, b] of g.E) for (const [u0, v0] of [[a, b], [b, a]]) {
    if (seen.has(u0 + v0)) continue;
    faces++;
    let u = u0, v = v0;
    while (!seen.has(u + v)) {
      seen.add(u + v);
      const l = nb[v], k = l.indexOf(u);
      const w = l[(k + 1) % l.length];
      u = v; v = w;
    }
  }
  return faces;
}
/** Can these degrees belong to a simple graph? (Havel–Hakimi) */
function graphical(d: number[]): boolean {
  let s = [...d].sort((a, b) => b - a);
  while (s.length && s[0] > 0) {
    const k = s.shift()!;
    if (k > s.length) return false;
    for (let i = 0; i < k; i++) { s[i]--; if (s[i] < 0) return false; }
    s.sort((a, b) => b - a);
  }
  return true;
}
const degOf = (g: Graph, id: string) => g.E.filter(e => e[0] === id || e[1] === id).length;

// every layout, every flip: nothing crosses or overlaps
for (const L of LAYOUTS) for (const fx of [false, true]) for (const fy of [false, true]) {
  const flip = (d: string) => (fx && d === 'e' ? 'w' : fx && d === 'w' ? 'e' : fy && d === 'n' ? 's' : fy && d === 's' ? 'n' : d);
  const g: Graph = {
    V: L.pts.map(([x, y, d], i) => ({ id: 'ABCDEFG'[i], x: fx ? 440 - x : x, y: fy ? 240 - y : y, dir: flip(d) as any })),
    E: L.edges.map(([a, b]) => ['ABCDEFG'[a], 'ABCDEFG'[b]] as [string, string]),
  };
  const lp = netLayoutProblems(g);
  ok(lp.length === 0, `layout ${LAYOUTS.indexOf(L)} flip ${fx}/${fy}: ${lp.join('; ')}`);
  ok(countFaces(g) === g.E.length - g.V.length + 2, `layout ${LAYOUTS.indexOf(L)}: traced faces do not fit Euler's formula`);
}

const NW = Number(process.env.NW || 300);
const typeCount: Record<string, number> = {};
for (const level of [1, 2, 3] as const) {
  for (let seed = 1; seed <= NW; seed++) {
    const q = generateDegrees(level, seed * 17 + level);
    const tag = `degrees L${level} seed ${seed}`;
    checkQuestion(q, tag);
    const m = q.meta;
    typeCount[`degrees ${m.type}${m.possible === false ? ' (no)' : ''}`] = (typeCount[`degrees ${m.type}${m.possible === false ? ' (no)' : ''}`] || 0) + 1;
    const ans = q.parts.map(p => p.answer);
    if (m.type === 'read') {
      const g: Graph = m.g;
      const mark = q.parts[2].label.match(/of (\w)/)![1];
      ok(ans[0] === String(g.V.length) && ans[1] === String(g.E.length), `${tag}: wrong counts`);
      ok(ans[2] === String(degOf(g, mark)), `${tag}: wrong degree of ${mark}`);
      ok(ans[3] === String(g.V.reduce((t, v) => t + degOf(g, v.id), 0)), `${tag}: wrong sum of degrees`);
      ok(q.svg!.includes('#f59e0b'), `${tag}: the vertex is not marked`);
    }
    if (m.type === 'edges-to-sum') ok(ans[0] === String(2 * m.e), `${tag}: wrong sum`);
    if (m.type === 'list') {
      const sum = m.degs.reduce((a: number, b: number) => a + b, 0);
      ok(ans[0] === String(sum), `${tag}: wrong sum`);
      ok(m.possible === graphical(m.degs) && m.possible === (sum % 2 === 0), `${tag}: ${m.degs} possible=${m.possible}`);
      ok(ans[1] === (m.possible ? 'yes' : 'no'), `${tag}: wrong choice`);
      if (m.possible) ok(ans[2] === String(sum / 2), `${tag}: wrong edges`);
      ok(m.degs.every((d: number) => d >= 1), `${tag}: a vertex of degree 0`);
    }
    if (m.type === 'formula') {
      ok(m.v + m.f === m.e + 2 && m.v >= 3 && m.f >= 2 && m.e <= 3 * m.v - 6, `${tag}: impossible graph ${m.v},${m.e},${m.f}`);
      ok(ans[0] === String(m[m.unknown]), `${tag}: wrong unknown`);
    }
    if (m.type === 'count') {
      ok(ans.join(',') === [m.g.V.length, m.g.E.length, countFaces(m.g)].join(','), `${tag}: counts ${ans} vs traced faces ${countFaces(m.g)}`);
      ok(netLayoutProblems(m.g).length === 0, `${tag}: layout`);
    }
  }
}

for (const level of [1, 2, 3] as const) {
  for (let seed = 1; seed <= NW; seed++) {
    const q = generateWalks(level, seed * 19 + level);
    const tag = `walks L${level} seed ${seed}`;
    checkQuestion(q, tag);
    const m = q.meta, g: Graph = m.g;
    typeCount[`walks ${m.type} ${m.want || m.kind || (m.closed ? 'cycle' : 'path')}`] = (typeCount[`walks ${m.type} ${m.want || m.kind || (m.closed ? 'cycle' : 'path')}`] || 0) + 1;
    ok(netLayoutProblems(g).length === 0, `${tag}: layout`);
    const adj = (a: string, b: string) => g.E.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
    if (m.type === 'name') {
      const w: string = m.w;
      ok(w.split('').slice(1).every((c, i) => adj(w[i], c)), `${tag}: ${w} does not follow the edges`);
      // classify again, a different way
      const es = w.split('').slice(1).map((c, i) => [w[i], c].sort().join(''));
      const closed = w[0] === w[w.length - 1];
      const vs = closed ? w.slice(1) : w;
      const want = new Set(es).size < es.length ? 'walk' : new Set(vs).size < vs.length ? (closed ? 'circuit' : 'trail') : closed ? 'cycle' : 'path';
      ok(q.parts[0].answer === want, `${tag}: ${w} is a ${want}, page says ${q.parts[0].answer}`);
    }
    if (m.type === 'euler') {
      const odd = g.V.filter(v => degOf(g, v.id) % 2 === 1).length;
      ok(q.parts[0].answer === String(odd), `${tag}: odd vertices`);
      const p0 = { kind: 'route', mode: 'euler', closed: false, adj: Object.fromEntries(g.V.map(v => [v.id, g.E.filter(e => e.includes(v.id)).map(e => (e[0] === v.id ? e[1] : e[0]))])) } as any;
      const any = findRoutes(p0.adj, 'euler', false, g.V.map(v => v.id), 1).length > 0;
      const circuit = findRoutes(p0.adj, 'euler', true, g.V.map(v => v.id), 50).some((r: string) => r[0] === r[r.length - 1]);
      const kind = !any ? 'neither' : circuit ? 'circuit' : 'trail';
      ok(q.parts[1].answer === kind, `${tag}: says ${q.parts[1].answer}, searching says ${kind}`);
      ok((q.parts.length === 3) === (kind !== 'neither'), `${tag}: write-it step at the wrong time`);
    }
    if (m.type === 'hamilton') ok(validRoute(q.parts[0] as RoutePart, q.parts[0].answer), `${tag}: shown answer is not Hamiltonian`);
  }
}
console.log(Object.entries(typeCount).map(([k, v]) => `${k}: ${v}`).join(' | '));
// every kind of question really comes up (at least 1 in 20 of its level)
for (const k of ['degrees read', 'degrees list', 'degrees list (no)', 'degrees edges-to-sum', 'degrees count', 'degrees formula',
  'walks name walk', 'walks name trail', 'walks name path', 'walks name circuit', 'walks name cycle',
  'walks euler circuit', 'walks euler trail', 'walks euler neither', 'walks hamilton path', 'walks hamilton cycle']) {
  ok((typeCount[k] || 0) >= NW / 20, `question type "${k}" came up ${typeCount[k] || 0} times in ${NW}`);
}

// ---------------------------------------------------------------- angle chase
// Each diagram is measured: every arc must measure what its label says (or the typed answer),
// and must sit between two drawn lines with no other line inside it.
type Pt = [number, number];
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const len = (v: Pt) => Math.hypot(v[0], v[1]);
const angleAt = (o: Pt, p: Pt, r: Pt) => {
  const a = sub(p, o), b = sub(r, o);
  return Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / (len(a) * len(b))))) * 180 / Math.PI;
};
const distToSeg = (p: Pt, s: AngleSeg) => {
  const d = sub(s.b, s.a), t = Math.max(0, Math.min(1, ((p[0] - s.a[0]) * d[0] + (p[1] - s.a[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2)));
  return len(sub(p, [s.a[0] + t * d[0], s.a[1] + t * d[1]]));
};
const NA = Number(process.env.NA || 400);
const angleCount: Record<string, number> = {};
const angleTopic = SEAL9_TOPICS.angles;
for (const level of [1, 2, 3] as const) {
  for (let seed = 1; seed <= NA; seed++) {
    const q = angleTopic.generate(level, seed * 13 + level);
    const tag = `angles L${level} ${q.meta.type} seed ${seed}`;
    angleCount[`L${level} ${q.meta.type}`] = (angleCount[`L${level} ${q.meta.type}`] || 0) + 1;
    ok(ANGLE_LEVEL_ITEMS[level].includes(q.meta.type), `${tag}: type not in this level`);
    checkQuestion(q, tag);
    const f: AngleFig = q.meta.fig, answers: Record<string, number> = q.meta.answers;
    // the parts are the lettered angles, in the diagram, with the right answers
    const letters = f.arcs.filter(c => c.unknown).map(c => c.text.replace('°', ''));
    ok(letters.length === q.parts.length && q.parts.every(p => letters.includes(p.label.replace(' =', ''))), `${tag}: parts ${q.parts.map(p => p.label)} do not match the diagram ${letters}`);
    q.parts.forEach(p => {
      ok(p.answer === String(answers[p.label.replace(' =', '')]), `${tag}: ${p.label} ${p.answer} is not the drawn angle`);
      ok(p.suffix === '°' && /^\d+$/.test(p.answer) && Number(p.answer) > 0 && Number(p.answer) < 180, `${tag}: answer ${p.answer} is not a whole angle under 180°`);
      ok(!!angleTopic.slipLabels[p.code || ''], `${tag}: no "Things to watch" name for ${p.code}`);
      for (const sl of p.slips || []) ok(!!angleTopic.slipLabels[sl.code] && sl.value !== p.answer, `${tag}: slip ${sl.code} unnamed or equal to the answer`);
    });
    if (level === 3) ok(q.parts.length === 2 && q.parts[0].label === 'y =' && q.parts[1].label === 'x =', `${tag}: two steps should be y then x`);
    else ok(q.parts.length === 1, `${tag}: one step should have one part`);
    for (const c of f.arcs) {
      const size = angleAt(c.at, c.p1, c.p2);
      const want = c.unknown ? answers[c.text.replace('°', '')] : Number(c.text.replace('°', ''));
      ok(Math.abs(size - want) < 0.01, `${tag}: angle labelled ${c.text} measures ${size.toFixed(2)}° (should be ${want}°)`);
      ok(c.unknown ? /^[a-z]°$/.test(c.text) : /^\d+°$/.test(c.text), `${tag}: odd label ${c.text}`);
      ok(q.svg!.includes(`>${c.text}</text>`), `${tag}: label ${c.text} not drawn`);
      // both arms are drawn lines through the corner, and reach well past the arc
      for (const p of [c.p1, c.p2]) {
        const u = sub(p, c.at), k = (arcRadius(size) + 10) / len(u);
        const far: Pt = [c.at[0] + u[0] * k, c.at[1] + u[1] * k];
        ok(f.segs.some(s => !s.dash && distToSeg(c.at, s) < 0.01 && distToSeg(far, s) < 0.01), `${tag}: an arm of ${c.text} is not a drawn line`);
      }
      // no other line leaves the corner inside the angle
      for (const s of f.segs) {
        if (distToSeg(c.at, s) > 0.01) continue;
        for (const end of [s.a, s.b]) {
          if (len(sub(end, c.at)) < 1) continue;
          const a1 = angleAt(c.at, c.p1, end), a2 = angleAt(c.at, end, c.p2);
          ok(!(a1 > 1 && a2 > 1 && Math.abs(a1 + a2 - size) < 0.01), `${tag}: a line cuts through the angle ${c.text}`);
        }
      }
    }
    // two arcs never mark the same angle
    f.arcs.forEach((c, i) => f.arcs.forEach((d, j) => {
      if (j <= i || len(sub(c.at, d.at)) > 0.01) return;
      const bis = (a: typeof c): Pt => { const u = sub(a.p1, a.at), v = sub(a.p2, a.at); return [u[0] / len(u) + v[0] / len(v), u[1] / len(u) + v[1] / len(v)]; };
      ok(angleAt([0, 0], bis(c), bis(d)) > 1, `${tag}: ${c.text} and ${d.text} mark the same angle`);
    }));
    // arrows only on lines that really are parallel; equal-side marks only on equal sides
    const arrowed = f.segs.filter(s => s.arrows), ticked = f.segs.filter(s => s.ticks);
    ok(arrowed.length !== 1, `${tag}: only one line has arrows`);
    for (const s of arrowed) {
      const u = sub(s.b, s.a), v = sub(arrowed[0].b, arrowed[0].a);
      ok(Math.abs(u[0] * v[1] - u[1] * v[0]) / (len(u) * len(v)) < 1e-9 && u[0] * v[0] + u[1] * v[1] > 0, `${tag}: arrowed lines are not parallel (or point opposite ways)`);
    }
    ok(ticked.length !== 1, `${tag}: only one side has a mark`);
    for (const s of ticked) ok(Math.abs(len(sub(s.b, s.a)) - len(sub(ticked[0].b, ticked[0].a))) < 0.01, `${tag}: marked sides are not equal`);
    ok(ticked.length === 0 || ['iso', 'iso-line'].includes(q.meta.type), `${tag}: equal-side marks on a triangle that is not isosceles`);
    const lp = anglesLayoutProblems(f);
    ok(lp.length === 0, `${tag}: ${lp[0]}`);
    // read the drawing itself: each label sits inside its own angle and clear of every line and other label
    const num = (s: string, k: string) => Number(s.match(new RegExp(`${k}="(-?[\\d.]+)"`))![1]);
    const lines = [...q.svg!.matchAll(/<line [^>]*>/g)].map(m => m[0]).filter(l => !/stroke-width="2.2"/.test(l))
      .map(l => ({ a: [num(l, 'x1'), num(l, 'y1')] as Pt, b: [num(l, 'x2'), num(l, 'y2')] as Pt }));
    const texts = [...q.svg!.matchAll(/<text ([^>]*)>([^<]*)<\/text>/g)].map(m => ({ x: num(m[1], 'x'), y: num(m[1], 'y'), t: m[2] }));
    ok(texts.length === f.arcs.length && lines.length === f.segs.length, `${tag}: drawing has ${texts.length} labels and ${lines.length} lines`);
    texts.forEach((tx, i) => {
      const w = tx.t.length * 9, h = 16;
      for (const l of lines) {
        const L = len(sub(l.b, l.a));
        for (let t = 0; t <= L; t += 0.5) {
          const x = l.a[0] + (l.b[0] - l.a[0]) * t / L, y = l.a[1] + (l.b[1] - l.a[1]) * t / L;
          if (Math.abs(x - tx.x) < w / 2 && Math.abs(y - tx.y) < h / 2) { fail(`${tag}: label ${tx.t} is drawn over a line`); break; }
        }
      }
      texts.forEach((o, j) => { if (j > i) ok(Math.abs(tx.x - o.x) > (w + o.t.length * 9) / 2 || Math.abs(tx.y - o.y) > h, `${tag}: labels ${tx.t} and ${o.t} overlap`); });
      const c = f.arcs[i];   // labels are drawn in the same order as the arcs
      const size = angleAt(c.at, c.p1, c.p2), L: Pt = [tx.x, tx.y];
      ok(Math.abs(angleAt(c.at, c.p1, L) + angleAt(c.at, L, c.p2) - size) < 0.5 && len(sub(L, c.at)) < 130, `${tag}: label ${tx.t} is not inside its own angle`);
    });
    // every step has its named misconception (around a point, 180° − the rest is often below 0)
    if (q.meta.type !== 'point') q.parts.forEach(p => ok(reachableSlips(p).length > 0, `${tag}: ${p.label} has no named misconception`));
  }
}
console.log(Object.entries(angleCount).map(([k, v]) => `${k}: ${v}`).join(' | '));
for (const level of [1, 2, 3] as const) for (const t of new Set(ANGLE_LEVEL_ITEMS[level])) {
  ok((angleCount[`L${level} ${t}`] || 0) >= NA / 20, `angle type "${t}" came up ${angleCount[`L${level} ${t}`] || 0} times in ${NA} at level ${level}`);
}
for (const t of ANGLE_TYPES) ok([1, 2, 3].some(l => ANGLE_LEVEL_ITEMS[l as 1 | 2 | 3].includes(t)), `angle type ${t} is in no level`);

// topics hold together
for (const [key, t] of Object.entries(SEAL9_TOPICS)) {
  for (const l of [1, 2, 3] as const) ok(t.levels[l].roundLength > 0 && !!t.levels[l].name, `${key} L${l}: missing level data`);
}

console.log(`${checks} checks, ${failures} failures`);
if (failures) process.exit(1);
