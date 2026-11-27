/* Angle chase questions for 9 SEAL (lesson 2A): angles on a line, around a point,
 * vertically opposite angles, parallel lines, triangles and isosceles triangles.
 *
 * Every diagram is drawn to scale from straight segments. Each angle is an arc between
 * two drawn rays, so the tests can measure every arc against its label. */
import { TPQuestion, NumberPart, Slip, makeRng, randInt, pick } from './typedParts';

export type P = [number, number];
export interface Seg { a: P; b: P; dash?: boolean; arrows?: number; ticks?: number }
export interface Arc { at: P; p1: P; p2: P; text: string; unknown?: boolean }
export interface Fig { segs: Seg[]; arcs: Arc[] }

const RAD = Math.PI / 180;
const dirv = (d: number): P => [Math.cos(d * RAD), Math.sin(d * RAD)];
const add = (p: P, v: P, k = 1): P => [p[0] + v[0] * k, p[1] + v[1] * k];
const unit = (a: P, b: P): P => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
const heading = (a: P, b: P) => Math.atan2(b[1] - a[1], b[0] - a[0]) / RAD;
const mod360 = (x: number) => ((x % 360) + 360) % 360;

/** Where an arc starts and how big it is, going the short way round. */
export function arcSpan(c: Arc): { from: number; size: number } {
  const h1 = heading(c.at, c.p1), h2 = heading(c.at, c.p2);
  const s = mod360(h2 - h1);
  return s <= 180 ? { from: h1, size: s } : { from: h2, size: 360 - s };
}
export const arcRadius = (size: number) => (size < 50 ? 22 : 16);

/** The box an arc's label is written in: on the angle's bisector, far enough out to clear both rays. */
export function labelBox(c: Arc): { x: number; y: number; w: number; h: number } {
  const { from, size } = arcSpan(c);
  const w = c.text.length * 10 + 2, h = 20;
  // how far the box reaches towards a direction (an axis-lined box)
  const reach = (d: P) => Math.abs(d[0]) * w / 2 + Math.abs(d[1]) * h / 2;
  const mid = dirv(from + size / 2);
  // clear its own arc, and clear both rays (the distance to a ray grows with sin of half the angle)
  const n1 = dirv(from + 90), n2 = dirv(from + size - 90);
  const d = Math.max(arcRadius(size) + reach(mid) + 4, (Math.max(reach(n1), reach(n2)) + 4) / Math.sin((size / 2) * RAD));
  const [x, y] = add(c.at, mid, d);
  return { x, y, w, h };
}

/** Labels that touch a line, an arc or another label (in drawn pixels). */
export function layoutProblems(f: Fig): string[] {
  const out: string[] = [];
  const boxes = f.arcs.map(labelBox);
  const inside = (b: { x: number; y: number; w: number; h: number }, x: number, y: number, pad: number) =>
    Math.abs(x - b.x) < b.w / 2 + pad && Math.abs(y - b.y) < b.h / 2 + pad;
  boxes.forEach((b, i) => {
    const name = f.arcs[i].text;
    for (const s of f.segs) {
      const L = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
      for (let t = 0; t <= L; t += 1) {
        if (inside(b, s.a[0] + (s.b[0] - s.a[0]) * t / L, s.a[1] + (s.b[1] - s.a[1]) * t / L, 2)) { out.push(`label ${name} touches a line`); break; }
      }
    }
    boxes.forEach((o, j) => {
      if (j > i && Math.abs(b.x - o.x) < (b.w + o.w) / 2 + 4 && Math.abs(b.y - o.y) < (b.h + o.h) / 2 + 4) out.push(`labels ${name} and ${f.arcs[j].text} overlap`);
    });
    for (const c of f.arcs) {
      const { from, size } = arcSpan(c), r = arcRadius(size);
      for (let a = 0; a <= size; a += 5) {
        const [x, y] = add(c.at, dirv(from + a), r);
        if (inside(b, x, y, 1)) { out.push(`label ${name} touches an arc`); break; }
      }
    }
  });
  return out;
}

// ---------------------------------------------------------------- drawing
function turn(f: Fig, rot: number, mirror: boolean): Fig {
  const c = Math.cos(rot * RAD), s = Math.sin(rot * RAD);
  const m = (p: P): P => { const x = mirror ? -p[0] : p[0]; return [x * c - p[1] * s, x * s + p[1] * c]; };
  return { segs: f.segs.map(g => ({ ...g, a: m(g.a), b: m(g.b) })), arcs: f.arcs.map(a => ({ ...a, at: m(a.at), p1: m(a.p1), p2: m(a.p2) })) };
}

