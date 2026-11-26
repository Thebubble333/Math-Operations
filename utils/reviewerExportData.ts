import { GameMode, MathProblem } from '../types';
import { generateProblem } from './gameLogic';
import {
  ALT5_CATEGORIES,
  Alt5Question,
  generateQuestionByCategory,
} from './alt5Generators';
import {
  PARTIAL_FRACTIONS_PROBLEMS,
  PartialFractionProblem,
} from './partialFractionsLogic';

export type CurriculumSectionId =
  | 'essential'
  | 'year8'
  | 'seal8'
  | 'year9'
  | 'spec11'
  | 'methods12'
  | 'alt5';

export interface SiteFeatureArea {
  title: string;
  route: string;
  summary: string;
  details: string[];
}

export interface ImprovementItem {
  id: string;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Bug / Broken Flow' | 'Curriculum & Content' | 'Architecture & UX' | 'Codebase Hygiene';
  title: string;
  impact: string;
  recommendation: string;
}

export interface ModeExportSpec {
  mode: GameMode;
  section: CurriculumSectionId;
  title: string;
  menuLabel: string;
  route: string;
  questionFormat: string;
  inputMechanic: string;
  validationNotes: string;
  visualAid: string;
  difficultyProgression: string;
  generatorSource: string;
  sampleCombos?: number[];
}

export interface FormattedSample {
  id: string;
  comboTier?: number;
  problem: MathProblem;
  formattedAnswerLatex: string;
  formattedAnswerPlain: string;
  rawAnswer: string;
  workingLinesLatex?: string[];
  correctOptionIndex?: number;
}

export interface ModeExportBundle {
  spec: ModeExportSpec;
  samples: FormattedSample[];
}

export interface StandaloneSampleItem {
  id: string;
  label: string;
  promptLatex: string;
  answerLatex: string;
  stages?: Array<{ label: string; contentLatex: string }>;
  notes?: string;
}

export interface StandaloneModuleBundle {
  id: string;
  section: CurriculumSectionId;
  title: string;
  route: string;
  rendererEngine: string;
  inputMechanic: string;
  questionFormat: string;
  bankSize: string;
  samples: StandaloneSampleItem[];
}

export interface Alt5CategoryBundle {
  categoryId: number;
  categoryTitle: string;
  samples: Alt5Question[];
}

export interface FullExportDump {
  generatedAt: string;
  appTitle: string;
  summaryMetrics: {
    coreEngineModes: number;
    brokenRegisteredModes: number;
    standaloneModules: number;
    alt5Categories: number;
    partialFractionsBankSize: number;
    mathRenderingEngines: number;
  };
  siteInventory: SiteFeatureArea[];
  improvementAudit: ImprovementItem[];
  coreModes: ModeExportBundle[];
  standaloneModules: StandaloneModuleBundle[];
  alt5Bank: Alt5CategoryBundle[];
  partialFractionsBank: PartialFractionProblem[];
}

export const CURRICULUM_SECTIONS: Array<{
  id: CurriculumSectionId;
  label: string;
  shortLabel: string;
  subtitle: string;
}> = [
  {
    id: 'essential',
    label: 'Essential Skills',
    shortLabel: 'Essential',
    subtitle: 'Foundational arithmetic fluency and directed numbers (7 modes)',
  },
  {
    id: 'year8',
    label: 'Year 8 Mainstream',
    shortLabel: 'Year 8',
    subtitle: 'Core algebraic manipulation, expanding, and HCF factorising (4 modes)',
  },
  {
    id: 'seal8',
    label: '8 SEAL Extension',
    shortLabel: '8 SEAL',
    subtitle: 'Index laws, surds, scientific notation, quadratics, and algebraic fractions (8 core modes + 4 standalone modules)',
  },
  {
    id: 'year9',
    label: 'Year 9 Mainstream',
    shortLabel: 'Year 9',
    subtitle: 'Step-by-step linear equations with pronumerals on both sides (1 standalone module + 1 broken core registration)',
  },
  {
    id: 'spec11',
    label: 'Year 11 Specialist',
    shortLabel: '11 Spec',
    subtitle: 'Inverse circular functions and partial fraction decompositions (1 core mode + 1 standalone module)',
  },
  {
    id: 'methods12',
    label: 'Year 12 Methods',
    shortLabel: '12 Methods',
    subtitle: 'Graph recognition, trig, domain/range, calculus, normal & binomial probability, sample proportions (12 core modes)',
  },
  {
    id: 'alt5',
    label: '8 SEAL — ALT 5 Mega Bank',
    shortLabel: 'ALT 5 Bank',
    subtitle: '13 procedural linear & quadratic graph categories with worked solutions and SVG diagrams',
  },
];

export const SITE_INVENTORY: SiteFeatureArea[] = [
  {
    title: 'Global Session Modes & Telemetry',
    route: '/',
    summary: 'Dual-mode practice engine supporting Fixed Problem sets and Time Attack drills across all core topics.',
    details: [
      'Fixed Problems mode: 20 questions default (10 questions for 12 Methods & 11 Specialist).',
      'Time Attack mode: 3-minute (180s) timed sprint with live countdown.',
      'Real-time HUD: progress bar, live Questions Per Minute (QPM), active streak counter, Show Answer / Skip button.',
      'Local persistence via localStorage for Best Streak, Total Solved, and Dark Mode preference.',
      'Summary Screen displaying final score, accuracy %, average QPM, elapsed time, and streak.',
    ],
  },
  {
    title: 'Custom Game Builder',
    route: '/custom',
    summary: 'Multi-topic session composer allowing students or teachers to mix core skills into a single drill.',
    details: [
      'Select any combination of registered modes across Essential, Year 8, 8 SEAL, Year 9, 11 Spec, and 12 Methods.',
      'Configurable Fixed count (1–100 problems) or Time Attack window (1–10 minutes).',
      'Note: Currently out of sync with 10 newer core modes and includes broken YEAR9_BOTH_SIDES.',
    ],
  },
  {
    title: 'Math Rendering & Visualisation Stack',
    route: 'Cross-site',
    summary: 'Four distinct rendering mechanisms are currently used across different modules.',
    details: [
      'MathText + react-latex-next (KaTeX): Used in ActiveGame, SampleProportionsGame, and TrigGame.',
      'Direct katex.renderToString: Used in Alt5Practice, PartialFractionsGame, QuadraticFormula, and PronumeralsBothSides.',
      'Custom SVG TexEngine (utils/textEngine.ts): Used in the 3 Algebraic Fractions interactive manipulation modules.',
      'Custom React HTML Overlays: Live auto-superscripts, stacked fraction builders, split surd boxes, and scientific notation inputs.',
      'Interactive SVG Visuals: GraphCard (10 function families + asymptotes/endpoints), Alt5Graph / Alt5GraphCard, Normal Bell Curve diagram, and Unit Circle diagram.',
    ],
  },
  {
    title: 'Input & Feedback Mechanics',
    route: 'Cross-site',
    summary: 'Highly tailored input UX per mathematical topic to minimize friction and catch pedagogical mistakes.',
    details: [
      'Auto-submit numeric input + mobile Numpad for arithmetic and index laws.',
      'Color-coded granular token feedback (emerald vs rose per term/sign/power) for Year 8 algebra.',
      'Guided prefix-checked auto-bracket input for HCF factorising, DOTS, and monic quadratics (accepts either factor order).',
      'Multi-step partial simplification support for Surds (accepts partial square extraction and updates remaining surd).',
      '4-option and 6-option Multiple Choice with keyboard shortcuts (1–4) for Methods calculus, probability, trig equations, domain/range, and graphs.',
      '14-button (Trig) and 18-button (Inverse Trig) KaTeX exact-value keypads with Q1 adaptive remediation.',
      'Interactive factor Edit/Cancel click-workspace for Algebraic Fractions, and 4-step/6-stage scaffolded solvers for Margin of Error, Quadratic Formula, Pronumerals Both Sides, and Partial Fractions.',
    ],
  },
];

