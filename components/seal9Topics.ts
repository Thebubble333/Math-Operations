/* 9 SEAL "typed parts" pages: levels, round lengths and the "What's in each level?" text.
 * Plain data (no React) so the typing tests can use it too. */
import { TPQuestion } from '../utils/typedParts';
import { generatePolygon } from '../utils/polygonBank';
import { generateAngles } from '../utils/angleBank';
import { generateDijkstra } from '../utils/dijkstraBank';
import { generateSimTests, generateSimFind } from '../utils/similarBank';
import { generateChords, generateCircles } from '../utils/circleBank';
import { generateDegrees, generateWalks } from '../utils/networkBank';

export type Level = 1 | 2 | 3;
export interface TopicLevel {
  name: string; summary: string;
  roundLength: number;                 // questions (or graphs) in a Fixed round
  skills: { title: string; text: string }[];
}
export interface TopicDef {
  title: string; blurb: string; icon: string; color: string;
  noun: string;                        // "Problem" or "Graph", shown as "Graph 2 / 3"
  countSteps: boolean;                 // score, streak and pace count each step, not each question
  levels: Record<Level, TopicLevel>;
  generate: (level: Level, seed?: number) => TPQuestion;
  slipLabels: Record<string, string>;
}

export const SEAL9_TOPICS: Record<string, TopicDef> = {
  polygons: {
    title: 'Polygon Angles', blurb: 'Angle sums, regular polygons, missing angles', icon: '540°', color: 'bg-amber-500',
    noun: 'Problem', countSteps: false,
    generate: generatePolygon,
    levels: {
      1: {
        name: 'Angle sums', summary: 'The angle sum of a polygon, and the number of sides from the sum.', roundLength: 20,
        skills: [
          { title: 'Angle sum', text: 'A polygon with n sides splits into n − 2 triangles from one corner, so S = (n − 2) × 180°.' },
          { title: 'Number of sides', text: 'Work backwards: divide the sum by 180 to get the triangles, then add 2.' },
          { title: 'How to type it', text: 'Type the number only. It is checked as soon as it is complete.' },
        ],
      },
      2: {
        name: 'Regular polygons', summary: 'Each exterior and interior angle, and the number of sides.', roundLength: 10,
        skills: [
          { title: 'Exterior angles', text: 'The exterior angles of any polygon add to 360°, so each one in a regular polygon is 360° ÷ n.' },
          { title: 'Interior angles', text: 'Find the exterior angle first, then interior = 180° − exterior.' },
          { title: 'Number of sides', text: 'n = 360° ÷ exterior angle. From an interior angle, find the exterior angle first.' },
        ],
      },
      3: {
        name: 'Missing angles', summary: 'Find the unknown angle in a polygon diagram.', roundLength: 10,
        skills: [
          { title: 'Angle sum first', text: 'Count the sides and type the angle sum.' },
          { title: 'Then the unknown', text: 'Take the angles you know away from the sum.' },
          { title: 'Mixed in', text: 'Some regular polygon questions from Level 2 come up too.' },
        ],
      },
    },
    slipLabels: {
      'times-n': 'Using n × 180° instead of (n − 2) × 180°',
      'always-360': 'Thinking every polygon adds to 360°',
      'forgot-2': 'Forgetting to add 2 for the number of sides',
      'gave-interior': 'Giving the interior angle instead of the exterior',
      'skipped-step': 'Skipping the exterior angle step',
      'ext-360': 'Interior + exterior = 360° (it is 180°)',
      slip: 'Arithmetic slips',
    },
  },
  angles: {
    title: 'Angle Chase', blurb: 'Lines, parallel lines and triangles', icon: 'x°', color: 'bg-orange-500',
    noun: 'Problem', countSteps: false,
    generate: (level, seed) => generateAngles(level, seed),
    levels: {
      1: {
        name: 'One step', summary: 'Angles on a line, around a point, vertically opposite, and on parallel lines.', roundLength: 20,
        skills: [
          { title: 'Lines and points', text: 'Angles on a straight line add to 180°. Angles around a point add to 360°.' },
          { title: 'Vertically opposite', text: 'Where two lines cross, the opposite angles are equal.' },
          { title: 'Parallel lines', text: 'Arrows mark parallel lines. Corresponding angles (F shape) and alternate angles (Z shape) are equal. Co-interior angles (C shape) add to 180°.' },
          { title: 'How to type it', text: 'Type the number of degrees only. It is checked as soon as it is complete.' },
        ],
      },
      2: {
        name: 'Triangles', summary: 'Angle sum, the exterior angle theorem and isosceles triangles.', roundLength: 20,
        skills: [
          { title: 'Angle sum', text: 'The angles of a triangle add to 180°.' },
          { title: 'Exterior angle', text: 'An exterior angle equals the sum of the two opposite interior angles. Work backwards to find a missing interior angle.' },
          { title: 'Isosceles triangles', text: 'The marks show the two equal sides. The angles where they meet the third side (the base angles) are equal.' },
        ],
      },
      3: {
        name: 'Two steps', summary: 'Find the angle in between first (y), then x.', roundLength: 10,
        skills: [
          { title: 'y first', text: 'Each question has an angle y between the one you know and x. Find y, then use it to find x.' },
          { title: 'What comes up', text: 'Parallel lines then a straight line or vertically opposite angles; a triangle then a straight line; isosceles triangles; and vertically opposite angles then a triangle.' },
        ],
      },
    },
    slipLabels: {
      'line-360': 'Angles on a line add to 180°, not 360°',
      'point-180': 'Angles around a point add to 360°',
      'vo-supp': 'Vertically opposite angles are equal',
      'adj-equal': 'Angles on a straight line add to 180°',
      'corr-supp': 'Corresponding angles are equal',
      'alt-supp': 'Alternate angles are equal',
      'cointerior-equal': 'Co-interior angles add to 180° (not equal)',
      'tri-360': 'The angles of a triangle add to 180°',
      'ext-supp': 'Exterior angle = sum of the two opposite angles',
      'ext-interior': 'Giving the inside angle, not the exterior angle',
      'ext-adjacent': 'Using the angle next to the exterior angle',
      'ext-added': 'Adding to the exterior angle instead of taking away',
      'iso-wrong-pair': 'Choosing the wrong equal angles in an isosceles triangle',
      'iso-not-halved': 'Forgetting to halve for the base angles',
      'iso-one-base': 'Taking away only one base angle',
      line: 'Angles on a line', point: 'Angles around a point', vert: 'Crossing lines', parallel: 'Parallel lines',
      tri: 'Triangle angle sum', ext: 'Exterior angles', iso: 'Isosceles triangles', step: 'The second step',
    },
  },
  simtests: {
    title: 'Similarity Tests', blurb: 'Choose SSS, SAS, AAA or RHS', icon: '∼', color: 'bg-violet-500',
    noun: 'Problem', countSteps: false,
    generate: (level, seed) => generateSimTests(level, seed),
    levels: {
      1: {
        name: 'Sides or angles', summary: 'Three pairs of sides (SSS) or two pairs of angles (AAA).', roundLength: 20,
        skills: [
          { title: 'SSS', text: 'All three pairs of matching sides are in the same ratio. Match shortest with shortest, then compare the ratios.' },
          { title: 'AAA', text: 'The matching angles are equal. Two pairs are enough, because the third pair is then equal too.' },
          { title: 'How to answer', text: 'Type the first letters (ss for SSS, aaa for AAA), click the test, or press Tab then Enter.' },
        ],
      },
      2: {
        name: 'All four tests', summary: 'SSS, SAS, AAA and RHS, with the triangles turned and flipped.', roundLength: 20,
        skills: [
          { title: 'SAS', text: 'Two pairs of matching sides are in the same ratio, and the angles between them are equal.' },
          { title: 'RHS', text: 'Both triangles are right-angled, and the hypotenuses and one other pair of sides are in the same ratio.' },
          { title: 'SAS or RHS?', text: 'If the right angle is between the two given sides, the hypotenuse is not given: it is SAS.' },
          { title: 'Different angles marked', text: 'Find the third angle of each triangle, then compare all three.' },
        ],
      },
      3: {
        name: 'Similar or not?', summary: 'Some pairs are not similar. Check every ratio and angle.', roundLength: 20,
        skills: [
          { title: 'Not similar', text: 'Choose Not similar when the ratios do not all match, the angles do not all match, or the equal angle is not between the two sides.' },
          { title: 'Check them all', text: 'Work out every ratio. One that does not match is enough to show the triangles are not similar.' },
        ],
      },
    },
    slipLabels: {
      'congruence-test': 'Using a congruence test (AAS or ASA)',
      'sss-ratios': 'SSS when the ratios do not all match',
      'sas-not-between': 'SAS when the angle is not between the sides',
      'rhs-no-hyp': 'RHS when the hypotenuse is not given',
      'rhs-ratios': 'RHS when the ratios do not match',
      'aaa-third': 'Finding the third angle',
      'shortest': 'Matching shortest with shortest',
      'missed-test': 'Missing a test that works',
      'not-shown': 'Choosing a test for facts that are not marked',
      test: 'Choosing the test',
    },
  },
  simfind: {
    title: 'Similar Triangles: Find x', blurb: 'Scale factors and unknown lengths', icon: '×k', color: 'bg-purple-500',
    noun: 'Problem', countSteps: false,
    generate: (level, seed) => generateSimFind(level, seed),
    levels: {
      1: {
        name: 'Whole scale factors', summary: 'Scale factors 2, 3 and 4. Find the scale factor, then multiply.', roundLength: 10,
        skills: [
          { title: 'Scale factor', text: 'Scale factor = image ÷ original. The first triangle named is the original: for △ABC ∼ △DEF, divide a side of △DEF by the matching side of △ABC.' },
          { title: 'Find x', text: 'x is on the image, so multiply the matching side of the original by the scale factor.' },
          { title: 'How to type it', text: 'Type the number only. It is checked as soon as it is complete.' },
        ],
      },
      2: {
        name: 'Halves', summary: 'Scale factors like 1.5, 2.5 and ½. Multiply and divide.', roundLength: 10,
        skills: [
          { title: 'Decimal or fraction', text: 'Type 1.5 or 3/2: both are right. Use / for a fraction.' },
          { title: 'Divide', text: 'y is on the original, so divide the matching side of the image by the scale factor.' },
          { title: 'Crossed triangles', text: 'AB ∥ DE gives two triangles meeting at C, so △ABC ∼ △EDC. The scale factor is ED ÷ AB.' },
        ],
      },
      3: {
        name: 'Fractions and nested triangles', summary: 'Scale factors like ⅓, ⅔, ¾ and 4/3, and one triangle inside another.', roundLength: 10,
        skills: [
          { title: 'Fractions', text: 'Type the fraction with /, for example 2/3. The scale factor is less than 1 when the image is smaller.' },
          { title: 'Nested triangles', text: 'DE ∥ BC, so △ADE ∼ △ABC. Use the whole side AB = AD + DB, not DB.' },
          { title: 'Finding a part', text: 'To find DB, find AB first, then take away AD.' },
        ],
      },
    },
    slipLabels: {
      'sf-upside-down': 'Scale factor upside down (it is image ÷ original)',
      'divide-not-times': 'Dividing when the length is on the image',
      'times-not-divide': 'Multiplying when the length is on the original',
      'added-difference': 'Adding the difference instead of scaling',
      'part-side': 'Using DB instead of the whole side AB',
      'whole-not-part': 'Giving AB instead of DB',
      sf: 'Finding the scale factor', times: 'Multiplying by the scale factor', divide: 'Dividing by the scale factor', subtract: 'Taking AD away from AB',
    },
  },
  chords: {
    title: 'Chords and Pythagoras', blurb: 'Halve the chord, then Pythagoras', icon: '½AB', color: 'bg-rose-500',
    noun: 'Problem', countSteps: false,
    generate: (level, seed) => generateChords(level, seed),
    levels: {
      1: {
        name: 'Halve it', summary: 'OM ⟂ AB cuts the chord and the angle at the centre in half.', roundLength: 20,
        skills: [
          { title: 'Chord theorem 3', text: 'The perpendicular from the centre to a chord bisects the chord: if OM ⟂ AB then AM = MB.' },
          { title: 'The angle too', text: 'It also halves the angle at the centre: ∠AOM = ∠BOM = ½∠AOB.' },
          { title: 'Both ways', text: 'Halve to find AM or ∠AOM. Double to find AB or ∠AOB.' },
        ],
      },
      2: {
        name: 'Find d', summary: 'Halve the chord, then use Pythagoras to find the distance from the centre.', roundLength: 10,
        skills: [
          { title: 'AM first', text: 'M is the midpoint of AB, so AM = AB ÷ 2.' },
          { title: 'Pythagoras', text: 'In △OAM the radius OA is the longest side, so d² = r² − AM². Subtract the squares, then take the square root.' },
          { title: 'Friendly numbers', text: 'The sides are triples like 3, 4, 5 and 5, 12, 13, so every answer is a whole number.' },
        ],
      },
      3: {
        name: 'Find the chord', summary: 'From r and d, find AM and then the whole chord. Sometimes find r.', roundLength: 10,
        skills: [
          { title: 'Find AM', text: 'AM² = r² − d². Take the square root.' },
          { title: 'Then the chord', text: 'AB = 2 × AM. Do not stop at AM.' },
          { title: 'Find r', text: 'r is the longest side, so add the squares: r² = AM² + d².' },
        ],
      },
    },
    slipLabels: {
      'not-halved': 'Forgetting to halve the chord',
      'angle-not-halved': 'Forgetting that OM halves ∠AOB',
      'not-doubled': 'Forgetting that AB is twice AM',
      'angle-not-doubled': 'Forgetting that ∠AOB is twice ∠AOM',
      'minus-lengths': 'Subtracting the lengths, not the squares',
      'added-lengths': 'Adding the lengths, not the squares',
      'no-root': 'Forgetting the square root',
      'stopped-am': 'Stopping at AM instead of the whole chord',
      'chord-half': 'Halving and doubling', pythagoras: 'Pythagoras in △OAM',
    },
  },
  circles: {
    title: 'Circle Theorems', blurb: 'Centre, semicircle, same arc, cyclic, tangents', icon: '∠O', color: 'bg-pink-500',
    noun: 'Problem', countSteps: false,
    generate: (level, seed) => generateCircles(level, seed),
    levels: {
      1: {
        name: 'Theorems 1 and 2', summary: 'The angle at the centre is twice the angle at the circumference. The angle in a semicircle is 90°.', roundLength: 20,
        skills: [
          { title: 'Theorem 1', text: 'The angle at the centre is twice the angle at the circumference on the same arc. Double or halve.' },
          { title: 'Reflex angles', text: 'Check both angles stand on the same arc. The angle at the centre can be reflex (more than 180°).' },
          { title: 'Theorem 2', text: 'An angle in a semicircle (standing on a diameter) is 90°.' },
        ],
      },
      2: {
        name: 'Theorems 3 and 4, and tangents', summary: 'Angles on the same arc, cyclic quadrilaterals and tangents.', roundLength: 20,
        skills: [
          { title: 'Theorem 3', text: 'Angles at the circumference on the same arc are equal.' },
          { title: 'Theorem 4', text: 'Opposite angles of a cyclic quadrilateral add to 180°.' },
          { title: 'Tangents', text: 'A tangent is at 90° to the radius. Two tangents from the same point are equal in length.' },
        ],
      },
      3: {
        name: 'Two steps and algebra', summary: 'Two facts one after the other, and angles written with x.', roundLength: 10,
        skills: [
          { title: 'Radii', text: 'OA = OB, so triangle OAB is isosceles. Find ∠AOB first, then use theorem 1.' },
          { title: 'Semicircle and angle sum', text: 'Type the 90° first, then take both angles away from 180°.' },
          { title: 'Algebra', text: 'Type what the expression is worth (for example 3x = 102), then solve for x.' },
        ],
      },
    },
    slipLabels: {
      'halved': 'Halving when the angle at the centre is twice',
      'doubled': 'Doubling when the angle at the circumference is half',
      'not-reflex': 'Missing the reflex angle at the centre',
      'semi-180': 'Using 180° for the angle in a semicircle',
      'semi-forgot-90': 'Forgetting the 90° in the semicircle',
      'same-arc-supp': 'Adding to 180° instead of equal (same arc)',
      'same-arc-double': 'Doubling an angle on the same arc',
      'cyclic-equal': 'Opposite angles taken as equal',
      'cyclic-360': 'Opposite angles taken to add to 360°',
      'cyclic-adjacent': 'Using the angle next to it, not opposite',
      'tan-no-right': 'Missing the right angle at the tangent',
      'tan-quad': 'Missing the two right angles at the tangents',
      'iso-one-base': 'Taking away only one base angle',
      centre: 'Angle at the centre', semi: 'Angle in a semicircle', 'same-arc': 'Angles on the same arc', cyclic: 'Cyclic quadrilaterals',
      tangent: 'Tangents', isosceles: 'Isosceles triangle from radii', step: 'The second step', solve: 'Solving for x',
    },
  },
  dijkstra: {
    title: "Dijkstra's Algorithm", blurb: 'Shortest paths, step by step', icon: 'A→F', color: 'bg-teal-500',
    noun: 'Graph', countSteps: true,
    generate: generateDijkstra,
    levels: {
      1: {
        name: 'Update the values', summary: 'Five vertices. You give each vertex its value; the page does the boxing.', roundLength: 3,
        skills: [
          { title: 'Start', text: 'The start vertex is boxed at 0. A boxed value is final.' },
          { title: 'Update', text: 'For each vertex joined to the one just boxed, add the boxed value and the edge. Write it (and where it came from) only if it is smaller than the value already there.' },
          { title: 'Keep or replace', text: 'If the vertex already has a smaller value, type the old value again.' },
          { title: 'Finish', text: 'When the end vertex is boxed, its value is the shortest distance.' },
        ],
      },
      2: {
        name: 'Choose what to box', summary: 'Six vertices. You also choose which vertex to box next.', roundLength: 3,
        skills: [
          { title: 'Box the smallest', text: 'After each round of updates, box the smallest value of ALL the unboxed vertices, not only the ones you just updated.' },
          { title: 'How to type it', text: 'Type the letter. Tapping a vertex label on a phone types it too.' },
        ],
      },
      3: {
        name: 'Trace the path', summary: 'Six or seven vertices, then write the shortest path.', roundLength: 3,
        skills: [
          { title: 'Trace back', text: 'Start at the end vertex and follow the "came from" letters back to the start.' },
          { title: 'Write the path', text: 'Type the path from the start, for example A–C–B–D–F. Only letters joined to the last one can be typed.' },
        ],
      },
    },
    slipLabels: {
      'edge-only': 'Using the edge on its own (add the boxed value)',
      'replaced-smaller': 'Replacing a smaller value with a bigger one',
      'kept-larger': 'Keeping a bigger value when the new one is smaller',
      'nearest-only': 'Boxing only from the vertices just updated',
      'not-smallest': 'Boxing a value that is not the smallest',
      'not-traced': 'A path that does not follow the "came from" letters',
      'add-slip': 'Adding slips',
      'read-end': 'Reading the final distance',
    },
  },
  degrees: {
    title: "Degrees and Euler's Formula", blurb: 'Degrees, edges and faces', icon: 'v+f', color: 'bg-cyan-500',
    noun: 'Problem', countSteps: false,
    generate: generateDegrees,
    levels: {
      1: {
        name: 'Read the network', summary: 'Count vertices and edges, find a degree and the sum of degrees.', roundLength: 10,
        skills: [
          { title: 'Vertices and edges', text: 'Vertices are the dots and edges are the lines joining them.' },
          { title: 'Degree', text: 'The degree of a vertex is the number of edges that meet there.' },
          { title: 'Sum of degrees', text: 'Every edge has two ends, so the sum of degrees is twice the number of edges.' },
        ],
      },
      2: {
        name: 'Degree lists', summary: 'From a list of degrees: the sum, whether the graph can exist, and the edges.', roundLength: 10,
        skills: [
          { title: 'Sum of degrees', text: 'Add the degrees. From the number of edges: sum = 2 × edges.' },
          { title: 'Can it exist?', text: 'The sum of degrees must be even. If it is odd, choose "Does not exist" (type n, click it, or Tab to it and press Enter).' },
          { title: 'Edges', text: 'Edges = sum of degrees ÷ 2.' },
        ],
      },
      3: {
        name: "Euler's formula", summary: 'Use v + f = e + 2, and count the faces of a planar network.', roundLength: 10,
        skills: [
          { title: "Euler's formula", text: 'For a connected planar graph, v + f = e + 2. Rearrange it to find the missing number.' },
          { title: 'Faces', text: 'A face is a region bounded by edges. The region outside the network counts as a face too.' },
        ],
      },
    },
    slipLabels: {
      'sum-is-edges': 'Sum of degrees = edges (it is 2 × edges)',
      'halved': 'Halving the edges instead of doubling',
      'not-halved': 'Edges = sum of degrees (halve it)',
      'odd-sum': 'Missing that an odd sum of degrees is impossible',
      'even-sum': 'Saying a graph with an even sum cannot exist',
      'outside-face': 'Forgetting the outside face',
      'wrong-formula': "Using the wrong formula (it is v + f = e + 2)",
      'forgot-2': 'Forgetting the + 2 in v + f = e + 2',
      'count-v': 'Counting vertices', 'count-e': 'Counting edges', 'count-f': 'Counting faces',
      'degree': 'Finding a degree', 'sum': 'Sum of degrees', 'add-slip': 'Adding slips', 'edges': 'Finding the edges', 'solve': 'Rearranging the formula',
      'exists': 'Deciding whether a graph can exist',
    },
  },
  walks: {
    title: 'Walks and Trails', blurb: 'Name walks, Eulerian trails, Hamiltonian paths', icon: 'A–B–C', color: 'bg-emerald-500',
    noun: 'Problem', countSteps: false,
    generate: generateWalks,
    levels: {
      1: {
        name: 'Name the walk', summary: 'Give the most precise name: walk, trail, path, circuit or cycle.', roundLength: 20,
        skills: [
          { title: 'Walk', text: 'Any route through the network.' },
          { title: 'Trail and path', text: 'A trail repeats no edge. A path repeats no edge and no vertex.' },
          { title: 'Circuit and cycle', text: 'A circuit is a trail that ends where it started. A cycle is a path that ends where it started.' },
          { title: 'How to answer', text: 'Type the first letters (ci for circuit, cy for cycle), click the word, or Tab to it and press Enter.' },
        ],
      },
      2: {
        name: 'Eulerian trails', summary: 'Count the odd vertices, decide trail, circuit or neither, then write one.', roundLength: 8,
        skills: [
          { title: 'Odd vertices', text: 'Find the degree of each vertex and count the odd ones.' },
          { title: 'Trail or circuit', text: 'An Eulerian trail uses every edge once. 0 odd vertices: an Eulerian circuit. 2 odd vertices: a trail from one odd vertex to the other. Otherwise neither.' },
          { title: 'Write one', text: 'Type the vertices in order. An edge you have used cannot be used again.' },
        ],
      },
      3: {
        name: 'Hamiltonian paths', summary: 'Visit every vertex exactly once (and sometimes return to the start).', roundLength: 10,
        skills: [
          { title: 'Hamiltonian path', text: 'A path that visits every vertex exactly once. Edges can be left out.' },
          { title: 'Hamiltonian cycle', text: 'A Hamiltonian path that finishes back at its start.' },
          { title: 'How to type it', text: 'Start anywhere. Only letters joined to the last one, and not yet visited, can be typed.' },
        ],
      },
    },
    slipLabels: {
      'repeat-edge': 'Missing a repeated edge (only a walk)',
      'repeat-vertex': 'Missing a repeated vertex',
      'not-closed': 'Calling an open walk closed',
      'closed': 'Missing that the walk is closed',
      'not-precise': 'True, but not the most precise name',
      'closed-trail': 'All even means a circuit',
      'two-odd-circuit': 'Two odd vertices give a trail, not a circuit',
      'four-odd': 'More than 2 odd vertices: no Eulerian trail',
      'missed-trail': 'Missing an Eulerian trail that exists',
      'even-start': 'Starting a trail at an even vertex',
      'stuck': 'Getting stuck part way',
      'count-odd': 'Counting odd vertices', 'name': 'Naming walks', 'decide': 'Trail, circuit or neither',
    },
  },
};
