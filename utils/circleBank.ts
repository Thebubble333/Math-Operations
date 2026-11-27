/* Circle questions for 9 SEAL (lessons 2F–2I):
 *   Chords and Pythagoras: chord theorem 3 (OM ⟂ AB halves the chord and the angle at the centre),
 *     then Pythagoras in △OAM with friendly triples.
 *   Circle Theorems: theorems 1–4, the tangent facts, two-step questions and algebra.
 *
 * Every diagram is drawn to scale on a circle of radius R pixels centred at O. Points on the
 * circle sit at chosen angles, so every marked angle is exactly its label. The tests measure
 * each one, and check every label is clear of the lines, the circle and the other labels. */
import { TPQuestion, NumberPart, Slip, makeRng, randInt, pick } from './typedParts';

export type P = [number, number];
export interface Seg { a: P; b: P }
/** An angle mark at `at` between the rays to p1 and p2 (the short way, or the long way if reflex). */
export interface CArc { at: P; p1: P; p2: P; text: string; unknown?: boolean; reflex?: boolean }
/** A length written beside a line, on the side away from `away`. */
export interface CSide { a: P; b: P; text: string; unknown?: boolean; away: P; t?: number }   // t: where along a→b (default the middle)
/** A named point. `dir` places the letter that way, in a gap of `gap` degrees between two lines, instead of in the widest gap. */
export interface CPoint { at: P; name: string; dir?: P; gap?: number }
export interface Right { at: P; p1: P; p2: P }
export interface CFig { O: P; R: number; segs: Seg[]; arcs: CArc[]; sides: CSide[]; rights: Right[]; points: CPoint[] }
export interface Box { x: number; y: number; w: number; h: number; text: string; kind: 'side' | 'angle' | 'point' }

export const R = 110;
const O: P = [0, 0];
const RAD = Math.PI / 180;
const dirv = (d: number): P => [Math.cos(d * RAD), Math.sin(d * RAD)];
const add = (p: P, v: P, k = 1): P => [p[0] + v[0] * k, p[1] + v[1] * k];
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const len = (v: P) => Math.hypot(v[0], v[1]);
const dist = (a: P, b: P) => len(sub(a, b));
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const unitv = (v: P): P => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };
const heading = (a: P, b: P) => Math.atan2(b[1] - a[1], b[0] - a[0]) / RAD;
const mod360 = (x: number) => ((x % 360) + 360) % 360;
/** The point on the circle at angle t (degrees, clockwise on screen). */
const on = (t: number): P => add(O, dirv(t), R);

/** Where an arc starts and how big it is. */
export function arcSpan(c: CArc): { from: number; size: number } {
  const h1 = heading(c.at, c.p1), h2 = heading(c.at, c.p2);
  const s = mod360(h2 - h1);
  const short = s <= 180 ? { from: h1, size: s } : { from: h2, size: 360 - s };
  return c.reflex ? { from: short.from + short.size, size: 360 - short.size } : short;
}
export const arcRadius = (size: number) => (size > 180 ? 15 : size < 50 ? 24 : 18);

const SIDE_FONT = 16, UNKNOWN_FONT = 19, ANGLE_FONT = 15, ANGLE_UNKNOWN_FONT = 17, POINT_FONT = 18;
const textW = (t: string, font: number) => t.replace('°', '').length * font * 0.58 + (t.includes('°') ? font * 0.4 : 0) + 4;
const reach = (d: P, w: number, h: number) => Math.abs(d[0]) * w / 2 + Math.abs(d[1]) * h / 2;

export function sideBox(s: CSide): Box {
  const font = s.unknown ? UNKNOWN_FONT : SIDE_FONT;
  const w = textW(s.text, font), h = font + 3;
  const m = lerp(s.a, s.b, s.t ?? 0.5), u = unitv(sub(s.b, s.a));
  let n: P = [-u[1], u[0]];
  const toAway = sub(s.away, m);
  if (n[0] * toAway[0] + n[1] * toAway[1] > 0) n = [-n[0], -n[1]];
  const [x, y] = add(m, n, reach(n, w, h) + 5);
  return { x, y, w, h, text: s.text, kind: 'side' };
}
export function angleBox(c: CArc): Box {
  const { from, size } = arcSpan(c);
  const font = c.unknown ? ANGLE_UNKNOWN_FONT : ANGLE_FONT;
  const w = textW(c.text, font), h = font + 3;
  const mid = dirv(from + size / 2);
  const n1 = dirv(from + 90), n2 = dirv(from + size - 90);
  const d = size >= 180 ? arcRadius(size) + reach(mid, w, h) + 3
    : Math.max(arcRadius(size) + reach(mid, w, h) + 3, (Math.max(reach(n1, w, h), reach(n2, w, h)) + 3) / Math.sin((size / 2) * RAD));
  const [x, y] = add(c.at, mid, d);
  return { x, y, w, h, text: c.text, kind: 'angle' };
}
/** The directions of the lines (and of the circle) leaving a point. */
function raysAt(at: P, f: CFig): number[] {
  const rays: number[] = [];
  for (const s of f.segs) {
    for (const [p, q] of [[s.a, s.b], [s.b, s.a]] as [P, P][]) if (dist(p, at) < 0.5) rays.push(heading(at, q));
    const L = dist(s.a, s.b), t = ((at[0] - s.a[0]) * (s.b[0] - s.a[0]) + (at[1] - s.a[1]) * (s.b[1] - s.a[1])) / (L * L);
    if (t > 0.01 && t < 0.99 && dist(lerp(s.a, s.b, t), at) < 0.5) rays.push(heading(at, s.a), heading(at, s.b));
  }
  if (Math.abs(dist(at, f.O) - f.R) < 0.5) { const h = heading(f.O, at); rays.push(h + 90, h - 90); }
  return rays;
}
export function pointBox(c: CPoint, f: CFig): Box {
  const w = textW(c.name, POINT_FONT), h = POINT_FONT + 2, r = Math.max(w, h) / 2 + 3;
  let dir: P, gap: number;
  if (c.dir) {
    // far enough along dir to clear both lines of the gap
    dir = unitv(c.dir); const g = c.gap ?? 90, h0 = Math.atan2(dir[1], dir[0]) / RAD;
    const need = Math.max(reach(dirv(h0 + g / 2 - 90), w, h), reach(dirv(h0 - g / 2 + 90), w, h)) + 5;
    const [x, y] = add(c.at, dir, need / Math.sin(g / 2 * RAD));
    return { x, y, w, h, text: c.name, kind: "point" };
  }
  else {
    const hs = raysAt(c.at, f).map(mod360).sort((a, b) => a - b);
    // the widest gap between the lines that holds no marked angle
    const marks = f.arcs.filter(a => dist(a.at, c.at) < 0.5).map(a => { const sp = arcSpan(a); return mod360(sp.from + sp.size / 2); });
    let best = 0; gap = 360;
    if (hs.length) {
      const gaps = hs.map((x, i) => { const nx = i + 1 < hs.length ? hs[i + 1] : hs[0] + 360; return { x, size: nx - x }; });
      const free = gaps.filter(g => !marks.some(m => mod360(m - g.x) < g.size));
      const top = (free.length ? free : gaps).reduce((a, b) => (b.size > a.size ? b : a));
      gap = top.size; best = top.x + top.size / 2;
    }
    dir = dirv(best);
  }
  const d = Math.min(40, Math.max(r + 3, r / Math.sin(Math.min(gap, 180) / 2 * RAD)));
  const [x, y] = add(c.at, dir, d);
  return { x, y, w, h, text: c.name, kind: 'point' };
}
export const allBoxes = (f: CFig): Box[] => [...f.sides.map(sideBox), ...f.arcs.map(angleBox), ...f.points.map(p => pointBox(p, f))];