export const IMPROVEMENT_AUDIT: ImprovementItem[] = [
  {
    id: 'imp-1',
    priority: 'High',
    category: 'Bug / Broken Flow',
    title: 'YEAR9_BOTH_SIDES is broken inside Custom Game',
    impact: 'Selecting "Both Sides" in /custom triggers the default fallback in utils/gameLogic.ts, displaying "?" with answer 0.',
    recommendation: 'Either implement YEAR9_BOTH_SIDES in generateProblem() or remove it from config/gameModes.ts until unified with the standalone PronumeralsBothSides module.',
  },
  {
    id: 'imp-2',
    priority: 'High',
    category: 'Bug / Broken Flow',
    title: 'Custom Game menu is missing 10 active core modes',
    impact: 'SEAL8 DOTS, Monic Quadratics, Completing the Square, all 3 Methods Calculus modes, Maximal Domain, Range, Sample Proportions, and Margin Steps cannot be selected in /custom.',
    recommendation: 'Register all 10 modes in config/gameModes.ts so /custom stays in sync with year-level menus.',
  },
  {
    id: 'imp-3',
    priority: 'High',
    category: 'Bug / Broken Flow',
    title: 'SummaryScreen displays "Unknown Mode" for 4 modes',
    impact: 'Completing SEAL8 DOTS, Monic Quadratics, Completing the Square, or YEAR9_BOTH_SIDES shows "Unknown Mode" on the summary card.',
    recommendation: 'Derive mode display names from a single centralized config registry instead of a hardcoded switch statement in SummaryScreen.tsx.',
  },
  {
    id: 'imp-4',
    priority: 'High',
    category: 'Architecture & UX',
    title: '7 Standalone modules sit outside global stats, Time Attack, and unified dark mode',
    impact: 'Alt5Practice, PartialFractionsGame, QuadraticFormula, PronumeralsBothSides, and the 3 Algebraic Fraction games do not increment global Solved/Streak stats, lack Time Attack support, and the 3 TexEngine SVG games use hardcoded dark ink (#1e293b) that clashes in dark mode.',
    recommendation: 'Wrap standalone modules in a shared session shell or emit completion callbacks to App stats, and replace hardcoded SVG ink with currentColor / theme tokens.',
  },
  {
    id: 'imp-5',
    priority: 'Medium',
    category: 'Curriculum & Content',
    title: 'Small static banks in Senior Methods & Specialist modules',
    impact: 'Trig Equations (24 fixed items), Partial Fractions (11 fixed items), Normal Symmetry (small template sets), Binomial parameter problems (6 items), and Sample Proportions word problems repeat noticeably over extended practice.',
    recommendation: 'Convert static item arrays into parameterized procedural generators (similar to alt5Generators.ts and calculusGame.ts) while retaining distractor quality.',
  },
  {
    id: 'imp-6',
    priority: 'Medium',
    category: 'Curriculum & Content',
    title: 'Missing visual graphs & function variety in Domain/Range and ALT 5 Q8',
    impact: 'YEAR12_MAXIMAL_DOMAIN omits SVG graphs for ln_e and reflected sqrt (b = -1); YEAR12_RANGE only covers linear and quadratic functions (missing sqrt, cubic, trig, exp); ALT 5 Category 8 always fixes a = 1 and targetY = k + 1.',
    recommendation: 'Extend GraphCard to plot log curves and reflected square roots, add more function families to Range, and randomize a and horizontal line height in ALT 5 Q8.',
  },
  {
    id: 'imp-7',
    priority: 'Medium',
    category: 'Architecture & UX',
    title: 'Broken "Save Offline Version" & unreachable DevTools',
    impact: 'Settings -> Save Offline Version dumps raw document.documentElement.outerHTML without bundled JS, so the downloaded file fails offline. DevTools is wired in App.tsx but no UI button exposes onOpenDevTools.',
    recommendation: 'Replace broken offline dump with this Reviewer Export / standalone HTML generator (or remove it), and either expose DevTools behind a clean dev flag or remove dead state.',
  },
  {
    id: 'imp-8',
    priority: 'Low',
    category: 'Codebase Hygiene',
    title: 'Three different math rendering pipelines & ~25 unused scratch/legacy files',
    impact: 'Maintaining MathText (react-latex-next), raw katex.renderToString, and custom SVG TexEngine creates inconsistent typography and styling bugs. Root contains ~20 test*.ts files, modify.cjs, and unused utils/surd/* & config/*Defaults.ts files.',
    recommendation: 'Standardize on one KaTeX rendering component across the app (keeping TexEngine strictly for clickable AST token cancellation) and prune scratch files.',
  },
];

