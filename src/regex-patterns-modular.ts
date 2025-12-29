/**
 * Modulare Regex-Muster für die LaTeX-Vorverarbeitung
 * 
 * Dieses System ermöglicht einfache, konfigurierbare Ersetzungen
 * ohne für jedes Makro ein eigenes Pattern schreiben zu müssen.
 */

export interface RegexPattern {
  name: string;
  regex: RegExp;
  replacement: string | ((match: string, ...groups: string[]) => string);
  description?: string;
}

// ============================================================================
// FORMATIERUNGSTYPEN
// ============================================================================

/**
 * Verfügbare Formatierungstypen für LaTeX → Markdown Konvertierung
 */
export enum FormatType {
  BOLD = "bold",                    // \textbf{...}  → **...**
  ITALIC = "italic",                // \emph{...}    → *...*
  BOLD_ITALIC = "bold_italic",      // \textbf{\emph{...}} → ***...***
  CODE = "code",                    // \texttt{...}  → `...`
  MATH_INLINE = "math_inline",      // $...$         → Math-Modus
  REMOVE = "remove",                // (leer)        → Inhalt wird entfernt
  CONTENT = "content",              // Nur Inhalt, keine Formatierung
}

/**
 * Mapping von FormatType zu LaTeX-Befehl
 */
const FORMAT_TO_LATEX: Record<FormatType, string> = {
  [FormatType.BOLD]: "\\textbf{$1}",
  [FormatType.ITALIC]: "\\emph{$1}",
  [FormatType.BOLD_ITALIC]: "\\textbf{\\emph{$1}}",
  [FormatType.CODE]: "\\texttt{$1}",
  [FormatType.MATH_INLINE]: "$$$1$$",
  [FormatType.REMOVE]: "",
  [FormatType.CONTENT]: "$1",
};

// ============================================================================
// EINFACHE MAKRO-ERSETZUNGEN
// ============================================================================

/**
 * Definition für einfache Makro-Ersetzungen
 * Format: \makroName{inhalt} → formatiert nach targetFormat
 */
export interface SimpleMacroConfig {
  /** Name des LaTeX-Makros (ohne Backslash) */
  macro: string;
  /** Ziel-Formatierung */
  targetFormat: FormatType;
  /** Optionale Beschreibung */
  description?: string;
}

/**
 * Konfiguration einfacher Makro-Ersetzungen
 * { macro: "meinMakro", targetFormat: FormatType.XXX, description: "Beschreibung" }
 */
export const SIMPLE_MACRO_CONFIGS: SimpleMacroConfig[] = [
  // Inline-Code Makros
  { macro: "ffc", targetFormat: FormatType.CODE, description: "Hervorhebung von Zeichen" },
  { macro: "fftt", targetFormat: FormatType.CODE, description: "Hervorhebung von Zeichen" },
  { macro: "ausgabeInline", targetFormat: FormatType.CODE, description: "Programmierbeispiele" },
];

/**
 * Generiert RegexPattern-Objekte aus SimpleMacroConfig
 */
export function generateSimpleMacroPatterns(): RegexPattern[] {
  return SIMPLE_MACRO_CONFIGS.map(config => ({
    name: config.macro,
    regex: new RegExp(`\\\\${config.macro}\\{([^}]*)\\}`, 'g'),
    replacement: FORMAT_TO_LATEX[config.targetFormat],
    description: config.description || `Ersetzt \\${config.macro}{} durch ${config.targetFormat}`
  }));
}

// ============================================================================
// VERSCHACHTELTE MAKROS (MIT MEHREREN PARAMETERN)
// ============================================================================

/**
 * Definition für Makros mit mehreren Parametern
 * Format: \makroName{p1}{p2}{p3} → kombinierte Formatierung
 */
export interface MultiParamMacroConfig {
  /** Name des LaTeX-Makros (ohne Backslash) */
  macro: string;
  /** Anzahl der Parameter */
  paramCount: number;
  /** Formatierung für jeden Parameter (Index = Parameter-Nummer - 1) */
  paramFormats: FormatType[];
  /** 
   * Optional: Trennzeichen nach jedem Parameter
   * Array mit n-1 Elementen für n Parameter
   * separators[0] kommt zwischen param1 und param2
   * separators[1] kommt zwischen param2 und param3, etc.
   */
  separators?: string[];
  /** Optional: Umschließende Struktur */
  wrapper?: { before: string; after: string };
  /** Optionale Beschreibung */
  description?: string;
}

