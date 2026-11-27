/* Dijkstra's algorithm, step by step, for 9 SEAL (lesson 2N).
 * The page draws a weighted network and walks the student through the algorithm
 * exactly as the course notes set it out:
 *   1. box the start at 0
 *   2. from the vertex just boxed, give each unboxed neighbour its new value
 *      (boxed value + edge, unless the old value is smaller)
 *   3. box the smallest unboxed value, repeat until the end is boxed
 *   4. trace back through the "came from" letters.
 * Graphs are built so there is never a tie, so every step has exactly one answer. */
import { TPQuestion, Part, Slip, makeRng, randInt, pick } from './typedParts';

type Dir = 'n' | 's' | 'e' | 'w';
interface Tpl { pts: [number, number, Dir][]; edges: [number, number][]; end: number }

// Layouts are planar and leave room for a value label beside every vertex. Vertex 0 is the start.
const T5: Tpl[] = [
  { pts: [[40, 120, 'w'], [160, 55, 'n'], [160, 185, 's'], [280, 120, 's'], [400, 120, 'e']], edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [3, 4], [1, 4]], end: 4 },
  { pts: [[40, 120, 'w'], [170, 55, 'n'], [170, 185, 's'], [310, 55, 'n'], [310, 185, 's']], edges: [[0, 1], [0, 2], [1, 2], [1, 3], [1, 4], [2, 4], [3, 4]], end: 4 },
];
const T6: Tpl[] = [
  { pts: [[40, 120, 'w'], [160, 55, 'n'], [160, 185, 's'], [290, 55, 'n'], [290, 185, 's'], [410, 120, 'e']], edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [2, 4], [3, 4], [3, 5], [4, 5]], end: 5 },
  { pts: [[40, 120, 'w'], [160, 55, 'n'], [160, 185, 's'], [290, 55, 'n'], [290, 185, 's'], [410, 120, 'e']], edges: [[0, 1], [0, 2], [1, 2], [1, 3], [1, 4], [2, 4], [3, 4], [3, 5], [4, 5]], end: 5 },
  { pts: [[40, 120, 'w'], [160, 55, 'n'], [160, 185, 's'], [280, 120, 's'], [410, 55, 'n'], [410, 185, 's']], edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [3, 5], [4, 5]], end: 5 },
];
const T7: Tpl[] = [
  { pts: [[30, 120, 'w'], [130, 55, 'n'], [130, 185, 's'], [230, 100, 's'], [330, 55, 'n'], [330, 185, 's'], [420, 120, 'e']], edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [4, 5], [4, 6], [5, 6]], end: 6 },
  { pts: [[30, 120, 'w'], [130, 55, 'n'], [130, 185, 's'], [250, 120, 'w'], [330, 55, 'n'], [330, 185, 's'], [420, 120, 'e']], edges: [[0, 1], [0, 2], [1, 2], [2, 3], [3, 5], [1, 4], [3, 4], [2, 5], [4, 5], [4, 6], [5, 6]], end: 6 },
];
export const TEMPLATES: Record<string, Tpl> = Object.fromEntries([
  ...T5.map((t, i) => [`5-${i}`, t]), ...T6.map((t, i) => [`6-${i}`, t]), ...T7.map((t, i) => [`7-${i}`, t]),
]);
const LETTER_SETS =['ABCDEFG', 'PQRSTUV', 'JKLMNPR'];
const W = 440, H = 240;

export interface Vtx { id: string; x: number; y: number; dir: Dir }
export interface Edge { a: string; b: string; w: number }
interface Snap {
  vals: Record<string, { d: number; from?: string }>;
  boxed: string[];
  active?: string; target?: string; choosing?: boolean; path?: string;
}

// ---------------------------------------------------------------- drawing
const OFF: Record<Dir, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