export const CORE_MODE_SPECS: ModeExportSpec[] = [
  // --- ESSENTIAL SKILLS ---
  {
    mode: GameMode.ADDITION,
    section: 'essential',
    title: 'Addition',
    menuLabel: 'Add',
    route: '/ (Essential)',
    questionFormat: 'Plain text binary sum (a + b, operands 1–12)',
    inputMechanic: 'Auto-submit numeric input + on-screen Numpad',
    validationNotes: 'Exact integer match; auto-advances on match.',
    visualAid: 'None',
    difficultyProgression: 'Flat (1–12)',
    generatorSource: 'utils/gameLogic.ts',
  },
  {
    mode: GameMode.SUBTRACTION,
    section: 'essential',
    title: 'Subtraction',
    menuLabel: 'Sub',
    route: '/ (Essential)',
    questionFormat: 'Plain text difference (a - b, a in 5–24, strictly positive result)',
    inputMechanic: 'Auto-submit numeric input + on-screen Numpad',
    validationNotes: 'Exact integer match.',
    visualAid: 'None',
    difficultyProgression: 'Flat (positive integer results)',
    generatorSource: 'utils/gameLogic.ts',
  },
  {
    mode: GameMode.MULTIPLICATION,
    section: 'essential',
    title: 'Multiplication',
    menuLabel: 'Mult',
    route: '/ (Essential)',
    questionFormat: 'Plain text product (a × b, times tables 1–12)',
    inputMechanic: 'Auto-submit numeric input + on-screen Numpad',
    validationNotes: 'Exact integer match.',
    visualAid: 'None',
    difficultyProgression: 'Flat (1–12 tables)',
    generatorSource: 'utils/gameLogic.ts',
  },
  {
    mode: GameMode.DIVISION,
    section: 'essential',
    title: 'Division',
    menuLabel: 'Div',
    route: '/ (Essential)',
    questionFormat: 'Plain text exact division (a ÷ b, divisor 2–12, quotient 1–12)',
    inputMechanic: 'Auto-submit numeric input + on-screen Numpad',
    validationNotes: 'Exact integer match.',
    visualAid: 'None',
    difficultyProgression: 'Flat (exact integer quotients)',
    generatorSource: 'utils/gameLogic.ts',
  },
  {
    mode: GameMode.MIXED,
    section: 'essential',
    title: 'Mixed Arithmetic',
    menuLabel: 'Mixed',
    route: '/ (Essential)',
    questionFormat: 'Uniform random mix of Addition, Subtraction, Multiplication, Division',
    inputMechanic: 'Auto-submit numeric input + on-screen Numpad',
    validationNotes: 'Exact integer match.',
    visualAid: 'None',
    difficultyProgression: 'Flat',
    generatorSource: 'utils/gameLogic.ts',
  },
  {
    mode: GameMode.ADD_SUB_NEGATIVES,
    section: 'essential',
    title: 'Directed Numbers (Add & Subtract)',
    menuLabel: '+/- Neg',
    route: '/ (Essential)',
    questionFormat: 'Signed operands (-10 to 10); negative second operand parenthesised e.g. -3 - (-7)',
    inputMechanic: 'Auto-submit signed numeric input + Numpad (with minus toggle)',
    validationNotes: 'Exact signed integer match.',
    visualAid: 'None',
    difficultyProgression: 'Flat (-10 to 10)',
    generatorSource: 'utils/gameLogic.ts',
  },
  {
    mode: GameMode.MULT_DIV_NEGATIVES,
    section: 'essential',
    title: 'Directed Numbers (Multiply & Divide)',
    menuLabel: '×/÷ Neg',
    route: '/ (Essential)',
    questionFormat: 'Signed products & exact quotients (-12 to 12, non-zero divisor)',
    inputMechanic: 'Auto-submit signed numeric input + Numpad',
    validationNotes: 'Exact signed integer match.',
    visualAid: 'None',
    difficultyProgression: 'Flat (-12 to 12)',
    generatorSource: 'utils/gameLogic.ts',
  },

  // --- YEAR 8 MAINSTREAM ---
  {
    mode: GameMode.YEAR8_ADD_SUB_ALGEBRA,
    section: 'year8',
    title: 'Adding & Subtracting Like Terms',
    menuLabel: 'Add/Sub Alg',
    route: '/8mainstream',
    questionFormat: 'KaTeX algebraic sum/difference across 3 combo-gated complexity tiers',
    inputMechanic: 'Algebraic text input with auto-superscript rendering (x2 → x²) & live granular color feedback',
    validationNotes: 'Canonicalises variable order (a^2b == ba^2); highlights correct/wrong terms in emerald/rose.',
    visualAid: 'Live superscript preview',
    difficultyProgression: 'Combo 0–3: 2 like terms; Combo 4–6: 3 terms (2 vars); Combo 7+: mixed higher powers (a²b + ba²)',
    generatorSource: 'utils/gameLogic.ts',
    sampleCombos: [0, 4, 8],
  },
  {
    mode: GameMode.YEAR8_MULT_DIV_ALGEBRA,
    section: 'year8',
    title: 'Multiplying & Dividing Algebra',
    menuLabel: 'Mult/Div Alg',
    route: '/8mainstream',
    questionFormat: 'KaTeX product (ax^m × bx^n) or algebraic fraction (\\frac{...}{...})',
    inputMechanic: 'Algebraic input (supports stacked fraction via "/" for division)',
    validationNotes: 'Checks reduced numeric coefficients and combined/subtracted powers; warns "Remove the 1" for redundant leading 1.',
    visualAid: 'Live fraction & superscript overlay',
    difficultyProgression: 'Combo 0–3: single var, powers ≤ 5; Combo 4+: 2 variables, powers up to 10',
    generatorSource: 'utils/gameLogic.ts',
    sampleCombos: [0, 5, 5],
  },
  {
    mode: GameMode.YEAR8_EXPANDING,
    section: 'year8',
    title: 'Expanding Single Brackets',
    menuLabel: 'Expanding',
    route: '/8mainstream',
    questionFormat: 'KaTeX single bracket expression a(bx + c)',
    inputMechanic: 'Algebraic input with granular per-term color feedback',
    validationNotes: 'Accepts terms in either order (e.g. 6x+12 or 12+6x).',
    visualAid: 'None',
    difficultyProgression: 'Combo 0–2: positive coefficients; Combo 3+: introduces negative outside/constant terms',
    generatorSource: 'utils/gameLogic.ts',
    sampleCombos: [0, 4, 6],
  },
  {
    mode: GameMode.YEAR8_FACTORISING,
    section: 'year8',
    title: 'Factorising (HCF)',
    menuLabel: 'Factorising / HCF',
    route: '/8mainstream & /8seal',
    questionFormat: 'KaTeX linear binomial ax + b with common factor ≥ 2',
    inputMechanic: 'Guided prefix-checking input with automatic bracket insertion',
    validationNotes: 'Detects partial factorisation (non-HCF) and prompts "Factorise fully".',
    visualAid: 'Live guided bracket preview',
    difficultyProgression: 'Flat (HCF 2–6, coprime inner terms)',
    generatorSource: 'utils/gameLogic.ts',
  },

  // --- 8 SEAL ---
  {
    mode: GameMode.INDEX_LAWS,
    section: 'seal8',
    title: 'Index Laws (Negative Powers)',
    menuLabel: 'Neg Powers',
    route: '/8seal',
    questionFormat: 'KaTeX multiply, divide, or power-of-power with exponents -5 to 5, solving for ? in x^?',
    inputMechanic: 'Signed integer exponent input + Numpad',
    validationNotes: 'Exact integer exponent match.',
    visualAid: 'None',
    difficultyProgression: 'Flat (exponents -5 to 5)',
    generatorSource: 'utils/gameLogic.ts',
  },
  {
    mode: GameMode.SIMPLIFY_SURDS,
    section: 'seal8',
    title: 'Simplifying Surds',
    menuLabel: 'Surds',
    route: '/8seal',
    questionFormat: 'KaTeX radical √n or a√n across 4 combo tiers',
    inputMechanic: 'Split outside/inside □√□ box input',
    validationNotes: 'Supports multi-step partial simplification: extracting a non-maximal square factor updates the question to the remaining surd.',
    visualAid: 'Split radical input box',
    difficultyProgression: 'Combo 0–1 (basic), 2–3 (medium), 4–6 (larger squares), 7+ (coefficients + large radicands)',
    generatorSource: 'utils/gameLogic.ts',
    sampleCombos: [0, 3, 5, 8],
  },
  {
    mode: GameMode.SIG_FIGS_SCI_NOTATION,
    section: 'seal8',
    title: 'Significant Figures & Scientific Notation',
    menuLabel: 'Sig Figs / Sci',
    route: '/8seal',
    questionFormat: '5 sub-types: round_dp, round_sf, count_sf, to_decimal, to_sci (KaTeX)',
    inputMechanic: 'Numeric/decimal input, or split □ × 10^□ box for to_sci',
    validationNotes: 'Exact string match preserving required trailing zeros; count_sf highlights significant digits in emerald upon success.',
    visualAid: 'Split ×10^n box & digit highlight',
    difficultyProgression: 'Flat across all 5 sub-types',
    generatorSource: 'utils/gameLogic.ts',
  },
  {
    mode: GameMode.EXPANDING_NEGATIVES,
    section: 'seal8',
    title: 'Expanding Negatives',
    menuLabel: 'Expand Neg',
    route: '/8seal',
    questionFormat: 'KaTeX expression -a(mx + n) or -a(n + mx) (30% reversed order)',
    inputMechanic: 'Algebraic input',
    validationNotes: 'Accepts equivalent term ordering (mx + c or c + mx).',
    visualAid: 'None',
    difficultyProgression: 'Flat (coefficients -5 to 5)',
    generatorSource: 'utils/gameLogic.ts',
  },
  {
    mode: GameMode.TWO_STEP_EQUATIONS,
    section: 'seal8',
    title: 'Two-Step Linear Equations',
    menuLabel: '2-Step Eq',
    route: '/8seal',
    questionFormat: 'KaTeX equation in 4 rearrangements (ax+b=c, b+ax=c, c=b+ax, c=ax+b), 50% fractional x/a',
    inputMechanic: 'Stacked fraction input ("/" splits numerator/denominator)',
    validationNotes: 'Catches unsimplified fractions and prompts student to simplify.',
    visualAid: 'Live stacked fraction input',
    difficultyProgression: 'Flat (integer & reduced rational answers)',
    generatorSource: 'utils/gameLogic.ts',
  },
  {
    mode: GameMode.SEAL8_FACTORISE_DOTS,
    section: 'seal8',
    title: 'Factorising — Difference of Two Squares (DOTS)',
    menuLabel: 'DOTS',
    route: '/8seal',
    questionFormat: 'KaTeX binomial a²x² - b² (a ∈ 1..5, b ∈ 1..10, coprime)',
    inputMechanic: 'Guided prefix-checked auto-bracket input',
    validationNotes: 'Accepts either factor order: (ax-b)(ax+b) or (ax+b)(ax-b).',
    visualAid: 'Guided auto-bracket overlay',
    difficultyProgression: 'Flat',
    generatorSource: 'utils/gameLogic.ts',
  },
  {
    mode: GameMode.SEAL8_FACTORISE_MONIC,
    section: 'seal8',
    title: 'Factorising — Monic Quadratics',
    menuLabel: 'Monic Quad',
    route: '/8seal',
    questionFormat: 'KaTeX trinomial x² + bx + c with integer roots p, q ∈ [-5, 5] \\ {0}',
    inputMechanic: 'Guided prefix-checked auto-bracket input',
    validationNotes: 'Accepts either factor order and also accepts (x+p)² when p = q.',
    visualAid: 'Guided auto-bracket overlay',
    difficultyProgression: 'Flat',
    generatorSource: 'utils/gameLogic.ts',
  },
  {
    mode: GameMode.SEAL8_COMPLETING_SQUARE,
    section: 'seal8',
    title: 'Completing the Square',
    menuLabel: 'Comp Square',
    route: '/8seal',
    questionFormat: 'KaTeX partial quadratic x² + bx (b ∈ [-7, 7] \\ {0}, both even and odd b)',
    inputMechanic: 'Custom live-rendered fraction + superscript input overlay',
    validationNotes: 'Expects (x + b/2)² - b²/4 with reduced fractions for odd b.',
    visualAid: 'Live formatted square & fraction overlay',
    difficultyProgression: 'Flat (mix of integer & half-integer shifts)',
    generatorSource: 'utils/gameLogic.ts',
  },

  // --- YEAR 11 SPECIALIST ---
  {
    mode: GameMode.INVERSE_TRIG_EXACT_VALUES,
    section: 'spec11',
    title: 'Inverse Trigonometric Exact Values',
    menuLabel: 'Inverse Trig',
    route: '/11spec',
    questionFormat: 'KaTeX sin⁻¹, cos⁻¹, tan⁻¹, arcsin, arccos, arctan exact value prompts (including out-of-domain Undefined cases)',
    inputMechanic: '18-button KaTeX exact-value keypad (0, ±π/6 to ±π, Undef)',
    validationNotes: 'Checks exact principal range value; reveals SVG unit circle on completion.',
    visualAid: 'SVG Unit Circle (post-answer)',
    difficultyProgression: 'Flat across principal domains',
    generatorSource: 'utils/gameLogic.ts',
  },

  // --- YEAR 12 METHODS ---
  {
    mode: GameMode.METHODS_GRAPHS,
    section: 'methods12',
    title: 'Function Graph Recognition',
    menuLabel: 'Graphs',
    route: '/12methods',
    questionFormat: 'KaTeX equation across 10 function families (linear, quadratic, cubic, hyperbola, truncus, sqrt, exp, sin, cos, tan)',
    inputMechanic: '4-card SVG GraphCard multiple choice (click card)',
    validationNotes: 'Distractors vary reflections, shifts, asymptotes, and dilations; avoids repeating last 3 families.',
    visualAid: '4× SVG GraphCard options with asymptotes & endpoints',
    difficultyProgression: 'Flat across 10 function families',
    generatorSource: 'utils/gameLogic.ts',
  },
  {
    mode: GameMode.TRIG_EXACT_VALUES,
    section: 'methods12',
    title: 'Circular Functions Exact Values',
    menuLabel: 'Trig Exact',
    route: '/12methods',
    questionFormat: 'KaTeX sin, cos, tan at multiples of π/6 and π/4 over [-2π, 2π]',
    inputMechanic: '14-button KaTeX exact-value keypad + SVG Unit Circle',
    validationNotes: 'Adaptive Quadrant-1 forcing for first 3 questions or after non-sign magnitude errors.',
    visualAid: 'SVG Unit Circle',
    difficultyProgression: 'Adaptive (Q1 remediation -> full [-2π, 2π])',
    generatorSource: 'utils/gameLogic.ts',
  },
  {
    mode: GameMode.METHODS_TRIG_EQUATIONS,
    section: 'methods12',
    title: 'Trigonometric Equations & General Solutions',
    menuLabel: 'Trig Equations',
    route: '/12methods',
    questionFormat: 'KaTeX text + equation prompt (13 general solution items + 11 restricted-domain / sum / solution-count items)',
    inputMechanic: '4-option KaTeX Multiple Choice (click or keys 1–4)',
    validationNotes: 'Curated bank of 24 VCE Methods-style trig equation problems with shuffled distractors.',
    visualAid: 'None',
    difficultyProgression: 'Random draw from 24 curated items',
    generatorSource: 'utils/trigEquationsGame.ts',
  },
  {
    mode: GameMode.YEAR12_MAXIMAL_DOMAIN,
    section: 'methods12',
    title: 'Maximal Domain',
    menuLabel: 'Maximal Domain',
    route: '/12methods',
    questionFormat: 'KaTeX function prompt covering sqrt, ln_e, and hyperbola',
    inputMechanic: '4-option interval notation Multiple Choice',
    validationNotes: 'Tests open vs closed brackets, domain exclusions R \\ {h}, and reflected inequalities.',
    visualAid: 'Optional SVG GraphCard (for unreflected sqrt & hyperbola)',
    difficultyProgression: 'Flat across 3 families',
    generatorSource: 'utils/domainRangeGame.ts',
  },
  {
    mode: GameMode.YEAR12_RANGE,
    section: 'methods12',
    title: 'Range of Restricted Functions',
    menuLabel: 'Range',
    route: '/12methods',
    questionFormat: 'KaTeX restricted-domain linear or quadratic function prompt',
    inputMechanic: '4-option interval notation Multiple Choice',
    validationNotes: '70% of quadratics place the turning point inside the domain to test vertex-bound range vs endpoint trap.',
    visualAid: 'SVG GraphCard with open/closed endpoints and pink turning-point marker',
    difficultyProgression: 'Flat (linear & quadratic)',
    generatorSource: 'utils/domainRangeGame.ts',
  },
  {
    mode: GameMode.METHODS_DERIVATIVES,
    section: 'methods12',
    title: 'Differentiation',
    menuLabel: 'Derivatives',
    route: '/12methods',
    questionFormat: 'KaTeX derivative prompt across 7 families (poly, chain_poly, sqrt, ln_e, sin, cos, exp)',
    inputMechanic: '4-option KaTeX Multiple Choice',
    validationNotes: 'Distractors target common chain-rule sign and coefficient errors.',
    visualAid: 'None',
    difficultyProgression: 'Flat across 7 families',
    generatorSource: 'utils/calculusGame.ts',
  },
  {
    mode: GameMode.METHODS_ANTIDERIVATIVES,
    section: 'methods12',
    title: 'Antidifferentiation',
    menuLabel: 'Antiderivatives',
    route: '/12methods',
    questionFormat: 'KaTeX prompt testing "Find an antiderivative" (no +c) vs "Find the antiderivative" / ∫...dx (with +c)',
    inputMechanic: '6-option KaTeX Multiple Choice (3 base forms × with/without +c)',
    validationNotes: 'Specifically distinguishes definite phrasing ("an" vs "the" / indefinite integral symbol) alongside chain-rule factor division.',
    visualAid: 'None',
    difficultyProgression: 'Flat across 7 families',
    generatorSource: 'utils/calculusGame.ts',
  },
  {
    mode: GameMode.METHODS_MIXED_CALCULUS,
    section: 'methods12',
    title: 'Mixed Calculus',
    menuLabel: 'Mixed Calc',
    route: '/12methods',
    questionFormat: '50/50 random blend of Differentiation (4 options) and Antidifferentiation (6 options)',
    inputMechanic: '4- or 6-option KaTeX Multiple Choice',
    validationNotes: 'Tests rapid switching between multiplying and dividing by inner linear derivative.',
    visualAid: 'None',
    difficultyProgression: 'Flat across 7 families',
    generatorSource: 'utils/calculusGame.ts',
  },
  {
    mode: GameMode.METHODS_NORMAL_SYMMETRY,
    section: 'methods12',
    title: 'Normal Distribution Symmetry',
    menuLabel: 'Normal Sym',
    route: '/12methods',
    questionFormat: 'KaTeX conditional/tail probability or z-score standardisation prompt',
    inputMechanic: '4-option KaTeX Multiple Choice (keys 1–4)',
    validationNotes: 'Covers 2-parameter conditional symmetry, 1-parameter symmetric bounds, and z-score equivalence.',
    visualAid: 'Custom SVG Normal Bell Curve with shaded regions, mean dashed line & labels',
    difficultyProgression: 'Random across 3 sub-types',
    generatorSource: 'utils/normalSymmetryGame.ts',
  },
  {
    mode: GameMode.METHODS_PROBABILITY,
    section: 'methods12',
    title: 'Binomial Probability',
    menuLabel: 'Probability',
    route: '/12methods',
    questionFormat: 'KaTeX word problem (marbles with replacement), explicit Bi(n,p) exact Pr(X=k), or parameter solving (mean/var/sd/Pr(X≥1))',
    inputMechanic: '4-option KaTeX Multiple Choice (keys 1–4)',
    validationNotes: 'Uses exact combinatorial fractions and binomial coefficients.',
    visualAid: 'None',
    difficultyProgression: 'Random across 3 sub-types',
    generatorSource: 'utils/binomialProbabilityGame.ts',
  },
  {
    mode: GameMode.METHODS_SAMPLE_PROPORTIONS,
    section: 'methods12',
    title: 'Sample Proportions & Confidence Intervals',
    menuLabel: 'Sample Props',
    route: '/12methods',
    questionFormat: 'KaTeX word/symbolic problems across 5 sub-types (68/95/99.7 z-score, find n, find p̂, CI width scaling, E(P̂)/Binomial rewrite)',
    inputMechanic: '4-option KaTeX Multiple Choice (keys 1–4)',
    validationNotes: 'Tests VCE Methods statistical inference concepts and width-scaling square-root laws.',
    visualAid: 'None',
    difficultyProgression: 'Random across 5 sub-types',
    generatorSource: 'utils/sampleProportionsGame.ts',
  },
  {
    mode: GameMode.METHODS_MARGIN_STEPS,
    section: 'methods12',
    title: 'Margin of Error Simplification Steps',
    menuLabel: 'Margin Steps',
    route: '/12methods',
    questionFormat: 'Given z, p̂, and n from 23 curated clean-square cases, simplify M = z√(p̂(1-p̂)/n) to a reduced fraction',
    inputMechanic: '4-step interactive fraction working builder (allows step-by-step or jumping directly to final reduced answer)',
    validationNotes: 'Validates p̂(1-p̂), variance p̂(1-p̂)/n, standard deviation √(var), and final reduced fraction M.',
    visualAid: 'Live stacked KaTeX working-out lines',
    difficultyProgression: 'Random draw from 23 exact-square cases',
    generatorSource: 'utils/sampleProportionsGame.ts',
  },
];

