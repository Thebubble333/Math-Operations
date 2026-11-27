/* Networks for 9 SEAL ALT 1 (lessons 2K–2N, without weights):
 *   Degrees and Euler's Formula: vertices, edges, degrees, sum of degrees, v + f = e + 2
 *   Walks and Trails: naming walks, Eulerian trails and circuits, Hamiltonian paths and cycles
 * Graphs are drawn from a few planar layouts with some edges left out, so every drawing
 * has no crossings and every face can be counted. */
import { TPQuestion, Part, Slip, makeRng, randInt, pick, opt, showPath, edgeCount } from './typedParts';

export type Dir = 'n' | 's' | 'e' | 'w';
interface Layout { pts: [number, number, Dir][]; edges: [number, number][] }

// Planar layouts. A vertex label sits on the side named by its direction, where no edge runs.
export const LAYOUTS: Layout[] = [
  { pts: [[60, 60, 'w'], [220, 40, 'n'], [380, 60, 'e'], [300, 195, 's'], [140, 195, 's']],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [1, 3], [1, 4]] },
  { pts: [[40, 120, 'w'], [160, 55, 'n'], [160, 185, 's'], [280, 120, 's'], [400, 120, 'e']],
    edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [3, 4], [1, 4]] },
  { pts: [[50, 120, 'w'], [150, 40, 'n'], [290, 40, 'n'], [390, 120, 'e'], [290, 200, 's'], [150, 200, 's']],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 5], [2, 4], [1, 4]] },
  { pts: [[60, 120, 'w'], [200, 40, 'n'], [360, 50, 'e'], [380, 190, 'e'], [200, 200, 's'], [230, 120, 'n']],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [5, 0], [5, 2], [5, 3], [5, 4]] },
  { pts: [[40, 120, 'w'], [160, 55, 'n'], [160, 185, 's'], [280, 120, 's'], [410, 55, 'n'], [410, 185, 's']],
    edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [3, 5], [4, 5]] },
  { pts: [[50, 50, 'w'], [150, 40, 'n'], [130, 200, 's'], [220, 120, 'n'], [310, 40, 'n'], [400, 110, 'e'], [300, 200, 's']],
    edges: [[0, 1], [1, 3], [3, 2], [2, 0], [3, 4], [4, 5], [5, 6], [6, 3], [0, 3], [4, 6], [1, 4]] },
  { pts: [[30, 120, 'w'], [130, 55, 'n'], [130, 185, 's'], [230, 100, 's'], [330, 55, 'n'], [330, 185, 's'], [420, 120, 'e']],
    edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [4, 5], [4, 6], [5, 6]] },
];
const W = 440, H = 240;
export const VIEW = { x: -40, y: -10, w: 520, h: 260 };
const LETTER_SETS = ['ABCDEFG', 'PQRSTUV', 'JKLMNPR'];

export interface Vtx { id: string; x: number; y: number; dir: Dir }
export interface Graph { V: Vtx[]; E: [string, string][] }

const OFF: Record<Dir, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
export const labelAt = (v: Vtx): [number, number] => [v.x + OFF[v.dir][0] * 19, v.y + OFF[v.dir][1] * 19];