/**
 * Konfiguration für Makros mit mehreren Parametern
 */
export const MULTI_PARAM_MACRO_CONFIGS: MultiParamMacroConfig[] = [
  // Deutsch-Englische Begriffspaare
   {
    macro: "ntpimde",
    paramCount: 2,
    paramFormats: [FormatType.REMOVE, FormatType.REMOVE],
    description: "Entfernt Seitenzeile"
  },
  {
    macro: "ntpimd",
    paramCount: 2,
    paramFormats: [FormatType.REMOVE, FormatType.REMOVE],
    description: "Entfernt Seitenzeile"
  }
];

/**
 * Generiert RegexPattern für Multi-Parameter-Makros
 */
export function generateMultiParamPatterns(): RegexPattern[] {
  return MULTI_PARAM_MACRO_CONFIGS.map(config => {
    // Erstelle Regex für n Parameter: \makro{p1}{p2}...{pn}
    const paramRegex = Array(config.paramCount).fill('\\{([^}]*)\\}').join('\\s*');
    const regex = new RegExp(`\\\\${config.macro}${paramRegex}`, 'g');
    
    return {
      name: config.macro,
      regex,
      replacement: (_match: string, ...params: string[]) => {
        const formattedParams = params
          .slice(0, config.paramCount)
          .map((param, idx) => {
            const format = config.paramFormats[idx] || FormatType.CONTENT;
            return FORMAT_TO_LATEX[format].replace('$1', param);
          });
        
        // Baue das Ergebnis mit individuellen Separatoren auf
        let result = '';
        for (let i = 0; i < formattedParams.length; i++) {
          result += formattedParams[i];
          
          // Füge Separator nach diesem Parameter hinzu (wenn vorhanden)
          if (config.separators && i < config.separators.length) {
            result += config.separators[i] || '';
          }
        }
        
        if (config.wrapper) {
          result = config.wrapper.before + result + config.wrapper.after;
        }
        
        return result;
      },
      description: config.description || `Konvertiert \\${config.macro} mit ${config.paramCount} Parametern`
    };
  });
}

// ============================================================================
// UMGEBUNGEN (ENVIRONMENTS → DIV-BLÖCKE)
// ============================================================================

/**
 * Definition für LaTeX-Umgebungen die zu div-Blöcken werden
 */
export interface EnvironmentConfig {
  /** Name der LaTeX-Umgebung */
  envName: string;
  
  /** Name der Ziel-Umgebung (für Pandoc div) */
  targetEnvName?: string;
  
  /** Verarbeitung des optionalen Parameters [...] */
  optionalParam?: {
    /** Formatierung des Parameters */
    format: FormatType;
    /** Trennzeichen nach dem Parameter (z.B. "\\\\\\\\" für Zeilenumbruch) */
    separator?: string;
  };
  
  /** Optionale Beschreibung */
  description?: string;
}

/**
 * Konfiguration aller Umgebungen
 * 
 * Neue Umgebungen können hier einfach hinzugefügt werden:
 * { envName: "meineBox", optionalParam: { format: FormatType.BOLD_ITALIC } }
 */
export const ENVIRONMENT_CONFIGS: EnvironmentConfig[] = [
  {
    envName: "hinweis",
    optionalParam: { format: FormatType.BOLD_ITALIC, separator: "\\\\\\\\" },
    description: "Hinweis-Box mit optionalem Titel"
  },
  {
    envName: "sprachvgl",
    optionalParam: { format: FormatType.BOLD_ITALIC, separator: "\\\\\\\\" },
    description: "Sprachvergleich-Box mit optionalem Titel"
  },
  {
    envName: "experten",
    optionalParam: { format: FormatType.BOLD_ITALIC, separator: "\\\\\\\\" },
    description: "Expertenwissen-Box mit optionalem Titel"
  },
  {
    envName: "exkurs",
    optionalParam: { format: FormatType.BOLD_ITALIC, separator: "\\\\\\\\" },
    description: "Exkurs-Box mit optionalem Titel"
  },
];

/**
 * Generiert RegexPattern für Umgebungen mit optionalem Parameter
 */
