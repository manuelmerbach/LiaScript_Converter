/**
 * Regex-Muster für die LaTeX-Vorverarbeitung
 * 
 * Diese Datei enthält alle Regex-Patterns, die für die Transformation
 * von LaTeX-Makros verwendet werden. Neue Patterns können hier einfach
 * hinzugefügt werden.
 */

export interface RegexPattern {
  name: string;
  regex: RegExp;
  replacement: string | ((match: string, ...groups: string[]) => string);
  description?: string;
}

/**
 * Einfache Makro-Ersetzungen
 * Format: \makro{inhalt} -> \ziel{inhalt}
 */
export const simpleMacroReplacements: RegexPattern[] = [
  {
    name: "ffc",
    regex: /\\ffc\{([^}]*)\}/g,
    replacement: "\\texttt{$1}",
    description: "Ersetzt \\ffc{} durch \\texttt{}"
  },
  {
    name: "fftt",
    regex: /\\fftt\{([^}]*)\}/g,
    replacement: "\\texttt{$1}",
    description: "Ersetzt \\fftt{} durch \\texttt{}"
  },
  {
    name: "textit",
    regex: /\\textit\{([^}]+)\}/g,
    replacement: "\\emph{$1}",
    description: "Ersetzt \\textit{} durch \\emph{}"
  },
  {
    name: "emphi",
    regex: /\\emphi\{([^}]+)\}/g,
    replacement: "\\emph{$1}",
    description: "Ersetzt \\emphi{} durch \\emph{}"
  },
  {
    name: "emphimd",
    regex: /\\emphimd\{([^}]+)\}/g,
    replacement: "\\emph{$1}",
    description: "Ersetzt \\emphimd{} durch \\emph{}"
  },
  {
    name: "emphim",
    regex: /\\emphim\{([^}]+)\}/g,
    replacement: "\\emph{$1}",
    description: "Ersetzt \\emphim{} durch \\emph{}"
  },
  {
    name: "im",
    regex: /\\im\{([^}]+)\}/g,
    replacement: "$1",
    description: "Entfernt \\im{}, behält nur den Inhalt"
  },
  {
    name: "iim",
    regex: /\\iim\{([^}]+)\}/g,
    replacement: "$1",
    description: "Entfernt \\iim{}, behält nur den Inhalt"
  },
   {
    name: "cite",
    regex: /\\cite\{([^}]+)\}/g,
    replacement: "[\\textbf{$1}]",
    description: "Entfernt \\iim{}, behält nur den Inhalt"
  },
];

/**
 * adjincludegraphics-Ersetzung
 * \adjincludegraphics[optionen]{datei} -> \includegraphics[optionen]{datei}
 */
export const adjIncludeGraphicsPattern: RegexPattern = {
  name: "adjincludegraphics",
  regex: /\\adjincludegraphics(\[([^\]]*)\])?\{([^}]+)\}/g,
  replacement: (_m: string, optionsWithBrackets: string, _optionsContent: string, filename: string) => {
    return `\\includegraphics${optionsWithBrackets || ''}{${filename}}`;
  },
  description: "Ersetzt \\adjincludegraphics durch \\includegraphics"
};

/**
 * begin-Environment-Patterns mit optionalem Parameter
 * \begin{env}[param] -> \begin{env}\textbf{\emph{param}}\\\\
 */
export const beginEnvironmentPatterns: RegexPattern[] = [
  {
    name: "hinweis",
    regex: /\\begin\{hinweis\}\[([^\]]+)\]/g,
    replacement: "\\begin{hinweis}\n\\textbf{\\emph{$1}}\\\\\\\\",
    description: "Übernimmt Parameter aus \\begin{hinweis}[...] und formatiert ihn"
  },
  {
    name: "sprachvgl",
    regex: /\\begin\{sprachvgl\}\[([^\]]+)\]/g,
    replacement: "\\begin{sprachvgl}\n\\textbf{\\emph{$1}}\\\\\\\\",
    description: "Übernimmt Parameter aus \\begin{sprachvgl}[...] und formatiert ihn"
  },
  {
    name: "experten",
    regex: /\\begin\{experten\}\[([^\]]+)\]/g,
    replacement: "\\begin{experten}\n\\textbf{\\emph{$1}}\\\\\\\\",
    description: "Übernimmt Parameter aus \\begin{experten}[...] und formatiert ihn"
  },
  {
    name: "exkurs",
    regex: /\\begin\{exkurs\}\[([^\]]+)\]/g,
    replacement: "\\begin{exkurs}\n\\textbf{\\emph{$1}}\\\\\\\\",
    description: "Übernimmt Parameter aus \\begin{exkurs}[...] und formatiert ihn"
  }
];

/**
 * tcolorbox-Patterns
 * Komplexe Makros mit mehreren Parametern
 */

/**
 * \tcolorbox{p1}{p2}{p3}{content}
 * Übernimmt die ersten beiden Parameter, 3. Parameter wird ignoriert
 */
