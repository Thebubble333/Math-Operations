/* Similar triangles for 9 SEAL (lessons 2D and 2E): which similarity test applies, and
 * finding unknown lengths with the scale factor.
 *
 * Every triangle is drawn to scale from its labels: each side's drawn length is in
 * proportion to its label, and each marked angle measures what it says. In a pair of
 * separate triangles, the second one's overall size is not to scale (a scale factor of 3
 * would make the first one tiny), but its shape is. The tests measure all of this. */
import { TPQuestion, NumberPart, ChoicePart, Slip, opt, makeRng, randInt, pick } from './typedParts';
import { P, Seg, Arc, arcSpan, arcRadius } from './angleBank';

const RAD = Math.PI / 180;
const dirv = (d: number): P => [Math.cos(d * RAD), Math.sin(d * RAD)];
const add = (p: P, v: P, k = 1): P => [p[0] + v[0] * k, p[1] + v[1] * k];
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const len = (v: P) => Math.hypot(v[0], v[1]);
const dist = (a: P, b: P) => len(sub(a, b));
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const heading = (a: P, b: P) => Math.atan2(b[1] - a[1], b[0] - a[0]) / RAD;
const mod360 = (x: number) => ((x % 360) + 360) % 360;
/** The angle at o between the rays to p and r, in degrees. */
export const angleAt = (o: P, p: P, r: P) => {
  const a = sub(p, o), b = sub(r, o);
  return Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / (len(a) * len(b))))) / RAD;
};

// ---------------------------------------------------------------- figures
/** A side label: written beside segment a–b, on the side away from the point `away`. */
export interface Side { a: P; b: P; text: string; unknown?: boolean; away: P; clear?: number }   // clear: extra room (beside an arrow)
export interface Corner { at: P; name: string }
export interface Right { at: P; p1: P; p2: P }
export interface SFig { segs: Seg[]; sides: Side[]; arcs: Arc[]; rights: Right[]; corners: Corner[] }
export interface Box { x: number; y: number; w: number; h: number; text: string; kind: 'side' | 'angle' | 'corner' }

const emptyFig = (): SFig => ({ segs: [], sides: [], arcs: [], rights: [], corners: [] });
function mapFig(f: SFig, m: (p: P) => P): SFig {
  return {
    segs: f.segs.map(s => ({ ...s, a: m(s.a), b: m(s.b) })),
    sides: f.sides.map(s => ({ ...s, a: m(s.a), b: m(s.b), away: m(s.away) })),
    arcs: f.arcs.map(c => ({ ...c, at: m(c.at), p1: m(c.p1), p2: m(c.p2) })),
    rights: f.rights.map(r => ({ at: m(r.at), p1: m(r.p1), p2: m(r.p2) })),
    corners: f.corners.map(c => ({ ...c, at: m(c.at) })),
  };
}
const merge = (a: SFig, b: SFig): SFig => ({
  segs: [...a.segs, ...b.segs], sides: [...a.sides, ...b.sides], arcs: [...a.arcs, ...b.arcs],
  rights: [...a.rights, ...b.rights], corners: [...a.corners, ...b.corners],
});
const turnMap = (rot: number, mirror: boolean) => {
  const c = Math.cos(rot * RAD), s = Math.sin(rot * RAD);
  return (p: P): P => { const x = mirror ? -p[0] : p[0]; return [x * c - p[1] * s, x * s + p[1] * c]; };
};
const figPoints = (f: SFig) => f.segs.flatMap(s => [s.a, s.b]);
function bbox(pts: P[]) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}
/** Scale a figure so its larger side of the bounding box is `size` pixels, with its top-left at (x, y). */
function place(f: SFig, size: number, x: number, yMid: number): SFig {
  const b = bbox(figPoints(f));
  const k = size / Math.max(b.x1 - b.x0, b.y1 - b.y0);
  const h = (b.y1 - b.y0) * k;
  return mapFig(f, p => [x + (p[0] - b.x0) * k, yMid - h / 2 + (p[1] - b.y0) * k]);
}

// label boxes (in pixels)
const SIDE_FONT = 16, UNKNOWN_FONT = 19, ANGLE_FONT = 15, CORNER_FONT = 18;
const textW = (t: string, font: number) => t.replace('°', '').length * font * 0.58 + (t.includes('°') ? font * 0.4 : 0) + 4;
const reach = (d: P, w: number, h: number) => Math.abs(d[0]) * w / 2 + Math.abs(d[1]) * h / 2;

export function sideBox(s: Side): Box {
  const font = s.unknown ? UNKNOWN_FONT : SIDE_FONT;
  const w = textW(s.text, font), h = font + 3;
  const m = lerp(s.a, s.b, 0.5), u = sub(s.b, s.a), L = len(u);
  let n: P = [-u[1] / L, u[0] / L];
  const toAway = sub(s.away, m);
  if (n[0] * toAway[0] + n[1] * toAway[1] > 0) n = [-n[0], -n[1]];
  const [x, y] = add(m, n, reach(n, w, h) + 5 + (s.clear || 0));
  return { x, y, w, h, text: s.text, kind: 'side' };
}
export function angleBox(c: Arc): Box {
  const { from, size } = arcSpan(c);
  const w = textW(c.text, ANGLE_FONT), h = ANGLE_FONT + 3;
  const mid = dirv(from + size / 2);
  const n1 = dirv(from + 90), n2 = dirv(from + size - 90);
  const d = Math.max(arcRadius(size) + reach(mid, w, h) + 3, (Math.max(reach(n1, w, h), reach(n2, w, h)) + 3) / Math.sin((size / 2) * RAD));
  const [x, y] = add(c.at, mid, d);
  return { x, y, w, h, text: c.text, kind: 'angle' };
}
/** A vertex letter goes in the widest gap between the lines that meet at the vertex. */
export function cornerBox(c: Corner, segs: Seg[]): Box {
  const rays: number[] = [];
  for (const s of segs) {
    for (const [p, q] of [[s.a, s.b], [s.b, s.a]] as [P, P][]) {
      if (dist(p, c.at) < 0.5) rays.push(heading(c.at, q));
    }
    // the vertex part way along a segment: both directions
    const L = dist(s.a, s.b), t = ((c.at[0] - s.a[0]) * (s.b[0] - s.a[0]) + (c.at[1] - s.a[1]) * (s.b[1] - s.a[1])) / (L * L);
    if (t > 0.01 && t < 0.99 && dist(lerp(s.a, s.b, t), c.at) < 0.5) rays.push(heading(c.at, s.a), heading(c.at, s.b));
  }
  const hs = rays.map(mod360).sort((a, b) => a - b);
  let best = 0, gap = 360;
  if (hs.length) {
    gap = -1;
    hs.forEach((h, i) => { const nx = i + 1 < hs.length ? hs[i + 1] : hs[0] + 360; if (nx - h > gap) { gap = nx - h; best = h + (nx - h) / 2; } });
  }
  const w = textW(c.name, CORNER_FONT), h = CORNER_FONT + 2;
  const dir = dirv(best), r = Math.max(w, h) / 2 + 3;
  const d = Math.min(40, Math.max(r + 3, r / Math.sin(Math.min(gap, 180) / 2 * RAD)));
  const [x, y] = add(c.at, dir, d);
  return { x, y, w, h, text: c.name, kind: 'corner' };
}
export const allBoxes = (f: SFig): Box[] => [...f.sides.map(sideBox), ...f.arcs.map(angleBox), ...f.corners.map(c => cornerBox(c, f.segs))];