// Pretty-print a multivar terms map like { "a^2b": 5, "x": -1, "constant": 3 } to LaTeX
function formatTermsMapLatex(terms: Record<string, number>): string {
  const keys = Object.keys(terms).filter(k => terms[k] !== 0);
  if (keys.length === 0) return '0';
  // Put variable terms first, constant last
  keys.sort((a, b) => {
    if (a === 'constant') return 1;
    if (b === 'constant') return -1;
    return a.localeCompare(b);
  });
  let out = '';
  keys.forEach((k, idx) => {
    const c = terms[k];
    const absC = Math.abs(c);
    const sign = c < 0 ? (idx === 0 ? '-' : ' - ') : (idx === 0 ? '' : ' + ');
    if (k === 'constant') {
      out += `${sign}${absC}`;
    } else {
      const varLatex = k.replace(/\^(\d+)/g, '^{$1}');
      out += `${sign}${absC === 1 ? '' : absC}${varLatex}`;
    }
  });
  return out;
}

function formatFractionStrLatex(str: string): string {
  if (!str.includes('/')) return str.replace(/\^(\d+)/g, '^{$1}');
  const [n, d] = str.split('/');
  return `\\frac{${n.replace(/\^(\d+)/g, '^{$1}')}}{${d.replace(/\^(\d+)/g, '^{$1}')}}`;
}

