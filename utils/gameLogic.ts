
import { GameMode, MathProblem } from '../types';

export const generateProblem = (mode: GameMode): MathProblem => {
  let a: number, b: number, answer: number, question: string;
  let activeMode = mode;

  if (mode === GameMode.MIXED) {
    const modes = [GameMode.ADDITION, GameMode.SUBTRACTION, GameMode.MULTIPLICATION];
    activeMode = modes[Math.floor(Math.random() * modes.length)];
  }

  switch (activeMode) {
    case GameMode.ADDITION:
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a + b;
      question = `${a} + ${b}`;
      break;

    case GameMode.SUBTRACTION:
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      if (a < b) [a, b] = [b, a];
      answer = a - b;
      question = `${a} - ${b}`;
      break;

    case GameMode.MULTIPLICATION:
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
      question = `${a} × ${b}`;
      break;

    default:
      return { question: '?', answer: 0 };
  }

  return { question, answer };
};