export const tcolorboxPattern: RegexPattern = {
  name: "tcolorbox",
  regex: /\\tcolorbox\s*(?:\{([^}]*)\})?(?:\{([^}]*)\})?(?:\{([^}]*)\})?\{([^}]*)\}/gs,
  replacement: (_m: string, p1: string, p2: string, _p3: string, content: string) => {
    let formatted = "";
    if (p1) formatted += `***${p1}***\n`;
    if (p2) formatted += `*${p2}*\n`;
    formatted += `\n${content}`;
    return formatted;
  },
  description: "Konvertiert \\tcolorbox mit bis zu 4 Parametern"
};

/**
 * \sttpDefinitionskasten{skalierung}{begriff}{definition}{text}
 * ODER \sttpDefinitionskasten{skalierung}{begriff}{definition}
 */
export const definitionskastenPattern: RegexPattern = {
  name: "sttpDefinitionskasten",
  regex: /\\(sttpDefinitionskasten)\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}(?:\s*\{((?:[^{}]|\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})*)\})?/g,
  replacement: (_m: string, _makro: string, _param1: string, param2: string, param3: string, param4: string) => {
    let result = `\\begin{Definitionskasten}\n`;
    result += `\\textbf{\\emph{${param2}}}\n\n`;
    if (param3 && param3.trim()) {
      result += `\\emph{${param3}}\n\n`;
    }
    result += `${param4}\n`;
    result += `\\end{Definitionskasten}`;
    return result;
  },
  description: "Konvertiert \\sttpDefinitionskasten in div-Block"
};

/**
 * \sttpUniversalkasten{überschrift}{inhalt}
 */
export const universalkastenPattern: RegexPattern = {
  name: "sttpUniversalkasten",
  regex: /\\(sttpUniversalkasten)\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
  replacement: (_m: string, _makro: string, param1: string, param2: string) => {
    let result = `\\begin{Universalkasten}\n`;
    result += `\\textbf{\\emph{${param1}}}\n\n`;
    result += `${param2}\n`;
    result += `\\end{Universalkasten}`;
    return result;
  },
  description: "Konvertiert \\sttpUniversalkasten in div-Block"
};

/**
 * \sttpAutorenkasten{Name des Autors}{Geburtsjahr}{Todesjahr}{Erweiterter Text}{Bild}{Jahr der Aufnahme}{Quellenangabe}
 */
export const autorenkastenPattern: RegexPattern = {
  name: "sttpAutorenkasten",
  regex: /\\(sttpAutorenkasten)\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\s*\{((?:[^{}]|\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})*)\}/g,
  replacement: (_m, _makro, param1, param2, param3, param4, param5, param6, param7) => {
  let result = `\\begin{Autorenkasten}\n\n`;
  
  // Bild einfügen (links, 2.5cm Breite)
  result += `\\includegraphics[width=2.5cm]{${param5}}\n\n`;
  
  // Name (fett)
  result += `\\textbf{${param1}}`;
  
  // Lebensdaten (Geburtsjahr - Todesjahr) in Klammern, fett
  if (param2 && param2.trim()) {
    if (param3 && param3.trim()) {
      
      // Falls beide Jahre vorhanden
      result += ` \\textbf{(${param2}--${param3})}`;
    } else {
      
      // Sonst nur Geburtsjahr
      result += ` \\textbf{(*${param2})}`;
    }
  }
  result += `\n\n`;

  // Beschreibungstext (ohne Formatierung)
  result += `${param4}\n\n`;
  
  // Bildquelle als Fußnote/Caption
  result += `\\textit{\\small Bildquelle: ${param7} (${param6})}\n`;
  
  result += `\\end{Autorenkasten}`;
  
  return result;
  },
  description: "Konvertiert \\sttpAutorenkasten in div-Block"
};

/**
 * Alle tcolorbox-Patterns als Array
 */
export const tcolorboxPatterns: RegexPattern[] = [
  tcolorboxPattern,
  definitionskastenPattern,
  universalkastenPattern,
  autorenkastenPattern

];

/**
 * Spezielle Patterns die manuell verarbeitet werden müssen
 * (wegen verschachtelten Klammern oder komplexer Logik)
 */
export const specialPatterns = {
  // \textrm{...} - benötigt Klammerzählung
  textrm: /\\textrm\{/g,
  
  // \sttpMindMapText[...]{...} - benötigt Klammerzählung und rekursive Bereinigung
  mindMap: /\\sttpMindMapText(?:\[[^\]]*\])?\{/g,
  
  // \codeRahmenDateiName[label=...]{file}{caption}
  codeRahmen: /\\codeRahmenDateiName\[label=([^\]]+)\]\{([^}]+)\}\s*\{/g
};

/**
 * Input-Ersetzungen
 * Dateien die durch Kommentare ersetzt werden sollen
 */
export const inputReplacements: RegexPattern[] = [
  {
    name: "config_listings",
    regex: /\\input\{config_listings\}/g,
    replacement: "% config_listings.tex not found - skipped by preprocessor",
    description: "Ersetzt \\input{config_listings} durch Kommentar"
  }
];