/** A plain network. Letters can be tapped to type them; `mark` picks out one vertex. */
export function drawNetwork(g: Graph, mark?: string): string {
  const at = (id: string) => g.V.find(v => v.id === id)!;
  let out = '';
  for (const [a, b] of g.E) {
    const p = at(a), q = at(b);
    out += `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>`;
  }
  for (const v of g.V) {
    const hot = v.id === mark;
    const [lx, ly] = labelAt(v);
    out += `<circle cx="${v.x}" cy="${v.y}" r="${hot ? 9 : 7}" fill="${hot ? '#f59e0b' : '#1e293b'}"/>`;
    if (hot) out += `<circle cx="${lx}" cy="${ly}" r="14" fill="#fef3c7"/>`;
    out += `<text class="cb-letter" data-vertex="${v.id}" x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-style="italic" font-size="21" fill="${hot ? '#b45309' : '#1e293b'}" style="cursor:pointer">${v.id}</text>`;
  }
  // crop to the network and its letters, so it is as large as possible on a phone
  const xs = g.V.flatMap(v => [v.x, labelAt(v)[0]]), ys = g.V.flatMap(v => [v.y, labelAt(v)[1]]);
  const x0 = Math.min(...xs) - 18, y0 = Math.min(...ys) - 18, x1 = Math.max(...xs) + 18, y1 = Math.max(...ys) + 18;
  return `<svg viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" style="max-height:300px" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}

// ---------------------------------------------------------------- graph helpers
export const adjOf = (g: Graph): Record<string, string[]> =>
  Object.fromEntries(g.V.map(v => [v.id, g.E.filter(e => e.includes(v.id)).map(e => (e[0] === v.id ? e[1] : e[0])).sort()]));
export const degreeOf = (g: Graph, id: string) => g.E.filter(e => e.includes(id)).length;
export function connected(ids: string[], E: [string, string][]): boolean {
  if (!ids.length) return true;
  const seen = new Set([ids[0]]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const [a, b] of E) {
      if (seen.has(a) !== seen.has(b)) { seen.add(a); seen.add(b); grew = true; }
    }
  }
  return ids.every(i => seen.has(i));
}
function shuffle<T>(a: T[], rng: () => number): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

/** A connected graph from one of the layouts, with `drop` edges left out. */
function makeGraph(rng: () => number, layouts: Layout[], drop: [number, number]): Graph | null {
  const L = pick(rng, layouts);
  const n = L.pts.length;
  const flipX = rng() < 0.5, flipY = rng() < 0.5;
  const letters = shuffle(pick(rng, LETTER_SETS).slice(0, n).split(''), rng);
  const flip = (d: Dir): Dir => (flipX && d === 'e' ? 'w' : flipX && d === 'w' ? 'e' : flipY && d === 'n' ? 's' : flipY && d === 's' ? 'n' : d);
  const V: Vtx[] = L.pts.map(([x, y, d], i) => ({ id: letters[i], x: flipX ? W - x : x, y: flipY ? H - y : y, dir: flip(d) }));
  const k = Math.min(randInt(rng, drop[0], drop[1]), L.edges.length - (n - 1));
  const kept = shuffle(L.edges, rng).slice(k);
  const E = kept.map(([a, b]) => [letters[a], letters[b]].sort() as [string, string]);
  if (!connected(V.map(v => v.id), E)) return null;
  return { V: [...V].sort((a, b) => a.id.localeCompare(b.id)), E };
}

/** Layout check for the tests: no crossings, no edge through a vertex, no letter on an edge. */
export function layoutProblems(g: Graph): string[] {
  const out: string[] = [];
  const at = (id: string) => g.V.find(v => v.id === id)!;
  const segDist = (px: number, py: number, a: Vtx, b: Vtx) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(a.x + t * dx - px, a.y + t * dy - py);
  };
  const cross = (p: Vtx, q: Vtx, r: Vtx, s: Vtx) => {
    const o = (a: Vtx, b: Vtx, c: Vtx) => Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
    return o(p, q, r) * o(p, q, s) < 0 && o(r, s, p) * o(r, s, q) < 0;
  };
  g.E.forEach(([a, b], i) => {
    for (const v of g.V) if (v.id !== a && v.id !== b && segDist(v.x, v.y, at(a), at(b)) < 14) out.push(`edge ${a}${b} runs through ${v.id}`);
    g.E.forEach(([c, d], j) => {
      if (j > i && ![a, b].includes(c) && ![a, b].includes(d) && cross(at(a), at(b), at(c), at(d))) out.push(`edges ${a}${b} and ${c}${d} cross`);
    });
  });
  for (const v of g.V) {
    const [lx, ly] = labelAt(v);
    if (lx < VIEW.x + 12 || lx > VIEW.x + VIEW.w - 12 || ly < VIEW.y + 12 || ly > VIEW.y + VIEW.h - 12) out.push(`${v.id} label off the picture`);
    for (const [a, b] of g.E) if (segDist(lx, ly, at(a), at(b)) < 11) out.push(`${v.id} label touches edge ${a}${b}`);
    for (const u of g.V) if (u.id !== v.id && Math.hypot(u.x - lx, u.y - ly) < 18) out.push(`${v.id} label touches vertex ${u.id}`);
  }
  return out;
}

const listWords = (xs: (string | number)[]) => (xs.length < 2 ? String(xs[0]) : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

// ================================================================ Degrees and Euler's formula
function degreesRead(rng: () => number): TPQuestion | null {
  const g = makeGraph(rng, LAYOUTS, [0, 3]);
  if (!g) return null;
  const mark = pick(rng, g.V).id;
  const e = g.E.length, n = g.V.length;
  const parts: Part[] = [
    { kind: 'number', label: 'Vertices =', answer: String(n), code: 'count-v', ask: 'Count the dots.' },
    { kind: 'number', label: 'Edges =', answer: String(e), code: 'count-e', ask: 'Count the lines.' },
    { kind: 'number', label: `Degree of ${mark} =`, answer: String(degreeOf(g, mark)), code: 'degree', ask: `Count the edges that meet at ${mark}.` },
    { kind: 'number', label: 'Sum of degrees =', answer: String(2 * e), code: 'sum', ask: 'Add the degrees of every vertex.',
      slips: [{ value: String(e), code: 'sum-is-edges', message: `Each edge has two ends, so the sum of degrees is 2 × ${e} = ${2 * e}.` }] },
  ];
  return { prompt: 'For this network:', parts, svg: drawNetwork(g, mark), figureLabel: 'a network', meta: { type: 'read', g } };
}

/** Degrees of a random connected simple graph on n vertices (not drawn). */
function randomDegrees(rng: () => number, n: number): number[] {
  for (;;) {
    const ids = 'ABCDEF'.slice(0, n).split('');
    const all: [string, string][] = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) all.push([ids[i], ids[j]]);
    const m = randInt(rng, n, Math.min(all.length, 2 * n - 1));
    const E = shuffle(all, rng).slice(0, m);
    if (connected(ids, E)) return ids.map(id => E.filter(x => x.includes(id)).length).sort((a, b) => b - a);
  }
}

function degreesList(rng: () => number): TPQuestion | null {
  if (rng() < 0.3) {
    const e = randInt(rng, 5, 15);
    const slips: Slip[] = [{ value: String(e), code: 'sum-is-edges', message: `Each edge has two ends, so the sum of degrees is 2 × ${e}.` }];
    if (e % 2 === 0) slips.push({ value: String(e / 2), code: 'halved', message: 'Double the edges: each edge adds 2 to the sum of degrees.' });
    return {
      prompt: `A graph has ${e} edges.`,
      parts: [{ kind: 'number', label: 'Sum of degrees =', answer: String(2 * e), code: 'sum', slips, ask: 'Sum of degrees = 2 × edges.' }],
      meta: { type: 'edges-to-sum', e },
    };
  }
  const n = randInt(rng, 4, 6);
  const degs = randomDegrees(rng, n);
  const possible = rng() < 0.6;
  if (!possible) {
    const i = randInt(rng, 0, n - 1);
    const up = degs[i] < n - 1 && (degs[i] <= 1 || rng() < 0.5);
    degs[i] += up ? 1 : -1;
    degs.sort((a, b) => b - a);
  }
  const sum = degs.reduce((a, b) => a + b, 0);
  const parts: Part[] = [
    { kind: 'number', label: 'Sum of degrees =', answer: String(sum), code: 'add-slip', ask: 'Add the degrees.' },
    { kind: 'choice', label: 'This graph', answer: possible ? 'yes' : 'no', code: 'exists',
      options: [opt('Can exist', 'yes', ['yes', 'canexist']), opt('Does not exist', 'no', ['no', 'doesnotexist'])],
      slips: possible
        ? [{ value: 'no', code: 'even-sum', message: `The sum is ${sum}, which is even, so the graph can exist.` }]
        : [{ value: 'yes', code: 'odd-sum', message: `The sum is ${sum}, which is odd. The sum of degrees is always even (2 × edges).` }],
      ask: 'Is the sum of degrees even? Type y or n, click, or use Tab and Enter.' },
  ];
  if (possible) parts.push({ kind: 'number', label: 'Edges =', answer: String(sum / 2), code: 'edges',
    slips: [{ value: String(sum), code: 'not-halved', message: `Halve the sum: each edge adds 2, so edges = ${sum} ÷ 2.` }], ask: 'Edges = sum of degrees ÷ 2.' });
  return { prompt: `A graph has vertices of degree ${listWords(degs)}.`, parts, meta: { type: 'list', degs, possible } };
}

function eulerFormula(rng: () => number): TPQuestion | null {
  if (rng() < 0.4) {
    const g = makeGraph(rng, LAYOUTS, [0, 3]);
    if (!g) return null;
    const v = g.V.length, e = g.E.length, f = e - v + 2;
    if (f < 2) return null;
    return {
      prompt: 'This network is planar. Count its vertices, edges and faces.',
      parts: [
        { kind: 'number', label: 'v =', answer: String(v), code: 'count-v', ask: 'Count the vertices.' },
        { kind: 'number', label: 'e =', answer: String(e), code: 'count-e', ask: 'Count the edges.' },
        { kind: 'number', label: 'f =', answer: String(f), code: 'count-f', ask: 'Count the regions, including the outside.',
          slips: [{ value: String(f - 1), code: 'outside-face', message: 'The region outside the network counts as a face too.' }] },
      ],
      svg: drawNetwork(g), figureLabel: 'a planar network', meta: { type: 'count', g, v, e, f },
    };
  }
  const v = randInt(rng, 4, 12);
  const e = randInt(rng, v, 3 * v - 6);
  const f = e - v + 2;
  const unknown = pick(rng, ['v', 'e', 'f'] as const);
  const known = { v, e, f };
  const answer = known[unknown];
  // the same sum done with a wrong formula: v + e = f + 2, or without the + 2
  const wrongs: Record<string, [number, number]> = { v: [f + 2 - e, e - f], e: [f + 2 - v, v + f], f: [v + e - 2, e - v] };
  const slips: Slip[] = [];
  const [wf, w2] = wrongs[unknown];
  if (wf > 0 && wf !== answer) slips.push({ value: String(wf), code: 'wrong-formula', message: "Euler's formula is v + f = e + 2." });
  if (w2 > 0 && w2 !== answer && w2 !== wf) slips.push({ value: String(w2), code: 'forgot-2', message: "Don't forget the + 2: v + f = e + 2." });
  const words = { v: 'vertices', e: 'edges', f: 'faces' };
  const givens = (['v', 'e', 'f'] as const).filter(k => k !== unknown).map(k => `${known[k]} ${words[k]}`);
  return {
    prompt: `A connected planar graph has ${givens[0]} and ${givens[1]}. How many ${words[unknown]} does it have?`,
    parts: [{ kind: 'number', label: `${unknown} =`, answer: String(answer), code: 'solve', slips, ask: 'Use v + f = e + 2.' }],
    meta: { type: 'formula', v, e, f, unknown },
  };
}

export function generateDegrees(level: 1 | 2 | 3, seed?: number): TPQuestion {
  const rng = makeRng(seed);
  for (let t = 0; t < 500; t++) {
    const q = level === 1 ? degreesRead(rng) : level === 2 ? degreesList(rng) : eulerFormula(rng);
    if (q) return q;
  }
  throw new Error('Could not build a degrees question');
}

// ================================================================ Walks and trails
export type WalkType = 'walk' | 'trail' | 'path' | 'circuit' | 'cycle';
export function classifyWalk(w: string): WalkType {
  const edges = new Set<string>();
  for (let i = 0; i + 1 < w.length; i++) {
    const k = [w[i], w[i + 1]].sort().join('');
    if (edges.has(k)) return 'walk';
    edges.add(k);
  }
  const closed = w[0] === w[w.length - 1];
  const inner = closed ? w.slice(0, -1) : w;
  const repeats = new Set(inner).size < inner.length;
  return closed ? (repeats ? 'circuit' : 'cycle') : repeats ? 'trail' : 'path';
}

function walkSlip(w: string, chosen: WalkType, actual: WalkType): Slip {
  let rep = '';
  for (let i = 0; i + 1 < w.length && !rep; i++) {
    const k = [w[i], w[i + 1]].sort().join('');
    for (let j = 0; j < i; j++) if ([w[j], w[j + 1]].sort().join('') === k) rep = k;
  }
  const closed = w[0] === w[w.length - 1];
  const inner = closed ? w.slice(0, -1) : w;
  const repV = inner.split('').find((c, i) => inner.indexOf(c) !== i);
  const m = (code: string, message: string): Slip => ({ value: chosen, code, message });
  if (rep && chosen !== 'walk') return m('repeat-edge', `Edge ${rep[0]}${rep[1]} is used twice, so it is only a walk.`);
  if (!closed && (chosen === 'circuit' || chosen === 'cycle')) return m('not-closed', `It does not finish where it started (${w[0]}).`);
  if (closed && (chosen === 'trail' || chosen === 'path')) return m('closed', `It starts and ends at ${w[0]}, so it is closed.`);
  if (repV && (chosen === 'path' || chosen === 'cycle')) return m('repeat-vertex', `${repV} is visited twice, so it is not a ${chosen}.`);
  return m('not-precise', `True, but not the most precise name: ${actual === 'path' || actual === 'cycle' ? 'no vertex repeats either' : 'no edge repeats'}.`);
}

const WALK_OPTIONS = [opt('Walk', 'walk'), opt('Trail', 'trail'), opt('Path', 'path'), opt('Circuit', 'circuit'), opt('Cycle', 'cycle')];

function nameTheWalk(rng: () => number, want: WalkType): TPQuestion | null {
  const g = makeGraph(rng, LAYOUTS, [0, 1]);
  if (!g) return null;
  const adj = adjOf(g);
  for (let t = 0; t < 300; t++) {
    const len = randInt(rng, 3, want === 'circuit' || want === 'walk' ? 7 : 6);   // vertices written
    let w = pick(rng, g.V).id;
    while (w.length < len) w += pick(rng, adj[w[w.length - 1]]);
    if (w[w.length - 2] === w[w.length - 1]) continue;
    if (classifyWalk(w) !== want) continue;
    if ((want === 'cycle' || want === 'circuit') && w.length < 4) continue;
    if (want === 'walk' && w.length < 4) continue;
    return {
      prompt: `Give the most precise name for the walk ${showPath(w)}.`,
      parts: [{ kind: 'choice', label: 'It is a', answer: want, code: 'name', options: WALK_OPTIONS,
        slips: WALK_OPTIONS.filter(o => o.value !== want).map(o => walkSlip(w, o.value as WalkType, want)),
        ask: 'Type the first letters, click, or use Tab and Enter.' }],
      svg: drawNetwork(g), figureLabel: 'a network', meta: { type: 'name', g, w, want },
    };
  }
  return null;
}

/** All routes that finish the job, up to `cap` of them (for answers and for the tests). */
export function findRoutes(adj: Record<string, string[]>, mode: 'euler' | 'hamilton', closed: boolean, starts: string[], cap = 40): string[] {
  const out: string[] = [];
  const all = Object.keys(adj);
  const total = edgeCount(adj);
  const go = (r: string, used: Set<string>) => {
    if (out.length >= cap) return;
    const last = r[r.length - 1];
    if (mode === 'euler') {
      if (used.size === total) { out.push(r); return; }
      for (const v of adj[last]) {
        const k = [last, v].sort().join('');
        if (used.has(k)) continue;
        used.add(k); go(r + v, used); used.delete(k);
      }
    } else {
      if (r.length === all.length) {
        if (!closed) out.push(r); else if (adj[last].includes(r[0])) out.push(r + r[0]);
        return;
      }
      for (const v of adj[last]) if (!r.includes(v)) go(r + v, used);
    }
  };
  for (const s of starts) go(s, new Set());
  return out;
}

function eulerian(rng: () => number, want: number): TPQuestion | null {
  const g = makeGraph(rng, LAYOUTS.filter(l => l.pts.length <= 6), [0, 3]);
  if (!g) return null;
  const adj = adjOf(g);
  const odd = g.V.filter(v => adj[v.id].length % 2 === 1).map(v => v.id);
  if (odd.length !== want) return null;
  const kind = odd.length === 0 ? 'circuit' : odd.length === 2 ? 'trail' : 'neither';
  const slips: Slip[] = [];
  if (kind === 'circuit') slips.push({ value: 'trail', code: 'closed-trail', message: 'Every vertex is even, so the trail finishes where it starts: a circuit.' },
    { value: 'neither', code: 'missed-trail', message: 'No odd vertices, so an Eulerian circuit exists.' });
  if (kind === 'trail') slips.push({ value: 'circuit', code: 'two-odd-circuit', message: `A circuit needs every vertex even. With 2 odd vertices the trail runs from ${odd[0]} to ${odd[1]}.` },
    { value: 'neither', code: 'missed-trail', message: 'Exactly 2 odd vertices, so an Eulerian trail exists.' });
  if (kind === 'neither') for (const v of ['circuit', 'trail']) slips.push({ value: v, code: 'four-odd', message: `With ${odd.length} odd vertices there is no Eulerian trail: it needs 0 or 2.` });
  const parts: Part[] = [
    { kind: 'number', label: 'Odd vertices =', answer: String(odd.length), code: 'count-odd', ask: 'Find each degree. How many are odd?' },
    { kind: 'choice', label: 'Eulerian:', answer: kind, code: 'decide',
      options: [opt('Circuit', 'circuit'), opt('Trail (not a circuit)', 'trail', ['trail']), opt('Neither', 'neither', ['neither', 'none'])], slips,
      ask: '0 odd vertices: circuit. 2 odd: trail. Otherwise neither.' },
  ];
  if (kind !== 'neither') {
    const starts = kind === 'trail' ? odd : [pick(rng, g.V).id];
    const routes = findRoutes(adj, 'euler', kind === 'circuit', starts, 1);
    if (!routes.length) return null;
    parts.push({
      kind: 'route', mode: 'euler', closed: kind === 'circuit', label: 'Write one:', answer: routes[0], adj, code: 'stuck',
      startSlip: kind === 'trail' ? (v: string) => (odd.includes(v) ? null : { value: v, code: 'even-start', message: `Start at an odd vertex: ${odd[0]} or ${odd[1]}.` }) : undefined,
      deadSlip: (r: string) => ({ value: r, code: 'stuck', message: `Stuck at ${r[r.length - 1]} with ${edgeCount(adj) - (r.length - 1)} edge${edgeCount(adj) - (r.length - 1) === 1 ? '' : 's'} left. Try a different order.` }),
      ask: kind === 'trail' ? 'Use every edge once. Start at an odd vertex.' : 'Use every edge once.',
    });
  }
  return {
    prompt: 'Does this network have an Eulerian trail? Is it a circuit?',
    parts, svg: drawNetwork(g), figureLabel: 'a network', meta: { type: 'euler', g, odd, kind },
  };
}

function hamiltonian(rng: () => number, closed: boolean): TPQuestion | null {
  const g = makeGraph(rng, LAYOUTS, [1, 3]);
  if (!g) return null;
  const adj = adjOf(g);
  const ids = g.V.map(v => v.id);
  const routes = findRoutes(adj, 'hamilton', closed, ids, 1);
  if (!routes.length) return null;
  return {
    prompt: closed ? 'Write a Hamiltonian cycle: visit every vertex once and return to the start.' : 'Write a Hamiltonian path: visit every vertex exactly once.',
    parts: [{
      kind: 'route', mode: 'hamilton', closed, label: closed ? 'Cycle:' : 'Path:', answer: routes[0], adj, code: 'stuck',
      deadSlip: (r: string) => {
        const left = ids.filter(v => !r.includes(v));
        return { value: r, code: 'stuck', message: left.length ? `Stuck at ${r[r.length - 1]}: ${listWords(left)} not visited yet.` : `${r[r.length - 1]} is not joined to ${r[0]}, so the cycle cannot close.` };
      },
      ask: closed ? 'Any start. Visit every vertex once, then return.' : 'Any start. Visit every vertex once.',
    }],
    svg: drawNetwork(g), figureLabel: 'a network', meta: { type: 'hamilton', g, closed },
  };
}

export function generateWalks(level: 1 | 2 | 3, seed?: number): TPQuestion {
  const rng = makeRng(seed);
  const walkType = pick(rng, ['walk', 'trail', 'path', 'circuit', 'cycle'] as WalkType[]);
  const odd = pick(rng, [0, 0, 2, 2, 2, 4]);
  const closed = rng() < 0.4;
  for (let t = 0; t < 3000; t++) {
    const q = level === 1 ? nameTheWalk(rng, walkType) : level === 2 ? eulerian(rng, odd) : hamiltonian(rng, closed);
    if (q) return q;
  }
  throw new Error('Could not build a walks question');
}
