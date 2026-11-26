// Loose typings for utils/congruenceBank.js (question generator + checker for congruent triangles).
export type InputKind = 'mapping' | 'letters' | 'test' | 'pairs' | 'fact' | 'steps';
export interface CBQuestion {
  id: string; type: string; family: 'mapping' | 'test'; difficulty: number; seed: number;
  title: string; prompt: string; svg: string; figure: any; showFigure?: boolean;
  tri1: string[]; tri2: string[]; mapping: Record<string, string>; statement: string; test: string;
  configLabel: string; facts: any[]; hints: string[]; explanation: string;
  input: any; answer: any; meta: any; pool: any[]; validTests: string[]; proposedIsCorrect?: boolean; proposedError?: string;
}
export interface CongruenceBankAPI {
  version: string;
  TYPES: Record<string, { family: string; label: string; difficulties: number[] }>;
  TESTS: string[];
  CONFIGS: Record<string, { label: string; transform: string; tests: string[] }>;
  REASON_OPTIONS: { value: string; label: string }[];
  generate(type: string, opts?: Record<string, any>): CBQuestion;
  generateSet(spec?: Record<string, any>): CBQuestion[];
  renderSVG(figure: any, style?: Record<string, any>): string;
  check(q: CBQuestion, resp: any): any;
  checkMapping(q: CBQuestion, resp: Record<string, string>): any;
  checkMappingRow(q: CBQuestion, from: string, letter: string): { status: 'correct' | 'wrong' | 'empty'; code?: string; message?: string };
  checkLetters(q: CBQuestion, s: string): any;
  checkTest(q: CBQuestion, choice: string): { correct: boolean; message: string };
  checkPair(q: CBQuestion, left: string, right: string, kind?: string): { status: string; code?: string; message?: string; key?: string };
  checkPairs(q: CBQuestion, resp: any): any;
  checkFact(q: CBQuestion, resp: any): any;
  classifyFacts(facts: any[]): string;
  VALID_TESTS: string[];
}
declare const CongruenceBank: CongruenceBankAPI;
export default CongruenceBank;
