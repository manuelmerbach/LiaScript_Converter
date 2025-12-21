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
  {
    name: "sog",
    regex: /\\sog\s*/g,
    replacement: "sog. ",
    description: "Ersetzt \\sog durch 'sog. '"
  },
  {
    name: "dH",
    regex: /\\dH\b/g,
    replacement: "d. h.",
    description: "Ersetzt \\dH durch 'd. h.'"
  }
  
  // Weitere Textmakros können hier hinzugefügt werden:
  /*
  {
    name: "zB",
    regex: /\\zB\b/g,
    replacement: "z. B.",
    description: "Ersetzt \\zB durch 'z. B.'"
  },
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
