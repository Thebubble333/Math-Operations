/* Levels for the 9 SEAL congruence pages, and the text for the "What's in each level?" page.
 * Plain data (no React) so the typing tests can use it too. */
import CB, { CBQuestion } from '../utils/congruenceBank';

export type Level = 1 | 2 | 3;
export interface LevelDef {
  name: string;                      // short name on the level button
  summary: string;                   // one line under the name
  items: { type: string; opts?: Record<string, unknown> }[];
  skills: { title: string; text: string }[];
}
export interface ModeDef { title: string; blurb: string; icon: string; color: string; roundLength: number; levels: Record<Level, LevelDef> }

const TYPING_TESTS = { title: 'How to type it', text: 'Type the three letters of the test, for example SAS. It is checked as soon as the third letter is in.' };

export const CONGRUENCE_MODES: Record<string, ModeDef> = {
  tests: {
    title: 'Congruence Tests', blurb: 'SSS, SAS, AAS or RHS?', icon: 'SAS', color: 'bg-sky-500', roundLength: 20,
    levels: {
      1: {
        name: 'Separate triangles', summary: 'Read the markings and name the test.',
        items: [{ type: 'choose-test' }],
        skills: [
          { title: 'Read the markings', text: 'Matching ticks are equal sides. Matching arcs are equal angles. A small square is a right angle.' },
          { title: 'Name the test', text: 'SSS: three pairs of sides. SAS: two sides and the angle BETWEEN them. AAS: two angles and a side OPPOSITE one of them. RHS: right angle, hypotenuse and one other side.' },
          { title: 'Easier diagrams', text: 'The second triangle is only turned, never flipped.' },
          TYPING_TESTS,
        ],
      },
      2: {
        name: 'What else is needed?', summary: 'Flipped triangles, and naming the missing pair.',
        items: [{ type: 'choose-test' }, { type: 'choose-test' }, { type: 'missing-fact' }],
        skills: [
          { title: 'Flipped triangles', text: 'The second triangle can be turned AND flipped over, so match corners by the markings, not by where they sit.' },
          { title: 'What else is needed?', text: 'Two pairs are marked. Type the pair that would finish the test you are given, like AB=XY.' },
          { title: 'Position matters', text: 'For SAS the angle must be between the two sides. For AAS the side must be opposite one of the angles: a side between the two angles is ASA, which is not one of our tests.' },
        ],
      },
      3: {
        name: 'Shared sides and traps', summary: 'Triangles that share a side or corner, and "not enough information".',
        items: [{ type: 'choose-test', opts: { includeNotEnough: true } }, { type: 'choose-test', opts: { includeNotEnough: true } }, { type: 'missing-fact' }],
        skills: [
          { title: 'Shared sides and corners', text: 'A common side, vertically opposite angles and alternate angles (from parallel lines) all count as equal pairs, even with no ticks.' },
          { title: 'Not enough information', text: 'Sometimes the markings do not prove anything, for example two sides and an angle that is not between them (SSA), or three angles (AAA). Type N.' },
        ],
      },
    },
  },
  mappings: {
    title: 'Vertex Mappings', blurb: 'Match each corner to its partner.', icon: 'A↦X', color: 'bg-indigo-500', roundLength: 20,
    levels: {
      1: {
        name: 'Read the statement', summary: 'Mappings from a congruence statement, and from easy diagrams.',
        items: [{ type: 'map-from-statement' }, { type: 'map-pair' }, { type: 'statement-from-map' }],
        skills: [
          { title: 'Letters in order', text: 'In △ABC ≡ △XYZ the letters match by position: A ↦ X, B ↦ Y, C ↦ Z.' },
          { title: 'Mapping from markings', text: 'Find the corner where the same markings meet in both triangles. The second triangle is only turned, never flipped.' },
          { title: 'How to type it', text: 'Type one letter for each corner, top to bottom. It is checked as soon as the third letter is in.' },
        ],
      },
      2: {
        name: 'Turned and flipped', summary: 'Any rotation or reflection, and fixing a mapping.',
        items: [{ type: 'map-pair' }, { type: 'map-pair' }, { type: 'statement-from-diagram' }, { type: 'map-fix', opts: { shared: false } }],
        skills: [
          { title: 'Flipped triangles', text: 'The second triangle can be flipped over. The answer is never just alphabetical order.' },
          { title: 'Write the statement', text: 'Complete △ABC ≡ △___ with the letters in matching order.' },
          { title: 'Fix a mapping', text: 'Someone else has written a mapping. Type the correct one (the same letters if it was already right).' },
        ],
      },
      3: {
        name: 'Shared corners', summary: 'Triangles that share a corner or a side.',
        items: [{ type: 'map-shared' }, { type: 'map-shared' }, { type: 'map-fix', opts: { shared: true } }, { type: 'statement-from-diagram' }],
        skills: [
          { title: 'Corners that stay', text: 'A corner shared by both triangles maps to itself when the triangles sit the same way round it (a kite, a bowtie).' },
          { title: 'Corners that swap', text: 'When the second triangle is turned half way round (a parallelogram cut by a diagonal), the two ends of the shared side swap.' },
        ],
      },
    },
  },
  proofs: {
    title: 'Proofs', blurb: 'Pairs, reasons and the test.', icon: '≡', color: 'bg-fuchsia-500', roundLength: 10,
    levels: {
      1: {
        name: 'Match the pairs', summary: 'The first side or angle of each pair is given.',
        items: [{ type: 'write-pairs' }],
        skills: [
          { title: 'Finish each pair', text: 'AB = __ is given. Type the matching side or angle of the other triangle.' },
          { title: 'Then the test', text: 'After the three pairs, type the test: SSS, SAS, AAS or RHS.' },
        ],
      },
      2: {
        name: 'Write the pairs', summary: 'Write all three pairs yourself, then the test.',
        items: [{ type: 'write-pairs' }],
        skills: [
          { title: 'How to type a pair', text: 'Type a side like AB=XY. Angles use three letters with the corner in the middle, like ABC=XYZ (the = is added for you).' },
          { title: 'Any order', text: 'The three pairs can go in any order, and either triangle can go first.' },
          { title: 'Position matters', text: 'For AAS the side must be opposite one of your angles. A side between the two angles is ASA, which is not one of our tests.' },
        ],
      },
      3: {
        name: 'Full proofs', summary: 'Shared sides: mapping, pairs with reasons, then the test.',
        items: [{ type: 'full-proof' }, { type: 'full-proof' }, { type: 'write-pairs' }],
        skills: [
          { title: 'Mapping first', text: 'Start with the vertex mapping, just like on paper.' },
          { title: 'Reasons', text: 'After each pair, type one letter for the reason: G given, C common side or angle, V vertically opposite, A alternate angles (parallel lines), R right angle.' },
          { title: 'Then the test', text: 'Finish with the test that your three pairs prove.' },
        ],
      },
    },
  },
};
// old links from earlier versions of the page still work
export const MODE_ALIASES: Record<string, string> = { shared: 'mappings', pairs: 'proofs', mixed: 'tests' };

export function pickQuestion(modeKey: string, level: Level, seed?: number): CBQuestion {
  const mode = CONGRUENCE_MODES[modeKey] || CONGRUENCE_MODES.mappings;
  const list = mode.levels[level].items;
  const r = seed !== undefined ? (seed % 9973) / 9973 : Math.random();
  const item = list[Math.floor(r * list.length)];
  const allowed = CB.TYPES[item.type].difficulties;
  const d = allowed.includes(level) ? level : allowed.reduce((a, b) => (Math.abs(b - level) < Math.abs(a - level) ? b : a));
  return CB.generate(item.type, { difficulty: d, ...(item.opts || {}), ...(seed !== undefined ? { seed } : {}) });
}
