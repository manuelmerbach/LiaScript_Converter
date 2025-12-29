/**
 * Eigene Textmakros für die LaTeX-Vorverarbeitung
 * 
 * Diese Datei enthält benutzerdefinierte Textmakros, die einfache
 * Textersetzungen durchführen. Neue Makros können hier problemlos
 * hinzugefügt werden.
 */

export interface TextMacro {
  name: string;
  regex: RegExp;
  replacement: string;
  description?: string;
}

/**
 * Liste aller Textmakros
 * Neue Makros können hier einfach hinzugefügt werden
 */
export const textMacros: TextMacro[] = [
  // === Logische Operatoren (als Math-Inline-Code) ===
  {
    name: "notOp",
    regex: /\\notOp\b/g,
    replacement: "$\\text{NOT}$",
    description: "Ersetzt \\notOp durch Math-Inline: $\\text{NOT}$"
  },
  {
    name: "andOp",
    regex: /\\andOp\b/g,
    replacement: "$\\text{AND}$",
    description: "Ersetzt \\andOp durch Math-Inline: $\\text{AND}$"
  },
  {
    name: "orOp",
    regex: /\\orOp\b/g,
    replacement: "$\\text{OR}$",
    description: "Ersetzt \\orOp durch Math-Inline: $\\text{OR}$"
  },
  {
    name: "xorOp",
    regex: /\\xorOp\b/g,
    replacement: "$\\text{XOR}$",
    description: "Ersetzt \\xorOp durch Math-Inline: $\\text{XOR}$"
  },
  {
    name: "andnotOp",
    regex: /\\andnotOp\b/g,
    replacement: "$\\text{AND NOT}$",
    description: "Ersetzt \\andnotOp durch Math-Inline: $\\text{AND NOT}$"
  },
  // \sog steht in den meisten Fällen vor einer kursiven Formatierung (\emph{...}), wodurch in Markdown keine Leerzeile dazwischen entsteht. 
  // Andernfalls entsteht eine doppelte Leerzeile die in Markdown ignoriert wird.
  {
    name: "sog",
    regex: /\\sog\b/g,
    replacement: "sog. ",
    description: "Ersetzt \sog durch 'sog. '"
  },
];

/**
 * Wendet alle Textmakros auf einen String an
 */
export function applyTextMacros(content: string): { processed: string; count: number } {
  let output = content;
  let count = 0;
  
  for (const macro of textMacros) {
    const beforeLength = output.length;
    output = output.replace(macro.regex, macro.replacement);
    // Zähle Ersetzungen (annähernd, basierend auf Längenänderung)
    if (output !== content) {
      count++;
    }
  }
  
  return { processed: output, count };
}