/** Labels that touch a line, an arc, a right-angle mark or another label (in drawn pixels). */
export function layoutProblems(f: SFig): string[] {
  const out: string[] = [];
  const boxes = allBoxes(f);
  for (const s of f.segs) if (s.arrows && dist(s.a, s.b) < 48) out.push('an arrowed line is too short for its arrow');
  const inside = (b: Box, p: P, pad: number) => Math.abs(p[0] - b.x) < b.w / 2 + pad && Math.abs(p[1] - b.y) < b.h / 2 + pad;
  boxes.forEach((b, i) => {
    for (const s of f.segs) {
      const L = dist(s.a, s.b);
      for (let t = 0; t <= L; t += 1) if (inside(b, lerp(s.a, s.b, t / L), 2)) { out.push(`label ${b.text} touches a line`); break; }
    }
    boxes.forEach((o, j) => {
      if (j > i && Math.abs(b.x - o.x) < (b.w + o.w) / 2 + 3 && Math.abs(b.y - o.y) < (b.h + o.h) / 2 + 3) out.push(`labels ${b.text} and ${o.text} overlap`);
    });
    for (const c of f.arcs) {
      const { from, size } = arcSpan(c), r = arcRadius(size);
      for (let a = 0; a <= size; a += 5) if (inside(b, add(c.at, dirv(from + a), r), 1)) { out.push(`label ${b.text} touches an arc`); break; }
    }
    for (const r of f.rights) for (const p of rightSquare(r)) if (inside(b, p, 2)) { out.push(`label ${b.text} touches a right-angle mark`); break; }
    for (const s of f.segs) for (const h of arrowHeads(s)) for (const p of [h[0], lerp(h[0], h[1], 0.5), h[1], lerp(h[1], h[2], 0.5), h[2]]) if (inside(b, p, 2)) { out.push(`label ${b.text} touches an arrow`); break; }
  });
  return out;
}
/** The three points of each parallel arrowhead on a segment. */
function arrowHeads(s: Seg): P[][] {
  const u0 = sub(s.b, s.a), L = len(u0), u: P = [u0[0] / L, u0[1] / L], n: P = [-u[1], u[0]];
  const mid = lerp(s.a, s.b, 0.5), out: P[][] = [];
  for (let k = 0; k < (s.arrows || 0); k++) {
    const tip = add(mid, u, 10 + k * 9 - (s.arrows! - 1) * 4.5);
    out.push([add(add(tip, u, -8), n, 6), tip, add(add(tip, u, -8), n, -6)]);
  }
  return out;
}
const RIGHT = 12;
function rightSquare(r: Right): P[] {
  const u = sub(r.p1, r.at), v = sub(r.p2, r.at);
  const a = add(r.at, u, RIGHT / len(u)), c = add(r.at, v, RIGHT / len(v));
  return [a, add(a, v, RIGHT / len(v)), c];
}

