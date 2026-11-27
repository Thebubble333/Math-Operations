/* Polygon angle questions for 9 SEAL (lesson 2A). Every answer is a whole number
 * that can be found in the head; bigger questions are split into typed steps. */
import { TPQuestion, NumberPart, Slip, makeRng, randInt, pick } from './typedParts';

export type PolygonType = 'sum' | 'sides-from-sum' | 'exterior' | 'interior' | 'sides-from-exterior' | 'sides-from-interior' | 'missing';

// regular polygons whose exterior angle is a whole number of degrees
const REGULAR_N = [3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36];
const SHAPE: Record<number, string> = { 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 8: 'octagon', 10: 'decagon' };
const REGULAR_NAME: Record<number, string> = { 3: 'an equilateral triangle', 4: 'a square', 5: 'a regular pentagon', 6: 'a regular hexagon', 8: 'a regular octagon', 10: 'a regular decagon' };

const article = (w: string) => (/^[aeiou]/.test(w) ? 'an' : 'a');
const polygonName = (n: number, rng: () => number) =>
  SHAPE[n] && rng() < 0.6 ? `${article(SHAPE[n])} ${SHAPE[n]}` : `a polygon with ${n} sides`;
const regularName = (n: number) => REGULAR_NAME[n] || `a regular polygon with ${n} sides`;

const keep = (answer: number, slips: (Slip | false)[]) =>
  slips.filter((s): s is Slip => !!s && s.value !== String(answer))
    .filter((s, i, all) => all.findIndex(t => t.value === s.value) === i);

const deg = (label: string, answer: number, slips: (Slip | false)[] = [], ask?: string): NumberPart =>
  ({ kind: 'number', label, answer: String(answer), suffix: '°', slips: keep(answer, slips), ask });
const count = (label: string, answer: number, slips: (Slip | false)[] = [], ask?: string): NumberPart =>
  ({ kind: 'number', label, answer: String(answer), slips: keep(answer, slips), ask });

const timesN = (n: number): Slip => ({ value: String(n * 180), code: 'times-n', message: `Use (n − 2) × 180°: ${n} sides make ${n - 2} triangles.` });
const always360 = (n: number): Slip | false => n !== 4 && { value: '360', code: 'always-360', message: 'Only quadrilaterals add to 360°. Use (n − 2) × 180°.' };

// ---------------------------------------------------------------- question types
function sum(rng: () => number): TPQuestion {
  const n = randInt(rng, 4, 12);
  return {
    prompt: `Find the angle sum of ${polygonName(n, rng)}.`,
    parts: [deg('S =', (n - 2) * 180, [timesN(n), always360(n)], 'S = (n − 2) × 180°')],
    meta: { type: 'sum', n },
  };
}

function sidesFromSum(rng: () => number): TPQuestion {
  const n = randInt(rng, 5, 12), S = (n - 2) * 180;
  return {
    prompt: `The angles of a polygon add to ${S}°. How many sides does it have?`,
    parts: [count('n =', n, [{ value: String(n - 2), code: 'forgot-2', message: `${S} ÷ 180 = ${n - 2} is the number of triangles. Add 2 for the sides.` }], 'Divide by 180, then add 2.')],
    meta: { type: 'sides-from-sum', n },
  };
}

function exterior(rng: () => number): TPQuestion {
  const n = pick(rng, REGULAR_N), ext = 360 / n;
  return {
    prompt: `Find the size of each exterior angle of ${regularName(n)}.`,
    parts: [deg('Exterior angle =', ext, [{ value: String(180 - ext), code: 'gave-interior', message: 'That is the interior angle. Each exterior angle is 360° ÷ n.' }], 'Each exterior angle is 360° ÷ n.')],
    meta: { type: 'exterior', n },
  };
}

function interior(rng: () => number): TPQuestion {
  const n = pick(rng, REGULAR_N), ext = 360 / n;
  return {
    prompt: `Find the size of each interior angle of ${regularName(n)}.`,
    parts: [
      deg('Exterior angle =', ext, [{ value: String(180 - ext), code: 'skipped-step', message: `Find the exterior angle first: 360° ÷ ${n}.` }], 'Exterior angle first: 360° ÷ n.'),
      deg('Interior angle =', 180 - ext, [{ value: String(360 - ext), code: 'ext-360', message: 'An interior and exterior angle add to 180°, not 360°.' }], 'Interior = 180° − exterior.'),
    ],
    meta: { type: 'interior', n },
  };
}

