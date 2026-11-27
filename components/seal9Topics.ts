/* 9 SEAL "typed parts" pages: levels, round lengths and the "What's in each level?" text.
 * Plain data (no React) so the typing tests can use it too. */
import { TPQuestion } from '../utils/typedParts';
import { generatePolygon } from '../utils/polygonBank';
import { generateDijkstra } from '../utils/dijkstraBank';

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
};
