import React from 'react';
import Latex from 'react-latex-next';

interface MathTextProps {
  content: string;
  className?: string;
}

/**
 * Converts strings that may contain LaTeX \text{...} wrappers or plain text
 * into properly delimited text + $math$ tokens so that English text renders as
 * standard, readable, line-wrapping HTML text, and math renders as crisp KaTeX formulas.
 */
export function formatLatexQuestion(raw: string): string {
  if (!raw) return '';

  let text = raw.trim();

  // If the string starts with `$` or `$$` and ends with `$`, strip them first
  if (text.startsWith('$$') && text.endsWith('$$')) {
    text = text.slice(2, -2).trim();
  } else if (text.startsWith('$') && text.endsWith('$')) {
    text = text.slice(1, -1).trim();
  }

  // If the string is purely English text (no LaTeX backslashes)
  if (!text.includes('\\') && !text.includes('$') && /[a-zA-Z]{2,}\s+[a-zA-Z]/.test(text)) {
    return text;
  }

  // If the whole string is just a math expression without \text, e.g. "x^2 + 2x + 1"
  if (!text.includes('\\text{')) {
    // If it's already got dollar signs, return as is
    if (text.includes('$')) return text;
    // Otherwise wrap in $...$
    return `$${text}$`;
  }

  // Decompose expressions containing \text{...}
  // Any content inside \text{...} is normal English text.
  // Content outside \text{...} is math formulas and should be enclosed in $...$.
  let result = '';
  let i = 0;
  const len = text.length;

  while (i < len) {
    const textIdx = text.indexOf('\\text{', i);
    if (textIdx === -1) {
      // The rest is math
      const rest = text.slice(i).trim();
      if (rest) {
        result += ` $${rest}$ `;
      }
      break;
    }

    // There was math before \text{
    if (textIdx > i) {
      const mathPart = text.slice(i, textIdx).trim();
      if (mathPart) {
        result += ` $${mathPart}$ `;
      }
    }

    // Now extract inside \text{...}
    let braceCount = 1;
    let j = textIdx + 6; // right after '\text{'
    const textStart = j;

    while (j < len && braceCount > 0) {
      if (text[j] === '{' && text[j - 1] !== '\\') {
        braceCount++;
      } else if (text[j] === '}' && text[j - 1] !== '\\') {
        braceCount--;
      }
      j++;
    }

    const textContent = text.slice(textStart, j - 1);
    result += textContent;
    i = j;
  }

  // Clean up any double spaces or empty math tags like $$
  return result
    .replace(/\$\s*\$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const MathText: React.FC<MathTextProps> = ({ content, className }) => {
  if (!content) return null;
  const formatted = formatLatexQuestion(content);
  return (
    <span className={`inline leading-relaxed ${className || ''}`}>
      <Latex>{formatted}</Latex>
    </span>
  );
};

export default MathText;
