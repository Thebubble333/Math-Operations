/* 9 SEAL "typed parts" pages: levels, round lengths and the "What's in each level?" text.
 * Plain data (no React) so the typing tests can use it too. */
import { TPQuestion } from '../utils/typedParts';
import { generatePolygon } from '../utils/polygonBank';
import { generateDijkstra } from '../utils/dijkstraBank';
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