function draw(V: Vtx[], E: Edge[], s: Snap): string {
  const at = (id: string) => V.find(v => v.id === id)!;
  const onPath = (a: string, b: string) => {
    if (!s.path) return false;
    for (let i = 0; i + 1 < s.path.length; i++) {
      if ((s.path[i] === a && s.path[i + 1] === b) || (s.path[i] === b && s.path[i + 1] === a)) return true;
    }
    return false;
  };
  let lines = '', weights = '', dots = '', labels = '';
  for (const e of E) {
    const p = at(e.a), q = at(e.b);
    const hot = s.active && s.target && ((e.a === s.active && e.b === s.target) || (e.b === s.active && e.a === s.target));
    const path = onPath(e.a, e.b);
    const col = path ? '#10b981' : hot ? '#f59e0b' : '#94a3b8';
    lines += `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="${col}" stroke-width="${path || hot ? 5 : 2.5}" stroke-linecap="round"/>`;
    const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
    weights += `<circle cx="${mx}" cy="${my}" r="12" fill="#fff" stroke="${hot ? '#f59e0b' : '#cbd5e1'}" stroke-width="1.5"/>`
      + `<text x="${mx}" y="${my}" text-anchor="middle" dominant-baseline="central" font-size="15" font-weight="700" fill="#334155">${e.w}</text>`;
  }
  for (const v of V) {
    const [dx, dy] = OFF[v.dir];
    const isActive = v.id === s.active, isTarget = v.id === s.target;
    const boxed = s.boxed.includes(v.id);
    dots += `<circle cx="${v.x}" cy="${v.y}" r="${isActive || isTarget ? 9 : 7}" fill="${isActive ? '#4f46e5' : isTarget ? '#f59e0b' : '#1e293b'}"/>`;
    const lx = v.x + dx * 19, ly = v.y + dy * 19;
    labels += `<text class="cb-letter" data-vertex="${v.id}" x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-style="italic" font-size="21" fill="#1e293b" style="cursor:pointer">${v.id}</text>`;
    const val = s.vals[v.id];
    const text = isTarget ? (val ? `${val.d} → ?` : '?') : val ? (val.from ? `${val.d} (${val.from})` : String(val.d)) : '';
    if (!text) continue;
    const { x: px, y: py, w, h } = pillBox(v, text);
    const stroke = isTarget ? '#f59e0b' : boxed ? '#4f46e5' : '#94a3b8';
    const fill = isTarget ? '#fffbeb' : boxed ? '#eef2ff' : '#ffffff';
    labels += `<rect x="${(px - w / 2).toFixed(1)}" y="${py - h / 2}" width="${w.toFixed(1)}" height="${h}" rx="${boxed ? 3 : 12}" fill="${fill}" stroke="${stroke}" stroke-width="${boxed ? 2.5 : 1.5}"${boxed || isTarget ? '' : ' stroke-dasharray="4 3"'}/>`
      + `<text x="${px.toFixed(1)}" y="${py}" text-anchor="middle" dominant-baseline="central" font-size="15" font-weight="700" fill="${isTarget ? '#b45309' : '#1e293b'}">${text}</text>`;
  }
  return `<svg viewBox="${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}" xmlns="http://www.w3.org/2000/svg">${lines}${weights}${dots}${labels}</svg>`;
}

const VIEW = { x: -90, y: -10, w: 620, h: 260 };
/** Where a vertex's value label sits (centre, width, height). */
function pillBox(v: Vtx, text: string) {
  const [dx, dy] = OFF[v.dir];
  const w = 14 + text.length * 8.5, h = 24;
  return { x: v.x + dx * (dy ? 0 : 30 + w / 2), y: v.y + dy * (dy ? 46 : 0), w, h };
}