export function formatProblemAnswer(
  problem: MathProblem,
  mode: GameMode
): {
  latex: string;
  plain: string;
  workingLinesLatex?: string[];
  correctOptionIndex?: number;
} {
  const raw = String(problem.answer);

  // Multiple choice modes where answer is an index into problem.options
  if (problem.options && problem.options.length > 0 && /^\d+$/.test(raw)) {
    const idx = parseInt(raw, 10);
    if (mode === GameMode.METHODS_GRAPHS) {
      const letter = ['A', 'B', 'C', 'D'][idx] || `#${idx + 1}`;
      const opt = problem.options[idx];
      const paramStr = opt ? `${opt.type} (a=${opt.a}, h=${opt.h}, k=${opt.k})` : '';
      return {
        latex: `\\text{Option ${letter} — ${paramStr}}`,
        plain: `Option ${letter}: ${paramStr}`,
        correctOptionIndex: idx,
      };
    }
    const chosen = problem.options[idx];
    if (typeof chosen === 'string') {
      return {
        latex: chosen,
        plain: chosen,
        correctOptionIndex: idx,
      };
    }
  }

  // Margin steps mode
  if (mode === GameMode.METHODS_MARGIN_STEPS && problem.marginDetails) {
    const d = problem.marginDetails;
    const workingLinesLatex = [
      `M = ${d.z}\\sqrt{\\frac{${d.pStr} \\times ${d.qStr}}{${d.n}}}`,
      `= ${d.z}\\sqrt{\\frac{${d.p1pStr}}{${d.n}}}`,
      `= ${d.z}\\sqrt{${d.varStr}}`,
      `= ${d.z} \\times ${d.sdStr}`,
      `= ${d.mStr}`,
    ];
    return {
      latex: `M = ${d.mStr}`,
      plain: `M = ${d.mNum}/${d.mDen}`,
      workingLinesLatex,
    };
  }

  // JSON-encoded answers from utils/gameLogic.ts
  if (raw.startsWith('{')) {
    try {
      const obj = JSON.parse(raw);

      if (mode === GameMode.SIMPLIFY_SURDS) {
        const latex =
          obj.i === 1
            ? `${obj.o}`
            : `${obj.o === 1 ? '' : obj.o}\\sqrt{${obj.i}}`;
        return { latex, plain: obj.i === 1 ? `${obj.o}` : `${obj.o}√${obj.i}` };
      }

      if (mode === GameMode.SIG_FIGS_SCI_NOTATION) {
        if (obj.type === 'sci') {
          return {
            latex: `${obj.a} \\times 10^{${obj.n}}`,
            plain: `${obj.a} × 10^${obj.n}`,
          };
        }
        if (obj.type === 'count_sf') {
          return {
            latex: `${obj.value}\\text{ s.f.}`,
            plain: `${obj.value} s.f. (sig digits: "${obj.numStr.slice(obj.sigStart, obj.sigEnd)}")`,
          };
        }
        return { latex: `${obj.value}`, plain: String(obj.value) };
      }

      if (obj.type === 'expand') {
        const xStr =
          obj.x === 0 ? '' : obj.x === 1 ? 'x' : obj.x === -1 ? '-x' : `${obj.x}x`;
        const cStr =
          obj.c === 0
            ? ''
            : obj.c > 0
            ? `${xStr ? ' + ' : ''}${obj.c}`
            : `${xStr ? ' - ' : '-'}${Math.abs(obj.c)}`;
        const expr = `${xStr}${cStr}` || '0';
        return { latex: expr, plain: expr };
      }

      if (obj.type === 'equation') {
        const latex =
          obj.den === 1
            ? `x = ${obj.num}`
            : `x = ${obj.num < 0 ? '-' : ''}\\frac{${Math.abs(obj.num)}}{${obj.den}}`;
        const plain = obj.den === 1 ? `x = ${obj.num}` : `x = ${obj.num}/${obj.den}`;
        return { latex, plain };
      }

      if (obj.type === 'multivar' && obj.terms) {
        const expr = formatTermsMapLatex(obj.terms);
        return { latex: expr, plain: expr };
      }

      if (obj.isDiv && obj.str) {
        return { latex: formatFractionStrLatex(obj.str), plain: obj.str };
      }

      if (obj.type === 'factorise' && obj.str) {
        return { latex: obj.str, plain: obj.str };
      }

      if (obj.type === 'dots') {
        const ax = obj.a === 1 ? obj.letter : `${obj.a}${obj.letter}`;
        const expr = `(${ax} - ${obj.b})(${ax} + ${obj.b})`;
        return { latex: expr, plain: expr };
      }

      if (obj.type === 'monic_quadratic') {
        const fmt = (v: number) => (v < 0 ? `- ${Math.abs(v)}` : `+ ${v}`);
        const expr =
          obj.p === obj.q
            ? `(${obj.letter} ${fmt(obj.p)})^2`
            : `(${obj.letter} ${fmt(obj.p)})(${obj.letter} ${fmt(obj.q)})`;
        return { latex: expr, plain: expr };
      }

      if (obj.type === 'completing_square') {
        const b = obj.b as number;
        const l = obj.letter as string;
        const sign = b < 0 ? '-' : '+';
        const absB = Math.abs(b);
        if (absB % 2 === 0) {
          const half = absB / 2;
          const expr = `(${l} ${sign} ${half})^2 - ${half * half}`;
          return { latex: expr, plain: expr };
        } else {
          const expr = `\\left(${l} ${sign} \\frac{${absB}}{2}\\right)^2 - \\frac{${absB * absB}}{4}`;
          return { latex: expr, plain: `(${l} ${sign} ${absB}/2)^2 - ${absB * absB}/4` };
        }
      }
    } catch {
      // fall through
    }
  }

  return { latex: raw, plain: raw };
}