const RIGHT = 12;
export function rightSquare(r: Right): P[] {
  const u = unitv(sub(r.p1, r.at)), v = unitv(sub(r.p2, r.at));
  const a = add(r.at, u, RIGHT), c = add(r.at, v, RIGHT);
  return [a, add(a, v, RIGHT), c];
}

/** Labels that touch a line, the circle, an arc, a right-angle mark or another label; marked
 * angles with a line running through them, or with arms too short for the arc (in drawn pixels). */
export function layoutProblems(f: CFig): string[] {
  const out: string[] = [];
  const boxes = allBoxes(f);
  const inside = (b: Box, p: P, pad: number) => Math.abs(p[0] - b.x) < b.w / 2 + pad && Math.abs(p[1] - b.y) < b.h / 2 + pad;
  boxes.forEach((b, i) => {
    for (const s of f.segs) {
      const L = dist(s.a, s.b);
      for (let t = 0; t <= L; t += 1) if (inside(b, lerp(s.a, s.b, t / L), 2)) { out.push(`label ${b.text} touches a line`); break; }
    }
    for (let a = 0; a < 360; a += 1) if (inside(b, add(f.O, dirv(a), f.R), 2)) { out.push(`label ${b.text} touches the circle`); break; }
    if (inside(b, f.O, 4) && b.text !== 'O') out.push(`label ${b.text} covers the centre`);
    boxes.forEach((o, j) => {
      if (j > i && Math.abs(b.x - o.x) < (b.w + o.w) / 2 + 3 && Math.abs(b.y - o.y) < (b.h + o.h) / 2 + 3) out.push(`labels ${b.text} and ${o.text} overlap`);
    });
    for (const c of f.arcs) {
      const { from, size } = arcSpan(c), r = arcRadius(size);
      for (let a = 0; a <= size; a += 4) if (inside(b, add(c.at, dirv(from + a), r), 1)) { out.push(`label ${b.text} touches an arc`); break; }
    }
    for (const r of f.rights) for (const p of rightSquare(r)) if (inside(b, p, 2)) { out.push(`label ${b.text} touches a right-angle mark`); break; }
  });
  for (const c of f.arcs) {
    const { from, size } = arcSpan(c), r = arcRadius(size);
    for (const p of [c.p1, c.p2]) if (dist(p, c.at) < r + 14) out.push(`an arm of ${c.text} is too short`);
    for (const h of raysAt(c.at, f)) {
      const off = mod360(h - from);
      if (off > 2 && off < size - 2) out.push(`a line runs through the angle ${c.text}`);
    }
    if (size < 22) out.push(`the angle ${c.text} is too small to mark`);
  }
  // a line that only just misses a point looks as if it runs through it
  for (const p of f.points) for (const s of f.segs) {
    const L = dist(s.a, s.b), t = Math.max(0, Math.min(1, ((p.at[0] - s.a[0]) * (s.b[0] - s.a[0]) + (p.at[1] - s.a[1]) * (s.b[1] - s.a[1])) / (L * L)));
    const gap = dist(p.at, lerp(s.a, s.b, t));
    if (gap > 1e-6 && gap < 12) out.push(`a line passes close to ${p.name}`);
  }
  return out;
}

const f1 = (x: number) => x.toFixed(1);
const text = (b: Box, font: number, fill: string, italic: boolean) =>
  `<text x="${f1(b.x)}" y="${f1(b.y)}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif"${italic ? ' font-style="italic"' : ''} font-size="${font}" fill="${fill}">${b.text}</text>`;