/** Layout check for the tests: with the widest possible labels, nothing overlaps or falls off the picture. */
export function layoutProblems(V: Vtx[], E: Edge[]): string[] {
  const out: string[] = [];
  const at = (id: string) => V.find(v => v.id === id)!;
  const pills = V.map(v => ({ id: v.id, ...pillBox(v, '28 (M)') }));
  const hitsRect = (r: { x: number; y: number; w: number; h: number }, cx: number, cy: number, rad: number) =>
    Math.abs(cx - r.x) < r.w / 2 + rad && Math.abs(cy - r.y) < r.h / 2 + rad;
  for (const p of pills) {
    if (p.x - p.w / 2 < VIEW.x || p.x + p.w / 2 > VIEW.x + VIEW.w || p.y - p.h / 2 < VIEW.y || p.y + p.h / 2 > VIEW.y + VIEW.h) out.push(`${p.id} label off the picture`);
    for (const e of E) {
      const a = at(e.a), b = at(e.b);
      if (hitsRect(p, (a.x + b.x) / 2, (a.y + b.y) / 2, 12)) out.push(`${p.id} label covers weight ${e.a}${e.b}`);
      if (e.a === p.id || e.b === p.id) continue;
      for (let t = 0; t <= 1; t += 0.02) if (hitsRect(p, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 1)) { out.push(`${p.id} label crosses edge ${e.a}${e.b}`); break; }
    }
    for (const o of pills) if (o.id < p.id && hitsRect(p, o.x, o.y, 0) || (o.id < p.id && Math.abs(o.x - p.x) < (o.w + p.w) / 2 && Math.abs(o.y - p.y) < (o.h + p.h) / 2)) out.push(`${p.id} and ${o.id} labels overlap`);
    for (const v of V) if (hitsRect(p, v.x, v.y, 7)) out.push(`${p.id} label covers vertex ${v.id}`);
  }
  for (const e of E) {
    const a = at(e.a), b = at(e.b);
    for (const v of V) if (v.id !== e.a && v.id !== e.b) {
      for (let t = 0; t <= 1; t += 0.02) if (Math.hypot(a.x + (b.x - a.x) * t - v.x, a.y + (b.y - a.y) * t - v.y) < 14) { out.push(`edge ${e.a}${e.b} runs through ${v.id}`); break; }
    }
  }
  return out;
}

// ---------------------------------------------------------------- building a question
function shuffle<T>(a: T[], rng: () => number): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

export function routeLength(E: Edge[], route: string): number {
  let t = 0;
  for (let i = 0; i + 1 < route.length; i++) {
    const e = E.find(x => (x.a === route[i] && x.b === route[i + 1]) || (x.b === route[i] && x.a === route[i + 1]));
    if (!e) return NaN;
    t += e.w;
  }
  return t;
}