export function generateEnvironmentPatterns(): RegexPattern[] {
  return ENVIRONMENT_CONFIGS.map(config => {
    const targetName = config.targetEnvName || config.envName;
    
    return {
      name: config.envName,
      regex: new RegExp(`\\\\begin\\{${config.envName}\\}\\[([^\\]]+)\\]`, 'g'),
      replacement: (_match: string, param: string) => {
        let result = `\\begin{${targetName}}`;
        
        if (config.optionalParam) {
          const formatted = FORMAT_TO_LATEX[config.optionalParam.format].replace('$1', param);
          const separator = config.optionalParam.separator || '';
          result += `\n${formatted}${separator}`;
        }
        
        return result;
      },
      description: config.description || `Konvertiert \\begin{${config.envName}}[...] zu div-Block`
    };
  });
}

// ============================================================================
// KOMPLEXE UMGEBUNGEN (CUSTOM DIV-BOXEN MIT MEHREREN PARAMETERN)
// ============================================================================

/**
 * Definition für komplexe div-Boxen (wie sttpDefinitionskasten)
 */
export interface DivBoxConfig {
  /** Name des LaTeX-Makros (ohne Backslash) */
  macro: string;
  
  /** Name der Ziel-Umgebung */
  targetEnv: string;
  
  /** Anzahl der Parameter */
  paramCount: number;
  
  /** 
   * Template-Funktion zur Generierung des Inhalts
   * params: Array der extrahierten Parameter
   * return: Inhalt zwischen \begin und \end
   */
  contentBuilder: (params: string[]) => string;
  
  /** Optionale Beschreibung */
  description?: string;
}

/**
 * Konfiguration für komplexe div-Boxen
 */
export const DIV_BOX_CONFIGS: DivBoxConfig[] = [
  {
    macro: "sttpDefinitionskasten",
    targetEnv: "Definitionskasten",
    paramCount: 4,
    contentBuilder: (params) => {
      // params[0] = Skalierung (ignoriert)
      // params[1] = Begriff
      // params[2] = Definition
      // params[3] = Erklärungstext
      let content = `\\textbf{\\emph{${params[1]}}}\n\n`;
      if (params[2] && params[2].trim()) {
        content += `\\emph{${params[2]}}\n\n`;
      }
      content += `${params[3]}\n`;
      return content;
    },
    description: "Definitions-Kasten mit Begriff, Definition und Text"
  },
  {
    macro: "sttpUniversalkasten",
    targetEnv: "Universalkasten",
    paramCount: 2,
    contentBuilder: (params) => {
      // params[0] = Überschrift
      // params[1] = Inhalt
      let content = `\\textbf{\\emph{${params[0]}}}\n\n`;
      content += `${params[1]}\n`;
      return content;
    },
    description: "Universal-Kasten mit Überschrift und Inhalt"
  },
  {
    macro: "sttpAutorenkasten",
    targetEnv: "Autorenkasten",
    paramCount: 7,
    contentBuilder: (params) => {
      // params[0] = Name
      // params[1] = Geburtsjahr
      // params[2] = Todesjahr
      // params[3] = Beschreibung
      // params[4] = Bilddatei
      // params[5] = Jahr der Aufnahme
      // params[6] = Bildquelle
      let content = `\\includegraphics[width=2.5cm]{${params[4]}}\n\n`;
      content += `\\textbf{${params[0]}}`;
      
      if (params[1] && params[1].trim()) {
        if (params[2] && params[2].trim()) {
          content += ` \\textbf{(${params[1]}--${params[2]})}`;
        } else {
          content += ` \\textbf{(*${params[1]})}`;
        }
      }
      content += `\n\n${params[3]}\n\n`;
      content += `\\textit{\\small Bildquelle: ${params[6]} (${params[5]})}\n`;
      
      return content;
    },
    description: "Autoren-Kasten mit Bild und Lebensdaten"
  }
];

/**
 * Generiert RegexPattern für komplexe div-Boxen
 */