/** Scale the figure to drawn pixels: about 300 wide or 210 high. */
function fit(f: Fig): Fig {
  const pts = f.segs.flatMap(s => [s.a, s.b]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  const k = Math.min(300 / (Math.max(...xs) - x0), 210 / (Math.max(...ys) - y0));
  const m = (p: P): P => [(p[0] - x0) * k, (p[1] - y0) * k];
  return { segs: f.segs.map(g => ({ ...g, a: m(g.a), b: m(g.b) })), arcs: f.arcs.map(a => ({ ...a, at: m(a.at), p1: m(a.p1), p2: m(a.p2) })) };
}

const f1 = (x: number) => x.toFixed(1);
export function drawFig(f: Fig): string {
  let out = '';
  for (const s of f.segs) {
    out += s.dash
      ? `<line x1="${f1(s.a[0])}" y1="${f1(s.a[1])}" x2="${f1(s.b[0])}" y2="${f1(s.b[1])}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6 5"/>`
      : `<line x1="${f1(s.a[0])}" y1="${f1(s.a[1])}" x2="${f1(s.b[0])}" y2="${f1(s.b[1])}" stroke="#334155" stroke-width="2.5" stroke-linecap="round"/>`;
    const u = unit(s.a, s.b), n: P = [-u[1], u[0]];
    const mid: P = [(s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2];
    for (let k = 0; k < (s.arrows || 0); k++) {          // parallel arrows, all pointing the same way
      const tip = add(mid, u, 10 + k * 9 - (s.arrows! - 1) * 4.5);
      const l = add(add(tip, u, -8), n, 6), r = add(add(tip, u, -8), n, -6);
      out += `<polyline points="${f1(l[0])},${f1(l[1])} ${f1(tip[0])},${f1(tip[1])} ${f1(r[0])},${f1(r[1])}" fill="none" stroke="#334155" stroke-width="2.2" stroke-linejoin="round"/>`;
    }
    for (let k = 0; k < (s.ticks || 0); k++) {           // equal-side marks
      const c = add(mid, u, (k - ((s.ticks! - 1) / 2)) * 6);
      const e1 = add(c, n, 7), e2 = add(c, n, -7);
      out += `<line x1="${f1(e1[0])}" y1="${f1(e1[1])}" x2="${f1(e2[0])}" y2="${f1(e2[1])}" stroke="#334155" stroke-width="2.2"/>`;
    }
  }
  const xs: number[] = f.segs.flatMap(s => [s.a[0], s.b[0]]), ys: number[] = f.segs.flatMap(s => [s.a[1], s.b[1]]);
  for (const c of f.arcs) {
    const { from, size } = arcSpan(c), r = arcRadius(size);
    const s = add(c.at, dirv(from), r), e = add(c.at, dirv(from + size), r);
    out += `<path d="M${f1(s[0])},${f1(s[1])} A${r},${r} 0 0 1 ${f1(e[0])},${f1(e[1])}" fill="none" stroke="${c.unknown ? '#6366f1' : '#64748b'}" stroke-width="1.8"/>`;
    const b = labelBox(c);
    xs.push(b.x - b.w / 2, b.x + b.w / 2); ys.push(b.y - b.h / 2, b.y + b.h / 2);
    out += c.unknown
      ? `<text x="${f1(b.x)}" y="${f1(b.y)}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-style="italic" font-size="19" fill="#4f46e5">${c.text}</text>`
      : `<text x="${f1(b.x)}" y="${f1(b.y)}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="16" fill="#1e293b">${c.text}</text>`;
  }
  const x0 = Math.min(...xs) - 10, y0 = Math.min(...ys) - 10, x1 = Math.max(...xs) + 10, y1 = Math.max(...ys) + 10;
  return `<svg viewBox="${f1(x0)} ${f1(y0)} ${f1(x1 - x0)} ${f1(y1 - y0)}" style="max-height:300px" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}

// ---------------------------------------------------------------- answers and slips
const keep = (answer: number, slips: (Slip | false)[]) =>
  slips.filter((s): s is Slip => !!s && s.value !== String(answer) && Number(s.value) > 0 && Number(s.value) < 360)
    .filter((s, i, all) => all.findIndex(t => t.value === s.value) === i);
const deg = (label: string, answer: number, code: string, slips: (Slip | false)[] = [], ask?: string): NumberPart =>
  ({ kind: 'number', label, answer: String(answer), suffix: '°', code, slips: keep(answer, slips), ask });
const slip = (value: number, code: string): Slip => ({ value: String(value), code, message: MESSAGES[code] });

export const MESSAGES: Record<string, string> = {
  'line-360': 'Angles on a straight line add to 180°, not 360°.',
  'point-180': 'Angles around a point add to 360°.',
  'vo-supp': 'Vertically opposite angles are equal.',
  'adj-equal': 'These two angles make a straight line, so they add to 180°.',
  'corr-supp': 'Corresponding angles on parallel lines are equal.',
  'alt-supp': 'Alternate angles on parallel lines are equal.',
  'cointerior-equal': 'Co-interior angles add to 180°. They are not equal.',
  'tri-360': 'The angles of a triangle add to 180°.',
  'ext-supp': 'The exterior angle equals the sum of the two opposite interior angles.',
  'ext-interior': 'That is the angle inside the triangle. The exterior angle is the sum of the two opposite angles.',
  'ext-adjacent': 'That is the angle next to the exterior angle. The two opposite angles add to the exterior angle.',
  'ext-added': 'The two opposite angles add to the exterior angle, so take the one you know away from it.',
  'iso-wrong-pair': 'The equal angles are the two base angles, where the equal sides meet the third side.',
  'iso-not-halved': 'The two equal base angles share 180° − the top angle: halve it.',
  'iso-one-base': 'There are two equal base angles: take both away from 180°.',
};

const PARALLEL_ASK = 'The arrows mark parallel lines.';
const ISO_ASK = 'The marks show two equal sides.';
const LETTERS = ['x', 'y', 'a', 'b', 'p', 'q'];

export type AngleType = 'line' | 'point' | 'vert' | 'parallel' | 'tri-sum' | 'tri-ext' | 'iso'
  | 'par-line' | 'tri-line' | 'iso-line' | 'vert-tri';
interface Built {
  type: AngleType; prompt: string; label: string; fig: Fig; parts: NumberPart[];
  answers: Record<string, number>;   // the size of each lettered angle
  flip?: boolean;                    // may be drawn upside down
}
const arc = (at: P, p1: P, p2: P, text: string, unknown = false): Arc => ({ at, p1, p2, text, unknown });
const given = (n: number) => `${n}°`;
const multiple5 = (rng: () => number, lo: number, hi: number) => 5 * randInt(rng, lo / 5, hi / 5);

// ---------------------------------------------------------------- one step
function line(rng: () => number): Built {
  const ang = rng() < 0.4
    ? (() => { for (;;) { const a = multiple5(rng, 35, 110), b = multiple5(rng, 35, 110); if (180 - a - b >= 35) return [a, b, 180 - a - b]; } })()
    : (() => { const a = multiple5(rng, 35, 145); return [a, 180 - a]; })();
  const O: P = [0, 0];
  const heads = [0];
  ang.forEach(g => heads.push(heads[heads.length - 1] - g));   // the rays go up from the line
  const segs: Seg[] = [{ a: [-1.6, 0], b: [1.6, 0] }];
  for (let i = 1; i < ang.length; i++) segs.push({ a: O, b: add(O, dirv(heads[i]), 1.3) });
  const u = randInt(rng, 0, ang.length - 1), v = pick(rng, LETTERS);
  const arcs = ang.map((g, i) => arc(O, add(O, dirv(heads[i])), add(O, dirv(heads[i + 1])), i === u ? `${v}°` : given(g), i === u));
  const rest = 180 - ang[u];
  return {
    type: 'line', prompt: `Find the value of ${v}.`, label: 'angles on a straight line', fig: { segs, arcs },
    parts: [deg(`${v} =`, ang[u], 'line', [slip(360 - rest, 'line-360')])], answers: { [v]: ang[u] },
  };
}

function point(rng: () => number): Built {
  const k = rng() < 0.5 ? 3 : 4;
  let ang: number[] = [];
  for (;;) {
    ang = Array.from({ length: k - 1 }, () => multiple5(rng, 55, 170));
    const last = 360 - ang.reduce((a, b) => a + b, 0);
    if (last >= 55 && last <= 170) { ang.push(last); break; }
  }
  const O: P = [0, 0], h0 = randInt(rng, 0, 359);
  const heads = [h0];
  ang.forEach(g => heads.push(heads[heads.length - 1] + g));
  const segs: Seg[] = heads.slice(0, k).map(h => ({ a: O, b: add(O, dirv(h), 1.2) }));
  const u = randInt(rng, 0, k - 1), v = pick(rng, LETTERS);
  const arcs = ang.map((g, i) => arc(O, add(O, dirv(heads[i])), add(O, dirv(heads[i + 1])), i === u ? `${v}°` : given(g), i === u));
  const rest = 360 - ang[u];
  return {
    type: 'point', prompt: `Find the value of ${v}.`, label: 'angles around a point', fig: { segs, arcs },
    parts: [deg(`${v} =`, ang[u], 'point', [slip(180 - rest, 'point-180')])], answers: { [v]: ang[u] },
  };
}

/** Two lines crossing at O: the four angles, in order round O. */
function crossing(a: number) {
  const O: P = [0, 0], H = [-a, 0, 180 - a, 180];
  const segs: Seg[] = [{ a: [-1.5, 0], b: [1.5, 0] }, { a: add(O, dirv(-a), -1.5), b: add(O, dirv(-a), 1.5) }];
  const size = (i: number) => (i % 2 === 0 ? a : 180 - a);
  const at = (i: number, text: string, unknown = false) => arc(O, add(O, dirv(H[i])), add(O, dirv(H[(i + 1) % 4])), text, unknown);
  return { segs, size, at };
}
const crossAngle = (rng: () => number) => { for (;;) { const a = multiple5(rng, 40, 140); if (Math.abs(a - 90) >= 15) return a; } };

function vert(rng: () => number): Built {
  const X = crossing(crossAngle(rng));
  const g = randInt(rng, 0, 3), opposite = rng() < 0.7;
  const u = opposite ? (g + 2) % 4 : (g + pick(rng, [1, 3])) % 4, v = pick(rng, LETTERS);
  const ans = X.size(u);
  return {
    type: 'vert', prompt: `Find the value of ${v}.`, label: 'two crossing lines', fig: { segs: X.segs, arcs: [X.at(g, given(X.size(g))), X.at(u, `${v}°`, true)] },
    parts: [deg(`${v} =`, ans, 'vert', [opposite ? slip(180 - ans, 'vo-supp') : slip(X.size(g), 'adj-equal')])], answers: { [v]: ans },
  };
}

/** Two parallel lines cut by a transversal. Angles at each crossing, in order round it:
 * 0 above-right, 1 below-right, 2 below-left, 3 above-left. */
function parallels(t: number) {
  const H = 1.1, u = dirv(-t), s = Math.sin(t * RAD);
  const P0: P = [0.55 * Math.cos(t * RAD) / s, 0], Q0 = add(P0, u, -H / s);
  const segs: Seg[] = [
    { a: [-1.8, 0], b: [1.8, 0], arrows: 1 }, { a: [-1.8, H], b: [1.8, H], arrows: 1 },
    { a: add(P0, u, 0.85), b: add(Q0, u, -0.85) },
  ];
  const Hs = [-t, 0, 180 - t, 180];
  const size = (i: number) => (i % 2 === 0 ? t : 180 - t);
  const at = (top: boolean, i: number, text: string, unknown = false) => {
    const X = top ? P0 : Q0;
    return arc(X, add(X, dirv(Hs[i])), add(X, dirv(Hs[(i + 1) % 4])), text, unknown);
  };
  return { segs, size, at };
}
type Relation = 'corr' | 'alt' | 'coint';
const PAIRS: Record<Relation, [number, number][]> = {   // [angle at the top crossing, angle at the bottom crossing]
  corr: [[0, 0], [1, 1], [2, 2], [3, 3]],
  alt: [[1, 3], [2, 0]],
  coint: [[1, 0], [2, 3]],
};
const relSlip = (rel: Relation, g: number, ans: number) =>
  rel === 'coint' ? slip(g, 'cointerior-equal') : slip(180 - ans, rel === 'corr' ? 'corr-supp' : 'alt-supp');

function parallel(rng: () => number): Built {
  const X = parallels(crossAngle(rng));
  const rel = pick(rng, ['corr', 'corr', 'alt', 'alt', 'coint', 'coint'] as Relation[]);
  const [i, j] = pick(rng, PAIRS[rel]), givenTop = rng() < 0.5, v = pick(rng, LETTERS);
  const gi = givenTop ? i : j, ui = givenTop ? j : i;
  const g = X.size(gi), ans = rel === 'coint' ? 180 - g : g;
  return {
    type: 'parallel', prompt: `Find the value of ${v}.`, label: 'two parallel lines cut by a transversal',
    fig: { segs: X.segs, arcs: [X.at(givenTop, gi, given(g)), X.at(!givenTop, ui, `${v}°`, true)] },
    parts: [deg(`${v} =`, ans, 'parallel', [relSlip(rel, g, ans)], PARALLEL_ASK)], answers: { [v]: ans },
  };
}

// ---------------------------------------------------------------- triangles
/** Triangle with angle B at B and angle C at C, base BC along the bottom. */
function triangle(B: number, C: number, base = 1.6) {
  const Bp: P = [0, 0], Cp: P = [base, 0];
  const A = 180 - B - C;
  const Ap = add(Bp, dirv(-B), base * Math.sin(C * RAD) / Math.sin(A * RAD));
  return { A: Ap, B: Bp, C: Cp };
}
function triAngles(rng: () => number): [number, number, number] {
  for (;;) { const a = multiple5(rng, 35, 110), b = multiple5(rng, 35, 110), c = 180 - a - b; if (c >= 35 && c <= 110) return [a, b, c]; }
}

function triSum(rng: () => number): Built {
  const [A, B, C] = triAngles(rng);
  const T = triangle(B, C);
  const u = randInt(rng, 0, 2), v = pick(rng, LETTERS), size = [A, B, C];
  const corners: [P, P, P][] = [[T.A, T.B, T.C], [T.B, T.A, T.C], [T.C, T.A, T.B]];
  const arcs = corners.map(([o, p, q], i) => arc(o, p, q, i === u ? `${v}°` : given(size[i]), i === u));
  return {
    type: 'tri-sum', prompt: `Find the value of ${v}.`, label: 'a triangle',
    fig: { segs: [{ a: T.A, b: T.B }, { a: T.B, b: T.C }, { a: T.C, b: T.A }], arcs },
    parts: [deg(`${v} =`, size[u], 'tri', [slip(360 - (180 - size[u]), 'tri-360')])], answers: { [v]: size[u] }, flip: true,
  };
}

/** Triangle with side BC carried on past C to D, so the exterior angle at C is drawn. */
function extTriangle(B: number, C: number) {
  const T = triangle(B, C);
  const D: P = [T.C[0] + 0.85, 0];
  return { ...T, D, segs: [{ a: T.A, b: T.B }, { a: T.C, b: T.A }, { a: T.B, b: D }] as Seg[] };
}

function triExt(rng: () => number): Built {
  const [A, B, C] = triAngles(rng);
  const T = extTriangle(B, C), e = 180 - C, v = pick(rng, LETTERS);
  const atA = (t: string, u = false) => arc(T.A, T.B, T.C, t, u), atB = (t: string, u = false) => arc(T.B, T.A, T.C, t, u);
  const ext = (t: string, u = false) => arc(T.C, T.D, T.A, t, u);
  if (rng() < 0.6) {   // the exterior angle from the two opposite angles
    return {
      type: 'tri-ext', prompt: `Find the value of ${v}.`, label: 'a triangle with one side extended',
      fig: { segs: T.segs, arcs: [atA(given(A)), atB(given(B)), ext(`${v}°`, true)] },
      parts: [deg(`${v} =`, e, 'ext', [slip(180 - A, 'ext-supp'), slip(180 - B, 'ext-supp'), slip(C, 'ext-interior')])], answers: { [v]: e },
    };
  }
  const findA = rng() < 0.5, ans = findA ? A : B;   // an opposite angle from the exterior angle
  return {
    type: 'tri-ext', prompt: `Find the value of ${v}.`, label: 'a triangle with one side extended',
    fig: { segs: T.segs, arcs: [ext(given(e)), findA ? atA(`${v}°`, true) : atA(given(A)), findA ? atB(given(B)) : atB(`${v}°`, true)] },
    parts: [deg(`${v} =`, ans, 'ext', [slip(180 - e, 'ext-adjacent'), slip(e + (findA ? B : A), 'ext-added')])], answers: { [v]: ans },
  };
}

function isoApex(rng: () => number) { for (;;) { const p = 10 * randInt(rng, 4, 11); if (p !== 60) return p; } }
function isoTriangle(b: number, extend: boolean) {
  const T = triangle(b, b, 1.5);
  const D: P = [T.C[0] + 0.85, 0];
  const segs: Seg[] = [{ a: T.B, b: T.A, ticks: 1 }, { a: T.C, b: T.A, ticks: 1 }, { a: T.B, b: extend ? D : T.C }];
  return { ...T, D, segs };
}

function iso(rng: () => number): Built {
  const p = isoApex(rng), b = (180 - p) / 2, T = isoTriangle(b, false), v = pick(rng, LETTERS);
  const atA = (t: string, u = false) => arc(T.A, T.B, T.C, t, u);
  const atB = (t: string, u = false) => arc(T.B, T.A, T.C, t, u), atC = (t: string, u = false) => arc(T.C, T.A, T.B, t, u);
  const base = rng() < 0.5 ? atB : atC, other = base === atB ? atC : atB;
  const kind = randInt(rng, 0, 2);
  const out = (arcs: Arc[], ans: number, slips: Slip[]): Built => ({
    type: 'iso', prompt: `Find the value of ${v}.`, label: 'an isosceles triangle', fig: { segs: T.segs, arcs },
    parts: [deg(`${v} =`, ans, 'iso', slips, ISO_ASK)], answers: { [v]: ans }, flip: true,
  });
  if (kind === 0) return out([atA(given(p)), base(`${v}°`, true)], b, [slip(p, 'iso-wrong-pair'), slip(180 - p, 'iso-not-halved')]);
  if (kind === 1) return out([base(given(b)), other(`${v}°`, true)], b, [slip(p, 'iso-wrong-pair')]);
  return out([base(given(b)), atA(`${v}°`, true)], p, [slip(b, 'iso-wrong-pair'), slip(180 - b, 'iso-one-base')]);
}

// ---------------------------------------------------------------- two steps: y first, then x
const TWO = 'Find y, then x.';

function parLine(rng: () => number): Built {
  const X = parallels(crossAngle(rng));
  const rel = pick(rng, ['corr', 'alt', 'coint'] as Relation[]);
  const [i, j] = pick(rng, PAIRS[rel]), givenTop = rng() < 0.5;
  const gi = givenTop ? i : j, yi = givenTop ? j : i;
  const g = X.size(gi), y = rel === 'coint' ? 180 - g : g;
  const opposite = rng() < 0.4, xi = opposite ? (yi + 2) % 4 : (yi + pick(rng, [1, 3])) % 4, x = opposite ? y : 180 - y;
  return {
    type: 'par-line', prompt: TWO, label: 'two parallel lines cut by a transversal',
    fig: { segs: X.segs, arcs: [X.at(givenTop, gi, given(g)), X.at(!givenTop, yi, 'y°', true), X.at(!givenTop, xi, 'x°', true)] },
    parts: [
      deg('y =', y, 'parallel', [relSlip(rel, g, y)], PARALLEL_ASK),
      deg('x =', x, 'step', [opposite ? slip(180 - y, 'vo-supp') : slip(y, 'adj-equal')], 'Now use y to find x.'),
    ],
    answers: { y, x },
  };
}

function triLine(rng: () => number): Built {
  let A = 0, B = 0, C = 0;
  do [A, B, C] = triAngles(rng); while (C === 90);   // x = 180° − 90° would hide the slip
  const T = extTriangle(B, C);
  return {
    type: 'tri-line', prompt: TWO, label: 'a triangle with one side extended',
    fig: { segs: T.segs, arcs: [arc(T.A, T.B, T.C, given(A)), arc(T.B, T.A, T.C, given(B)), arc(T.C, T.A, T.B, 'y°', true), arc(T.C, T.D, T.A, 'x°', true)] },
    parts: [
      deg('y =', C, 'tri', [slip(360 - A - B, 'tri-360')]),
      deg('x =', 180 - C, 'step', [slip(C, 'adj-equal')], 'Now use y to find x.'),
    ],
    answers: { y: C, x: 180 - C },
  };
}

function isoLine(rng: () => number): Built {
  const p = isoApex(rng), b = (180 - p) / 2, T = isoTriangle(b, true);
  const atA = (t: string, u = false) => arc(T.A, T.B, T.C, t, u);
  const inC = (t: string, u = false) => arc(T.C, T.A, T.B, t, u), extC = (t: string, u = false) => arc(T.C, T.D, T.A, t, u);
  const base = { type: 'iso-line' as AngleType, prompt: TWO, label: 'an isosceles triangle with one side extended' };
  if (rng() < 0.5) {   // top angle → base angle → exterior angle
    return {
      ...base, fig: { segs: T.segs, arcs: [atA(given(p)), inC('y°', true), extC('x°', true)] },
      parts: [
        deg('y =', b, 'iso', [slip(p, 'iso-wrong-pair'), slip(180 - p, 'iso-not-halved')], ISO_ASK),
        deg('x =', 180 - b, 'step', [slip(b, 'adj-equal')], 'Now use y to find x.'),
      ],
      answers: { y: b, x: 180 - b },
    };
  }
  const e = 180 - b;   // exterior angle → base angle → top angle
  return {
    ...base, fig: { segs: T.segs, arcs: [extC(given(e)), inC('y°', true), atA('x°', true)] },
    parts: [
      deg('y =', b, 'step', [slip(e, 'adj-equal')], ISO_ASK),
      deg('x =', p, 'iso', [slip(b, 'iso-wrong-pair'), slip(180 - b, 'iso-one-base')], 'Now use y to find x.'),
    ],
    answers: { y: b, x: p },
  };
}

function vertTri(rng: () => number): Built {
  let A = 0, B = 0, C = 0;
  for (;;) { [A, B, C] = triAngles(rng); if (A <= 100 && A !== 90) break; }   // 180° − 90° would not show the slip
  const T = triangle(B, C);
  const E = add(T.A, unit(T.B, T.A), 0.7), F = add(T.A, unit(T.C, T.A), 0.7);
  return {
    type: 'vert-tri', prompt: TWO, label: 'a triangle with two sides extended past the top corner',
    fig: {
      segs: [{ a: T.B, b: E }, { a: T.C, b: F }, { a: T.B, b: T.C }],
      arcs: [arc(T.A, E, F, given(A)), arc(T.B, T.A, T.C, given(B)), arc(T.A, T.B, T.C, 'y°', true), arc(T.C, T.A, T.B, 'x°', true)],
    },
    parts: [
      deg('y =', A, 'vert', [slip(180 - A, 'vo-supp')]),
      deg('x =', C, 'step', [slip(360 - A - B, 'tri-360')], 'Now use y to find x.'),
    ],
    answers: { y: A, x: C },
  };
}

// ---------------------------------------------------------------- levels
const MAKERS: Record<AngleType, (rng: () => number) => Built> = {
  line, point, vert, parallel, 'tri-sum': triSum, 'tri-ext': triExt, iso,
  'par-line': parLine, 'tri-line': triLine, 'iso-line': isoLine, 'vert-tri': vertTri,
};
export const ANGLE_LEVEL_ITEMS: Record<1 | 2 | 3, AngleType[]> = {
  1: ['line', 'point', 'vert', 'parallel', 'parallel', 'parallel'],
  2: ['tri-sum', 'tri-ext', 'tri-ext', 'iso', 'iso'],
  3: ['par-line', 'par-line', 'tri-line', 'iso-line', 'vert-tri'],
};
export const ANGLE_TYPES = Object.keys(MAKERS) as AngleType[];

export function generateAngles(level: 1 | 2 | 3, seed?: number, type?: AngleType): TPQuestion {
  const rng = makeRng(seed);
  const t = type || pick(rng, ANGLE_LEVEL_ITEMS[level]);
  for (let k = 0; k < 400; k++) {
    const b = MAKERS[t](rng);
    const rot = randInt(rng, -25, 25) + (b.flip && rng() < 0.25 ? 180 : 0);
    const fig = fit(turn(b.fig, rot, rng() < 0.5));
    if (layoutProblems(fig).length) continue;
    return { prompt: b.prompt, svg: drawFig(fig), figureLabel: b.label, parts: b.parts, meta: { type: t, fig, answers: b.answers } };
  }
  throw new Error(`no clear layout for ${t}`);
}