function tryBuild(level: 1 | 2 | 3, rng: () => number, strict: boolean): TPQuestion | null {
  const tpl = level === 1 ? pick(rng, T5) : level === 2 ? pick(rng, T6) : pick(rng, [...T6, ...T7]);
  const n = tpl.pts.length;
  const flipX = rng() < 0.5, flipY = rng() < 0.5;
  const letters = shuffle(pick(rng, LETTER_SETS).slice(0, n).split(''), rng);
  const flip = (d: Dir): Dir => (flipX && d === 'e' ? 'w' : flipX && d === 'w' ? 'e' : flipY && d === 'n' ? 's' : flipY && d === 's' ? 'n' : d);
  const V: Vtx[] = tpl.pts.map(([x, y, d], i) => ({ id: letters[i], x: flipX ? W - x : x, y: flipY ? H - y : y, dir: flip(d) }));
  const E: Edge[] = tpl.edges.map(([a, b]) => ({ a: letters[a], b: letters[b], w: randInt(rng, 1, 9) }));
  const start = letters[0], end = letters[tpl.end];
  const nbrs = (v: string) => E.filter(e => e.a === v || e.b === v).map(e => ({ v: e.a === v ? e.b : e.a, w: e.w }));

  const dist: Record<string, number> = { [start]: 0 };
  const from: Record<string, string> = {};
  const boxed = [start];
  const parts: Part[] = [];
  const snaps: Snap[] = [];
  const shown: Snap['vals'] = { [start]: { d: 0 } };
  const snap = (extra: Partial<Snap>): Snap => ({ vals: JSON.parse(JSON.stringify(shown)), boxed: [...boxed], ...extra });
  let keeps = 0, replaces = 0, farBoxes = 0;
  let cur = start;

  for (let guard = 0; guard < 20; guard++) {
    const updated: string[] = [];
    for (const { v: u, w } of nbrs(cur).filter(x => !boxed.includes(x.v)).sort((a, b) => a.v.localeCompare(b.v))) {
      const old = dist[u], nv = dist[cur] + w;
      if (old === nv) return null;                                   // a tie would give two "came from" letters
      const ans = old === undefined ? nv : Math.min(old, nv);
      if (old !== undefined) { if (nv < old) replaces++; else keeps++; }
      const slips: Slip[] = [];
      if (dist[cur] > 0 && w !== ans) slips.push({ value: String(w), code: 'edge-only', message: `Add the boxed value too: ${dist[cur]} + ${w}.` });
      if (old !== undefined && old < nv) slips.push({ value: String(nv), code: 'replaced-smaller', message: `${u} already has ${old}, which is smaller than ${nv}. Keep ${old}.` });
      if (old !== undefined && nv < old) slips.push({ value: String(old), code: 'kept-larger', message: `${dist[cur]} + ${w} = ${nv} is smaller than ${old}, so ${u} changes to ${nv}.` });
      snaps.push(snap({ active: cur, target: u }));
      parts.push({
        kind: 'number', label: `From ${cur}:  ${u} =`, answer: String(ans), code: 'add-slip',
        slips: slips.filter((s, i, all) => s.value !== String(ans) && all.findIndex(t => t.value === s.value) === i),
        ask: old === undefined ? `Boxed value of ${cur} + the edge.` : `Boxed value of ${cur} + the edge. Keep ${old} if it is smaller.`,
      });
      if (ans !== old) { dist[u] = ans; from[u] = cur; shown[u] = { d: ans, from: cur }; }
      updated.push(u);
    }
    const open = Object.keys(dist).filter(v => !boxed.includes(v));
    if (!open.length) return null;
    const best = Math.min(...open.map(v => dist[v]));
    const winners = open.filter(v => dist[v] === best);
    if (winners.length > 1) return null;                             // a tie for the next box
    const next = winners[0];
    if (level >= 2) {
      const nearest = updated.filter(v => !boxed.includes(v)).sort((a, b) => dist[a] - dist[b])[0];
      if (nearest && nearest !== next) farBoxes++;
      snaps.push(snap({ choosing: true }));
      const slips: Slip[] = nearest && nearest !== next
        ? [{ value: nearest, code: 'nearest-only', message: 'Box the smallest value of ALL the unboxed vertices, not just the ones you updated.' }] : [];
      parts.push({ kind: 'letter', label: 'Box next:', answer: next, allowed: open.sort(), slips, code: 'not-smallest', ask: 'Type the letter with the smallest unboxed value.' });
    }
    boxed.push(next);
    if (next === end) break;
    cur = next;
  }
  if (!boxed.includes(end)) return null;

  let path = end;
  while (path[0] !== start) path = from[path[0]] + path;
  if (dist[end] > 30) return null;
  if (strict && (keeps < 1 || replaces < 1 || (level >= 2 && farBoxes < 1))) return null;
  // the shortest path should not simply be the route with the fewest edges
  if (strict && path.length === 3) return null;

  if (level === 3) {
    snaps.push(snap({}));
    parts.push({
      kind: 'path', label: 'Path:', start, end, answer: path, code: 'not-traced',
      adj: Object.fromEntries(V.map(v => [v.id, nbrs(v.id).map(x => x.v)])),
      pathSlip: (route: string) => ({ value: route, code: 'not-traced', message: `That route is ${routeLength(E, route)} long. Trace back from ${end} through the "came from" letters.` }),
      ask: `Trace back from ${end}, then type the path from ${start}.`,
    });
  }
  snaps.push(snap({ path: level === 3 ? undefined : path }));
  parts.push({ kind: 'number', label: 'Shortest distance =', answer: String(dist[end]), code: 'read-end', ask: `Read the boxed value at ${end}.` });
  snaps.push(snap({ path }));

  return {
    prompt: `Use Dijkstra's algorithm to find the shortest path from ${start} to ${end}.`,
    parts,
    render: (i: number, solved: boolean) => draw(V, E, snaps[solved ? parts.length : Math.min(i, parts.length)]),
    figureLabel: 'a weighted network',
    onlyCurrent: true,
    pauseMs: 1400,
    meta: { V, E, start, end, dist: dist[end], path },
  };
}

export function generateDijkstra(level: 1 | 2 | 3, seed?: number): TPQuestion {
  const rng = makeRng(seed);
  for (let t = 0; t < 2000; t++) {
    const q = tryBuild(level, rng, t < 1500);
    if (q) return q;
  }
  throw new Error('Could not build a Dijkstra question');
}
