/*!
 * congruence-bank.js  (v1.0)
 * Random question generator + answer checker for Year 9 congruent-triangle practice:
 *   1. vertex mappings (A -> X, B -> Z, C -> Y)
 *   2. choosing the congruence test (SSS / SAS / AAS / RHS) and writing out the matching pairs
 *
 * No dependencies. ES module version for the Math-Operations site (import CongruenceBank from './congruenceBank').
 * Every question is reproducible from (type, seed, options).
 *
 * Quick start:
 *   const q = CongruenceBank.generate('map-pair', { seed: 42, difficulty: 2 });
 *   container.innerHTML = q.svg;
 *   const result = CongruenceBank.check(q, { A: 'R', B: 'P', C: 'Q' });
 */
const CongruenceBank = (function (global) {
  'use strict';

  // =====================================================================
  // 1. Seeded random numbers
  // =====================================================================
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeRng(seed) {
    const r = mulberry32(seed);
    const api = {
      seed: seed,
      next: r,
      float: (a, b) => a + (b - a) * r(),
      int: (a, b) => Math.floor(a + (b - a + 1) * r()),
      pick: arr => arr[Math.floor(r() * arr.length)],
      chance: p => r() < p,
      shuffle: arr => {
        const c = arr.slice();
        for (let i = c.length - 1; i > 0; i--) {
          const j = Math.floor(r() * (i + 1));
          const t = c[i]; c[i] = c[j]; c[j] = t;
        }
        return c;
      }
    };
    return api;
  }
  function randomSeed() { return Math.floor(Math.random() * 2147483647); }

  // =====================================================================
  // 2. Vector helpers (SVG coordinates: x right, y DOWN)
  // =====================================================================
  const P = (x, y) => ({ x: x, y: y });
  const add = (a, b) => P(a.x + b.x, a.y + b.y);
  const sub = (a, b) => P(a.x - b.x, a.y - b.y);
  const mul = (a, k) => P(a.x * k, a.y * k);
  const len = a => Math.hypot(a.x, a.y);
  const dist = (a, b) => len(sub(a, b));
  const unit = a => { const l = len(a) || 1; return P(a.x / l, a.y / l); };
  const dot = (a, b) => a.x * b.x + a.y * b.y;
  const cross = (a, b) => a.x * b.y - a.y * b.x;
  const deg = r => r * 180 / Math.PI;
  const rad = d => d * Math.PI / 180;
  const polar = (d, r) => P(r * Math.cos(rad(d)), r * Math.sin(rad(d)));
  const rot = (p, d) => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return P(p.x * c - p.y * s, p.x * s + p.y * c); };
  const dirDeg = v => (deg(Math.atan2(v.y, v.x)) + 360) % 360;
  function angleAt(V, A, B) {
    const u = unit(sub(A, V)), w = unit(sub(B, V));
    return deg(Math.acos(Math.max(-1, Math.min(1, dot(u, w)))));
  }
  function centroid(pts) { return P(pts.reduce((s, p) => s + p.x, 0) / pts.length, pts.reduce((s, p) => s + p.y, 0) / pts.length); }
  function bbox(pts) {
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  }

  // =====================================================================
  // 3. Letter sets (I and O avoided, except O as a centre point)
  // =====================================================================
  const PAIR_LETTER_SETS = [
    [['A', 'B', 'C'], ['D', 'E', 'F']], [['A', 'B', 'C'], ['P', 'Q', 'R']], [['P', 'Q', 'R'], ['X', 'Y', 'Z']],
    [['D', 'E', 'F'], ['L', 'M', 'N']], [['K', 'L', 'M'], ['X', 'Y', 'Z']], [['E', 'F', 'G'], ['S', 'T', 'U']],
    [['A', 'B', 'C'], ['X', 'Y', 'Z']], [['L', 'M', 'N'], ['R', 'S', 'T']], [['U', 'V', 'W'], ['F', 'G', 'H']],
    [['A', 'B', 'C'], ['K', 'L', 'M']], [['G', 'H', 'J'], ['P', 'Q', 'R']], [['R', 'S', 'T'], ['X', 'Y', 'Z']]
  ];
  const QUAD_LETTER_SETS = [['A', 'B', 'C', 'D'], ['P', 'Q', 'R', 'S'], ['K', 'L', 'M', 'N'], ['E', 'F', 'G', 'H'],
    ['W', 'X', 'Y', 'Z'], ['J', 'K', 'L', 'M'], ['T', 'U', 'V', 'W']];
  const FIVE_LETTER_SETS = [['A', 'B', 'C', 'D', 'E'], ['P', 'Q', 'R', 'S', 'T'], ['J', 'K', 'L', 'M', 'N'],
    ['V', 'W', 'X', 'Y', 'Z'], ['F', 'G', 'H', 'J', 'K'], ['R', 'S', 'T', 'U', 'V']];

  // =====================================================================
  // 4. Triangle generation: one random point in each of three disjoint rectangles
  // =====================================================================
  // Rectangles live in a 100 x 100 box (y down). The gaps between them guarantee a
  // proper triangle; we then reject triangles that are too thin or nearly isosceles
  // (an isosceles triangle would make the vertex mapping ambiguous).
  const VERTEX_RECTS = [
    { x: [0, 35], y: [62, 100] },   // bottom-left
    { x: [65, 100], y: [55, 100] }, // bottom-right
    { x: [18, 82], y: [0, 30] }     // top band
  ];
  function triAngles(p) { return [angleAt(p[0], p[1], p[2]), angleAt(p[1], p[2], p[0]), angleAt(p[2], p[0], p[1])]; }
  function triSides(p) { return [dist(p[1], p[2]), dist(p[2], p[0]), dist(p[0], p[1])]; } // side i is opposite vertex i
  function goodTriangle(p, o) {
    o = Object.assign({ minAngle: 28, maxAngle: 118, angleGap: 9, sideGap: 0.10, sideRatio: 0.42 }, o || {});
    const A = triAngles(p), S = triSides(p), mx = Math.max(...S);
    if (Math.min(...A) < o.minAngle || Math.max(...A) > o.maxAngle) return false;
    if (Math.min(...S) / mx < o.sideRatio) return false;
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      if (Math.abs(A[i] - A[j]) < o.angleGap) return false;
      if (Math.abs(S[i] - S[j]) / mx < o.sideGap) return false;
    }
    return true;
  }
  function genScalene(rng) {
    for (let k = 0; k < 2000; k++) {
      const pts = VERTEX_RECTS.map(R => P(rng.float(R.x[0], R.x[1]), rng.float(R.y[0], R.y[1])));
      if (goodTriangle(pts)) return pts;
    }
    return [P(5, 95), P(95, 80), P(38, 6)];
  }
  function genRight(rng) {
    for (let k = 0; k < 2000; k++) {
      const a = rng.float(45, 100), b = rng.float(40, 100);
      const pts = [P(0, 0), P(a, 0), P(0, -b)]; // right angle at index 0
      if (goodTriangle(pts, { maxAngle: 90.5 })) return pts;
    }
    return [P(0, 0), P(90, 0), P(0, -50)];
  }

  // =====================================================================
  // 5. Elements, facts and text helpers
  // =====================================================================
  // side element:  { t:'side',  p:['A','B'] }
  // angle element: { t:'angle', v:'B', a:'A', c:'C' }   (angle ABC)
  const side = (a, b) => ({ t: 'side', p: [a, b] });
  const ang = (a, v, c) => ({ t: 'angle', v: v, a: a, c: c });
  function elStr(e) { return e.t === 'side' ? e.p.join('') : '∠' + e.a + e.v + e.c; }
  function elKey(e) { return e.t === 'side' ? 'S:' + e.p.slice().sort().join('') : 'A:' + e.v + ':' + [e.a, e.c].sort().join(''); }
  function mapEl(e, m) { return e.t === 'side' ? side(m[e.p[0]], m[e.p[1]]) : ang(m[e.a], m[e.v], m[e.c]); }
  const TRI = '△', EQUIV = '≡', MAPSTO = '↦', DEGREE = '°', ANGLE = '∠';

  const REASONS = {
    given: 'Given',
    'common-side': 'Common side',
    'common-angle': 'Common angle',
    'vert-opp': 'Vertically opposite angles',
    alternate: 'Alternate angles (parallel lines)',
    'right-given': 'Given right angles'
  };
  const REASON_OPTIONS = Object.keys(REASONS).map(k => ({ value: k, label: REASONS[k] }));

  // A "fact" is one row of a congruence proof. kind: S (side), A (angle), R (right angle), H (hypotenuse)
  function fact(kind, el, reason, note) { return { kind: kind, el: el, reason: reason || 'given', note: note || '' }; }

  // ---------------------------------------------------------------------
  // Positional classification of three facts about ONE triangle (elements named with that triangle's letters).
  // Our course has four tests. Position matters:
  //   SAS  the angle is BETWEEN the two sides (at the vertex the sides share)
  //   AAS  the side is OPPOSITE one of the two angles (NOT between them)
  //   RHS  a right angle, the hypotenuse (opposite it) and one other side
  // Anything else is not a test: ASA (side between the angles), SSA (angle not between the sides), AAA.
  // ---------------------------------------------------------------------
  const VALID_TESTS = ['SSS', 'SAS', 'AAS', 'RHS'];
  function classifyFacts(fs) {
    if (fs.length !== 3 || new Set(fs.map(f => elKey(f.el))).size !== 3) return 'INVALID';
    const S = fs.filter(f => f.el.t === 'side'), A = fs.filter(f => f.el.t === 'angle');
    if (S.length === 3) return 'SSS';
    if (A.length === 3) return 'AAA';
    if (S.length === 2) {
      const v = A[0].el.v, shared = S[0].el.p.find(x => S[1].el.p.includes(x));
      if (shared === v) return 'SAS';
      if (A[0].kind === 'R') {
        const legs = S.filter(x => x.el.p.includes(v)), hyp = S.filter(x => !x.el.p.includes(v));
        if (legs.length === 1 && hyp.length === 1) return 'RHS';
      }
      return 'SSA';
    }
    const p = S[0].el.p, v1 = A[0].el.v, v2 = A[1].el.v;
    if (v1 === v2) return 'INVALID';
    return p.includes(v1) && p.includes(v2) ? 'ASA' : 'AAS';
  }
  function combos3(arr) {
    const out = [];
    for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) for (let k = j + 1; k < arr.length; k++) out.push([arr[i], arr[j], arr[k]]);
    return out;
  }
  // Which of our four tests can be proved from a pool of known facts?
  function analysePool(pool) {
    const triples = combos3(pool).map(t => ({ facts: t, test: classifyFacts(t) })).filter(x => VALID_TESTS.includes(x.test));
    return { validTests: [...new Set(triples.map(x => x.test))], triples: triples };
  }
  const NOT_A_TEST = {
    ASA: 'The side is BETWEEN the two angles. That is ASA, which is not one of our tests. For AAS the side must be opposite one of the equal angles.',
    SSA: 'The angle is NOT between the two sides, so this is not SAS (and without a right angle and hypotenuse it is not RHS).',
    AAA: 'Three pairs of angles only show the triangles are the same shape, not the same size. You need a pair of sides.',
    INVALID: 'You need three different pairs.'
  };

  // =====================================================================
  // 6. Figures and marks
  // =====================================================================
  // figure = { W, H, points:{A:{x,y}}, segments:[['A','B']], polys:[{v:[..], role:'t1'|'t2'}], marks:[..], fills:bool }
  // marks: {k:'tick', a,b,n} {k:'sideval', a,b,text,away:'C'} {k:'arc', v,a,b,n} {k:'angval', v,a,b,text}
  //        {k:'right', v,a,b} {k:'para', a,b,n}
  function fitPoints(world, W, H, margin) {
    const keys = Object.keys(world), pts = keys.map(k => world[k]);
    const b = bbox(pts), s = Math.min((W - 2 * margin) / (b.x1 - b.x0 || 1), (H - 2 * margin) / (b.y1 - b.y0 || 1));
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, out = {};
    keys.forEach(k => { out[k] = P(W / 2 + (world[k].x - cx) * s, H / 2 + (world[k].y - cy) * s); });
    return out;
  }

  // =====================================================================
  // 7. SEPARATE PAIRS (two triangles side by side; second one rotated and/or reflected)
  // =====================================================================
  // Which elements are marked for each test. Indices refer to triangle vertices 0,1,2.
  function chooseTestElements(rng, test, rightIndex, opts) {
    const idx = [0, 1, 2];
    if (test === 'SSS') {
      const t = rng.shuffle([1, 2, 3]);
      return { sides: [[1, 2, t[0]], [2, 0, t[1]], [0, 1, t[2]]], angles: [], right: null,
        factsOrder: [0, 1, 2].map(i => ({ kind: 'S', s: i })) };
    }
    if (test === 'SAS') {
      const v = rng.int(0, 2), o = idx.filter(i => i !== v), t = rng.shuffle([1, 2]);
      return { sides: [[v, o[0], t[0]], [v, o[1], t[1]]], angles: [[v, 1]], right: null,
        factsOrder: [{ kind: 'S', s: 0 }, { kind: 'A', a: 0 }, { kind: 'S', s: 1 }] };
    }
    if (test === 'AAS') {
      const pair = rng.shuffle(idx), u = pair[0], w = pair[1], x = pair[2], arcs = rng.shuffle([1, 2]);
      // AAS: the marked side joins w and x, so it is OPPOSITE the angle at u and NOT between the two marked angles
      // (a side between the two angles would be ASA, which is not one of our tests)
      const sideEnds = [w, x];
      return { sides: [[sideEnds[0], sideEnds[1], 1]], angles: [[u, arcs[0]], [w, arcs[1]]], right: null,
        factsOrder: [{ kind: 'A', a: 0 }, { kind: 'A', a: 1 }, { kind: 'S', s: 0 }] };
    }
    if (test === 'RHS') {
      const r = rightIndex, o = idx.filter(i => i !== r), leg = rng.pick(o), t = rng.shuffle([1, 2]);
      return { sides: [[o[0], o[1], t[0], 'H'], [r, leg, t[1]]], angles: [], right: r,
        factsOrder: [{ kind: 'R' }, { kind: 'H', s: 0 }, { kind: 'S', s: 1 }] };
    }
    if (test === 'SSA') { // not enough information: two sides and a NON-included angle
      const v = rng.int(0, 2), o = idx.filter(i => i !== v), t = rng.shuffle([1, 2]);
      return { sides: [[v, o[0], t[0]], [o[0], o[1], t[1]]], angles: [[o[1], 1]], right: null, factsOrder: [] };
    }
    if (test === 'AAA') {
      const a = rng.shuffle([1, 2, 3]);
      return { sides: [], angles: [[0, a[0]], [1, a[1]], [2, a[2]]], right: null, factsOrder: [] };
    }
    throw new Error('Unknown test ' + test);
  }

  // Work out which tests the known facts actually prove (used by every checker)
  function finalize(base) {
    const a = analysePool(base.pool);
    base.validTests = a.validTests;
    base.validTriples = a.triples;
    if (base.test !== 'NONE') base.canonicalTest = classifyFacts(base.facts);
    return base;
  }

  function makePair(rng, o) {
    o = Object.assign({ test: 'SAS', difficulty: 2, style: 'ticks' }, o);
    const test = o.test;
    let pts, rightIndex = null;
    if (test === 'RHS') {
      pts = genRight(rng);
      const perm = rng.shuffle([0, 1, 2]);           // put the right angle at a random vertex index
      pts = perm.map(i => pts[i]); rightIndex = perm.indexOf(0);
    } else pts = genScalene(rng);
    // vary the first triangle's orientation too
    const spin = rng.float(0, 360);
    pts = pts.map(p => rot(p, spin));
    // isometry for the second triangle
    const reflect = o.difficulty >= 2 ? rng.chance(0.5) : false;
    const turn = o.difficulty <= 1 ? rng.pick([-1, 1]) * rng.float(35, 80) : rng.float(30, 330);
    let pts2 = pts.map(p => rot(P(reflect ? -p.x : p.x, p.y), turn));
    // letters
    const set = o.letters || rng.pick(PAIR_LETTER_SETS);
    const L1 = set[0].slice();
    let perm2;
    do { perm2 = rng.shuffle([0, 1, 2]); } while (o.difficulty >= 2 && perm2.join('') === '012'); // never alphabetical at difficulty 2+
    const L2 = perm2.map(i => set[1][i]);   // L2[i] is the image of L1[i]
    // layout: common scale so both copies are visibly the same size
    const W = 470, H = 245, boxW = 150, boxH = 160;
    const b1 = bbox(pts), b2 = bbox(pts2);
    const s = Math.min(boxW / (b1.x1 - b1.x0), boxH / (b1.y1 - b1.y0), boxW / (b2.x1 - b2.x0), boxH / (b2.y1 - b2.y0));
    const place = (arr, b, cx) => arr.map(p => P(cx + (p.x - (b.x0 + b.x1) / 2) * s, H / 2 + (p.y - (b.y0 + b.y1) / 2) * s));
    const q1 = place(pts, b1, W * 0.25), q2 = place(pts2, b2, W * 0.75);
    const points = {};
    L1.forEach((l, i) => { points[l] = q1[i]; });
    L2.forEach((l, i) => { points[l] = q2[i]; });
    const mapping = {}; L1.forEach((l, i) => { mapping[l] = L2[i]; });

    const sel = chooseTestElements(rng, test, rightIndex, {});
    const style = o.style === 'mixed' ? rng.pick(['ticks', 'values']) : o.style;
    const marks = [];
    // numeric values
    const realSides = triSides(pts), realAngles = triAngles(pts);
    // choose a scale whose rounded side lengths are all different (equal labels would wrongly suggest equal sides)
    let k = rng.int(9, 16) / Math.max(...realSides);
    for (let tries = 0; tries < 40; tries++) {
      const r = realSides.map(x => Math.round(x * k));
      if (new Set(r).size === 3) break;
      k = rng.int(9, 20) / Math.max(...realSides);
    }
    const sideVal = (i, j) => Math.round(dist(pts[i], pts[j]) * k);
    const angleVal = i => Math.round(realAngles[i]);
    const unitTxt = o.units === false ? '' : ' cm';
    for (const [tri, L] of [[0, L1], [1, L2]]) {
      for (const sd of sel.sides) {
        const a = L[sd[0]], b = L[sd[1]], away = L[3 - sd[0] - sd[1]];
        if (style === 'values') marks.push({ k: 'sideval', a: a, b: b, text: sideVal(sd[0], sd[1]) + unitTxt, away: away });
        else marks.push({ k: 'tick', a: a, b: b, n: sd[2] });
      }
      for (const an of sel.angles) {
        const v = L[an[0]], others = [0, 1, 2].filter(i => i !== an[0]).map(i => L[i]);
        if (style === 'values') marks.push({ k: 'angval', v: v, a: others[0], b: others[1], text: angleVal(an[0]) + DEGREE });
        else marks.push({ k: 'arc', v: v, a: others[0], b: others[1], n: an[1] });
      }
      if (sel.right !== null) {
        const v = L[sel.right], others = [0, 1, 2].filter(i => i !== sel.right).map(i => L[i]);
        marks.push({ k: 'right', v: v, a: others[0], b: others[1] });
      }
    }
    // facts in standard order for the test
    const facts = sel.factsOrder.map(f => {
      if (f.kind === 'S' || f.kind === 'H') { const sd = sel.sides[f.s]; return fact(f.kind, side(L1[sd[0]], L1[sd[1]]), 'given'); }
      if (f.kind === 'A') { const i = sel.angles[f.a][0], o2 = [0, 1, 2].filter(j => j !== i); return fact('A', ang(L1[o2[0]], L1[i], L1[o2[1]]), 'given'); }
      const r = sel.right, o2 = [0, 1, 2].filter(j => j !== r); return fact('R', ang(L1[o2[0]], L1[r], L1[o2[1]]), 'right-given');
    });
    // pool = every pair of equal parts the student is allowed to use (here: everything that is marked)
    const pool = [];
    sel.sides.forEach(sd => pool.push(fact(sd[3] === 'H' ? 'H' : 'S', side(L1[sd[0]], L1[sd[1]]), 'given')));
    sel.angles.forEach(an => { const o2 = [0, 1, 2].filter(j => j !== an[0]); pool.push(fact('A', ang(L1[o2[0]], L1[an[0]], L1[o2[1]]), 'given')); });
    if (sel.right !== null) { const o2 = [0, 1, 2].filter(j => j !== sel.right); pool.push(fact('R', ang(L1[o2[0]], L1[sel.right], L1[o2[1]]), 'right-given')); }
    const figure = {
      W: W, H: H, points: points,
      segments: [[L1[0], L1[1]], [L1[1], L1[2]], [L1[2], L1[0]], [L2[0], L2[1]], [L2[1], L2[2]], [L2[2], L2[0]]],
      polys: [{ v: L1, role: 't1' }, { v: L2, role: 't2' }], marks: marks, fills: false
    };
    return finalize({
      kind: 'pair', config: 'separate', test: (test === 'SSA' || test === 'AAA') ? 'NONE' : test, rawTest: test,
      figure: figure, tri1: L1, tri2: L2, mapping: mapping, facts: facts, pool: pool, style: style, rightVertex: sel.right !== null ? L1[sel.right] : null,
      transform: { reflect: reflect, rotate: Math.round(turn) }, fixed: [], swaps: [], sel: sel, ambiguousVertices: [], lines: []
    });
  }

  // =====================================================================
  // 8. SHARED-VERTEX / SHARED-SIDE CONFIGURATIONS
  // =====================================================================
  // Each builder returns world coordinates for named ROLES, the two triangles as role lists
  // (t2[i] is the image of t1[i]), and the facts/marks for each available test.
  function sc(o) { return goodTriangle(o, { minAngle: 20, maxAngle: 140, angleGap: 7, sideGap: 0.08, sideRatio: 0.3 }); }

  const CONFIGS = {
    kite: {
      label: 'Kite cut along its line of symmetry',
      transform: 'reflection in the shared side', letters: 4,
      cycle: ['T', 'R', 'B', 'L'],
      build(rng) {
        for (let k = 0; k < 500; k++) {
          const h1 = rng.float(45, 80), h2 = rng.float(95, 140), w = rng.float(50, 80), y = rng.float(-12, 18);
          const R = { T: P(0, -h1), R: P(w, y), B: P(0, h2), L: P(-w, y) };
          if (sc([R.L, R.T, R.B])) return R;
        }
      },
      t1: ['L', 'T', 'B'], t2: ['R', 'T', 'B'],
      segments: [['T', 'R'], ['R', 'B'], ['B', 'L'], ['L', 'T'], ['T', 'B']],
      tests: {
        SAS: { facts: [['S', side('L', 'T'), 'given'], ['A', ang('L', 'T', 'B'), 'given'], ['S', side('T', 'B'), 'common-side']],
          marks: [{ k: 'tick', a: 'L', b: 'T', n: 1 }, { k: 'tick', a: 'R', b: 'T', n: 1 }, { k: 'arc', v: 'T', a: 'L', b: 'B', n: 1 }, { k: 'arc', v: 'T', a: 'R', b: 'B', n: 1 }] },
        SSS: { facts: [['S', side('L', 'T'), 'given'], ['S', side('L', 'B'), 'given'], ['S', side('T', 'B'), 'common-side']],
          marks: [{ k: 'tick', a: 'L', b: 'T', n: 1 }, { k: 'tick', a: 'R', b: 'T', n: 1 }, { k: 'tick', a: 'L', b: 'B', n: 2 }, { k: 'tick', a: 'R', b: 'B', n: 2 }] }
      }
    },
    'isosceles-split': {
      label: 'Isosceles triangle split by a line from the apex to the base',
      transform: 'reflection in the shared side', letters: 4,
      build(rng) {
        for (let k = 0; k < 500; k++) {
          const h = rng.float(90, 150), w = rng.float(45, 85);
          const R = { A: P(0, -h), B: P(-w, 0), C: P(w, 0), M: P(0, 0) };
          if (sc([R.A, R.B, R.M])) return R;
        }
      },
      t1: ['A', 'B', 'M'], t2: ['A', 'C', 'M'],
      segments: [['A', 'B'], ['A', 'C'], ['B', 'M'], ['M', 'C'], ['A', 'M']],
      lines: [['B', 'M', 'C']],
      tests: {
        SSS: { facts: [['S', side('A', 'B'), 'given'], ['S', side('B', 'M'), 'given'], ['S', side('A', 'M'), 'common-side']],
          marks: [{ k: 'tick', a: 'A', b: 'B', n: 1 }, { k: 'tick', a: 'A', b: 'C', n: 1 }, { k: 'tick', a: 'B', b: 'M', n: 2 }, { k: 'tick', a: 'C', b: 'M', n: 2 }] },
        RHS: { facts: [['R', ang('A', 'M', 'B'), 'right-given'], ['H', side('A', 'B'), 'given'], ['S', side('A', 'M'), 'common-side']],
          marks: [{ k: 'right', v: 'M', a: 'A', b: 'B' }, { k: 'right', v: 'M', a: 'A', b: 'C' }, { k: 'tick', a: 'A', b: 'B', n: 1 }, { k: 'tick', a: 'A', b: 'C', n: 1 }] },
        SAS: { facts: [['S', side('A', 'B'), 'given'], ['A', ang('B', 'A', 'M'), 'given'], ['S', side('A', 'M'), 'common-side']],
          marks: [{ k: 'tick', a: 'A', b: 'B', n: 1 }, { k: 'tick', a: 'A', b: 'C', n: 1 }, { k: 'arc', v: 'A', a: 'B', b: 'M', n: 1 }, { k: 'arc', v: 'A', a: 'C', b: 'M', n: 1 }] }
      }
    },
    parallelogram: {
      label: 'Parallelogram cut by a diagonal',
      transform: 'half-turn about the middle of the diagonal (the ends of the diagonal swap)', letters: 4,
      cycle: ['P1', 'P2', 'P3', 'P4'],
      build(rng) {
        for (let k = 0; k < 500; k++) {
          const L1 = rng.float(110, 160), L2 = rng.float(60, 100), f = rng.float(52, 75);
          if (Math.abs(L1 - L2) / L1 < 0.25) continue;
          const v = P(L2 * Math.cos(rad(f)), -L2 * Math.sin(rad(f)));
          const R = { P1: P(0, 0), P2: P(L1, 0), P3: P(L1 + v.x, v.y), P4: v };
          if (sc([R.P1, R.P2, R.P3]) && sc([R.P2, R.P3, R.P4])) return R;
        }
      },
      diagonal: true, // t1/t2 are chosen from the diagonal at build time
      segments: [['P1', 'P2'], ['P2', 'P3'], ['P3', 'P4'], ['P4', 'P1']],
      tests: {
        SSS: { facts: d => [['S', side(d.d1, d.o1), 'given'], ['S', side(d.o1, d.d2), 'given'], ['S', side(d.d1, d.d2), 'common-side']],
          marks: d => [{ k: 'tick', a: d.d1, b: d.o1, n: 1 }, { k: 'tick', a: d.d2, b: d.o2, n: 1 }, { k: 'tick', a: d.o1, b: d.d2, n: 2 }, { k: 'tick', a: d.o2, b: d.d1, n: 2 }] },
        SAS: { facts: d => [['S', side(d.d1, d.o1), 'given'], ['A', ang(d.o1, d.d1, d.d2), 'alternate', side(d.d1, d.o1)], ['S', side(d.d1, d.d2), 'common-side']],
          marks: d => [{ k: 'tick', a: d.d1, b: d.o1, n: 1 }, { k: 'tick', a: d.d2, b: d.o2, n: 1 }, { k: 'para', a: d.d1, b: d.o1, n: 1 }, { k: 'para', a: d.o2, b: d.d2, n: 1 }] }
      }
    },
    'rectangle-diagonal': {
      label: 'Rectangle cut by a diagonal',
      transform: 'half-turn about the middle of the diagonal (the ends of the diagonal swap)', letters: 4,
      cycle: ['P1', 'P2', 'P3', 'P4'],
      build(rng) {
        for (let k = 0; k < 500; k++) {
          const L1 = rng.float(110, 170), L2 = rng.float(55, 100);
          if (Math.abs(L1 - L2) / L1 < 0.3) continue;
          const R = { P1: P(0, 0), P2: P(L1, 0), P3: P(L1, -L2), P4: P(0, -L2) };
          const t = rng.float(-25, 25);
          Object.keys(R).forEach(key => { R[key] = rot(R[key], t); });
          if (sc([R.P1, R.P2, R.P3])) return R;
        }
      },
      diagonal: true,
      segments: [['P1', 'P2'], ['P2', 'P3'], ['P3', 'P4'], ['P4', 'P1']],
      tests: {
        RHS: { facts: d => [['R', ang(d.d1, d.o1, d.d2), 'right-given'], ['H', side(d.d1, d.d2), 'common-side'], ['S', side(d.d1, d.o1), 'given']],
          marks: d => [{ k: 'right', v: d.o1, a: d.d1, b: d.d2 }, { k: 'right', v: d.o2, a: d.d1, b: d.d2 }, { k: 'tick', a: d.d1, b: d.o1, n: 1 }, { k: 'tick', a: d.d2, b: d.o2, n: 1 }] }
      }
    },
    bowtie: {
      label: 'Two triangles meeting at a point (vertically opposite angles)',
      transform: 'half-turn about the shared vertex', letters: 5,
      build(rng) {
        for (let k = 0; k < 500; k++) {
          const a = rng.float(60, 105), b = rng.float(45, 95), g = rng.float(40, 78);
          if (Math.abs(a - b) / Math.max(a, b) < 0.15) continue;
          const u = P(1, 0), w = polar(g, 1);
          const R = { X: mul(u, -a), Y: mul(w, -b), Xp: mul(u, a), Yp: mul(w, b), E: P(0, 0) };
          const t = rng.float(0, 360);
          Object.keys(R).forEach(key => { R[key] = rot(R[key], t); });
          if (sc([R.X, R.Y, R.E])) return R;
        }
      },
      t1: ['X', 'Y', 'E'], t2: ['Xp', 'Yp', 'E'],
      segments: [['X', 'E'], ['E', 'Xp'], ['Y', 'E'], ['E', 'Yp'], ['X', 'Y'], ['Xp', 'Yp']],
      lines: [['X', 'E', 'Xp'], ['Y', 'E', 'Yp']],
      tests: {
        SAS: { facts: [['S', side('X', 'E'), 'given'], ['A', ang('X', 'E', 'Y'), 'vert-opp'], ['S', side('E', 'Y'), 'given']],
          marks: [{ k: 'tick', a: 'X', b: 'E', n: 1 }, { k: 'tick', a: 'Xp', b: 'E', n: 1 }, { k: 'tick', a: 'Y', b: 'E', n: 2 }, { k: 'tick', a: 'Yp', b: 'E', n: 2 }] },
        AAS: { facts: [['A', ang('X', 'Y', 'E'), 'alternate', side('X', 'Y')], ['A', ang('X', 'E', 'Y'), 'vert-opp'], ['S', side('X', 'E'), 'given']],
          extra: [['A', ang('Y', 'X', 'E'), 'alternate', side('X', 'Y')]],
          marks: [{ k: 'para', a: 'X', b: 'Y', n: 1 }, { k: 'para', a: 'Yp', b: 'Xp', n: 1 }, { k: 'tick', a: 'X', b: 'E', n: 1 }, { k: 'tick', a: 'Xp', b: 'E', n: 1 }] }
      }
    },
    windmill: {
      label: 'Two triangles sharing one vertex (rotation about that vertex)',
      transform: 'rotation about the shared vertex', letters: 5,
      build(rng) {
        for (let k = 0; k < 500; k++) {
          const r1 = rng.float(75, 115), r2 = rng.float(45, 95), al = rng.float(35, 62), t0 = rng.float(0, 360);
          if (Math.abs(r1 - r2) / r1 < 0.18) continue;
          const ph = rng.float(al + 35, 325 - al);
          const R = { O: P(0, 0), X: polar(t0, r1), Y: polar(t0 + al, r2), Xp: polar(t0 + ph, r1), Yp: polar(t0 + ph + al, r2) };
          if (sc([R.O, R.X, R.Y])) return R;
        }
      },
      t1: ['O', 'X', 'Y'], t2: ['O', 'Xp', 'Yp'],
      segments: [['O', 'X'], ['O', 'Y'], ['X', 'Y'], ['O', 'Xp'], ['O', 'Yp'], ['Xp', 'Yp']],
      tests: {
        SAS: { facts: [['S', side('O', 'X'), 'given'], ['A', ang('X', 'O', 'Y'), 'given'], ['S', side('O', 'Y'), 'given']],
          marks: [{ k: 'tick', a: 'O', b: 'X', n: 1 }, { k: 'tick', a: 'O', b: 'Xp', n: 1 }, { k: 'tick', a: 'O', b: 'Y', n: 2 }, { k: 'tick', a: 'O', b: 'Yp', n: 2 }, { k: 'arc', v: 'O', a: 'X', b: 'Y', n: 1 }, { k: 'arc', v: 'O', a: 'Xp', b: 'Yp', n: 1 }] },
        SSS: { facts: [['S', side('O', 'X'), 'given'], ['S', side('O', 'Y'), 'given'], ['S', side('X', 'Y'), 'given']],
          marks: [{ k: 'tick', a: 'O', b: 'X', n: 1 }, { k: 'tick', a: 'O', b: 'Xp', n: 1 }, { k: 'tick', a: 'O', b: 'Y', n: 2 }, { k: 'tick', a: 'O', b: 'Yp', n: 2 }, { k: 'tick', a: 'X', b: 'Y', n: 3 }, { k: 'tick', a: 'Xp', b: 'Yp', n: 3 }] }
      }
    },
    'isosceles-overlap': {
      label: 'Overlapping triangles inside an isosceles triangle (shared angle)',
      transform: 'reflection in the axis of symmetry', letters: 5,
      build(rng) {
        for (let k = 0; k < 500; k++) {
          const h = rng.float(130, 175), w = rng.float(55, 85), t = rng.float(0.3, 0.42);
          const A = P(0, -h), B = P(-w, 0), C = P(w, 0);
          const R = { A: A, B: B, C: C, D: add(A, mul(sub(B, A), t)), E: add(A, mul(sub(C, A), t)) };
          if (sc([R.A, R.B, R.E])) return R;
        }
      },
      t1: ['A', 'B', 'E'], t2: ['A', 'C', 'D'],
      segments: [['A', 'D'], ['D', 'B'], ['A', 'E'], ['E', 'C'], ['B', 'E'], ['C', 'D'], ['B', 'C']],
      lines: [['A', 'D', 'B'], ['A', 'E', 'C']], // collinear points, in order, for angle-naming checks
      tests: {
        SAS: { facts: [['S', side('A', 'B'), 'given'], ['A', ang('B', 'A', 'E'), 'common-angle'], ['S', side('A', 'E'), 'given']],
          marks: [{ k: 'tick', a: 'A', b: 'B', n: 1 }, { k: 'tick', a: 'A', b: 'C', n: 1 }, { k: 'tick', a: 'A', b: 'D', n: 2 }, { k: 'tick', a: 'A', b: 'E', n: 2 }] }
      }
    },
    'rectangle-overlap': {
      label: 'Overlapping triangles in a rectangle (shared side)',
      transform: 'reflection in the perpendicular bisector of the shared side (its ends swap)', letters: 4,
      cycle: ['P1', 'P2', 'P3', 'P4'],
      build(rng) {
        for (let k = 0; k < 500; k++) {
          const L1 = rng.float(130, 180), L2 = rng.float(65, 105);
          if (Math.abs(L1 - L2) / L1 < 0.3) continue;
          const R = { P1: P(0, 0), P2: P(L1, 0), P3: P(L1, -L2), P4: P(0, -L2) };
          if (sc([R.P1, R.P2, R.P3])) return R;
        }
      },
      t1: ['P1', 'P2', 'P3'], t2: ['P2', 'P1', 'P4'],
      segments: [['P1', 'P2'], ['P2', 'P3'], ['P3', 'P4'], ['P4', 'P1'], ['P1', 'P3'], ['P2', 'P4']],
      tests: {
        SAS: { facts: [['S', side('P1', 'P2'), 'common-side'], ['R', ang('P1', 'P2', 'P3'), 'right-given'], ['S', side('P2', 'P3'), 'given']],
          marks: [{ k: 'right', v: 'P2', a: 'P1', b: 'P3' }, { k: 'right', v: 'P1', a: 'P2', b: 'P4' }, { k: 'tick', a: 'P2', b: 'P3', n: 1 }, { k: 'tick', a: 'P1', b: 'P4', n: 1 }] },
        RHS: { facts: [['R', ang('P1', 'P2', 'P3'), 'right-given'], ['H', side('P1', 'P3'), 'given'], ['S', side('P1', 'P2'), 'common-side']],
          marks: [{ k: 'right', v: 'P2', a: 'P1', b: 'P3' }, { k: 'right', v: 'P1', a: 'P2', b: 'P4' }, { k: 'tick', a: 'P1', b: 'P3', n: 2, pos: 0.25 }, { k: 'tick', a: 'P2', b: 'P4', n: 2, pos: 0.25 }] }
      }
    }
  };
  const CONFIG_NAMES = Object.keys(CONFIGS);

  function assignLetters(rng, cfg, roles) {
    // keep letters in order around a quadrilateral when the config has a cycle
    if (cfg.cycle) {
      const set = rng.pick(QUAD_LETTER_SETS), start = rng.int(0, 3), dirn = rng.pick([1, -1]), m = {};
      cfg.cycle.forEach((role, i) => { m[role] = set[((start + dirn * i) % 4 + 4) % 4]; });
      return m;
    }
    const n = roles.length, m = {};
    if (cfg === CONFIGS.windmill && rng.chance(0.5)) { // centre called O, the rest from a 4-letter set
      m.O = 'O'; const rest = rng.shuffle(rng.pick(QUAD_LETTER_SETS));
      roles.filter(r => r !== 'O').forEach((r, i) => { m[r] = rest[i]; });
      return m;
    }
    const letters = rng.shuffle(n === 4 ? rng.pick(QUAD_LETTER_SETS) : rng.pick(FIVE_LETTER_SETS));
    roles.forEach((r, i) => { m[r] = letters[i]; });
    return m;
  }

  function makeShared(rng, o) {
    o = Object.assign({ config: null, test: null }, o);
    const name = o.config || rng.pick(CONFIG_NAMES);
    const cfg = CONFIGS[name];
    let world = cfg.build(rng);
    for (let k = 0; !world && k < 20; k++) world = cfg.build(rng);
    if (!world) throw new Error('Could not build configuration ' + name);
    const roles = Object.keys(world);
    const L = assignLetters(rng, cfg, roles);
    let t1r, t2r, d = null;
    if (cfg.diagonal) {
      const useAC = rng.chance(0.5);
      d = useAC ? { d1: 'P1', o1: 'P2', d2: 'P3', o2: 'P4' } : { d1: 'P2', o1: 'P3', d2: 'P4', o2: 'P1' };
      t1r = [d.d1, d.o1, d.d2]; t2r = [d.d2, d.o2, d.d1];
    } else { t1r = cfg.t1; t2r = cfg.t2; }
    const testNames = Object.keys(cfg.tests);
    const test = o.test && cfg.tests[o.test] ? o.test : rng.pick(testNames);
    const spec = cfg.tests[test];
    const rawFacts = typeof spec.facts === 'function' ? spec.facts(d) : spec.facts;
    const rawMarks = typeof spec.marks === 'function' ? spec.marks(d) : spec.marks;
    const segs = cfg.segments.slice();
    if (cfg.diagonal) segs.push([d.d1, d.d2]);
    // randomise the order in which the first triangle is named, keep correspondence
    const order = rng.shuffle([0, 1, 2]);
    const tri1 = order.map(i => L[t1r[i]]), tri2 = order.map(i => L[t2r[i]]);
    const mapping = {}; tri1.forEach((l, i) => { mapping[l] = tri2[i]; });
    // world -> letters, then fit to the canvas
    const wl = {}; roles.forEach(r => { wl[L[r]] = world[r]; });
    // random overall rotation for shapes that do not already rotate themselves
    if (name === 'kite' || name === 'isosceles-split' || name === 'parallelogram' || name === 'isosceles-overlap' || name === 'rectangle-overlap') {
      const t = name === 'kite' || name === 'isosceles-split' ? rng.pick([0, 90, 180, 270]) + rng.float(-20, 20)
        : name === 'isosceles-overlap' ? rng.pick([0, 0, 180]) + rng.float(-15, 15) : rng.float(-20, 20) + rng.pick([0, 180]);
      Object.keys(wl).forEach(k => { wl[k] = rot(wl[k], t); });
      if (rng.chance(0.5)) Object.keys(wl).forEach(k => { wl[k] = P(-wl[k].x, wl[k].y); });
    }
    const W = 360, H = 260;
    const points = fitPoints(wl, W, H, 42);
    const LL = r => L[r];
    const marks = rawMarks.map(m => {
      const c = Object.assign({}, m);
      ['a', 'b', 'v'].forEach(key => { if (c[key]) c[key] = LL(c[key]); });
      return c;
    });
    const facts = rawFacts.map(f => {
      const el = f[1].t === 'side' ? side(LL(f[1].p[0]), LL(f[1].p[1])) : ang(LL(f[1].a), LL(f[1].v), LL(f[1].c));
      let note = '';
      if (f[3]) note = f[3].p.map(LL).join('') + ' ∥ ' + mapEl(side(LL(f[3].p[0]), LL(f[3].p[1])), mapping).p.join('');
      return fact(f[0], el, f[2], note);
    });
    const extraFacts = (spec.extra ? (typeof spec.extra === 'function' ? spec.extra(d) : spec.extra) : []).map(f => {
      const el = f[1].t === 'side' ? side(LL(f[1].p[0]), LL(f[1].p[1])) : ang(LL(f[1].a), LL(f[1].v), LL(f[1].c));
      let note = '';
      if (f[3]) note = f[3].p.map(LL).join('') + ' \u2225 ' + mapEl(side(LL(f[3].p[0]), LL(f[3].p[1])), mapping).p.join('');
      return fact(f[0], el, f[2], note);
    });
    const pool = [];
    const addPool = f => { if (!pool.some(g => elKey(g.el) === elKey(f.el))) pool.push(f); };
    facts.forEach(addPool); extraFacts.forEach(addPool);
    // any side the two triangles share is always known (common side)
    [[0, 1], [1, 2], [2, 0]].forEach(([i, j]) => {
      const e = side(tri1[i], tri1[j]);
      if (elKey(mapEl(e, mapping)) === elKey(e)) addPool(fact('S', e, 'common-side'));
    });
    const fixed = tri1.filter(l => mapping[l] === l);
    const swaps = [];
    tri1.forEach(l => { const m = mapping[l]; if (m !== l && mapping[m] === l && l < m) swaps.push([l, m]); });
    // vertices where a single-letter angle name is ambiguous (3+ segments meet, or on a straight line)
    const degree = {};
    segs.forEach(s => { s.forEach(r => { degree[LL(r)] = (degree[LL(r)] || 0) + 1; }); });
    const ambiguous = Object.keys(degree).filter(k => degree[k] > 2);
    const lines = (cfg.lines || []).map(ln => ln.map(LL));
    return finalize({
      kind: 'shared', config: name, configLabel: cfg.label, transformText: cfg.transform, test: test, rawTest: test,
      figure: { W: W, H: H, points: points, segments: segs.map(s => s.map(LL)),
        polys: [{ v: tri1, role: 't1' }, { v: tri2, role: 't2' }], marks: marks, fills: true },
      tri1: tri1, tri2: tri2, mapping: mapping, facts: facts, pool: pool, fixed: fixed, swaps: swaps, ambiguousVertices: ambiguous, lines: lines
    });
  }

  // =====================================================================
  // 9. SVG renderer
  // =====================================================================
  const DEFAULT_STYLE = {
    stroke: '#1d1d1f', strokeWidth: 2, markWidth: 1.6,
    fill1: 'rgba(37, 99, 235, 0.13)', fill2: 'rgba(234, 88, 12, 0.13)',
    letterFont: '"Times New Roman", Times, serif', letterSize: 18, valueSize: 15,
    background: 'none'
  };
  function f1(v) { return (Math.round(v * 10) / 10).toString(); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function renderSVG(fig, style) {
    const S = Object.assign({}, DEFAULT_STYLE, style || {});
    const pt = fig.points, out = [];
    const W = fig.W, H = fig.H;
    out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" class="cb-figure" overflow="visible" style="max-width:${W * 1.4}px;overflow:visible">`);
    if (S.background !== 'none') out.push(`<rect width="${W}" height="${H}" fill="${S.background}"/>`);
    // fills (shared configurations only, so students can see which two triangles)
    if (fig.fills) {
      fig.polys.forEach((pl, i) => {
        out.push(`<polygon class="cb-fill cb-${pl.role}" points="${pl.v.map(l => f1(pt[l].x) + ',' + f1(pt[l].y)).join(' ')}" fill="${i === 0 ? S.fill1 : S.fill2}" stroke="none"/>`);
      });
    }
    // segments
    fig.segments.forEach(s => {
      const a = pt[s[0]], b = pt[s[1]];
      out.push(`<line class="cb-seg" x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}" stroke="${S.stroke}" stroke-width="${S.strokeWidth}" stroke-linecap="round"/>`);
    });
    const mk = (d) => `<path class="cb-mark" d="${d}" fill="none" stroke="${S.stroke}" stroke-width="${S.markWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const txt = (p, t, size, cls, italic) => `<text class="${cls}" x="${f1(p.x)}" y="${f1(p.y)}" font-family='${S.letterFont}' font-size="${size}" ${italic ? 'font-style="italic"' : ''} text-anchor="middle" dominant-baseline="central" fill="${S.stroke}">${esc(t)}</text>`;
    // arcs drawn at the same vertex get increasing radii so they never sit on top of each other
    const arcRadiusUsed = {};
    fig.marks.forEach(m => {
      if (m.k === 'tick') {
        const a = pt[m.a], b = pt[m.b], M = add(a, mul(sub(b, a), m.pos !== undefined ? m.pos : 0.5)), t = unit(sub(b, a)), n = P(-t.y, t.x);
        for (let i = 0; i < m.n; i++) {
          const Q = add(M, mul(t, (i - (m.n - 1) / 2) * 5));
          const p1 = add(Q, mul(n, 6)), p2 = add(Q, mul(n, -6));
          out.push(mk(`M${f1(p1.x)} ${f1(p1.y)} L${f1(p2.x)} ${f1(p2.y)}`));
        }
      } else if (m.k === 'para') {
        const ticked = fig.marks.some(o => o.k === 'tick' && ((o.a === m.a && o.b === m.b) || (o.a === m.b && o.b === m.a)));
        const a = pt[m.a], b = pt[m.b], M = add(a, mul(sub(b, a), ticked ? 0.72 : 0.5)), t = unit(sub(b, a)), n = P(-t.y, t.x);
        for (let i = 0; i < m.n; i++) {
          const tip = add(M, mul(t, 4 + (i - (m.n - 1) / 2) * 7));
          const p1 = add(add(tip, mul(t, -7)), mul(n, 5)), p2 = add(add(tip, mul(t, -7)), mul(n, -5));
          out.push(mk(`M${f1(p1.x)} ${f1(p1.y)} L${f1(tip.x)} ${f1(tip.y)} L${f1(p2.x)} ${f1(p2.y)}`));
        }
      } else if (m.k === 'arc' || m.k === 'angval') {
        const V = pt[m.v], u = unit(sub(pt[m.a], V)), w = unit(sub(pt[m.b], V));
        const th = angleAt(V, pt[m.a], pt[m.b]);
        const n = m.k === 'arc' ? m.n : 1;
        const base = Math.max(13, Math.min(24, 300 / th));
        for (let i = 0; i < n; i++) {
          const r = base + i * 4.5;
          const p1 = add(V, mul(u, r)), p2 = add(V, mul(w, r)), sweep = cross(u, w) > 0 ? 1 : 0;
          out.push(mk(`M${f1(p1.x)} ${f1(p1.y)} A${f1(r)} ${f1(r)} 0 0 ${sweep} ${f1(p2.x)} ${f1(p2.y)}`));
        }
        if (m.k === 'angval') {
          const bis = unit(add(u, w)), d = Math.min(60, Math.max(base + 15, 17 / Math.sin(rad(th / 2))));
          out.push(txt(add(V, mul(bis, d)), m.text, S.valueSize, 'cb-value', false));
        }
      } else if (m.k === 'right') {
        const V = pt[m.v], u = unit(sub(pt[m.a], V)), w = unit(sub(pt[m.b], V)), q = 11;
        const p1 = add(V, mul(u, q)), p2 = add(p1, mul(w, q)), p3 = add(V, mul(w, q));
        out.push(mk(`M${f1(p1.x)} ${f1(p1.y)} L${f1(p2.x)} ${f1(p2.y)} L${f1(p3.x)} ${f1(p3.y)}`));
      } else if (m.k === 'sideval') {
        const a = pt[m.a], b = pt[m.b], M = mul(add(a, b), 0.5), t = unit(sub(b, a));
        let n = P(-t.y, t.x);
        const away = pt[m.away];
        if (away && dot(sub(M, away), n) < 0) n = mul(n, -1);
        const wEst = String(m.text).length * S.valueSize * 0.5;
        const off = 9 + Math.abs(n.x) * wEst / 2 + Math.abs(n.y) * S.valueSize / 2;
        out.push(txt(add(M, mul(n, off)), m.text, S.valueSize, 'cb-value', false));
      }
    });
    // vertex letters: placed in the widest gap between the segments meeting at the vertex
    Object.keys(pt).forEach(l => {
      const V = pt[l];
      const dirs = [];
      fig.segments.forEach(s => {
        if (s[0] === l) dirs.push(dirDeg(sub(pt[s[1]], V)));
        if (s[1] === l) dirs.push(dirDeg(sub(pt[s[0]], V)));
      });
      let best = 0, mid = 270;
      if (dirs.length) {
        dirs.sort((a, b) => a - b);
        for (let i = 0; i < dirs.length; i++) {
          const a = dirs[i], b = i + 1 < dirs.length ? dirs[i + 1] : dirs[0] + 360, gap = b - a;
          if (gap > best) { best = gap; mid = a + gap / 2; }
        }
      }
      const pos = add(V, polar(mid, dirs.length > 2 ? 16 : 13));
      out.push(`<text class="cb-letter" data-vertex="${l}" x="${f1(pos.x)}" y="${f1(pos.y)}" font-family='${S.letterFont}' font-size="${S.letterSize}" font-style="italic" text-anchor="middle" dominant-baseline="central" fill="${S.stroke}">${l}</text>`);
    });
    out.push('</svg>');
    return out.join('');
  }

  // =====================================================================
  // 10. Hints: describe each vertex of triangle 1 by the marks that meet there
  // =====================================================================
  function markWords(m) {
    if (m.k === 'tick') return m.n === 1 ? 'one tick' : m.n === 2 ? 'two ticks' : 'three ticks';
    if (m.k === 'arc') return m.n === 1 ? 'one arc' : m.n === 2 ? 'two arcs' : 'three arcs';
    if (m.k === 'sideval' || m.k === 'angval') return m.text;
    return '';
  }
  function vertexHint(base, l) {
    const tri = base.tri1, ms = base.figure.marks;
    const inTri = (a, b) => tri.includes(a) && tri.includes(b);
    const sides = ms.filter(m => (m.k === 'tick' || m.k === 'sideval') && inTri(m.a, m.b) && (m.a === l || m.b === l));
    const angles = ms.filter(m => (m.k === 'arc' || m.k === 'angval') && m.v === l && inTri(m.a, m.b));
    const right = ms.find(m => m.k === 'right' && m.v === l && inTri(m.a, m.b));
    const opp = ms.filter(m => (m.k === 'tick' || m.k === 'sideval') && inTri(m.a, m.b) && m.a !== l && m.b !== l);
    const target = base.mapping[l];
    if (base.fixed.includes(l)) return `${l} is a corner of both triangles, and both triangles sit the same way round it, so ${l} ↦ ${l}.`;
    if (base.kind === 'shared') {
      const notShared1 = tri.filter(x => !base.tri2.includes(x));
      const swap = base.swaps.find(pr => pr.includes(l));
      if (swap) return `${swap[0]} and ${swap[1]} are the two ends of the shared side. The orange triangle is the blue one moved by a ${base.transformText}, so ${l} lands on the OTHER end of the shared side.`;
      if (notShared1.length === 1 && notShared1[0] === l) return `${l} is the only corner of the blue triangle that is not shared, so it matches the only corner of the orange triangle that is not shared.`;
    }
    const parts = [];
    if (right) parts.push(`${l} is the right angle`);
    if (angles.length) parts.push(`${l} has the angle marked ${markWords(angles[0])}`);
    if (sides.length === 2) parts.push(`${l} is where the sides marked ${markWords(sides[0])} and ${markWords(sides[1])} meet`);
    else if (sides.length === 1 && !angles.length && !right) {
      const other = sides[0].a === l ? sides[0].b : sides[0].a;
      parts.push(base.fixed.includes(other)
        ? `${l} is the end of the side marked ${markWords(sides[0])} that is not the shared corner ${other}`
        : `${l} is at one end of the side marked ${markWords(sides[0])}`);
    }
    if (!parts.length && opp.length) parts.push(`${l} is opposite the side marked ${markWords(opp[0])}`);
    let s = parts.length ? parts.join('; ') + '.' : `Find the other two vertices first; ${l} must go to the letter that is left.`;
    if (base.swaps.some(p => p.includes(l))) s += ` The two triangles have swapped ends of the shared side, so ${l} does not map to itself.`;
    void target;
    return s;
  }

  // =====================================================================
  // 11. Question builders
  // =====================================================================
  const TESTS = ['SSS', 'SAS', 'AAS', 'RHS'];
  const TEST_NAMES = { SSS: 'side, side, side', SAS: 'side, included angle, side', AAS: 'two angles and a side opposite one of them', RHS: 'right angle, hypotenuse, side', NONE: 'not enough information' };
  const triName = arr => TRI + arr.join('');

  function factRow(f, mapping) {
    const r = mapEl(f.el, mapping);
    const kindLabel = { S: 'Side', A: 'Angle', R: 'Right angle', H: 'Hypotenuse' }[f.kind];
    let reasonText = REASONS[f.reason];
    if (f.reason === 'alternate' && f.note) reasonText = 'Alternate angles, ' + f.note;
    return { kind: f.kind, kindLabel: kindLabel, left: elStr(f.el), right: elStr(r), leftEl: f.el, rightEl: r, note: f.note || '',
      reason: f.reason, reasonText: reasonText, letter: f.kind === 'R' ? 'A' : f.kind === 'H' ? 'H' : f.kind };
  }

  function baseFor(rng, o) {
    const shared = o.shared === true || (o.shared !== false && o.config) || (o.shared === undefined && o.difficulty >= 3 && rng.chance(0.75));
    if (shared) return makeShared(rng, { config: o.config, test: o.test });
    let test = o.test || rng.pick(TESTS);
    return makePair(rng, { test: test, difficulty: o.difficulty, style: o.style || (o.difficulty <= 1 ? rng.pick(['values', 'ticks']) : rng.pick(['ticks', 'ticks', 'values'])), asa: o.asa });
  }

  function common(type, family, rng, o, base, extra) {
    const q = Object.assign({
      id: `${type}-${o.difficulty}-${rng.seed}`, type: type, family: family, difficulty: o.difficulty, seed: rng.seed,
      config: base.config, configLabel: base.configLabel || 'Two separate triangles', test: base.test,
      tri1: base.tri1, tri2: base.tri2, mapping: base.mapping, statement: `${triName(base.tri1)} ${EQUIV} ${triName(base.tri2)}`,
      figure: base.figure, svg: renderSVG(base.figure, o.svgStyle),
      facts: base.facts.map(f => factRow(f, base.mapping)),
      pool: base.pool.map(f => factRow(f, base.mapping)),
      validTests: base.test === 'NONE' ? ['NONE'] : base.validTests,
      meta: { rawTest: base.rawTest, fixed: base.fixed, swaps: base.swaps, transform: base.transform || base.transformText, style: base.style, ambiguousVertices: base.ambiguousVertices, lines: base.lines || [] }
    }, extra);
    q.hints = q.hints || base.tri1.map(l => vertexHint(base, l));
    return q;
  }

  const BUILDERS = {
    // ---------------- Family 1: vertex mappings ----------------
    'map-pair'(rng, o) {
      const base = makePair(rng, { test: o.test || rng.pick(TESTS), difficulty: o.difficulty, style: o.style || rng.pick(['ticks', 'ticks', 'values']) });
      return common('map-pair', 'mapping', rng, o, base, {
        title: 'Match the vertices',
        prompt: `These two triangles are congruent. Use the markings to complete the vertex mapping from ${triName(base.tri1)}.`,
        input: { kind: 'mapping', rows: base.tri1, choices: base.tri2.slice().sort() },
        answer: { mapping: base.mapping },
        explanation: base.tri1.map(l => `${l} ${MAPSTO} ${base.mapping[l]}`).join(', ') + `, so ${triName(base.tri1)} ${EQUIV} ${triName(base.tri2)}.`
      });
    },
    'map-shared'(rng, o) {
      const base = makeShared(rng, { config: o.config, test: o.test });
      const give = o.giveStatement !== undefined ? o.giveStatement : rng.chance(0.5);
      return common('map-shared', 'mapping', rng, o, base, {
        title: 'Match the vertices (shared corners)',
        prompt: give
          ? `Prove ${triName(base.tri1)} ${EQUIV} ${triName(base.tri2)}. Start with the vertex mapping.`
          : `The blue triangle ${triName(base.tri1)} and the orange triangle are congruent. Complete the vertex mapping using the markings.`,
        statementGiven: give,
        input: { kind: 'mapping', rows: base.tri1, choices: base.tri2.slice().sort() },
        answer: { mapping: base.mapping },
        explanation: base.tri1.map(l => `${l} ${MAPSTO} ${base.mapping[l]}`).join(', ') + '. ' +
          (base.fixed.length ? `${base.fixed.join(' and ')} ${base.fixed.length > 1 ? 'are' : 'is'} shared and ${base.fixed.length > 1 ? 'map' : 'maps'} to ${base.fixed.length > 1 ? 'themselves' : 'itself'}. ` : '') +
          (base.swaps.length ? `${base.swaps.map(p => p.join(' and ')).join(', ')} swap: the second triangle is a ${base.transformText}. ` : '')
      });
    },
    'map-from-statement'(rng, o) {
      const base = o.difficulty >= 3 && rng.chance(0.6) ? makeShared(rng, {}) : makePair(rng, { test: rng.pick(TESTS), difficulty: o.difficulty, style: 'ticks' });
      const showFigure = o.showFigure !== undefined ? o.showFigure : rng.chance(0.4);
      return common('map-from-statement', 'mapping', rng, o, base, {
        title: 'Read the mapping from a congruence statement',
        prompt: `${triName(base.tri1)} ${EQUIV} ${triName(base.tri2)}. Write the vertex mapping.`,
        showFigure: showFigure,
        input: { kind: 'mapping', rows: base.tri1, choices: base.tri2.slice().sort() },
        answer: { mapping: base.mapping },
        hints: base.tri1.map((l, i) => `${l} is letter ${i + 1} of ${triName(base.tri1)}, so it maps to letter ${i + 1} of ${triName(base.tri2)}.`),
        explanation: 'Match the letters by position: ' + base.tri1.map(l => `${l} ${MAPSTO} ${base.mapping[l]}`).join(', ') + '.'
      });
    },
    'statement-from-map'(rng, o) {
      const base = o.difficulty >= 3 && rng.chance(0.6) ? makeShared(rng, {}) : makePair(rng, { test: rng.pick(TESTS), difficulty: o.difficulty, style: 'ticks' });
      // name the first triangle in a different order from the mapping rows
      const named = rng.shuffle(base.tri1);
      const target = named.map(l => base.mapping[l]);
      return common('statement-from-map', 'mapping', rng, o, base, {
        title: 'Write the congruence statement from the mapping',
        prompt: `The vertex mapping is ${base.tri1.map(l => `${l} ${MAPSTO} ${base.mapping[l]}`).join(', ')}. Complete: ${triName(named)} ${EQUIV} ${TRI}___`,
        showFigure: false,
        input: { kind: 'letters', count: 3, prefix: `${triName(named)} ${EQUIV} ${TRI}`, choices: base.tri2.slice().sort() },
        answer: { letters: target.join('') },
        hints: named.map((l, i) => `Letter ${i + 1} is ${l}, and ${l} ${MAPSTO} ${base.mapping[l]}.`),
        explanation: `${triName(named)} ${EQUIV} ${triName(target)}`
      });
    },
    'statement-from-diagram'(rng, o) {
      const base = baseFor(rng, o);
      const named = rng.shuffle(base.tri1);
      const target = named.map(l => base.mapping[l]);
      return common('statement-from-diagram', 'mapping', rng, o, base, {
        title: 'Write the congruence statement',
        prompt: `The triangles are congruent. Complete the statement with the vertices in matching order: ${triName(named)} ${EQUIV} ${TRI}___`,
        input: { kind: 'letters', count: 3, prefix: `${triName(named)} ${EQUIV} ${TRI}`, choices: base.tri2.slice().sort() },
        answer: { letters: target.join('') },
        explanation: `${named.map(l => `${l} ${MAPSTO} ${base.mapping[l]}`).join(', ')}, so ${triName(named)} ${EQUIV} ${triName(target)}.`
      });
    },
    'map-fix'(rng, o) {
      const shared = o.shared !== undefined ? o.shared : (o.difficulty >= 2 && rng.chance(0.6));
      const base = shared ? makeShared(rng, { config: o.config }) : makePair(rng, { test: rng.pick(TESTS), difficulty: o.difficulty, style: 'ticks' });
      const m = base.mapping, t1 = base.tri1, proposed = Object.assign({}, m);
      let error = 'none';
      if (!rng.chance(0.2)) {
        if (base.fixed.length >= 2) { // the classic mistake: swap the two shared vertices
          const [x, y] = base.fixed; proposed[x] = y; proposed[y] = x; error = 'shared-swapped';
        } else if (base.swaps.length) { // map the shared side's ends to themselves instead of swapping
          const [x, y] = base.swaps[0]; proposed[x] = x; proposed[y] = y; error = 'missed-swap';
        } else if (base.fixed.length === 1) {
          const f = base.fixed[0], other = t1.find(l => l !== f); proposed[f] = m[other]; proposed[other] = f; error = 'shared-moved';
        } else {
          const sorted1 = t1.slice().sort(), sorted2 = base.tri2.slice().sort(), alpha = {};
          sorted1.forEach((l, i) => { alpha[l] = sorted2[i]; });
          const differs = t1.some(l => alpha[l] !== m[l]);
          if (differs && rng.chance(0.5)) { Object.assign(proposed, alpha); error = 'alphabetical'; } else {
            const [x, y] = rng.shuffle(t1).slice(0, 2); proposed[x] = m[y]; proposed[y] = m[x]; error = 'two-swapped';
          }
        }
      }
      const who = rng.pick(['Sam', 'Alex', 'Jordan', 'Riley', 'Casey', 'Taylor']);
      return common('map-fix', 'mapping', rng, o, base, {
        title: 'Check the mapping',
        prompt: `${who} wrote this vertex mapping for ${triName(base.tri1)} and the congruent triangle. Type the correct mapping (type the same letters if it is already right).`,
        input: { kind: 'mapping', rows: t1, choices: base.tri2.slice().sort(), prefill: proposed, allowConfirm: true },
        proposed: proposed, proposedError: error, proposedIsCorrect: error === 'none',
        answer: { mapping: m },
        explanation: t1.map(l => `${l} ${MAPSTO} ${m[l]}`).join(', ') + '. ' + ERROR_EXPLAIN[error]
      });
    },
    // ---------------- Family 2: tests and matching pairs ----------------
    'choose-test'(rng, o) {
      const allowNone = !!o.includeNotEnough && rng.chance(0.2);
      let base;
      if (allowNone) base = makePair(rng, { test: rng.pick(['SSA', 'AAA']), difficulty: o.difficulty, style: o.style || 'ticks' });
      else base = baseFor(rng, o);
      const options = TESTS.slice(); if (o.includeNotEnough) options.push('NONE');
      return common('choose-test', 'test', rng, o, base, {
        title: 'Choose the congruence test',
        prompt: base.test === 'NONE' || allowNone
          ? 'Is there enough information to say these triangles are congruent? If so, which test?'
          : `These triangles are congruent. Which test proves it?`,
        input: { kind: 'test', options: options.map(t => ({ value: t, label: t === 'NONE' ? 'Not enough information' : t })) },
        answer: { test: base.test, tests: base.test === 'NONE' ? ['NONE'] : base.validTests },
        explanation: testExplanation(base)
      });
    },
    'write-pairs'(rng, o) {
      const base = baseFor(rng, o);
      const rows = base.facts.map(f => factRow(f, base.mapping));
      const prefillLeft = o.prefillLeft !== undefined ? o.prefillLeft : o.difficulty <= 1;
      const askReasons = o.askReasons !== undefined ? o.askReasons : base.kind === 'shared';
      return common('write-pairs', 'test', rng, o, base, {
        title: 'Write out the matching pairs',
        prompt: `${triName(base.tri1)} ${EQUIV} ${triName(base.tri2)}. Write three pairs of equal sides or angles that prove it, then the test.`,
        input: { kind: 'pairs', askTest: o.askTest !== false, options: TESTS.map(t => ({ value: t, label: t })),
          rows: rows.map(r => ({ kind: r.kind, kindLabel: r.kindLabel, left: prefillLeft ? r.left : null })),
          askReasons: askReasons, reasonOptions: REASON_OPTIONS, orderFree: true },
        answer: { test: base.test, tests: base.validTests, pairs: rows },
        explanation: rows.map(r => `${r.left} = ${r.right} (${r.reasonText})`).join('; ') + `. So ${triName(base.tri1)} ${EQUIV} ${triName(base.tri2)} (${base.test}).` + positionNote(base) + alternativesNote(base)
      });
    },
    'missing-fact'(rng, o) {
      const test = o.test || rng.pick(TESTS);
      const base = makePair(rng, { test: test, difficulty: o.difficulty, style: o.style || 'ticks' });
      // hide one of the three facts (never the right angle for RHS, so the triangles still look right-angled)
      const candidatesIdx = base.facts.map((f, i) => i).filter(i => base.facts[i].kind !== 'R');
      const hideIdx = rng.pick(candidatesIdx), hidden = base.facts[hideIdx];
      const hiddenRow = factRow(hidden, base.mapping);
      const keyOf = m => m.k === 'tick' || m.k === 'sideval' ? 'S:' + [m.a, m.b].sort().join('') : (m.k === 'arc' || m.k === 'angval') ? 'A:' + m.v + ':' + [m.a, m.b].sort().join('') : '';
      const hideKeys = [elKey(hidden.el), elKey(mapEl(hidden.el, base.mapping))];
      base.figure.marks = base.figure.marks.filter(m => !hideKeys.includes(keyOf(m)));
      const shown = base.facts.filter((f, i) => i !== hideIdx);
      base.pool = shown.slice();                    // only the two marked pairs are known now
      // Try every side and angle of the triangle as the third pair, and classify each by position.
      const t1 = base.tri1;
      const all = [[0, 1], [1, 2], [2, 0]].map(([i, j]) => fact('S', side(t1[i], t1[j])))
        .concat([0, 1, 2].map(i => { const o2 = t1.filter((_, j) => j !== i); return fact(t1[i] === base.rightVertex ? 'R' : 'A', ang(o2[0], t1[i], o2[1])); }));
      const shownKeys = shown.map(f => elKey(f.el));
      const candidates = all.filter(f => !shownKeys.includes(elKey(f.el))).map(f => ({ key: elKey(f.el), fact: f, test: classifyFacts(shown.concat([f])) }));
      const accept = candidates.filter(c => c.test === test);
      const acceptRows = accept.map(c => factRow(c.fact, base.mapping));
      const what = hidden.kind === 'A' ? 'pair of angles' : 'pair of sides';
      const many = acceptRows.length > 1;
      const why = test === 'AAS' && hidden.kind !== 'A' ? 'AAS needs a pair of sides OPPOSITE one of the equal angles (not between them).'
        : test === 'AAS' ? 'AAS needs the equal side to be OPPOSITE one of the two equal angles, so check where the side is.'
          : test === 'RHS' && hidden.kind === 'S' ? 'With the right angle and the hypotenuse, either of the other sides completes RHS.'
            : test === 'RHS' ? 'RHS needs the hypotenuse: the side opposite the right angle.'
              : test === 'SAS' && hidden.kind === 'A' ? 'SAS needs the angle BETWEEN the two marked sides.'
                : test === 'SAS' ? 'SAS needs the other side that meets the marked angle, so the angle is between the two sides.'
                  : 'SSS needs all three pairs of sides.';
      return common('missing-fact', 'test', rng, o, base, {
        title: 'What else do you need?',
        prompt: `Two pairs are already marked equal. Name ${many ? 'a' : 'the'} ${what} that would complete the proof that these triangles are congruent by ${test}. The congruent triangle is ${triName(base.tri2)}.`,
        input: { kind: 'fact', expect: hidden.kind === 'A' ? 'angle' : 'side' },
        answer: { pair: hiddenRow, accept: acceptRows, acceptKeys: accept.map(c => c.key), shownKeys: shownKeys,
          candidates: candidates.map(c => ({ key: c.key, test: c.test })) },
        hints: [why],
        explanation: `${many ? 'Either of these works: ' : ''}${acceptRows.map(r => `${r.left} = ${r.right}`).join(many ? ', or ' : '')}. ${why}`
      });
    },
    'full-proof'(rng, o) {
      const base = makeShared(rng, { config: o.config, test: o.test });
      const rows = base.facts.map(f => factRow(f, base.mapping));
      return common('full-proof', 'test', rng, o, base, {
        title: 'Full congruence proof',
        prompt: `Prove ${triName(base.tri1)} ${EQUIV} ${triName(base.tri2)}.`,
        input: { kind: 'steps', steps: [
          { kind: 'mapping', rows: base.tri1, choices: base.tri2.slice().sort() },
          { kind: 'pairs', askTest: false, rows: rows.map(r => ({ kind: r.kind, kindLabel: r.kindLabel, left: null })), askReasons: true, reasonOptions: REASON_OPTIONS, orderFree: true },
          { kind: 'test', options: TESTS.map(t => ({ value: t, label: t })) }
        ] },
        answer: { mapping: base.mapping, pairs: rows, test: base.test, tests: base.validTests },
        explanation: base.tri1.map(l => `${l} ${MAPSTO} ${base.mapping[l]}`).join(', ') + '. ' +
          rows.map(r => `${r.left} = ${r.right} (${r.reasonText})`).join('; ') + `. ${'∴'} ${triName(base.tri1)} ${EQUIV} ${triName(base.tri2)} (${base.test}).` + positionNote(base) + alternativesNote(base)
      });
    }
  };

  function positionNote(base) {
    if (base.test !== 'AAS') return '';
    const sd = base.facts.find(f => f.el.t === 'side'), angs = base.facts.filter(f => f.el.t === 'angle');
    const opp = angs.find(a => !sd.el.p.includes(a.el.v));
    return opp ? ` The side ${elStr(sd.el)} is opposite ${elStr(opp.el)}, so the side is not between the two angles.` : '';
  }
  function alternativesNote(base) {
    const n = (base.validTriples || []).filter(t => t.test === base.test).length;
    return n > 1 ? ` (Other correct choices of three pairs are accepted too, as long as they fit ${base.test}.)` : '';
  }
  function testExplanation(base) {
    if (base.test === 'NONE') {
      return base.rawTest === 'AAA'
        ? 'Only angles are marked. Triangles with the same angles can be different sizes, so this is not enough.'
        : 'Two sides and an angle are marked, but the angle is NOT between the two sides. That is not one of the tests.';
    }
    const rows = base.facts.map(f => factRow(f, base.mapping));
    return `${base.test} (${TEST_NAMES[base.test]}): ` + rows.map(r => `${r.left} = ${r.right}`).join(', ') + '.' + positionNote(base);
  }

  const ERROR_EXPLAIN = {
    none: 'The mapping was already correct.',
    'shared-swapped': 'The two shared corners belong to both triangles and the triangles sit the same way round them, so each one maps to itself.',
    'missed-swap': 'The second triangle is turned half a turn, so the two ends of the shared side swap places.',
    'shared-moved': 'The shared corner is in both triangles at the same place, so it maps to itself.',
    alphabetical: 'The letters were matched in alphabetical order instead of by the markings.',
    'two-swapped': 'Two letters were swapped. Check which markings meet at each corner.'
  };

  // =====================================================================
  // 12. Answer checking
  // =====================================================================
  const clean = s => String(s == null ? '' : s).toUpperCase().replace(/[^A-Z]/g, '');

  // Live feedback for one mapping row as the student types
  function checkMappingRow(q, from, letter) {
    const want = q.answer.mapping[from], got = clean(letter);
    if (!got) return { status: 'empty' };
    if (got === want) return { status: 'correct' };
    const t2 = q.tri2;
    if (!t2.includes(got)) {
      if (q.tri1.includes(got) && !q.meta.fixed.includes(got)) return { status: 'wrong', code: 'from-same-triangle', message: `${got} is in ${TRI}${q.tri1.join('')}. The right-hand side must be a vertex of the other triangle (${t2.join(', ')}).` };
      return { status: 'wrong', code: 'not-a-vertex', message: `Use one of ${t2.join(', ')}.` };
    }
    if (q.meta.fixed.includes(from) && got !== from) return { status: 'wrong', code: 'shared-should-stay', message: `${from} is a corner of both triangles, and both triangles sit the same way round it. Does ${from} need to move?` };
    if (q.meta.swaps.some(p => p.includes(from)) && got === from) return { status: 'wrong', code: 'shared-should-swap', message: `The second triangle is turned round, so ${from} lands on the other end of the shared side.` };
    return { status: 'wrong', code: 'wrong-vertex', message: q.hints[q.tri1.indexOf(from)] };
  }

  function checkMapping(q, resp) {
    const rows = {}, msgs = [];
    let correct = 0;
    const vals = q.tri1.map(l => clean(resp[l]));
    q.tri1.forEach((l, i) => { const r = checkMappingRow(q, l, vals[i]); rows[l] = r; if (r.status === 'correct') correct++; });
    const used = vals.filter(Boolean), dup = used.filter((v, i) => used.indexOf(v) !== i);
    let code = correct === 3 ? 'correct' : 'partial';
    if (dup.length) { code = 'duplicate'; msgs.push(`Each vertex of the second triangle is used once. You used ${dup[0]} twice.`); }
    if (correct < 3 && used.length === 3) {
      const sorted1 = q.tri1.slice().sort(), sorted2 = q.tri2.slice().sort();
      if (sorted1.every((l, i) => clean(resp[l]) === sorted2[i]) && q.tri1.some(l => q.answer.mapping[l] !== sorted2[sorted1.indexOf(l)])) {
        code = 'alphabetical'; msgs.push('It looks like the letters were matched in alphabetical order. Match them using the markings instead.');
      } else if (correct === 1) {
        const wrong = q.tri1.filter(l => rows[l].status !== 'correct');
        if (clean(resp[wrong[0]]) === q.answer.mapping[wrong[1]] && clean(resp[wrong[1]]) === q.answer.mapping[wrong[0]]) {
          code = q.meta.fixed.length >= 2 && wrong.every(w => q.meta.fixed.includes(w)) ? 'shared-swapped' : 'two-swapped';
          msgs.push(code === 'shared-swapped'
            ? `You swapped ${wrong[0]} and ${wrong[1]}. They are corners of both triangles, so each one maps to itself.`
            : `${wrong[0]} and ${wrong[1]} are the wrong way round. Check which markings meet at each.`);
        }
      }
    }
    if (q.type === 'map-fix') {
      const unchanged = q.tri1.every(l => clean(resp[l]) === q.proposed[l]);
      if (unchanged && !q.proposedIsCorrect) msgs.push('There is still a mistake in this mapping.');
    }
    return { correct: correct === 3 && !dup.length, score: correct, max: 3, rows: rows, code: code, messages: msgs };
  }

  function checkLetters(q, resp) {
    const got = clean(resp), want = q.answer.letters, per = [];
    for (let i = 0; i < want.length; i++) per.push(got[i] ? (got[i] === want[i] ? 'correct' : 'wrong') : 'empty');
    const msgs = [];
    if (got.length === 3 && got !== want) {
      if (got.split('').sort().join('') === want.split('').sort().join('')) msgs.push('Right letters, wrong order. Each letter must match the letter in the same position in the first triangle.');
      else msgs.push(`Use only the letters of the other triangle: ${q.tri2.join(', ')}.`);
    }
    return { correct: got === want, score: per.filter(x => x === 'correct').length, max: 3, positions: per, messages: msgs };
  }

  // FEEDBACK[correct test][test the student chose]: explains why the correct test is right
  const TEST_FEEDBACK = {
    SSS: { SAS: 'No angle is needed here: all three pairs of sides are equal. That is SSS.',
           AAS: 'No angles are marked. All three pairs of sides are equal, so it is SSS.',
           RHS: 'There is no right angle. All three pairs of sides are equal, so it is SSS.' },
    SAS: { SSS: 'Only two pairs of sides are equal. The equal angle sits between those two sides, so it is SAS.',
           AAS: 'Only one pair of angles is equal, and it sits between the two equal sides. That is SAS.',
           RHS: 'The angle sits between the two equal sides, and neither side is the hypotenuse. That is SAS.' },
    AAS: { SSS: 'Only one pair of sides is equal, but two pairs of angles are equal, and the side is opposite one of them. That is AAS.',
           SAS: 'Two pairs of angles are equal, plus a pair of sides opposite one of those angles. That is AAS.',
           RHS: 'There is no right angle with a hypotenuse here. Two angles and a side: AAS.' },
    RHS: { SSS: 'Only two pairs of sides are equal, but there is a right angle. Right angle, hypotenuse, side: RHS.',
           SAS: 'The right angle is NOT between the two equal sides, because one of them is the hypotenuse. That is RHS.',
           AAS: 'Only the right angle is marked, with the hypotenuse and one other side. That is RHS.' },
    NONE: { SSS: 'Count the equal sides again: there are not three pairs.',
            SAS: 'Is the equal angle between the two equal sides? If it is not, SAS does not apply.',
            AAS: 'AAS needs a pair of equal sides as well as two angles.',
            RHS: 'There is no right angle marked, so RHS does not apply.' }
  };
  function checkTest(q, choice) {
    const want = q.answer.test, got = String(choice || '').toUpperCase();
    const ok = (q.validTests && q.validTests.length ? q.validTests : [want]);
    if (ok.includes(got)) return { correct: true, message: q.explanation };
    let msg = (TEST_FEEDBACK[want] && TEST_FEEDBACK[want][got]) || 'Not quite. Count the equal sides and angles again.';
    if (want === 'SAS' && got === 'RHS' && q.facts.some(f => f.kind === 'R')) msg = 'There is a right angle, but it sits between the two equal sides and the hypotenuse is not one of them. That is SAS.';
    if (want === 'NONE' && got === 'AAS' && q.meta && q.meta.rawTest === 'AAA') msg = 'Only angles are equal. Triangles with the same angles can be different sizes, so there is not enough information.';
    if (got === 'NONE' && want !== 'NONE') msg = `There is enough information. ${q.explanation}`;
    if (got === 'ASA') msg = 'ASA is not one of our tests. For AAS, the equal side must be opposite one of the equal angles.';
    if (got === 'SSA' || got === 'ASS') msg = `${got} is not a test: the angle must be between the two sides (SAS).`;
    return { correct: false, message: msg };
  }

  // Parse a typed side or angle. Students type letters only; the page can show a fixed "∠" prefix for angle rows.
  function parseElement(s, expect) {
    const c = clean(s);
    if (expect === 'side' || (!expect && c.length === 2)) return c.length === 2 ? side(c[0], c[1]) : null;
    if (c.length === 1) return { t: 'angle', v: c, a: null, c: null, single: true };
    if (c.length === 3) return ang(c[0], c[1], c[2]);
    if (c.length === 2 && !expect) return side(c[0], c[1]);
    return null;
  }

  // Move an angle's arms along straight lines so they use letters of the given triangle
  // (e.g. angle DAE = angle BAE when A, D, B are collinear). Returns null if impossible.
  function angleInTri(q, e, tri) {
    const lines = q.meta.lines || [];
    const fixArm = x => {
      if (tri.includes(x)) return x;
      for (const ln of lines) {
        const iv = ln.indexOf(e.v), ix = ln.indexOf(x);
        if (iv < 0 || ix < 0) continue;
        const ray = ix > iv ? ln.slice(iv + 1) : ln.slice(0, iv);
        const hit = ray.find(y => tri.includes(y));
        if (hit) return hit;
      }
      return null;
    };
    if (!tri.includes(e.v)) return null;
    const a = fixArm(e.a), c = fixArm(e.c);
    if (!a || !c || a === c || a === e.v || c === e.v) return null;
    return ang(a, e.v, c);
  }
  function elInTri(q, e, which) {
    const tri = which === 1 ? q.tri1 : q.tri2;
    if (e.t === 'side') return e.p.every(l => tri.includes(l)) && e.p[0] !== e.p[1] ? e : null;
    if (e.single) {
      if (!tri.includes(e.v)) return null;
      if (q.meta.ambiguousVertices.includes(e.v)) return 'ambiguous';
      const o = tri.filter(l => l !== e.v);
      return ang(o[0], e.v, o[1]);
    }
    return angleInTri(q, e, tri);
  }

  // Check one row (left = right). Returns status + a specific message.
  function checkPair(q, leftIn, rightIn, rowKind) {
    const expect = rowKind === 'S' || rowKind === 'H' ? 'side' : rowKind === 'A' || rowKind === 'R' ? 'angle' : null;
    const L = parseElement(leftIn, expect), R = parseElement(rightIn, expect);
    if (!L || !R) return { status: 'invalid', code: 'format', message: expect === 'side' ? 'Name a side with two letters, like AB.' : expect === 'angle' ? 'Name an angle with three letters (the middle letter is the vertex), like ABC.' : 'Type two letters for a side or three letters for an angle.' };
    if (L.t !== R.t) return { status: 'invalid', code: 'type-mismatch', message: 'A side can only equal a side, and an angle can only equal an angle.' };
    // orient: one element from each triangle (either way round is accepted)
    let a = elInTri(q, L, 1), b = elInTri(q, R, 2);
    if (!a || !b || a === 'ambiguous' || b === 'ambiguous') {
      const a2 = elInTri(q, R, 1), b2 = elInTri(q, L, 2);
      if (a2 && b2 && a2 !== 'ambiguous' && b2 !== 'ambiguous') { a = a2; b = b2; }
    }
    if (a === 'ambiguous' || b === 'ambiguous') {
      const v = L.single ? L.v : R.v;
      return { status: 'invalid', code: 'ambiguous-angle', message: `Several angles meet at ${v}. Use three letters so it is clear which angle you mean.` };
    }
    if (!a || !b) return { status: 'invalid', code: 'same-triangle', message: `Put a ${L.t} of ${triName(q.tri1)} on one side and a ${L.t} of ${triName(q.tri2)} on the other.` };
    const m = q.mapping, image = mapEl(a, m);
    if (elKey(image) !== elKey(b)) {
      const letters = a.t === 'side' ? a.p : [a.a, a.v, a.c];
      return { status: 'wrong', code: 'not-matching', matchedRight: elStr(image),
        message: `${elStr(a)} matches ${elStr(image)}, not ${elStr(b)}. Use the vertex mapping: ${letters.map(l => `${l} ${MAPSTO} ${m[l]}`).join(', ')}.` };
    }
    const keys = (q.pool || q.answer.pairs || q.facts).map(p => elKey(p.leftEl));
    const k = elKey(a);
    if (!keys.includes(k)) {
      return { status: 'unused', code: 'true-but-not-marked', key: k,
        message: `${elStr(a)} = ${elStr(b)} is true because the triangles are congruent, but it is not marked in the diagram, so you cannot use it to prove they are congruent.` };
    }
    return { status: 'correct', key: k, left: elStr(a), right: elStr(b) };
  }

  // A right angle can be justified as "Given" or "Given right angles"; everything else needs its own reason
  function reasonMatches(pf, reason) {
    if (reason === pf.reason) return true;
    if (pf.kind === 'R' || pf.reason === 'right-given') return reason === 'given' || reason === 'right-given';
    return false;
  }

  // Whole proof: three rows (any order). Correct when every row is a known pair, the three together
  // prove one of our tests BY POSITION, that test is the one chosen (if a test was chosen), and reasons fit.
  function checkPairs(q, resp) {
    const out = { rows: [], messages: [] };
    let chosen = null, testOk = true;
    if (resp.test !== undefined && resp.test !== null && resp.test !== '') {
      const t = checkTest(q, resp.test); testOk = t.correct; out.test = t; chosen = String(resp.test).toUpperCase();
    }
    const pool = q.pool || q.answer.pairs;
    const used = new Map();
    (resp.pairs || []).forEach((row, i) => {
      // a row may carry its own kind (null = work it out from the letters: 2 = side, 1 or 3 = angle)
      const kind = row && 'kind' in row ? row.kind : q.input.rows ? (q.input.rows[i] || {}).kind : (q.input.steps ? (q.input.steps[1].rows[i] || {}).kind : null);
      const r = checkPair(q, row.left, row.right, kind);
      if (r.status === 'correct') {
        if (used.has(r.key)) { r.status = 'duplicate'; r.message = 'You already used this pair.'; }
        else {
          const pf = pool.find(x => elKey(x.leftEl) === r.key);
          used.set(r.key, pf);
          if (row.reason !== undefined && row.reason !== null && row.reason !== '') {
            r.reasonCorrect = reasonMatches(pf, row.reason);
            if (!r.reasonCorrect) r.reasonMessage = `Reason: ${pf.reasonText}.`;
          }
        }
      }
      out.rows.push(r);
    });
    const facts = [...used.values()];
    const valid = (q.validTests || []).filter(t => t !== 'NONE');
    let cls = null;
    if (facts.length === 3) {
      cls = classifyFacts(facts.map(f => ({ kind: f.kind, el: f.leftEl })));
      out.classification = cls;
      if (!VALID_TESTS.includes(cls)) out.messages.push(NOT_A_TEST[cls] || NOT_A_TEST.INVALID);
      else if (chosen && cls !== chosen) out.messages.push(`These three pairs prove it by ${cls}, not ${chosen}.`);
    } else {
      const need = { SSS: 'three pairs of sides', SAS: 'two pairs of sides and the angle between them', AAS: 'two pairs of angles and a pair of sides opposite one of them', RHS: 'the right angle, the hypotenuse and one other side' };
      const t = chosen && need[chosen] ? chosen : (valid.length === 1 ? valid[0] : null);
      out.messages.push(t ? `${t} needs ${need[t]}.` : 'You need three different pairs.');
    }
    const reasonsOk = out.rows.every(r => r.reasonCorrect !== false);
    const allRowsOk = out.rows.length >= 3 && out.rows.every(r => r.status === 'correct');
    const tripleOk = cls !== null && valid.includes(cls) && (!chosen || cls === chosen);
    out.correct = testOk && allRowsOk && tripleOk && reasonsOk;
    out.score = out.rows.filter(r => r.status === 'correct').length;
    out.max = 3;
    return out;
  }

  // "What else do you need?": any pair that, with the two marked pairs, proves the named test BY POSITION
  function checkFact(q, resp) {
    const r = checkPair(q, resp.left, resp.right, q.answer.pair.kind);
    if (r.status !== 'correct' && r.status !== 'unused') return { correct: false, row: r, message: r.message };
    if (q.answer.acceptKeys.includes(r.key)) return { correct: true, row: r, message: q.explanation };
    if (q.answer.shownKeys.includes(r.key)) return { correct: false, row: r, message: 'That pair is already marked. Which piece is not marked yet?' };
    const cand = q.answer.candidates.find(c => c.key === r.key);
    const cls = cand ? cand.test : 'INVALID';
    let msg;
    if (VALID_TESTS.includes(cls)) msg = `With that pair the test would be ${cls}, not ${q.test}. ${q.hints[0]}`;
    else msg = NOT_A_TEST[cls] ? NOT_A_TEST[cls] : 'That pair does not complete the test. ' + q.hints[0];
    return { correct: false, row: r, message: msg };
  }

  // Is this typed side/angle one of the known (marked or common) elements, in either triangle?
  function poolHas(q, s) {
    const e = parseElement(s, null);
    if (!e) return false;
    const pool = q.pool || q.facts;
    const a = elInTri(q, e, 1), b = elInTri(q, e, 2);
    if (a && a !== 'ambiguous' && pool.some(p => elKey(p.leftEl) === elKey(a))) return true;
    if (b && b !== 'ambiguous' && pool.some(p => elKey(p.rightEl) === elKey(b))) return true;
    return false;
  }

  function check(q, resp) {
    const kind = q.input.kind;
    if (kind === 'mapping') return checkMapping(q, resp);
    if (kind === 'letters') return checkLetters(q, resp);
    if (kind === 'test') return checkTest(q, resp);
    if (kind === 'pairs') return checkPairs(q, resp);
    if (kind === 'fact') return checkFact(q, resp);
    if (kind === 'steps') {
      const a = checkMapping(q, resp.mapping || {});
      const b = checkPairs(q, { pairs: resp.pairs || [] });
      const c = checkTest(q, resp.test);
      return { correct: a.correct && b.correct && c.correct, mapping: a, pairs: b, test: c };
    }
    throw new Error('Unknown input kind ' + kind);
  }

  // =====================================================================
  // 13. Public API
  // =====================================================================
  const TYPES = {
    'map-pair': { family: 'mapping', label: 'Match the vertices (separate triangles)', difficulties: [1, 2] },
    'map-shared': { family: 'mapping', label: 'Match the vertices (shared corner or side)', difficulties: [2, 3] },
    'map-from-statement': { family: 'mapping', label: 'Read the mapping from a statement', difficulties: [1, 2, 3] },
    'statement-from-map': { family: 'mapping', label: 'Write the statement from a mapping', difficulties: [1, 2, 3] },
    'statement-from-diagram': { family: 'mapping', label: 'Write the congruence statement', difficulties: [1, 2, 3] },
    'map-fix': { family: 'mapping', label: 'Spot and fix the mistake', difficulties: [2, 3] },
    'choose-test': { family: 'test', label: 'Choose the test', difficulties: [1, 2, 3] },
    'write-pairs': { family: 'test', label: 'Write out the matching pairs', difficulties: [1, 2, 3] },
    'missing-fact': { family: 'test', label: 'What else is needed?', difficulties: [2, 3] },
    'full-proof': { family: 'test', label: 'Full proof (shared sides)', difficulties: [3] }
  };

  function generate(type, opts) {
    opts = Object.assign({ difficulty: 2 }, opts || {});
    if (!BUILDERS[type]) throw new Error('Unknown question type: ' + type + '. Use one of ' + Object.keys(BUILDERS).join(', '));
    const seed = opts.seed !== undefined ? opts.seed : randomSeed();
    const rng = makeRng(seed);
    const q = BUILDERS[type](rng, Object.assign({}, opts, { seed: seed }));
    q.seed = seed; q.id = `${type}-d${opts.difficulty}-${seed}`;
    return q;
  }

  // Build a mixed practice set
  function generateSet(spec) {
    spec = Object.assign({ count: 10, types: Object.keys(TYPES), difficulty: 2, seed: randomSeed() }, spec || {});
    const rng = makeRng(spec.seed), out = [];
    for (let i = 0; i < spec.count; i++) {
      const type = spec.types[i % spec.types.length];
      const d = TYPES[type].difficulties.includes(spec.difficulty) ? spec.difficulty : TYPES[type].difficulties[0];
      out.push(generate(type, Object.assign({}, spec.options || {}, { seed: rng.int(1, 2147483646), difficulty: d })));
    }
    return out;
  }

  const API = {
    version: '1.0.0',
    TYPES: TYPES, TESTS: TESTS, CONFIGS: Object.fromEntries(CONFIG_NAMES.map(n => [n, { label: CONFIGS[n].label, transform: CONFIGS[n].transform, tests: Object.keys(CONFIGS[n].tests) }])),
    REASONS: REASONS, REASON_OPTIONS: REASON_OPTIONS,
    generate: generate, generateSet: generateSet,
    renderSVG: renderSVG,
    check: check, checkMapping: checkMapping, checkMappingRow: checkMappingRow, checkLetters: checkLetters,
    checkTest: checkTest, checkPair: checkPair, checkPairs: checkPairs, checkFact: checkFact, poolHas: poolHas,
    classifyFacts: classifyFacts, VALID_TESTS: VALID_TESTS,
    // lower-level building blocks, for custom question types
    _internal: { makeRng: makeRng, makePair: makePair, makeShared: makeShared, genScalene: genScalene, genRight: genRight, goodTriangle: goodTriangle, VERTEX_RECTS: VERTEX_RECTS }
  };

  return API;
})(globalThis);

export default CongruenceBank;
