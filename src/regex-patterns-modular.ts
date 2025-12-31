/**
 * Modulare Regex-Muster für die LaTeX-Vorverarbeitung
 * 
 * HINWEIS: SimpleMacros und MultiParamMacros wurden zu text-macros.ts migriert.
 * Diese Datei enthält jetzt nur noch:
 * - Umgebungen (Environments) mit optionalen Parametern
 * - Komplexe div-Boxen (DivBoxes) mit mehreren Parametern
 * - Spezielle Patterns für Brace-Counting im Preprocessor
 */

export interface RegexPattern {
  name: string;
  regex: RegExp;
  replacement: string | ((match: string, ...groups: string[]) => string);
  description?: string;
}

// ============================================================================
// UMGEBUNGEN (ENVIRONMENTS → DIV-BLÖCKE)
// ============================================================================

/**
 * Liste aller Environments die einen optionalen Titel-Parameter haben
 * Format: \begin{envName}[Titel] → \begin{envName}\n\textbf{\emph{Titel}}\\\\
 */
const ENVIRONMENT_NAMES = ["hinweis", "sprachvgl", "experten", "exkurs"];

/**
 * Generiert RegexPattern für Umgebungen mit optionalem Parameter
 * Alle haben die gleiche Formatierung: BOLD_ITALIC + Zeilenumbruch
 */
export function generateEnvironmentPatterns(): RegexPattern[] {
  return ENVIRONMENT_NAMES.map(envName => ({
    name: envName,
    regex: new RegExp(`\\\\begin\\{${envName}\\}\\[([^\\]]+)\\]`, 'g'),
    replacement: (_match: string, param: string) => {
      // Formatiere den Titel als fett-kursiv mit Zeilenumbruch
      const formatted = `\\textbf{\\emph{${param}}}`;
      return `\\begin{${envName}}\n${formatted}\\\\\\\\\n`;
    },
    description: `Konvertiert \\begin{${envName}}[Titel] zu div-Block mit formatiertem Titel`
  }));
}

// ============================================================================
// KOMPLEXE DIV-BOXEN MIT MEHREREN PARAMETERN
// ============================================================================

/**
 * Definition für komplexe div-Boxen mit contentBuilder-Funktion
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
 * Diese haben unterschiedliche Parameter-Anzahlen und spezifische Formatierung
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
// SPEZIELLE PATTERNS (FÜR BRACE-COUNTING IM PREPROCESSOR)
// ============================================================================

/**
 * Patterns die manuelle Verarbeitung mit Brace-Counting benötigen
 * Diese werden NICHT durch simple Regex ersetzt, sondern im Preprocessor
 * mit extractBracedContent() oder processMultiParamMacro() verarbeitet
 */
export const specialPatterns = {
  /** \textrm{...} - Entfernt Makro, behält Inhalt */
  textrm: /\\textrm\{/g,
  
  /** \sttpMindMapText[...]{...} - Entfernt \textbf und \textsf aus Inhalt */
  mindMap: /\\sttpMindMapText(?:\[[^\]]*\])?\{/g,
  
  /** \codeRahmenDateiName[label=...]{...}{...} - Multi-Parameter mit Label */
  codeRahmen: /\\codeRahmenDateiName\[label=([^\]]+)\]\{([^}]+)\}\s*\{/g
};

/**
 * adjIncludeGraphics - Braucht Replacement-Funktion für optionale Parameter
 */
export const adjIncludeGraphicsPattern: RegexPattern = {
  name: "adjincludegraphics",
  regex: /\\adjincludegraphics(\[([^\]]*)\])?\{([^}]+)\}/g,
  replacement: (_m: string, optionsWithBrackets: string, _optionsContent: string, filename: string) => {
    return `\\includegraphics${optionsWithBrackets || ''}{${filename}}`;
  },
  description: "Ersetzt \\adjincludegraphics durch \\includegraphics (behält optionale Parameter)"
};

// ============================================================================
// EXPORT ALLER PATTERNS
// ============================================================================

/**
 * Generiert alle Patterns aus den Konfigurationen
 */
export function getAllPatterns() {
  return {
    environments: generateEnvironmentPatterns(),
    divBoxes: generateDivBoxPatterns(),
    special: specialPatterns,
    adjIncludeGraphics: adjIncludeGraphicsPattern,
  };
}