function buildStandaloneModules(): StandaloneModuleBundle[] {
  return [
    {
      id: 'standalone-frac-simplify',
      section: 'seal8',
      title: 'Algebraic Fractions — Simplify, Multiply & Divide',
      route: '/algebraic-fractions-prototype',
      rendererEngine: 'Custom SVG TexEngine (utils/textEngine.ts) + mathjs equivalence',
      inputMechanic: 'Interactive EDIT (factorise into brackets) and CANCEL (click matching numerator/denominator factors) workspace',
      questionFormat: '11 factorising templates + simple monomial fraction templates (simplify, multiply, divide)',
      bankSize: 'Procedural from 11+ templates',
      samples: [
        {
          id: 'fs-1',
          label: 'Simplify by HCF Factorising',
          promptLatex: '\\frac{3x + 6}{6x + 12}',
          answerLatex: '\\frac{1}{2}',
          stages: [
            { label: 'Step 1 (Edit / Factorise)', contentLatex: '\\frac{3(x + 2)}{6(x + 2)}' },
            { label: 'Step 2 (Cancel Factors)', contentLatex: '\\frac{3}{6} = \\frac{1}{2}' },
          ],
        },
        {
          id: 'fs-2',
          label: 'Multiply with Common Factor Cancellation',
          promptLatex: '\\frac{4x - 8}{3x} \\times \\frac{9x^2}{2x - 4}',
          answerLatex: '6x',
          stages: [
            { label: 'Step 1 (Factorise)', contentLatex: '\\frac{4(x - 2)}{3x} \\times \\frac{9x^2}{2(x - 2)}' },
            { label: 'Step 2 (Cancel & Multiply)', contentLatex: '2 \\times 3x = 6x' },
          ],
        },
        {
          id: 'fs-3',
          label: 'Divide (Keep-Change-Flip + Cancel)',
          promptLatex: '\\frac{5a + 15}{4b} \\div \\frac{a + 3}{8b^2}',
          answerLatex: '10b',
          stages: [
            { label: 'Step 1 (Invert & Multiply)', contentLatex: '\\frac{5(a + 3)}{4b} \\times \\frac{8b^2}{a + 3}' },
            { label: 'Step 2 (Cancel)', contentLatex: '5 \\times 2b = 10b' },
          ],
        },
      ],
    },
    {
      id: 'standalone-frac-addsub',
      section: 'seal8',
      title: 'Algebraic Fractions — Add & Subtract',
      route: '/algebraic-fractions-add-subtract',
      rendererEngine: 'Custom SVG TexEngine (utils/textEngine.ts) + mathjs equivalence',
      inputMechanic: 'Interactive common-denominator multiplier, numerator expansion, like-term collection, and factor cancellation',
      questionFormat: '7 procedural algebraic fraction addition/subtraction templates (numerical, monomial, and linear denominators)',
      bankSize: 'Procedural from 7 templates',
      samples: [
        {
          id: 'fa-1',
          label: 'Numerical Denominators (Add)',
          promptLatex: '\\frac{x + 2}{3} + \\frac{x - 1}{4}',
          answerLatex: '\\frac{7x + 5}{12}',
          stages: [
            { label: 'Common Denominator (12)', contentLatex: '\\frac{4(x + 2) + 3(x - 1)}{12}' },
            { label: 'Expand & Collect', contentLatex: '\\frac{4x + 8 + 3x - 3}{12} = \\frac{7x + 5}{12}' },
          ],
        },
        {
          id: 'fa-2',
          label: 'Linear Bracket Denominators (Subtract)',
          promptLatex: '\\frac{3}{x + 2} - \\frac{2}{x - 1}',
          answerLatex: '\\frac{x - 7}{(x + 2)(x - 1)}',
          stages: [
            { label: 'Common Denominator', contentLatex: '\\frac{3(x - 1) - 2(x + 2)}{(x + 2)(x - 1)}' },
            { label: 'Expand & Simplify', contentLatex: '\\frac{3x - 3 - 2x - 4}{(x + 2)(x - 1)} = \\frac{x - 7}{(x + 2)(x - 1)}' },
          ],
        },
        {
          id: 'fa-3',
          label: 'Negative Sign Distribution Trap',
          promptLatex: '\\frac{2x + 1}{5} - \\frac{x - 3}{2}',
          answerLatex: '\\frac{-x + 17}{10}',
          stages: [
            { label: 'Common Denominator (10)', contentLatex: '\\frac{2(2x + 1) - 5(x - 3)}{10}' },
            { label: 'Expand & Collect', contentLatex: '\\frac{4x + 2 - 5x + 15}{10} = \\frac{-x + 17}{10}' },
          ],
        },
      ],
    },
    {
      id: 'standalone-frac-quad',
      section: 'seal8',
      title: 'Algebraic Fractions — Quadratics (DOTS & Monic)',
      route: '/algebraic-fractions-quad',
      rendererEngine: 'Custom SVG TexEngine (utils/textEngine.ts) + mathjs equivalence',
      inputMechanic: 'Interactive factorise-and-cancel workspace combining DOTS, monic quadratics, and HCF factors',
      questionFormat: '5 procedural templates multiplying/dividing rational quadratic expressions',
      bankSize: 'Procedural from 5 templates',
      samples: [
        {
          id: 'fq-1',
          label: 'DOTS ÷ Monic Quadratic',
          promptLatex: '\\frac{x^2 - 9}{x^2 + 5x + 6}',
          answerLatex: '\\frac{x - 3}{x + 2}',
          stages: [
            { label: 'Factorise Numerator & Denominator', contentLatex: '\\frac{(x - 3)(x + 3)}{(x + 2)(x + 3)}' },
            { label: 'Cancel (x + 3)', contentLatex: '\\frac{x - 3}{x + 2}' },
          ],
        },
        {
          id: 'fq-2',
          label: 'Quadratic Product Cancellation',
          promptLatex: '\\frac{x^2 - 4}{x^2 - x - 6} \\times \\frac{x - 3}{2x + 4}',
          answerLatex: '\\frac{x - 2}{2(x + 2)}',
          stages: [
            { label: 'Factorise All Parts', contentLatex: '\\frac{(x - 2)(x + 2)}{(x - 3)(x + 2)} \\times \\frac{x - 3}{2(x + 2)}' },
            { label: 'Cancel Matching Factors', contentLatex: '\\frac{x - 2}{2(x + 2)}' },
          ],
        },
      ],
    },
    {
      id: 'standalone-quad-formula',
      section: 'seal8',
      title: 'Quadratic Formula (6-Stage Scaffolded Solver)',
      route: '/quadratic-formula-draft',
      rendererEngine: 'Direct katex.renderToString',
      inputMechanic: '6-stage progressive input: (1) Identify a, b, c -> (2) Discriminant Δ = b² - 4ac -> (3) Solution count (0/1/2) -> (4) Formula substitution -> (5) Root simplification -> (6) Final roots',
      questionFormat: 'Procedural ax² + bx + c = 0 covering Δ > 0 (rational & surd), Δ = 0 (repeated root), and Δ < 0 (no real solutions)',
      bankSize: 'Procedural (random a, b, c)',
      samples: [
        {
          id: 'qf-1',
          label: 'Two Distinct Rational Roots (Δ > 0, perfect square)',
          promptLatex: '2x^2 - 5x - 3 = 0',
          answerLatex: 'x = 3 \\text{ or } x = -\\frac{1}{2}',
          stages: [
            { label: '1. Coefficients', contentLatex: 'a = 2,\\; b = -5,\\; c = -3' },
            { label: '2. Discriminant', contentLatex: '\\Delta = (-5)^2 - 4(2)(-3) = 25 + 24 = 49' },
            { label: '3. Solutions', contentLatex: '\\Delta > 0 \\implies 2 \\text{ real solutions}' },
            { label: '4–6. Formula & Roots', contentLatex: 'x = \\frac{5 \\pm \\sqrt{49}}{4} = \\frac{5 \\pm 7}{4} \\implies x = 3,\\; -\\frac{1}{2}' },
          ],
        },
        {
          id: 'qf-2',
          label: 'Exact Surd Roots (Δ > 0, non-square)',
          promptLatex: 'x^2 + 4x - 2 = 0',
          answerLatex: 'x = -2 \\pm \\sqrt{6}',
          stages: [
            { label: '1. Coefficients', contentLatex: 'a = 1,\\; b = 4,\\; c = -2' },
            { label: '2. Discriminant', contentLatex: '\\Delta = 4^2 - 4(1)(-2) = 24' },
            { label: '3–6. Simplified Surd', contentLatex: 'x = \\frac{-4 \\pm \\sqrt{24}}{2} = \\frac{-4 \\pm 2\\sqrt{6}}{2} = -2 \\pm \\sqrt{6}' },
          ],
        },
        {
          id: 'qf-3',
          label: 'No Real Solutions (Δ < 0)',
          promptLatex: '3x^2 - 2x + 5 = 0',
          answerLatex: '\\text{No real solutions}',
          stages: [
            { label: '1. Coefficients', contentLatex: 'a = 3,\\; b = -2,\\; c = 5' },
            { label: '2. Discriminant', contentLatex: '\\Delta = (-2)^2 - 4(3)(5) = 4 - 60 = -56 < 0' },
            { label: '3. Conclusion', contentLatex: '\\text{No real solutions (stops at Stage 3)}' },
          ],
        },
      ],
    },
    {
      id: 'standalone-pronumerals',
      section: 'year9',
      title: 'Pronumerals on Both Sides (Step-by-Step Equation Solver)',
      route: '/pronumerals-both-sides',
      rendererEngine: 'Direct katex.renderToString + motion/react line transitions',
      inputMechanic: 'Line-by-line equation manipulation (type equivalent next line OR jump straight to x = value) with contextual hints',
      questionFormat: 'Level 1: ax + b = cx + d; Level 2: single or double brackets e.g. a(bx + c) = d(ex + f)',
      bankSize: 'Procedural (Level 1 & Level 2)',
      samples: [
        {
          id: 'pb-1',
          label: 'Level 1 — Standard Pronumerals Both Sides',
          promptLatex: '5x - 3 = 2x + 9',
          answerLatex: 'x = 4',
          stages: [
            { label: 'Subtract 2x', contentLatex: '3x - 3 = 9' },
            { label: 'Add 3', contentLatex: '3x = 12' },
            { label: 'Divide by 3', contentLatex: 'x = 4' },
          ],
        },
        {
          id: 'pb-2',
          label: 'Level 2 — Brackets on Both Sides',
          promptLatex: '3(2x - 1) = 4(x + 3)',
          answerLatex: 'x = \\frac{15}{2}',
          stages: [
            { label: 'Expand Brackets', contentLatex: '6x - 3 = 4x + 12' },
            { label: 'Collect x terms', contentLatex: '2x - 3 = 12' },
            { label: 'Isolate x', contentLatex: '2x = 15 \\implies x = \\frac{15}{2}' },
          ],
        },
      ],
    },
  ];
}