const f1 = (x: number) => x.toFixed(1);
export function drawSFig(f: SFig): string {
  let out = '';
  const xs: number[] = [], ys: number[] = [];
  for (const s of f.segs) {
    out += `<line x1="${f1(s.a[0])}" y1="${f1(s.a[1])}" x2="${f1(s.b[0])}" y2="${f1(s.b[1])}" stroke="#334155" stroke-width="2.5" stroke-linecap="round"/>`;
    xs.push(s.a[0], s.b[0]); ys.push(s.a[1], s.b[1]);
    for (const [l, tip, r] of arrowHeads(s)) {
      out += `<polyline points="${f1(l[0])},${f1(l[1])} ${f1(tip[0])},${f1(tip[1])} ${f1(r[0])},${f1(r[1])}" fill="none" stroke="#334155" stroke-width="2.2" stroke-linejoin="round"/>`;
    }
  }
  for (const r of f.rights) {
    const [a, b, c] = rightSquare(r);
    out += `<polyline points="${f1(a[0])},${f1(a[1])} ${f1(b[0])},${f1(b[1])} ${f1(c[0])},${f1(c[1])}" fill="none" stroke="#64748b" stroke-width="1.8"/>`;
  }
  for (const c of f.arcs) {
    const { from, size } = arcSpan(c), r = arcRadius(size);
    const s = add(c.at, dirv(from), r), e = add(c.at, dirv(from + size), r);
    out += `<path d="M${f1(s[0])},${f1(s[1])} A${r},${r} 0 0 1 ${f1(e[0])},${f1(e[1])}" fill="none" stroke="#64748b" stroke-width="1.8"/>`;
  }
  f.sides.forEach(s => {
    const b = sideBox(s);
    xs.push(b.x - b.w / 2, b.x + b.w / 2); ys.push(b.y - b.h / 2, b.y + b.h / 2);
    out += s.unknown
      ? `<text x="${f1(b.x)}" y="${f1(b.y)}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-style="italic" font-size="${UNKNOWN_FONT}" fill="#4f46e5">${s.text}</text>`
      : `<text x="${f1(b.x)}" y="${f1(b.y)}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="${SIDE_FONT}" fill="#1e293b">${s.text}</text>`;
  });
  f.arcs.forEach(c => {
    const b = angleBox(c);
    xs.push(b.x - b.w / 2, b.x + b.w / 2); ys.push(b.y - b.h / 2, b.y + b.h / 2);
    out += `<text x="${f1(b.x)}" y="${f1(b.y)}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="${ANGLE_FONT}" fill="#1e293b">${c.text}</text>`;
  });
  f.corners.forEach(c => {
    const b = cornerBox(c, f.segs);
    xs.push(b.x - b.w / 2, b.x + b.w / 2); ys.push(b.y - b.h / 2, b.y + b.h / 2);
    out += `<text x="${f1(b.x)}" y="${f1(b.y)}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-style="italic" font-size="${CORNER_FONT}" fill="#475569">${c.name}</text>`;
  });
  const x0 = Math.min(...xs) - 8, y0 = Math.min(...ys) - 8, x1 = Math.max(...xs) + 8, y1 = Math.max(...ys) + 8;
  return `<svg viewBox="${f1(x0)} ${f1(y0)} ${f1(x1 - x0)} ${f1(y1 - y0)}" style="max-height:300px" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}

// ---------------------------------------------------------------- triangles
/** A triangle: vertices, a label (or null) for each side (side i runs from V[i] to V[i+1]),
 * a label for each angle, and which corner (if any) has a right-angle mark. */
export interface Tri { V: P[]; side: (string | null)[]; angle: (string | null)[]; right: number | null; names?: string[]; unknown?: boolean[] }
const angleOf = (V: P[], i: number) => angleAt(V[i], V[(i + 2) % 3], V[(i + 1) % 3]);
export const triAngles = (V: P[]) => [0, 1, 2].map(i => angleOf(V, i));
/** How far apart the two shapes are: the biggest difference between their sorted angles. */
export const shapeGap = (V1: P[], V2: P[]) => { const a = triAngles(V1).sort((x, y) => x - y), b = triAngles(V2).sort((x, y) => x - y); return Math.max(...a.map((v, i) => Math.abs(v - b[i]))); };
const okShape = (V: P[], lo = 28, hi = 118) => triAngles(V).every(a => a >= lo && a <= hi);

/** From three side lengths: side0 = V0V1, side1 = V1V2, side2 = V2V0. Null if impossible. */
function fromSides(s0: number, s1: number, s2: number): P[] | null {
  const x = (s0 * s0 + s2 * s2 - s1 * s1) / (2 * s0), y2 = s2 * s2 - x * x;
  if (y2 <= 0) return null;
  return [[0, 0], [s0, 0], [x, -Math.sqrt(y2)]];
}
/** Two sides around V0 and the angle between them: side0 = V0V1 = p, side2 = V2V0 = q. */
const fromSAS = (p: number, q: number, th: number): P[] => [[0, 0], [p, 0], [q * Math.cos(th * RAD), -q * Math.sin(th * RAD)]];
/** Angles at V0 and V1 on a base of 1. */
function fromAngles(a: number, b: number): P[] {
  const c = 180 - a - b;
  const s2 = Math.sin(b * RAD) / Math.sin(c * RAD);     // V2V0, by the sine rule
  return [[0, 0], [1, 0], [s2 * Math.cos(a * RAD), -s2 * Math.sin(a * RAD)]];
}

/** Draw one triangle (in its own coordinates) as a figure. */
function triFig(t: Tri): SFig {
  const f = emptyFig();
  const c: P = [(t.V[0][0] + t.V[1][0] + t.V[2][0]) / 3, (t.V[0][1] + t.V[1][1] + t.V[2][1]) / 3];
  for (let i = 0; i < 3; i++) {
    const a = t.V[i], b = t.V[(i + 1) % 3];
    f.segs.push({ a, b });
    if (t.side[i] !== null) f.sides.push({ a, b, text: t.side[i]!, unknown: t.unknown?.[i], away: c });
    if (t.angle[i] !== null) f.arcs.push({ at: t.V[i], p1: t.V[(i + 2) % 3], p2: t.V[(i + 1) % 3], text: t.angle[i]! });
    if (t.right === i) f.rights.push({ at: t.V[i], p1: t.V[(i + 2) % 3], p2: t.V[(i + 1) % 3] });
    if (t.names) f.corners.push({ at: t.V[i], name: t.names[i] });
  }
  return f;
}
function mapTri(t: Tri, m: (p: P) => P): Tri { return { ...t, V: t.V.map(m) }; }

/** Two triangles side by side. The bigger one is drawn up to 1.7 times the size of the smaller. */
function drawPair(t1: Tri, t2: Tri, k: number, rng: () => number, turnSecond: boolean): { fig: SFig; tris: Tri[] } {
  const r1 = randInt(rng, -18, 18);
  const r2 = turnSecond ? pick(rng, [0, 60, 120, 180, 240, 300]) + randInt(rng, -15, 15) : r1 + randInt(rng, -6, 6);
  const m1 = turnMap(r1, false), m2 = turnMap(r2, turnSecond && rng() < 0.5);
  const a = mapTri(t1, m1), b = mapTri(t2, m2);
  const big = Math.min(1.7, Math.max(k, 1 / k));
  const s1 = k >= 1 ? 150 : 150 * big, s2 = k >= 1 ? 150 * big : 150;
  const placeTri = (t: Tri, size: number, x: number): Tri => {
    const bb = bbox(t.V), sc = size / Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0), h = (bb.y1 - bb.y0) * sc;
    return { ...t, V: t.V.map(p => [x + (p[0] - bb.x0) * sc, -h / 2 + (p[1] - bb.y0) * sc] as P) };
  };
  const pa = placeTri(a, s1, 0);
  const gap = 78;
  const pb = placeTri(b, s2, bbox(pa.V).x1 + gap);
  return { fig: merge(triFig(pa), triFig(pb)), tris: [pa, pb] };
}

// ---------------------------------------------------------------- numbers
export const fmt = (v: number) => String(Math.round(v * 100) / 100);
const nice = (v: number) => v > 0 && Math.abs(v * 2 - Math.round(v * 2)) < 1e-9;      // whole or a half
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
type Fr = [number, number];
const reduce = ([p, q]: Fr): Fr => { const g = gcd(p, q); return [p / g, q / g]; };
const terminates = (q: number) => { while (q % 2 === 0) q /= 2; while (q % 5 === 0) q /= 5; return q === 1; };
/** The right spellings of a fraction: the decimal if it ends within 2 places, the simplest
 * fraction, and the ratio of the two lengths as written in the diagram (e.g. 10/4). */
export function spell(f: Fr, raw?: [number, number]): { answer: string; forms: string[] } {
  const [p, q] = reduce(f);
  const forms = new Set<string>();
  let answer: string;
  if (q === 1) answer = String(p);
  else if (terminates(q) && Number.isInteger(p / q * 100)) { answer = fmt(p / q); forms.add(`${p}/${q}`); }
  else answer = `${p}/${q}`;
  if (raw && Number.isInteger(raw[0]) && Number.isInteger(raw[1]) && raw[1] !== 1) forms.add(`${raw[0]}/${raw[1]}`);
  forms.delete(answer);
  return { answer, forms: [...forms] };
}
export const valueOf = (s: string) => (s.includes('/') ? Number(s.split('/')[0]) / Number(s.split('/')[1]) : Number(s));

const keepSlips = (right: string[], slips: (Slip | false | null)[]) =>
  slips.filter((s): s is Slip => !!s && !right.includes(s.value) && valueOf(s.value) > 0 && Number.isFinite(valueOf(s.value)))
    .filter((s, i, all) => all.findIndex(t => t.value === s.value) === i);
const numPart = (label: string, answer: string, code: string, slips: (Slip | false | null)[], forms: string[] = [], ask?: string): NumberPart => {
  const right = [answer, ...forms];
  return { kind: 'number', label, answer, ...(forms.length ? { forms } : {}), code, slips: keepSlips(right, slips), ask };
};
const sl = (value: number | string, code: string, message: string): Slip => ({ value: typeof value === 'number' ? fmt(value) : value, code, message });
/** A misconception that is a fraction: one slip for each way of writing it. */
const fracSlips = (f: Fr, raw: [number, number] | undefined, code: string, message: string): Slip[] => {
  const s = spell(f, raw);
  return [s.answer, ...s.forms].map(v => sl(v, code, message));
};

// ---------------------------------------------------------------- similarity tests
export type TestKind = 'SSS' | 'SAS' | 'SAS-right' | 'AAA' | 'AAA-third' | 'RHS' | 'NS-sss' | 'NS-sas' | 'NS-aaa' | 'NS-rhs';
export const TEST_LEVEL_ITEMS: Record<1 | 2 | 3, TestKind[]> = {
  1: ['SSS', 'AAA'],
  2: ['SSS', 'SSS', 'SAS', 'SAS', 'SAS-right', 'AAA', 'AAA-third', 'RHS', 'RHS'],
  3: ['SSS', 'SAS', 'SAS-right', 'AAA-third', 'RHS', 'NS-sss', 'NS-sas', 'NS-aaa', 'NS-rhs'],
};
export const TEST_KINDS: TestKind[] = ['SSS', 'SAS', 'SAS-right', 'AAA', 'AAA-third', 'RHS', 'NS-sss', 'NS-sas', 'NS-aaa', 'NS-rhs'];
const answerOf = (k: TestKind) => (k.startsWith('NS') ? 'NS' : k.split('-')[0]);
const TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]];

const deg = (a: number) => `${a}°`;
const sidesShown = (k: TestKind) => (k === 'SSS' || k === 'NS-sss' ? 3 : k.startsWith('AAA') || k === 'NS-aaa' ? 0 : 2);
const hasRight = (k: TestKind) => k === 'SAS-right' || k === 'RHS' || k === 'NS-rhs';

/** Why a wrong option is wrong, for this kind of question. */
function optionSlip(kind: TestKind, option: string): Slip {
  const n = sidesShown(kind);
  const S = (code: string, message: string): Slip => ({ value: option, code, message });
  const noSides = S('not-shown', 'No sides are given. Look at the angles.');
  if (option === 'SSS') {
    if (kind === 'NS-sss') return S('sss-ratios', 'All three ratios must match. Match shortest with shortest: one pair does not.');
    return n === 2 ? S('not-shown', 'Only two pairs of sides are given, so it can’t be SSS.') : noSides;
  }
  if (option === 'SAS') {
    if (kind === 'RHS' || kind === 'NS-rhs') return S('sas-not-between', 'The right angle is not between the two given sides.' + (kind === 'RHS' ? ' With the hypotenuse, it is RHS.' : ''));
    if (kind === 'NS-sas') return S('sas-not-between', 'The equal angle must be between the two sides in both triangles. Here it is not.');
    return n === 3 ? S('not-shown', 'No angle is marked. Compare all three pairs of sides.') : noSides;
  }
  if (option === 'AAA') {
    if (kind === 'NS-aaa') return S('aaa-third', 'Find the third angle of each triangle: the angles do not all match.');
    return n === 2 ? S('not-shown', 'Only one pair of angles is marked. AAA needs two pairs.') : S('not-shown', 'No angles are marked. Compare the sides.');
  }
  if (option === 'RHS') {
    if (kind === 'NS-rhs') return S('rhs-ratios', 'The hypotenuses and the other pair of sides must be in the same ratio. Here they are not.');
    if (kind === 'SAS-right') return S('rhs-no-hyp', 'The hypotenuse is not given. The right angle is between the two sides: SAS.');
    return S('not-shown', 'There is no right angle.');
  }
  // "Not similar" when they are
  if (kind === 'SSS') return S('shortest', 'Match shortest with shortest: all three ratios are the same.');
  if (kind === 'AAA-third') return S('aaa-third', 'Find the third angle: all three angles match.');
  if (kind === 'AAA') return S('missed-test', 'Two pairs of angles are equal, so the third pair is too: AAA.');
  if (kind === 'RHS') return S('missed-test', 'Both are right-angled, and the hypotenuses and another pair of sides are in the same ratio: RHS.');
  return S('missed-test', 'Two pairs of sides are in the same ratio and the angle between them is equal: SAS.');
}
const CONGRUENCE_WORD = 'AAS and ASA are congruence tests. For similar triangles, equal angles give AAA.';
export const TEST_ASK = 'Type the first letters, click, or press Tab then Enter.';

const scaleSet = (level: number) => (level === 1 ? [2, 3] : [1.5, 2, 2.5, 3]);
const sizeOk = (vals: number[]) => vals.every(v => nice(v) && v <= 40);

/** The two triangles for one kind of question (in their own coordinates, before turning). */
function buildTest(kind: TestKind, level: number, rng: () => number): { t1: Tri; t2: Tri; k: number } | null {
  const k = pick(rng, scaleSet(level));
  const none = (): (string | null)[] => [null, null, null];
  if (kind === 'SSS' || kind === 'NS-sss') {
    const s = [randInt(rng, 3, 10), randInt(rng, 3, 10), randInt(rng, 3, 10)];
    if (new Set(s).size < 3) return null;             // a scalene triangle, so "shortest with shortest" matters
    const V1 = fromSides(s[0], s[1], s[2]);
    if (!V1 || !okShape(V1, 30, 112) || triAngles(V1).some(a => Math.abs(a - 90) < 6)) return null;
    const s2 = s.map(v => v * k);
    if (kind === 'NS-sss') {
      const j = randInt(rng, 0, 2);
      s2[j] += pick(rng, [-1, 1]) * (k >= 2 ? 1 : 0.5) * randInt(rng, 1, 2);
    }
    if (!sizeOk(s2)) return null;
    const V2 = fromSides(s2[0], s2[1], s2[2]);
    if (!V2 || !okShape(V2, 28, 115) || triAngles(V2).some(a => Math.abs(a - 90) < 6)) return null;
    return { t1: { V: V1, side: s.map(fmt), angle: none(), right: null }, t2: { V: V2, side: s2.map(fmt), angle: none(), right: null }, k };
  }
  if (kind === 'SAS' || kind === 'SAS-right' || kind === 'NS-sas') {
    const p = randInt(rng, 3, 10), q = randInt(rng, 3, 10);
    if (p === q) return null;
    const th = kind === 'SAS-right' ? 90 : 5 * randInt(rng, 7, 23);
    if (kind !== 'SAS-right' && Math.abs(th - 90) < 15) return null;
    const V1 = fromSAS(p, q, th);
    if (!okShape(V1, 25, 120)) return null;
    const lab = (a: number, b: number, right: boolean): Tri =>
      ({ V: [], side: [fmt(a), null, fmt(b)], angle: [right ? null : deg(th), null, null], right: right ? 0 : null });
    const t1 = { ...lab(p, q, kind === 'SAS-right'), V: V1 };
    if (!sizeOk([p * k, q * k])) return null;
    if (kind !== 'NS-sas') return { t1, t2: { ...lab(p * k, q * k, kind === 'SAS-right'), V: V1.map(v => [v[0] * k, v[1] * k] as P) }, k };
    // the same two sides, but the equal angle is not between them: kp = V0V1, kq = V1V2, angle at V0
    const kp = p * k, kq = q * k;
    const disc = kq * kq - kp * kp * Math.sin(th * RAD) ** 2;
    if (disc <= 0) return null;
    const t = kp * Math.cos(th * RAD) + Math.sqrt(disc);
    if (t <= 1) return null;
    const V2: P[] = [[0, 0], [kp, 0], [t * Math.cos(th * RAD), -t * Math.sin(th * RAD)]];
    if (!okShape(V2, 25, 125)) return null;
    return { t1, t2: { V: V2, side: [fmt(kp), fmt(kq), null], angle: [deg(th), null, null], right: null }, k };
  }
  if (kind === 'AAA' || kind === 'AAA-third' || kind === 'NS-aaa') {
    const a = 5 * randInt(rng, 8, 20), b = 5 * randInt(rng, 8, 20), c = 180 - a - b;
    if (c < 40 || [a, b, c].some(x => Math.abs(x - 90) < 10) || new Set([a, b, c]).size < 3 || Math.min(Math.abs(a - b), Math.abs(b - c), Math.abs(a - c)) < 10) return null;
    const V1 = fromAngles(a, b);
    const t1: Tri = { V: V1, side: none(), angle: [deg(a), deg(b), null], right: null };
    if (kind === 'AAA') return { t1, t2: { V: V1.map(v => [v[0] * k, v[1] * k] as P), side: none(), angle: [deg(a), deg(b), null], right: null }, k };
    if (kind === 'AAA-third') return { t1, t2: { V: V1.map(v => [v[0] * k, v[1] * k] as P), side: none(), angle: [null, deg(b), deg(c)], right: null }, k };
    // one angle the same, but the others are not
    const d = pick(rng, [-15, -10, 10, 15]);
    const b2 = b + d, c2 = c - d;
    if (b2 < 35 || c2 < 35 || Math.abs(b2 - 90) < 10 || Math.abs(c2 - 90) < 10 || [b2, c2].some(x => x === a || x === b || x === c)) return null;
    const V2 = fromAngles(a, b2).map(v => [v[0] * k, v[1] * k] as P);
    const showC = rng() < 0.5;
    return { t1, t2: { V: V2, side: none(), angle: [deg(a), showC ? null : deg(b2), showC ? deg(c2) : null], right: null }, k };
  }
  // RHS: legs on V0V1 and V2V0, right angle at V0; the hypotenuse is side 1
  const [x, y, h] = pick(rng, TRIPLES);
  const legFirst = rng() < 0.5;
  const a = legFirst ? x : y, b = legFirst ? y : x;      // a is the labelled leg
  const V1: P[] = [[0, 0], [a, 0], [0, -b]];
  const t1: Tri = { V: V1, side: [fmt(a), fmt(h), null], angle: none(), right: 0 };
  const H = h * k;
  let A = a * k;
  if (kind === 'NS-rhs') A += pick(rng, [-1, 1]) * randInt(rng, 1, 2);
  if (A <= 0 || A >= H - 1 || !sizeOk([A, H])) return null;
  const V2: P[] = [[0, 0], [A, 0], [0, -Math.sqrt(H * H - A * A)]];
  if (!okShape(V2, 22, 90.001)) return null;
  return { t1, t2: { V: V2, side: [fmt(A), fmt(H), null], angle: none(), right: 0 }, k };
}

export function generateSimTests(level: 1 | 2 | 3, seed?: number, kind?: TestKind): TPQuestion {
  const rng = makeRng(seed);
  const kd = kind || pick(rng, TEST_LEVEL_ITEMS[level]);
  for (let tries = 0; tries < 500; tries++) {
    const b = buildTest(kd, level, rng);
    if (!b) continue;
    // not similar means clearly a different shape; similar means exactly the same shape
    const gap = shapeGap(b.t1.V, b.t2.V);
    if (kd.startsWith('NS') ? gap < 3 : gap > 1e-6) continue;
    // a corner that looks like a right angle is marked as one, or kept well away from 90°
    if (!hasRight(kd) && [b.t1, b.t2].some(t => triAngles(t.V).some(x => Math.abs(x - 90) < 6))) continue;
    // the smaller triangle is not always on the left
    const swap = level > 1 && rng() < 0.4;
    const { fig, tris } = swap ? drawPair(b.t2, b.t1, 1 / b.k, rng, level > 1) : drawPair(b.t1, b.t2, b.k, rng, level > 1);
    if (layoutProblems(fig).length) continue;
    const names = level === 3 ? ['SSS', 'SAS', 'AAA', 'RHS', 'NS'] : ['SSS', 'SAS', 'AAA', 'RHS'];
    const answer = answerOf(kd);
    const options = names.map(v => (v === 'NS' ? opt('Not similar', 'NS', ['notsimilar']) : opt(v)));
    const part: ChoicePart = {
      kind: 'choice', label: 'Test:', answer, options, code: 'test', ask: TEST_ASK,
      slips: names.filter(v => v !== answer).map(v => optionSlip(kd, v)),
      traps: ['aas', 'asa'].map(key => ({ key, slip: { value: key.toUpperCase(), code: 'congruence-test', message: CONGRUENCE_WORD } })),
    };
    return {
      prompt: level === 3 ? 'Are these triangles similar? Choose the test, or Not similar.' : 'Which test shows these triangles are similar?',
      parts: [part], svg: drawSFig(fig), figureLabel: 'two triangles',
      meta: { kind: kd, fig, tris },
    };
  }
  throw new Error(`no ${kd} question found`);
}

// ---------------------------------------------------------------- find x
export type FindKind = 'pair' | 'cross' | 'nested' | 'nested-part';
export const FIND_LEVEL_ITEMS: Record<1 | 2 | 3, FindKind[]> = {
  1: ['pair'],
  2: ['pair', 'pair', 'pair', 'cross'],
  3: ['pair', 'pair', 'cross', 'nested', 'nested', 'nested-part'],
};
export const FIND_KINDS: FindKind[] = ['pair', 'cross', 'nested', 'nested-part'];
const LETTERS: [string[], string[]][] = [[['A', 'B', 'C'], ['D', 'E', 'F']], [['P', 'Q', 'R'], ['S', 'T', 'U']], [['A', 'B', 'C'], ['X', 'Y', 'Z']], [['K', 'L', 'M'], ['P', 'Q', 'R']]];
/** Scale factors by level, as fractions. */
const FIND_SCALES: Record<number, Fr[]> = {
  1: [[2, 1], [3, 1], [4, 1]],
  2: [[3, 2], [5, 2], [1, 2], [2, 1], [3, 1]],
  3: [[1, 3], [2, 3], [3, 4], [4, 3], [3, 2]],
};
export const SF_ASK = 'Scale factor = image ÷ original. Type a fraction like 3/4, or a decimal.';
const SF_ASK_WHOLE = 'Scale factor = image ÷ original.';
const sideName = (names: string[], i: number) => names[i] + names[(i + 1) % 3];

export function generateSimFind(level: 1 | 2 | 3, seed?: number, kind?: FindKind): TPQuestion {
  const rng = makeRng(seed);
  const kd = kind || pick(rng, FIND_LEVEL_ITEMS[level]);
  for (let tries = 0; tries < 500; tries++) {
    const q = kd === 'pair' ? findPair(level, rng) : kd === 'cross' ? findCross(level, rng) : findNested(level, rng, kd === 'nested-part');
    if (!q) continue;
    if (layoutProblems(q.meta.fig).length) continue;
    q.meta.kind = kd;
    return q;
  }
  throw new Error(`no ${kd} question found`);
}

const parts3 = (wantX: boolean, wantY: boolean) => `Find the scale factor, then ${wantX && wantY ? 'x and y' : wantX ? 'x' : 'y'}.`;

/** The scale factor part, from a known pair of lengths (original, image). */
function sfPart(k: Fr, orig: number, img: number, origName: string, imgName: string, level: number): NumberPart {
  const s = spell(k, [img, orig]);
  const msg = `Upside down. Scale factor = ${imgName} ÷ ${origName} (image ÷ original).`;
  return numPart('scale factor =', s.answer, 'sf', fracSlips([k[1], k[0]], [orig, img], 'sf-upside-down', msg), s.forms, level === 1 ? SF_ASK_WHOLE : SF_ASK);
}
/** x on the image: multiply. y on the original: divide. */
function timesPart(label: string, orig: number, kv: number, pairDiff: number, imageName: string): NumberPart {
  const ans = orig * kv;
  return numPart(label, fmt(ans), 'times', [
    nice(orig / kv) && sl(orig / kv, 'divide-not-times', `${label.replace(' =', '')} is on ${imageName}, the image: multiply by the scale factor.`),
    nice(orig + pairDiff) && sl(orig + pairDiff, 'added-difference', 'Similar shapes are scaled, not added to: multiply by the scale factor.'),
  ]);
}
function dividePart(label: string, img: number, kv: number, pairDiff: number, origName: string): NumberPart {
  const ans = img / kv;
  return numPart(label, fmt(ans), 'divide', [
    nice(img * kv) && sl(img * kv, 'times-not-divide', `${label.replace(' =', '')} is on ${origName}, the original: divide by the scale factor.`),
    nice(img - pairDiff) && sl(img - pairDiff, 'added-difference', 'Similar shapes are scaled, not added to: divide by the scale factor.'),
  ]);
}

function findPair(level: number, rng: () => number): TPQuestion | null {
  const k = pick(rng, FIND_SCALES[level]), kv = k[0] / k[1];
  const [n1, n2] = pick(rng, LETTERS);
  // original lengths are whole multiples of the denominator, so every image length is nice
  const unitM = k[1] === 1 ? 1 : k[1];
  const s = [0, 1, 2].map(() => unitM * randInt(rng, level === 1 ? 2 : 1, level === 1 ? 9 : Math.floor(12 / unitM) + 1));
  if (new Set(s).size < 3 || s.some(v => v < 2)) return null;
  const V1 = fromSides(s[0], s[1], s[2]);
  if (!V1 || !okShape(V1, 30, 115)) return null;
  const img = s.map(v => v * kv);
  if (img.some(v => !nice(v) || v > 40 || v < 1)) return null;
  const order = [0, 1, 2].sort(() => rng() - 0.5);
  const [jk, jx, jy] = order;                          // the known pair, x (on the image), y (on the original)
  const r = level === 1 ? 0 : rng();
  const wantX = r < 0.75, wantY = level > 1 && r > 0.25;
  const side1: (string | null)[] = [null, null, null], side2: (string | null)[] = [null, null, null];
  const unk1 = [false, false, false], unk2 = [false, false, false];
  side1[jk] = fmt(s[jk]); side2[jk] = fmt(img[jk]);
  if (wantX) { side1[jx] = fmt(s[jx]); side2[jx] = 'x'; unk2[jx] = true; }
  if (wantY) { side1[jy] = 'y'; unk1[jy] = true; side2[jy] = fmt(img[jy]); }
  const t1: Tri = { V: V1, side: side1, angle: [null, null, null], right: null, names: n1, unknown: unk1 };
  const t2: Tri = { V: V1.map(v => [v[0] * kv, v[1] * kv] as P), side: side2, angle: [null, null, null], right: null, names: n2, unknown: unk2 };
  const swap = level > 1 && rng() < 0.3;
  const { fig, tris } = swap ? drawPair(t2, t1, 1 / kv, rng, level > 1) : drawPair(t1, t2, kv, rng, level > 1);
  const T1 = `△${n1.join('')}`, T2 = `△${n2.join('')}`;
  const diff = img[jk] - s[jk];
  const parts: NumberPart[] = [sfPart(k, s[jk], img[jk], sideName(n1, jk), sideName(n2, jk), level)];
  if (wantX) parts.push(timesPart('x =', s[jx], kv, diff, T2));
  if (wantY) parts.push(dividePart('y =', img[jy], kv, diff, T1));
  return {
    prompt: `${T1} ∼ ${T2}. ${parts3(wantX, wantY)}`, parts, svg: drawSFig(fig), figureLabel: 'two similar triangles',
    meta: { fig, tris, scale: kv, orig: tris[swap ? 1 : 0], image: tris[swap ? 0 : 1] },
  };
}

/** AB ∥ DE, with AE and BD crossing at C: △ABC ∼ △EDC. */
function findCross(level: number, rng: () => number): TPQuestion | null {
  // up to 2.5 times, so the small triangle has room for its arrow and labels
  const k = pick(rng, FIND_SCALES[level].filter(f => f[0] !== f[1] && Math.max(f[0] / f[1], f[1] / f[0]) <= 2.5)), kv = k[0] / k[1];
  const unitM = k[1];
  const ab = unitM * randInt(rng, 2, Math.floor(12 / unitM) + 1), ac = unitM * randInt(rng, 2, Math.floor(12 / unitM) + 1), bc = unitM * randInt(rng, 2, Math.floor(12 / unitM) + 1);
  if (new Set([ab, ac, bc]).size < 3) return null;
  // C at the origin; A and B above it
  const V = fromSides(ab, bc, ac);                    // V0 = A, V1 = B, V2 = C
  if (!V || !okShape(V, 32, 110)) return null;
  const [A0, B0, C0] = V;
  const A = sub(A0, C0), B = sub(B0, C0), C: P = [0, 0];
  const E: P = [-kv * A[0], -kv * A[1]], D: P = [-kv * B[0], -kv * B[1]];
  const ed = ab * kv, ec = ac * kv, dc = bc * kv;
  if ([ed, ec, dc].some(v => !nice(v) || v > 40)) return null;
  const wantY = level > 1 && rng() < 0.5;
  const pts = { A, B, C, D, E };
  const rot = randInt(rng, 0, 359), mir = rng() < 0.5;
  const m = turnMap(rot, mir);
  let f = emptyFig();
  f.segs.push({ a: A, b: B, arrows: 1 }, { a: D, b: E, arrows: 1 }, { a: A, b: E }, { a: B, b: D });
  f.sides.push({ a: A, b: B, text: fmt(ab), away: C, clear: 8 }, { a: D, b: E, text: fmt(ed), away: C, clear: 8 });
  f.sides.push({ a: A, b: C, text: fmt(ac), away: B }, { a: E, b: C, text: 'x', unknown: true, away: D });
  if (wantY) f.sides.push({ a: B, b: C, text: 'y', unknown: true, away: A }, { a: D, b: C, text: fmt(dc), away: E });
  (Object.keys(pts) as (keyof typeof pts)[]).forEach(n => f.corners.push({ at: pts[n], name: n }));
  f = mapFig(f, m);
  // fit: about 300 wide or 230 high
  const bb = bbox(figPoints(f));
  const sc = Math.min(300 / (bb.x1 - bb.x0), 230 / (bb.y1 - bb.y0));
  f = mapFig(f, p => [(p[0] - bb.x0) * sc, (p[1] - bb.y0) * sc]);
  const parts: NumberPart[] = [sfPart(k, ab, ed, 'AB', 'ED', level), timesPart('x =', ac, kv, ed - ab, '△EDC')];
  if (wantY) parts.push(dividePart('y =', dc, kv, ed - ab, '△ABC'));
  return {
    prompt: `AB ∥ DE, so △ABC ∼ △EDC. ${parts3(true, wantY)}`, parts, svg: drawSFig(f), figureLabel: 'two triangles crossing at C',
    meta: { fig: f, scale: kv, points: mapPoints(pts, m, bb, sc), lengths: { AB: ab, ED: ed, AC: ac, EC: ec, BC: bc, DC: dc } },
  };
}
function mapPoints(pts: Record<string, P>, m: (p: P) => P, bb: { x0: number; y0: number }, sc: number): Record<string, P> {
  const out: Record<string, P> = {};
  for (const n of Object.keys(pts)) { const p = m(pts[n]); out[n] = [(p[0] - bb.x0) * sc, (p[1] - bb.y0) * sc]; }
  return out;
}

const NESTED_SCALES: Fr[] = [[3, 2], [4, 3], [5, 2], [2, 1], [3, 1], [5, 4]];
/** DE ∥ BC with D on AB and E on AC: △ADE ∼ △ABC. Use the whole side AB = AD + DB. */
function findNested(level: number, rng: () => number, partSide: boolean): TPQuestion | null {
  const ad = randInt(rng, 2, 8), db = randInt(rng, 1, 8);
  const ab = ad + db;
  const big: Fr = reduce([ab, ad]);                  // small → large
  // friendly scale factors only (both ways round): 3/2, 4/3, 5/2, 2, 3, 5/4
  if (!NESTED_SCALES.some(f => f[0] === big[0] && f[1] === big[1])) return null;
  const reverse = !partSide && rng() < 0.4;          // △ABC ∼ △ADE: the image is the smaller one
  const k: Fr = reverse ? [big[1], big[0]] : big, kv = k[0] / k[1];
  const de = big[1] * randInt(rng, 1, Math.max(1, Math.floor(12 / big[1])));
  const bc = de * big[0] / big[1];
  if (de < 2 || bc > 30 || db === ad && !partSide) return null;
  // the shape: base BC, angle at B
  const thB = randInt(rng, 50, 80);
  const B: P = [0, 0], C: P = [bc, 0];
  const A: P = add(B, dirv(-thB), ab);
  const tri = [A, B, C];
  if (!okShape(tri, 35, 100)) return null;
  const t = ad / ab;
  const D = lerp(A, B, t), E = lerp(A, C, t);
  const pts: Record<string, P> = { A, B, C, D, E };
  let f = emptyFig();
  const cen: P = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
  f.segs.push({ a: A, b: B }, { a: A, b: C }, { a: B, b: C, arrows: 1 }, { a: D, b: E, arrows: 1 });
  for (const n of ['A', 'B', 'C', 'D', 'E']) f.corners.push({ at: pts[n], name: n });
  let parts: NumberPart[], prompt: string;
  const partMsg = 'Use the whole side AB = AD + DB, not DB.';
  if (!partSide) {
    // AD, DB and one of DE / BC given; x is the other
    f.sides.push({ a: A, b: D, text: fmt(ad), away: cen }, { a: D, b: B, text: fmt(db), away: cen });
    const xOnBig = !reverse;
    f.sides.push({ a: D, b: E, text: xOnBig ? fmt(de) : 'x', unknown: !xOnBig, away: A, clear: 8 }, { a: B, b: C, text: xOnBig ? 'x' : fmt(bc), unknown: xOnBig, away: A, clear: 8 });
    const s = spell(k, reverse ? [ad, ab] : [ab, ad]);
    const upside: Fr = [k[1], k[0]];
    const partK: Fr = reverse ? reduce([ad, db]) : reduce([db, ad]);
    const sf = numPart('scale factor =', s.answer, 'sf', [
      ...fracSlips(partK, undefined, 'part-side', partMsg),
      ...fracSlips(upside, undefined, 'sf-upside-down', `Upside down. Scale factor = image ÷ original: ${reverse ? 'AD ÷ AB' : 'AB ÷ AD'}.`),
    ], s.forms, SF_ASK);
    const pv = partK[0] / partK[1];
    const known = xOnBig ? de : bc, ans = known * kv;
    const x = numPart('x =', fmt(ans), 'times', [
      nice(known * pv) && sl(known * pv, 'part-side', partMsg),
      nice(known / kv) && sl(known / kv, 'divide-not-times', `x is on ${reverse ? '△ADE' : '△ABC'}, the image: multiply by the scale factor.`),
    ]);
    parts = [sf, x];
    prompt = `DE ∥ BC, so ${reverse ? '△ABC ∼ △ADE' : '△ADE ∼ △ABC'}. Find the scale factor, then x.`;
  } else {
    // AD, DE and BC given; find AB, then x = DB
    f.sides.push({ a: A, b: D, text: fmt(ad), away: cen }, { a: D, b: B, text: 'x', unknown: true, away: cen });
    f.sides.push({ a: D, b: E, text: fmt(de), away: A, clear: 8 }, { a: B, b: C, text: fmt(bc), away: A, clear: 8 });
    const s = spell(k, [bc, de]);
    const sf = numPart('scale factor =', s.answer, 'sf', fracSlips([k[1], k[0]], [de, bc], 'sf-upside-down', 'Upside down. Scale factor = BC ÷ DE (image ÷ original).'), s.forms, SF_ASK);
    const abPart = numPart('AB =', fmt(ab), 'times', [
      nice(ad / kv) && sl(ad / kv, 'divide-not-times', 'AB is on △ABC, the image: multiply AD by the scale factor.'),
    ]);
    const x = numPart('x =', fmt(db), 'subtract', [sl(ab, 'whole-not-part', 'That is all of AB. x is only DB = AB − AD.')]);
    parts = [sf, abPart, x];
    prompt = 'DE ∥ BC, so △ADE ∼ △ABC. Find the scale factor, then AB, then x.';
  }
  const rot = randInt(rng, -20, 20), mir = rng() < 0.5;
  const m = turnMap(rot, mir);
  f = mapFig(f, m);
  const bb = bbox(figPoints(f));
  const sc = Math.min(280 / (bb.x1 - bb.x0), 240 / (bb.y1 - bb.y0));
  f = mapFig(f, p => [(p[0] - bb.x0) * sc, (p[1] - bb.y0) * sc]);
  return {
    prompt, parts, svg: drawSFig(f), figureLabel: 'a triangle with a line parallel to its base',
    meta: { fig: f, scale: kv, reverse, points: mapPoints(pts, m, bb, sc), lengths: { AD: ad, DB: db, AB: ab, DE: de, BC: bc } },
  };
}