function sidesFromExterior(rng: () => number): TPQuestion {
  const n = pick(rng, REGULAR_N.filter(k => k >= 5)), ext = 360 / n;
  return {
    prompt: `Each exterior angle of a regular polygon is ${ext}°. How many sides does it have?`,
    parts: [count('n =', n, [], 'n = 360° ÷ exterior angle')],
    meta: { type: 'sides-from-exterior', n },
  };
}

function sidesFromInterior(rng: () => number): TPQuestion {
  const n = pick(rng, REGULAR_N.filter(k => k >= 5)), ext = 360 / n, int = 180 - ext;
  return {
    prompt: `Each interior angle of a regular polygon is ${int}°. How many sides does it have?`,
    parts: [
      deg('Exterior angle =', ext, [{ value: String(360 - int), code: 'ext-360', message: 'An interior and exterior angle add to 180°, not 360°.' }], 'Exterior = 180° − interior.'),
      count('n =', n, [], 'n = 360° ÷ exterior angle'),
    ],
    meta: { type: 'sides-from-interior', n },
  };
}

// ---------------------------------------------------------------- missing angle with a diagram
/** Corner points of a polygon drawn to scale: the angle at corner i is angles[i]. */
export function polygonPoints(angles: number[], rng: () => number): number[][] | null {
  const n = angles.length, rad = Math.PI / 180;
  for (let t = 0; t < 200; t++) {
    // side i runs from corner i to corner i + 1 and turns by the exterior angle at each corner
    const h0 = rng() * 360, dirs: number[] = [h0];
    for (let i = 1; i < n; i++) dirs.push(dirs[i - 1] + 180 - angles[i]);
    const L = Array.from({ length: n }, () => 0.85 + rng() * 0.3);
    let sx = 0, sy = 0;
    for (let i = 0; i < n - 2; i++) { sx += L[i] * Math.cos(dirs[i] * rad); sy += L[i] * Math.sin(dirs[i] * rad); }
    // the last two sides close the shape: a·u + b·v = −(sx, sy)
    const u = [Math.cos(dirs[n - 2] * rad), Math.sin(dirs[n - 2] * rad)], v = [Math.cos(dirs[n - 1] * rad), Math.sin(dirs[n - 1] * rad)];
    const det = u[0] * v[1] - u[1] * v[0];
    if (Math.abs(det) < 1e-6) continue;
    const a = (-sx * v[1] + sy * v[0]) / det, b = (-sy * u[0] + sx * u[1]) / det;
    if (a < 0.75 || a > 1.4 || b < 0.75 || b > 1.4) continue;
    L[n - 2] = a; L[n - 1] = b;
    const pts: number[][] = [[0, 0]];
    for (let i = 0; i < n - 1; i++) { const p = pts[i]; pts.push([p[0] + L[i] * Math.cos(dirs[i] * rad), p[1] - L[i] * Math.sin(dirs[i] * rad)]); }
    // fit inside the picture
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    const k = Math.min(290 / w, 200 / h);
    if (w * k < 150 || h * k < 110) continue;   // too long and thin
    const ox = 170 - (Math.max(...xs) + Math.min(...xs)) / 2 * k, oy = 125 - (Math.max(...ys) + Math.min(...ys)) / 2 * k;
    const out = pts.map(p => [ox + p[0] * k, oy + p[1] * k]);
    // every angle label needs room of its own
    const lp = labelPoints(out);
    if (lp.some((p, i) => lp.some((q, j) => j > i && Math.hypot(p[0] - q[0], p[1] - q[1]) < 52))) continue;
    return out;
  }
  return null;
}

/** The angle at each corner of a drawn polygon, in degrees (used by the tests). */
export function measuredAngles(pts: number[][]): number[] {
  const n = pts.length;
  return pts.map((p, i) => {
    const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
    const t1 = Math.atan2(a[1] - p[1], a[0] - p[0]), t2 = Math.atan2(b[1] - p[1], b[0] - p[0]);
    let d = Math.abs(t1 - t2) * 180 / Math.PI;
    if (d > 180) d = 360 - d;
    return d;
  });
}