export function drawCFig(f: CFig): string {
  let out = `<circle cx="${f1(f.O[0])}" cy="${f1(f.O[1])}" r="${f.R}" fill="none" stroke="#334155" stroke-width="2.5"/>`;
  const xs: number[] = [f.O[0] - f.R, f.O[0] + f.R], ys: number[] = [f.O[1] - f.R, f.O[1] + f.R];
  for (const s of f.segs) {
    out += `<line x1="${f1(s.a[0])}" y1="${f1(s.a[1])}" x2="${f1(s.b[0])}" y2="${f1(s.b[1])}" stroke="#334155" stroke-width="2.5" stroke-linecap="round"/>`;
    xs.push(s.a[0], s.b[0]); ys.push(s.a[1], s.b[1]);
  }
  for (const r of f.rights) {
    const [a, b, c] = rightSquare(r);
    out += `<polyline points="${f1(a[0])},${f1(a[1])} ${f1(b[0])},${f1(b[1])} ${f1(c[0])},${f1(c[1])}" fill="none" stroke="#64748b" stroke-width="1.8"/>`;
  }
  for (const c of f.arcs) {
    const { from, size } = arcSpan(c), r = arcRadius(size);
    const s = add(c.at, dirv(from), r), e = add(c.at, dirv(from + size), r);
    out += `<path d="M${f1(s[0])},${f1(s[1])} A${r},${r} 0 ${size > 180 ? 1 : 0} 1 ${f1(e[0])},${f1(e[1])}" fill="none" stroke="${c.unknown ? '#6366f1' : '#64748b'}" stroke-width="1.8"/>`;
  }
  if (f.points.some(p => p.name === 'O' && dist(p.at, f.O) < 0.5)) out += `<circle cx="${f1(f.O[0])}" cy="${f1(f.O[1])}" r="3" fill="#334155"/>`;
  const keep = (b: Box) => { xs.push(b.x - b.w / 2, b.x + b.w / 2); ys.push(b.y - b.h / 2, b.y + b.h / 2); return b; };
  for (const s of f.sides) out += s.unknown ? text(keep(sideBox(s)), UNKNOWN_FONT, '#4f46e5', true) : text(keep(sideBox(s)), SIDE_FONT, '#1e293b', false);
  for (const c of f.arcs) out += c.unknown ? text(keep(angleBox(c)), ANGLE_UNKNOWN_FONT, '#4f46e5', true) : text(keep(angleBox(c)), ANGLE_FONT, '#1e293b', false);
  for (const p of f.points) out += text(keep(pointBox(p, f)), POINT_FONT, '#475569', true);
  const x0 = Math.min(...xs) - 8, y0 = Math.min(...ys) - 8, x1 = Math.max(...xs) + 8, y1 = Math.max(...ys) + 8;
  return `<svg viewBox="${f1(x0)} ${f1(y0)} ${f1(x1 - x0)} ${f1(y1 - y0)}" style="max-height:300px" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}

// ---------------------------------------------------------------- parts and slips
const slip = (value: number, code: string): Slip => ({ value: String(value), code, message: MESSAGES[code] });
const keep = (answer: number, max: number, slips: (Slip | false)[]) =>
  slips.filter((s): s is Slip => !!s && s.value !== String(answer) && Number.isInteger(Number(s.value)) && Number(s.value) > 0 && Number(s.value) < max)
    .filter((s, i, all) => all.findIndex(t => t.value === s.value) === i);
const deg = (label: string, answer: number, code: string, slips: (Slip | false)[] = [], ask?: string): NumberPart =>
  ({ kind: 'number', label, answer: String(answer), suffix: '°', code, slips: keep(answer, 361, slips), ask });
const cm = (label: string, answer: number, code: string, slips: (Slip | false)[] = [], ask?: string, unit = ' cm'): NumberPart =>
  ({ kind: 'number', label, answer: String(answer), suffix: unit, code, slips: keep(answer, 10000, slips), ask });

export const MESSAGES: Record<string, string> = {
  // chords
  'not-halved': 'OM ⟂ AB, so M is the midpoint of AB: halve the chord.',
  'angle-not-halved': 'OM ⟂ AB, so OM cuts ∠AOB in half.',
  'not-doubled': 'M is the midpoint, so AB is twice AM.',
  'angle-not-doubled': '∠AOB is twice ∠AOM.',
  'minus-lengths': 'Subtract the squares, not the lengths.',
  'added-lengths': 'Add the squares, not the lengths: r² = AM² + d².',
  'no-root': 'That is the square. Take the square root.',
  'stopped-am': 'That is AM. The chord AB is twice as long.',
  // circle theorems
  'halved': 'The angle at the centre is twice the angle at the circumference: double it.',
  'doubled': 'The angle at the circumference is half the angle at the centre: halve it.',
  'not-reflex': 'Use the angle at the centre on the same arc: here it is the reflex angle.',
  'semi-180': 'An angle in a semicircle is 90°.',
  'semi-forgot-90': 'The angle in the semicircle is 90°: take both angles away from 180°.',
  'same-arc-supp': 'Angles at the circumference on the same arc are equal.',
  'same-arc-double': 'Both angles are at the circumference on the same arc, so they are equal.',
  'cyclic-equal': 'Opposite angles of a cyclic quadrilateral add to 180°. They are not equal.',
  'cyclic-360': 'Opposite angles of a cyclic quadrilateral add to 180°, not 360°.',
  'cyclic-adjacent': 'Use the angle opposite, not the one next to it.',
  'tan-no-right': 'A tangent meets the radius at 90°.',
  'tan-quad': 'Each tangent meets its radius at 90°, so the quadrilateral has two right angles.',
  'iso-one-base': 'OA = OB (radii), so both base angles are equal: take both away from 180°.',
};

const LETTERS = ['x', 'y', 'a', 'b'];
const given = (n: number) => `${n}°`;
const arc = (at: P, p1: P, p2: P, txt: string, unknown = false, reflex = false): CArc => ({ at, p1, p2, text: txt, unknown, reflex });
const pt = (at: P, name: string, dir?: P, gap?: number): CPoint => (dir ? { at, name, dir, gap } : { at, name });
const fig = (o: Partial<CFig>): CFig => ({ O, R, segs: [], arcs: [], sides: [], rights: [], points: [], ...o });
const centre = () => pt(O, 'O');
/** "3x", "x", "5x − 10", "2x + 15" */
/** An angle written with x: "(3x)°", "(5x − 10)°", or just "x°". */
const angleExpr = (a: number, b = 0) => (a === 1 && !b ? "x°" : `(${expr(a, b)})°`);
export const expr = (a: number, b = 0) => `${a === 1 ? '' : a}x${b > 0 ? ` + ${b}` : b < 0 ? ` − ${-b}` : ''}`;

interface Built {
  type: string; prompt: string; label: string; fig: CFig; parts: NumberPart[];
  answers: Record<string, number>;   // the value of each unknown letter (the tests evaluate the labels with these)
}

// ---------------------------------------------------------------- chords and Pythagoras
export type ChordType = 'halve-len' | 'double-len' | 'halve-ang' | 'double-ang' | 'find-d' | 'find-chord' | 'find-r';
const CHORD_ASK = 'O is the centre and OM ⟂ AB.';
/** Friendly triples: [AM or d, the other one, r]. */
const TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [9, 12, 15], [12, 16, 20], [5, 12, 13], [10, 24, 26], [8, 15, 17], [7, 24, 25]];

/** A chord AB with midpoint M, half-length `half` and distance `d` from O (in pixels). */
function chordFig(rng: () => number, half: number, d: number, chordLabelled = false) {
  const phi = randInt(rng, 0, 359), side = rng() < 0.5 ? 1 : -1;
  const M = add(O, dirv(phi), d), u = dirv(phi + 90 * side);
  const A = add(M, u, half), B = add(M, u, -half);
  // the right-angle mark sits in triangle OAM; the letter M goes outside the chord, or inside
  // triangle OMB when the chord's length is written outside it
  const mPoint = chordLabelled ? pt(M, 'M', add(unitv(sub(O, M)), unitv(sub(B, M))), 90) : pt(M, 'M', sub(M, O), 180);
  return { M, A, B, points: [centre(), pt(A, 'A'), pt(B, 'B'), mPoint], right: { at: M, p1: O, p2: A } as Right };
}

function halveLen(rng: () => number): Built {
  const h = randInt(rng, 3, 20);
  const ratio = 0.3 + rng() * 0.28, dpx = R * ratio, half = Math.sqrt(R * R - dpx * dpx);
  const k = chordFig(rng, half, dpx);
  return {
    type: 'halve-len', prompt: `AB = ${2 * h} cm. Find AM.`, label: 'a circle with chord AB and the perpendicular OM',
    fig: fig({ segs: [{ a: k.A, b: k.B }, { a: O, b: k.M }, { a: O, b: k.A }, { a: O, b: k.B }], rights: [k.right], points: k.points }),
    parts: [cm('AM =', h, 'chord-half', [slip(2 * h, 'not-halved')], CHORD_ASK)], answers: {},
  };
}
function doubleLen(rng: () => number): Built {
  const h = randInt(rng, 3, 20), ratio = 0.3 + rng() * 0.28, dpx = R * ratio, half = Math.sqrt(R * R - dpx * dpx);
  const k = chordFig(rng, half, dpx);
  return {
    type: 'double-len', prompt: `AM = ${h} cm. Find AB.`, label: 'a circle with chord AB and the perpendicular OM',
    fig: fig({ segs: [{ a: k.A, b: k.B }, { a: O, b: k.M }, { a: O, b: k.A }, { a: O, b: k.B }], rights: [k.right], points: k.points }),
    parts: [cm('AB =', 2 * h, 'chord-half', [slip(h, 'not-doubled')], CHORD_ASK)], answers: {},
  };
}
function halveAng(rng: () => number): Built {
  const a = randInt(rng, 25, 75), k = chordFig(rng, R * Math.sin(a * RAD), R * Math.cos(a * RAD), false);
  return {
    type: 'halve-ang', prompt: `∠AOB = ${2 * a}°. Find ∠AOM.`, label: 'a circle with chord AB and the perpendicular OM',
    fig: fig({ segs: [{ a: k.A, b: k.B }, { a: O, b: k.M }, { a: O, b: k.A }, { a: O, b: k.B }], rights: [k.right], points: k.points }),
    parts: [deg('∠AOM =', a, 'chord-half', [slip(2 * a, 'angle-not-halved')], CHORD_ASK)], answers: { AOB: 2 * a, AOM: a },
  };
}
function doubleAng(rng: () => number): Built {
  const a = randInt(rng, 30, 75), k = chordFig(rng, R * Math.sin(a * RAD), R * Math.cos(a * RAD), false);
  return {
    type: 'double-ang', prompt: 'Find ∠AOB.', label: 'a circle with chord AB and the perpendicular OM',
    fig: fig({ segs: [{ a: k.A, b: k.B }, { a: O, b: k.M }, { a: O, b: k.A }, { a: O, b: k.B }], arcs: [arc(O, k.A, k.M, given(a))], rights: [k.right], points: k.points }),
    parts: [deg('∠AOB =', 2 * a, 'chord-half', [slip(a, 'angle-not-doubled')], CHORD_ASK)], answers: { AOB: 2 * a, AOM: a },
  };
}

/** A triple drawn to scale: half-chord AM, distance d, radius r (in cm). */
function tripleChord(rng: () => number, dSmall: boolean, chordLabelled = false) {
  const [p, q, r] = pick(rng, TRIPLES);
  const am = dSmall ? q : p, d = dSmall ? p : q, s = R / r;
  return { am, d, r, k: chordFig(rng, am * s, d * s, chordLabelled) };
}
function findD(rng: () => number): Built {
  const { am, d, r, k } = tripleChord(rng, true);
  return {
    type: 'find-d', prompt: `AB = ${2 * am} cm. Find AM, then d.`, label: 'a circle with chord AB, radius OA and the distance d from O to the chord',
    fig: fig({
      segs: [{ a: k.A, b: k.B }, { a: O, b: k.M }, { a: O, b: k.A }],
      sides: [{ a: O, b: k.A, text: `${r} cm`, away: k.M }, { a: O, b: k.M, text: 'd', unknown: true, away: k.A, t: 0.4 }],
      rights: [k.right], points: k.points,
    }),
    parts: [
      cm('AM =', am, 'chord-half', [slip(2 * am, 'not-halved')], CHORD_ASK),
      cm('d =', d, 'pythagoras', [slip(r - am, 'minus-lengths'), slip(r * r - am * am, 'no-root')], 'Use Pythagoras in △OAM.'),
    ],
    answers: { d },
  };
}
function findChord(rng: () => number): Built {
  const { am, d, r, k } = tripleChord(rng, rng() < 0.6);
  return {
    type: 'find-chord', prompt: 'Find AM, then the chord AB.', label: 'a circle with radius OA and the distance OM from O to the chord AB',
    fig: fig({
      segs: [{ a: k.A, b: k.B }, { a: O, b: k.M }, { a: O, b: k.A }],
      sides: [{ a: O, b: k.A, text: `${r} cm`, away: k.M }, { a: O, b: k.M, text: `${d} cm`, away: k.A, t: 0.4 }],
      rights: [k.right], points: k.points,
    }),
    parts: [
      cm('AM =', am, 'pythagoras', [slip(r - d, 'minus-lengths'), slip(r * r - d * d, 'no-root')], 'Use Pythagoras in △OAM.'),
      cm('AB =', 2 * am, 'chord-half', [slip(am, 'stopped-am')], 'Now find the whole chord.'),
    ],
    answers: {},
  };
}
function findR(rng: () => number): Built {
  const { am, d, r, k } = tripleChord(rng, true);
  return {
    type: 'find-r', prompt: `AB = ${2 * am} cm. Find AM, then the radius r.`, label: 'a circle with chord AB and the distance OM from O to the chord',
    fig: fig({
      segs: [{ a: k.A, b: k.B }, { a: O, b: k.M }, { a: O, b: k.A }],
      sides: [{ a: O, b: k.M, text: `${d} cm`, away: k.A, t: 0.4 }, { a: O, b: k.A, text: 'r', unknown: true, away: k.M }],
      rights: [k.right], points: k.points,
    }),
    parts: [
      cm('AM =', am, 'chord-half', [slip(2 * am, 'not-halved')], CHORD_ASK),
      cm('r =', r, 'pythagoras', [slip(am + d, 'added-lengths'), slip(am * am + d * d, 'no-root')], 'Use Pythagoras in △OAM.'),
    ],
    answers: { r },
  };
}

export const CHORD_MAKERS: Record<ChordType, (rng: () => number) => Built> = {
  'halve-len': halveLen, 'double-len': doubleLen, 'halve-ang': halveAng, 'double-ang': doubleAng,
  'find-d': findD, 'find-chord': findChord, 'find-r': findR,
};
export const CHORD_TYPES = Object.keys(CHORD_MAKERS) as ChordType[];
export const CHORD_LEVEL_ITEMS: Record<1 | 2 | 3, ChordType[]> = {
  1: ['halve-len', 'halve-len', 'double-len', 'halve-ang', 'halve-ang', 'double-ang'],
  2: ['find-d'],
  3: ['find-chord', 'find-chord', 'find-r'],
};

// ---------------------------------------------------------------- circle theorems
export type CircleType = 'centre' | 'circ' | 'reflex' | 'semi'
  | 'same-arc' | 'cyclic' | 'tan-tri' | 'tan-quad' | 'tan-len'
  | 'iso-centre' | 'semi-sum' | 'alg-centre' | 'alg-semi' | 'alg-cyclic' | 'alg-tanlen' | 'alg-tanangle';

/** Random start angle and direction round the circle. */
const spin = (rng: () => number) => { const t0 = randInt(rng, 0, 359), s = rng() < 0.5 ? 1 : -1; return (t: number) => on(t0 + s * t); };
const between = (rng: () => number, lo: number, hi: number) => lo + rng() * (hi - lo);

/** A, B on the circle with arc AB (not containing C) of `arcAB` degrees, and C on the rest of the circle. */
function threePoints(rng: () => number, arcAB: number, gap: number) {
  const at = spin(rng);
  return { A: at(0), B: at(arcAB), C: at(arcAB + between(rng, gap, 360 - arcAB - gap)) };
}

function centreCirc(rng: () => number, findCentre: boolean): Built {
  // finding the centre angle: an even g, so halving it (the misconception) gives a whole number
  const g = findCentre ? 2 * randInt(rng, 13, 39) : randInt(rng, 25, 78), { A, B, C } = threePoints(rng, 2 * g, 40), v = pick(rng, LETTERS);
  const segs = [{ a: O, b: A }, { a: O, b: B }, { a: C, b: A }, { a: C, b: B }];
  const points = [centre(), pt(A, 'A'), pt(B, 'B'), pt(C, 'C')];
  if (findCentre) return {
    type: 'centre', prompt: `O is the centre. Find ${v}.`, label: 'an angle at the centre and an angle at the circumference on the same arc',
    fig: fig({ segs, points, arcs: [arc(C, A, B, given(g)), arc(O, A, B, `${v}°`, true)] }),
    parts: [deg(`${v} =`, 2 * g, 'centre', [slip(g / 2, 'halved')])], answers: { [v]: 2 * g },
  };
  const c = 2 * g;
  return {
    type: 'circ', prompt: `O is the centre. Find ${v}.`, label: 'an angle at the centre and an angle at the circumference on the same arc',
    fig: fig({ segs, points, arcs: [arc(O, A, B, given(c)), arc(C, A, B, `${v}°`, true)] }),
    parts: [deg(`${v} =`, g, 'centre', [slip(2 * c, 'doubled')])], answers: { [v]: g },
  };
}
function reflex(rng: () => number): Built {
  const g = randInt(rng, 100, 140), { A, B, C } = threePoints(rng, 2 * g, 25), v = pick(rng, LETTERS);
  const segs = [{ a: O, b: A }, { a: O, b: B }, { a: C, b: A }, { a: C, b: B }];
  const points = [centre(), pt(A, 'A'), pt(B, 'B'), pt(C, 'C')];
  const label = 'a reflex angle at the centre and an angle at the circumference on the same arc';
  if (rng() < 0.5) return {
    type: 'reflex', prompt: `O is the centre. Find ${v}.`, label,
    fig: fig({ segs, points, arcs: [arc(O, A, B, given(2 * g), false, true), arc(C, A, B, `${v}°`, true)] }),
    parts: [deg(`${v} =`, g, 'centre', [slip(180 - g, 'not-reflex'), slip(4 * g, 'doubled')])], answers: { [v]: g },
  };
  return {
    type: 'reflex', prompt: `O is the centre. Find ${v}.`, label,
    fig: fig({ segs, points, arcs: [arc(C, A, B, given(g)), arc(O, A, B, `${v}°`, true, true)] }),
    parts: [deg(`${v} =`, 2 * g, 'centre', [slip(360 - 2 * g, 'not-reflex'), g % 2 === 0 && slip(g / 2, 'halved')])], answers: { [v]: 2 * g },
  };
}
/** Diameter AB through O, and C on the circle with ∠CAB = g. */
function semiFig(rng: () => number, g: number) {
  const at = spin(rng), A = at(0), B = at(180), C = at(180 - 2 * g);
  return { A, B, C, segs: [{ a: A, b: B }, { a: C, b: A }, { a: C, b: B }] };
}
function semi(rng: () => number): Built {
  const g = randInt(rng, 22, 68), { A, B, C, segs } = semiFig(rng, g);
  const shown = rng() < 0.5;
  return {
    type: 'semi', prompt: 'AB is a diameter. Find ∠ACB.', label: 'a triangle in a semicircle',
    fig: fig({ segs, points: [centre(), pt(A, 'A'), pt(B, 'B'), pt(C, 'C')], arcs: shown ? [arc(A, C, B, given(g))] : [] }),
    parts: [deg('∠ACB =', 90, 'semi', [slip(180, 'semi-180')])], answers: { ACB: 90 },
  };
}

function sameArc(rng: () => number): Built {
  const g = randInt(rng, 25, 70), at = spin(rng), v = pick(rng, LETTERS);
  const A = at(0), B = at(2 * g);
  let t1 = 0, t2 = 0;
  do { t1 = between(rng, 2 * g + 30, 330); t2 = between(rng, 2 * g + 30, 330); } while (Math.abs(t1 - t2) < 45);
  const C = at(t1), D = at(t2);
  return {
    type: 'same-arc', prompt: `Find ${v}.`, label: 'two angles at the circumference on the same arc AB',
    fig: fig({ segs: [{ a: C, b: A }, { a: C, b: B }, { a: D, b: A }, { a: D, b: B }], points: [pt(A, 'A'), pt(B, 'B'), pt(C, 'C'), pt(D, 'D')], arcs: [arc(C, A, B, given(g)), arc(D, A, B, `${v}°`, true)] }),
    parts: [deg(`${v} =`, g, 'same-arc', [slip(180 - g, 'same-arc-supp'), slip(2 * g, 'same-arc-double')])], answers: { [v]: g },
  };
}
/** A cyclic quadrilateral ABCD with ∠A = alpha and ∠B = beta. */
function cyclicFig(rng: () => number, alpha: number, beta: number) {
  for (;;) {
    const a3 = randInt(rng, 45, Math.min(2 * alpha, 2 * beta) - 45);
    const a2 = 2 * alpha - a3, a4 = 2 * beta - a3, a1 = 360 - a2 - a3 - a4;
    if (Math.min(a1, a2, a3, a4) < 45) continue;
    const at = spin(rng);
    const A = at(0), B = at(a1), C = at(a1 + a2), D = at(a1 + a2 + a3);
    return { A, B, C, D, segs: [{ a: A, b: B }, { a: B, b: C }, { a: C, b: D }, { a: D, b: A }], points: [pt(A, 'A'), pt(B, 'B'), pt(C, 'C'), pt(D, 'D')] };
  }
}
const cyclicAngle = (rng: () => number) => { for (;;) { const a = randInt(rng, 55, 125); if (Math.abs(a - 90) >= 10) return a; } };
function cyclic(rng: () => number): Built {
  let alpha = 0, beta = 0;
  do { alpha = cyclicAngle(rng); beta = cyclicAngle(rng); } while (Math.abs(alpha - beta) < 8 || alpha + beta < 140 || alpha + beta > 220);
  const q = cyclicFig(rng, alpha, beta), v = pick(rng, LETTERS), atC = rng() < 0.5;
  const ans = atC ? 180 - alpha : 180 - beta, opp = atC ? alpha : beta, next = atC ? beta : alpha;
  const unknown = atC ? arc(q.C, q.B, q.D, `${v}°`, true) : arc(q.D, q.C, q.A, `${v}°`, true);
  return {
    type: 'cyclic', prompt: `ABCD is a cyclic quadrilateral. Find ${v}.`, label: 'a cyclic quadrilateral',
    fig: fig({ segs: q.segs, points: q.points, arcs: [arc(q.A, q.B, q.D, given(alpha)), arc(q.B, q.A, q.C, given(beta)), unknown] }),
    parts: [deg(`${v} =`, ans, 'cyclic', [slip(opp, 'cyclic-equal'), slip(360 - opp, 'cyclic-360'), slip(180 - next, 'cyclic-adjacent')])], answers: { [v]: ans },
  };
}
/** Tangent at A meeting the line from O at T, with ∠AOT = alpha. */
function tangentFig(rng: () => number, alpha: number) {
  const t0 = randInt(rng, 0, 359), s = rng() < 0.5 ? 1 : -1;
  const A = on(t0), u = dirv(t0 + 90 * s), T = add(A, u, R * Math.tan(alpha * RAD));
  return { A, T, segs: [{ a: O, b: A }, { a: add(A, u, -32), b: T }, { a: O, b: T }] };
}
function tanTri(rng: () => number): Built {
  const alpha = randInt(rng, 30, 62), k = tangentFig(rng, alpha), v = pick(rng, LETTERS), atO = rng() < 0.5;
  const g = atO ? 90 - alpha : alpha, ans = 90 - g;
  return {
    type: 'tan-tri', prompt: `AB is a tangent at A and O is the centre. Find ${v}.`, label: 'a tangent and a radius',
    fig: fig({
      segs: k.segs, points: [centre(), pt(k.A, 'A'), pt(k.T, 'B')],
      arcs: atO ? [arc(k.T, O, k.A, given(g)), arc(O, k.A, k.T, `${v}°`, true)] : [arc(O, k.A, k.T, given(g)), arc(k.T, O, k.A, `${v}°`, true)],
    }),
    parts: [deg(`${v} =`, ans, 'tangent', [slip(180 - g, 'tan-no-right')])], answers: { [v]: ans },
  };
}
/** Tangents from P touching at A and B, with ∠APB = p. */
function twoTangents(rng: () => number, p: number) {
  const t0 = randInt(rng, 0, 359), Pp = add(O, dirv(t0), R / Math.sin(p / 2 * RAD));
  const A = on(t0 + 90 - p / 2), B = on(t0 - 90 + p / 2);
  return { P: Pp, A, B };
}
function tanQuad(rng: () => number): Built {
  const p = randInt(rng, 50, 100), k = twoTangents(rng, p), v = pick(rng, LETTERS), atO = rng() < 0.5;
  const g = atO ? p : 180 - p, ans = 180 - g;
  return {
    type: 'tan-quad', prompt: `PA and PB are tangents and O is the centre. Find ${v}.`, label: 'two tangents from P',
    fig: fig({
      segs: [{ a: O, b: k.A }, { a: O, b: k.B }, { a: k.P, b: k.A }, { a: k.P, b: k.B }], points: [centre(), pt(k.A, 'A'), pt(k.B, 'B'), pt(k.P, 'P')],
      arcs: atO ? [arc(k.P, k.A, k.B, given(g)), arc(O, k.A, k.B, `${v}°`, true)] : [arc(O, k.A, k.B, given(g)), arc(k.P, k.A, k.B, `${v}°`, true)],
    }),
    parts: [deg(`${v} =`, ans, 'tangent', [slip(360 - g, 'tan-quad')])], answers: { [v]: ans },
  };
}
function tanLen(rng: () => number): Built {
  const p = randInt(rng, 56, 90), k = twoTangents(rng, p), L = randInt(rng, 4, 15);
  return {
    type: 'tan-len', prompt: 'PA and PB are tangents. Find PB.', label: 'two tangents from P',
    fig: fig({ segs: [{ a: k.P, b: k.A }, { a: k.P, b: k.B }], points: [centre(), pt(k.A, 'A'), pt(k.B, 'B'), pt(k.P, 'P')], sides: [{ a: k.P, b: k.A, text: `${L} cm`, away: O }] }),
    parts: [cm('PB =', L, 'tangent')], answers: {},
  };
}

// ---- two steps
function isoCentre(rng: () => number): Built {
  const g = randInt(rng, 20, 62), apex = 180 - 2 * g, { A, B, C } = threePoints(rng, apex, 35);
  return {
    type: 'iso-centre', prompt: 'O is the centre. Find ∠AOB, then x.', label: 'an isosceles triangle OAB and an angle at the circumference',
    fig: fig({ segs: [{ a: O, b: A }, { a: O, b: B }, { a: A, b: B }, { a: C, b: A }, { a: C, b: B }], points: [centre(), pt(A, 'A'), pt(B, 'B'), pt(C, 'C')], arcs: [arc(A, O, B, given(g)), arc(C, A, B, 'x°', true)] }),
    parts: [
      deg('∠AOB =', apex, 'isosceles', [slip(180 - g, 'iso-one-base')], 'OA and OB are radii.'),
      deg('x =', apex / 2, 'centre', [slip(2 * apex, 'doubled')], 'Now use ∠AOB to find x.'),
    ],
    answers: { x: apex / 2, AOB: apex },
  };
}
function semiSum(rng: () => number): Built {
  const g = randInt(rng, 22, 68), at = spin(rng);
  const A = at(0), C = at(180), B = at(180 - 2 * g), v = pick(rng, ['a', 'b', 'x', 'y']);
  return {
    type: 'semi-sum', prompt: `AC is a diameter. Find ∠ABC, then ${v}.`, label: 'a triangle in a semicircle',
    fig: fig({ segs: [{ a: A, b: C }, { a: B, b: A }, { a: B, b: C }], points: [centre(), pt(A, 'A'), pt(B, 'B'), pt(C, 'C')], arcs: [arc(A, B, C, given(g)), arc(C, A, B, `${v}°`, true)] }),
    parts: [
      deg('∠ABC =', 90, 'semi', [slip(180, 'semi-180')]),
      deg(`${v} =`, 90 - g, 'step', [slip(180 - g, 'semi-forgot-90')], `Now use the angle sum to find ${v}.`),
    ],
    answers: { [v]: 90 - g, ABC: 90 },
  };
}

// ---- algebra: type the value of the expression, then x
function algCentre(rng: () => number): Built {
  for (;;) {
    // kx at the centre starts at 3x: with 2x = 2g, forgetting to double would give x itself
    const g = randInt(rng, 34, 78), atCentre = rng() < 0.5, k = randInt(rng, atCentre ? 3 : 2, 5);
    const val = atCentre ? 2 * g : g;
    if (val % k) continue;
    const x = val / k, { A, B, C } = threePoints(rng, 2 * g, 40);
    const e = `(${expr(k)})°`;
    return {
      type: 'alg-centre', prompt: 'O is the centre. Find x.', label: 'an angle at the centre and an angle at the circumference on the same arc',
      fig: fig({
        segs: [{ a: O, b: A }, { a: O, b: B }, { a: C, b: A }, { a: C, b: B }], points: [centre(), pt(A, 'A'), pt(B, 'B'), pt(C, 'C')],
        arcs: atCentre ? [arc(C, A, B, given(g)), arc(O, A, B, e)] : [arc(O, A, B, given(2 * g)), arc(C, A, B, e)],
      }),
      parts: [
        deg(`${expr(k)} =`, val, 'centre', [atCentre ? slip(g, 'halved') : slip(4 * g, 'doubled')]),
        { kind: 'number', label: 'x =', answer: String(x), code: 'solve', ask: `Now solve ${expr(k)} = ${val}.` },
      ],
      answers: { x },
    };
  }
}
function algSemi(rng: () => number): Built {
  for (;;) {
    const a = randInt(rng, 2, 6), b = 5 * randInt(rng, -8, 8);
    if (!b || (90 - b) % a) continue;
    const x = (90 - b) / a;
    if (x < 6) continue;
    const g = randInt(rng, 25, 65), { A, B, C, segs } = semiFig(rng, g);
    return {
      type: 'alg-semi', prompt: 'AB is a diameter. Find x.', label: 'a triangle in a semicircle',
      fig: fig({ segs, points: [centre(), pt(A, 'A'), pt(B, 'B'), pt(C, 'C')], arcs: [arc(C, A, B, `(${expr(a, b)})°`)] }),
      parts: [
        deg(`${expr(a, b)} =`, 90, 'semi', [slip(180, 'semi-180')]),
        { kind: 'number', label: 'x =', answer: String(x), code: 'solve', ask: `Now solve ${expr(a, b)} = 90.` },
      ],
      answers: { x },
    };
  }
}
function algCyclic(rng: () => number): Built {
  for (;;) {
    const x = randInt(rng, 8, 30), a = randInt(rng, 2, 5), c = randInt(rng, 1, 4);
    const b = 5 * randInt(rng, -6, 6), alpha = a * x + b, gamma = 180 - alpha, d = gamma - c * x;
    if (a === c || alpha < 55 || alpha > 125 || Math.abs(alpha - 90) < 8 || d % 5 || Math.abs(d) > 50 || !d || !b) continue;
    const beta = cyclicAngle(rng);
    if (alpha + beta < 140 || alpha + beta > 220) continue;
    const q = cyclicFig(rng, alpha, beta), sum = expr(a + c, b + d);
    return {
      type: 'alg-cyclic', prompt: 'ABCD is a cyclic quadrilateral. Find x.', label: 'a cyclic quadrilateral',
      fig: fig({ segs: q.segs, points: q.points, arcs: [arc(q.A, q.B, q.D, `(${expr(a, b)})°`), arc(q.C, q.B, q.D, `(${expr(c, d)})°`)] }),
      parts: [
        deg(`${sum} =`, 180, 'cyclic', [slip(360, 'cyclic-360')], 'Add the two opposite angles.'),
        { kind: 'number', label: 'x =', answer: String(x), code: 'solve', ask: `Now solve ${sum} = 180.` },
      ],
      answers: { x },
    };
  }
}
function algTanLen(rng: () => number): Built {
  for (;;) {
    const x = randInt(rng, 2, 9), a = randInt(rng, 2, 4), c = randInt(rng, 1, 2);
    const L = randInt(rng, 6, 30), b = a * x - L, d = L - c * x;
    if (a === c || !b || !d || Math.abs(b) > 12 || Math.abs(d) > 20) continue;
    const k = twoTangents(rng, randInt(rng, 56, 90));
    // PA = ax − b, PB = cx + d
    return {
      type: 'alg-tanlen', prompt: 'PA and PB are tangents. Find x, then PA.', label: 'two tangents from P',
      fig: fig({
        segs: [{ a: k.P, b: k.A }, { a: k.P, b: k.B }], points: [centre(), pt(k.A, 'A'), pt(k.B, 'B'), pt(k.P, 'P')],
        sides: [{ a: k.P, b: k.A, text: expr(a, -b), away: O }, { a: k.P, b: k.B, text: expr(c, d), away: O }],
      }),
      parts: [
        { kind: 'number', label: 'x =', answer: String(x), code: 'solve', ask: 'Tangents from P are equal: PA = PB.' },
        cm('PA =', L, 'tangent', [], 'Now put x into PA.', ''),
      ],
      answers: { x },
    };
  }
}
function algTanAngle(rng: () => number): Built {
  for (;;) {
    const a = randInt(rng, 1, 5), c = randInt(rng, 1, 5);
    if ((90 % (a + c)) !== 0) continue;
    const x = 90 / (a + c), alpha = a * x;
    if (alpha < 28 || alpha > 62) continue;
    const k = tangentFig(rng, alpha);
    return {
      type: 'alg-tanangle', prompt: 'AT is a tangent at A and O is the centre. Find x.', label: 'a tangent and a radius',
      fig: fig({ segs: k.segs, points: [centre(), pt(k.A, 'A'), pt(k.T, 'T')], arcs: [arc(O, k.A, k.T, angleExpr(a)), arc(k.T, O, k.A, angleExpr(c))] }),
      parts: [
        deg(`${expr(a + c)} =`, 90, 'tangent', [slip(180, 'tan-no-right')], 'Add the two marked angles.'),
        { kind: 'number', label: 'x =', answer: String(x), code: 'solve', ask: `Now solve ${expr(a + c)} = 90.` },
      ],
      answers: { x },
    };
  }
}

export const CIRCLE_MAKERS: Record<CircleType, (rng: () => number) => Built> = {
  centre: r => centreCirc(r, true), circ: r => centreCirc(r, false), reflex, semi,
  'same-arc': sameArc, cyclic, 'tan-tri': tanTri, 'tan-quad': tanQuad, 'tan-len': tanLen,
  'iso-centre': isoCentre, 'semi-sum': semiSum,
  'alg-centre': algCentre, 'alg-semi': algSemi, 'alg-cyclic': algCyclic, 'alg-tanlen': algTanLen, 'alg-tanangle': algTanAngle,
};
export const CIRCLE_TYPES = Object.keys(CIRCLE_MAKERS) as CircleType[];
export const CIRCLE_LEVEL_ITEMS: Record<1 | 2 | 3, CircleType[]> = {
  1: ['centre', 'centre', 'circ', 'circ', 'reflex', 'semi'],
  2: ['same-arc', 'same-arc', 'cyclic', 'cyclic', 'tan-tri', 'tan-quad', 'tan-len'],
  3: ['iso-centre', 'iso-centre', 'semi-sum', 'semi-sum', 'alg-centre', 'alg-semi', 'alg-cyclic', 'alg-tanlen', 'alg-tanangle'],
};

export function build(makers: Record<string, (rng: () => number) => Built>, type: string, seed?: number, rng0?: () => number): TPQuestion {
  const rng = rng0 || makeRng(seed);
  for (let k = 0; k < 400; k++) {
    const b = makers[type](rng);
    if (layoutProblems(b.fig).length) continue;
    // a slip that is a later step's answer would give the wrong message to a student who is just ahead
    const answers = b.parts.map(p => p.answer);
    b.parts.forEach((p, i) => { p.slips = (p.slips || []).filter(sl => !answers.some((a, j) => j > i && a === sl.value)); });
    return { prompt: b.prompt, svg: drawCFig(b.fig), figureLabel: b.label, parts: b.parts, meta: { type, fig: b.fig, answers: b.answers } };
  }
  throw new Error(`no clear layout for ${type}`);
}
export function generateChords(level: 1 | 2 | 3, seed?: number, type?: ChordType): TPQuestion {
  const rng = makeRng(seed);
  return build(CHORD_MAKERS, type || pick(rng, CHORD_LEVEL_ITEMS[level]), undefined, rng);
}
export function generateCircles(level: 1 | 2 | 3, seed?: number, type?: CircleType): TPQuestion {
  const rng = makeRng(seed);
  return build(CIRCLE_MAKERS, type || pick(rng, CIRCLE_LEVEL_ITEMS[level]), undefined, rng);
}