export function buildExportDump(samplesPerMode: number = 3): FullExportDump {
  const coreModes: ModeExportBundle[] = CORE_MODE_SPECS.map((spec) => {
    const samples: FormattedSample[] = [];
    const seenQuestions = new Set<string>();

    // Determine how many samples to draw (ensure combo-tiered modes show all tiers)
    const count = spec.sampleCombos
      ? Math.max(samplesPerMode, spec.sampleCombos.length)
      : spec.mode === GameMode.SIG_FIGS_SCI_NOTATION
      ? Math.max(samplesPerMode, 5)
      : spec.mode === GameMode.METHODS_GRAPHS
      ? Math.max(samplesPerMode, 4)
      : samplesPerMode;

    for (let i = 0; i < count; i++) {
      const combo = spec.sampleCombos
        ? spec.sampleCombos[i % spec.sampleCombos.length]
        : 0;

      // Try up to 10 attempts to get a distinct question so the reviewer sees variety
      let problem = generateProblem(spec.mode, { combo });
      let tries = 0;
      while (seenQuestions.has(problem.question) && tries < 10) {
        problem = generateProblem(spec.mode, { combo });
        tries++;
      }
      seenQuestions.add(problem.question);

      const formatted = formatProblemAnswer(problem, spec.mode);
      samples.push({
        id: `${spec.mode}-${i + 1}`,
        comboTier: spec.sampleCombos ? combo : undefined,
        problem,
        formattedAnswerLatex: formatted.latex,
        formattedAnswerPlain: formatted.plain,
        rawAnswer: String(problem.answer),
        workingLinesLatex: formatted.workingLinesLatex,
        correctOptionIndex: formatted.correctOptionIndex,
      });
    }

    return { spec, samples };
  });

  // ALT 5: cover all 13 categories, showing both standard & challenging when samplesPerMode >= 2
  const alt5Bank: Alt5CategoryBundle[] = ALT5_CATEGORIES.map((cat) => {
    const altSamples: Alt5Question[] = [];
    const perCat = Math.max(2, Math.min(samplesPerMode, 4));
    for (let i = 0; i < perCat; i++) {
      const diff: 'standard' | 'challenging' = i % 2 === 0 ? 'standard' : 'challenging';
      altSamples.push(generateQuestionByCategory(cat.id, diff));
    }
    return {
      categoryId: cat.id,
      categoryTitle: cat.title,
      samples: altSamples,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    appTitle: 'MathFlow Trainer',
    summaryMetrics: {
      coreEngineModes: CORE_MODE_SPECS.length,
      brokenRegisteredModes: 1, // YEAR9_BOTH_SIDES
      standaloneModules: 7, // 5 above + Alt5Practice + PartialFractionsGame
      alt5Categories: ALT5_CATEGORIES.length,
      partialFractionsBankSize: PARTIAL_FRACTIONS_PROBLEMS.length,
      mathRenderingEngines: 4,
    },
    siteInventory: SITE_INVENTORY,
    improvementAudit: IMPROVEMENT_AUDIT,
    coreModes,
    standaloneModules: buildStandaloneModules(),
    alt5Bank,
    partialFractionsBank: PARTIAL_FRACTIONS_PROBLEMS,
  };
}