/** Where each angle label is written (used by the tests to check labels stay apart). */
export function labelPoints(pts: number[][]): number[][] {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
  const unit = (x: number, y: number) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  return pts.map((p, i) => {
    const prev = pts[(i + n - 1) % n], next = pts[(i + 1) % n];
    const a = unit(prev[0] - p[0], prev[1] - p[1]), b = unit(next[0] - p[0], next[1] - p[1]);
    let bis = unit(a[0] + b[0], a[1] + b[1]);
    if (bis[0] * (mx - p[0]) + bis[1] * (my - p[1]) < 0) bis = [-bis[0], -bis[1]];
    return [p[0] + bis[0] * 34, p[1] + bis[1] * 34];
  });
}

function polygonSvg(pts: number[][], labels: string[], unknown: number): string {
  const n = pts.length;
  const lp = labelPoints(pts);
  const mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
  const unit = (x: number, y: number) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  let arcs = '', texts = '';
  pts.forEach((p, i) => {
    const prev = pts[(i + n - 1) % n], next = pts[(i + 1) % n];
    const a = unit(prev[0] - p[0], prev[1] - p[1]), b = unit(next[0] - p[0], next[1] - p[1]);
    const r = 15, sweep = a[0] * b[1] - a[1] * b[0] > 0 ? 1 : 0;
    arcs += `<path d="M${(p[0] + a[0] * r).toFixed(1)},${(p[1] + a[1] * r).toFixed(1)} A${r},${r} 0 0 ${sweep} ${(p[0] + b[0] * r).toFixed(1)},${(p[1] + b[1] * r).toFixed(1)}" fill="none" stroke="#64748b" stroke-width="1.5"/>`;
    // the label sits on the corner's own angle bisector, so it is clear which corner it belongs to
    const [tx, ty] = lp[i];
    texts += i === unknown
      ? `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-style="italic" font-size="19" fill="#4f46e5">${labels[i]}°</text>`
      : `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="16" fill="#1e293b">${labels[i]}°</text>`;
  });
  const poly = pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 340 250" xmlns="http://www.w3.org/2000/svg"><polygon points="${poly}" fill="none" stroke="#334155" stroke-width="2.5" stroke-linejoin="round"/>${arcs}${texts}</svg>`;
}

function missing(rng: () => number): TPQuestion {
  const n = pick(rng, [4, 5, 5, 6, 6]), S = (n - 2) * 180, avg = S / n;
  const v = pick(rng, ['x', 'y', 'p', 'q']);
  const unknown = randInt(rng, 0, n - 1);
  let given: number[] = [], x = 0, pts: number[][] | null = null;
  for (let t = 0; t < 500 && !pts; t++) {
    given = Array.from({ length: n - 1 }, () => Math.round(avg / 5) * 5 + 5 * randInt(rng, -5, 5));
    x = S - given.reduce((a, b) => a + b, 0);
    if (Math.abs(x - avg) > 30 || x >= 175 || !given.every(g => g < 175 && g > 45)) continue;
    const all = [...given]; all.splice(unknown, 0, x);
    pts = polygonPoints(all, rng);
  }
  const labels: string[] = []; let gi = 0;
  for (let i = 0; i < n; i++) labels.push(i === unknown ? v : String(given[gi++]));
  return {
    prompt: `Find the value of ${v}.`,
    svg: polygonSvg(pts!, labels, unknown),
    figureLabel: `a polygon with ${n} sides`,
    parts: [
      deg('Angle sum =', S, [timesN(n), always360(n)], 'Count the sides: S = (n − 2) × 180°'),
      deg(`${v} =`, x, [], `Take the other angles away from ${S}°.`),
    ],
    meta: { type: 'missing', n, given, x, unknown, pts },
  };
}

const MAKERS: Record<PolygonType, (rng: () => number) => TPQuestion> = {
  sum, 'sides-from-sum': sidesFromSum, exterior, interior,
  'sides-from-exterior': sidesFromExterior, 'sides-from-interior': sidesFromInterior, missing,
};

const LEVEL_ITEMS: Record<1 | 2 | 3, PolygonType[]> = {
  1: ['sum', 'sum', 'sum', 'sides-from-sum', 'sides-from-sum'],
  2: ['exterior', 'interior', 'sides-from-exterior', 'sides-from-interior'],
  3: ['missing', 'missing', 'missing', 'interior', 'sides-from-interior'],
};

export function generatePolygon(level: 1 | 2 | 3, seed?: number, type?: PolygonType): TPQuestion {
  const rng = makeRng(seed);
  return MAKERS[type || pick(rng, LEVEL_ITEMS[level])](rng);
}
export const POLYGON_TYPES = Object.keys(MAKERS) as PolygonType[];
