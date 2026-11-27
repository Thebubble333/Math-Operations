/* The 9 SEAL menu, grouped by ALT (assessment block). To add the next ALT, add an entry
 * at the end of SEAL9_ALTS: the newest ALT shows open and older ones fold up. */

export interface MenuButton { label: string; icon: string; color: string; route: string; blurb: string }
export interface MenuSection { title: string; buttons: MenuButton[] }
export interface Alt { id: string; title: string; subtitle: string; sections: MenuSection[] }

export const SEAL9_ALTS: Alt[] = [
  {
    id: 'alt1', title: 'ALT 1', subtitle: 'Geometry and Networks',
    sections: [
      { title: 'Angles and Polygons', buttons: [
        { label: 'Polygon Angles', icon: '540°', color: 'bg-amber-500', route: '/9seal/skill/polygons', blurb: 'Angle sums, regular polygons, missing angles' },
      ] },
      { title: 'Congruent Triangles', buttons: [
        { label: 'Congruence Tests', icon: 'SAS', color: 'bg-sky-500', route: '/9seal/congruence/tests', blurb: 'Choose SSS, SAS, AAS or RHS' },
        { label: 'Vertex Mappings', icon: 'A↦X', color: 'bg-indigo-500', route: '/9seal/congruence/mappings', blurb: 'Match the corners' },
        { label: 'Proofs', icon: '≡', color: 'bg-fuchsia-500', route: '/9seal/congruence/proofs', blurb: 'Pairs, reasons and the test' },
      ] },
      { title: 'Networks', buttons: [
        { label: "Degrees and Euler's Formula", icon: 'v+f', color: 'bg-cyan-500', route: '/9seal/skill/degrees', blurb: 'Degrees, edges and faces' },
        { label: 'Walks and Trails', icon: 'A–B–C', color: 'bg-emerald-500', route: '/9seal/skill/walks', blurb: 'Name walks, Eulerian trails, Hamiltonian paths' },
        { label: "Dijkstra's Algorithm", icon: 'A→F', color: 'bg-teal-500', route: '/9seal/skill/dijkstra', blurb: 'Shortest paths, step by step' },
      ] },
    ],
  },
];
