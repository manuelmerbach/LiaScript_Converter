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
  // /sog steht in den meisten Fällen vor einer kursiven Formatierung (/emph{...}), wodurch in Markdown keine Leerzeile dazwischen entsteht. Andernfalls entsteht eine doppelte Leerzeile die in Markdown ignoriert wird.
  {
    name: "sog",
    regex: /\\sog\b/g,
    replacement: "sog. ",
    description: "Ersetzt \\bzw durch 'bzw.'"
  }

  /*
  {
    name: "bzw",
    regex: /\\bzw\b/g,
    replacement: "bzw.",
    description: "Ersetzt \\bzw durch 'bzw.'"
  },
  {
    name: "etc",
    regex: /\\etc\b/g,
    replacement: "etc.",
    description: "Ersetzt \\etc durch 'etc.'"
  },
  {
    name: "usw",
    regex: /\\usw\b/g,
    replacement: "usw.",
    description: "Ersetzt \\usw durch 'usw.'"
  },
  {
    name: "vgl",
    regex: /\\vgl\b/g,
    replacement: "vgl.",
    description: "Ersetzt \\vgl durch 'vgl.'"
  },
  {
    name: "ggf",
    regex: /\\ggf\b/g,
    replacement: "ggf.",
    description: "Ersetzt \\ggf durch 'ggf.'"
  },
  {
    name: "evtl",
    regex: /\\evtl\b/g,
    replacement: "evtl.",
    description: "Ersetzt \\evtl durch 'evtl.'"
  }
  */
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