export function generateDivBoxPatterns(): RegexPattern[] {
  return DIV_BOX_CONFIGS.map(config => {
    // Erstelle Regex für verschachtelte Klammern
    const paramRegex = Array(config.paramCount)
      .fill('\\{([^{}]*(?:\\{[^{}]*\\}[^{}]*)*)\\}')
      .join('\\s*');
    
    const regex = new RegExp(`\\\\${config.macro}${paramRegex}`, 'g');
    
    return {
      name: config.macro,
      regex,
      replacement: (_match: string, ...params: string[]) => {
        const content = config.contentBuilder(params.slice(0, config.paramCount));
        return `\\begin{${config.targetEnv}}\n\n${content}\\end{${config.targetEnv}}`;
      },
      description: config.description || `Konvertiert \\${config.macro} in div-Block`
    };
  });
}

// ============================================================================
// SPEZIELLE PATTERNS
// ============================================================================

/**
 * Spezielle Patterns die manuelle Verarbeitung benötigen
 */
export const specialPatterns = {
  textrm: /\\textrm\{/g,
  mindMap: /\\sttpMindMapText(?:\[[^\]]*\])?\{/g,
  codeRahmen: /\\codeRahmenDateiName\[label=([^\]]+)\]\{([^}]+)\}\s*\{/g
};

/**
 * Weitere spezielle Ersetzungen
 */
export const adjIncludeGraphicsPattern: RegexPattern = {
  name: "adjincludegraphics",
  regex: /\\adjincludegraphics(\[([^\]]*)\])?\{([^}]+)\}/g,
  replacement: (_m: string, optionsWithBrackets: string, _optionsContent: string, filename: string) => {
    return `\\includegraphics${optionsWithBrackets || ''}{${filename}}`;
  },
  description: "Ersetzt \\adjincludegraphics durch \\includegraphics"
};

export const citePattern: RegexPattern = {
  name: "cite",
  regex: /\\cite\{([^}]+)\}/g,
  replacement: "[\\textbf{$1}]",
  description: "Konvertiert \\cite{} zu [**...**]"
};

export const citeOptionalPattern: RegexPattern = {
  name: "citeOptional",
  regex: /\\cite\[([^\]]+)\]\{([^}]+)\}/g,
  replacement: "[\\textbf{$2}]",
  description: "Konvertiert \\cite[]{} zu [**...**]"
};

//https://de.overleaf.com/learn/latex/Line_breaks_and_blank_spaces#Line_breaks
export const minisecPattern: RegexPattern = {
  name: "minisec",
  regex: /\\minisec\{([^}]*)\}/g,
  replacement: "\\textbf{\\emph{$1}}\\hfill\\break\n",
  description: "Konvertiert \\minisec{} zu fett-kursiv mit Zeilenumbruch"
};

//listInline funktioniert nicht in Tabellen und wird durch texttt{} ersetzt
export const liwrOptionalPattern: RegexPattern = {
  name: "liwrOptional",
  regex: /\\liwr\[([^\]]*)\]\{([^}]*)\}/g,
  replacement: "\\texttt{$2}",
  description: "Konvertiert \\liwr[...]{text} zu \\texttt{text}"
};

//listInline funktioniert nicht in Tabellen und wird durch texttt{} ersetzt
export const liwrPattern: RegexPattern = {
  name: "liwr",
  regex: /\\liwr\{([^}]*)\}/g,
  replacement: "\\texttt{$1}",
  description: "Konvertiert \\liwr{text} zu \\texttt{text}"
};

export const inputReplacements: RegexPattern[] = [
  {
    name: "config_listings",
    regex: /\\input\{config_listings\}/g,
    replacement: "% config_listings.tex not found - skipped by preprocessor",
    description: "Ersetzt \\input{config_listings} durch Kommentar"
  },
];

// ============================================================================
// EXPORT ALLER PATTERNS
// ============================================================================

/**
 * Generiert alle Patterns aus den Konfigurationen
 */
export function getAllPatterns() {
  return {
    simpleMacros: generateSimpleMacroPatterns(),
    multiParamMacros: generateMultiParamPatterns(),
    environments: generateEnvironmentPatterns(),
    divBoxes: generateDivBoxPatterns(),
    special: specialPatterns,
    adjIncludeGraphics: adjIncludeGraphicsPattern,
    cite: citePattern,
    citeOptional: citeOptionalPattern,
    minisec: minisecPattern,
    liwr: liwrPattern,
    liwrOptional: liwrOptionalPattern,
    inputReplacements: inputReplacements
  };
}