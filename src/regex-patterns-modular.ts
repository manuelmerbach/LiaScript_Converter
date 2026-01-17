/**
 * Regex-Muster für die LaTeX-Preprocessing
 * - Umgebungen (Environments) mit optionalen Parametern
 * - Benutzerdefinierte Makros mit mehreren Parametern
 * - Spezielle Patterns die Klammerzählung erfordern
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
 * Environments mit optionalen Titel-Parameter für Titel
 * Format: \begin{envName}[Titel] -> \begin{envName}\n\textbf{\emph{Titel}}\\\\
 */
const ENVIRONMENT_NAMES = ["hinweis", "sprachvgl", "experten", "exkurs"];

/**
 * Generiert RegexPattern für Umgebungen mit optionalem Parameter
 * Formatierung: BOLD_ITALIC + Zeilenumbruch
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
    description: `Extrahiert Titel aus optionalen Parameter aus\\begin{${envName}}[Titel] zu Umgebung mit fett-kursivem Titel`
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
  
  /** 
   * Verarbeitungsmethode
   * - 'regex': Einfache Verschachtelungen
   * - 'brace-counting': Robuste Klammerzählung für komplexe Verschachtelungen
   * @default 'regex'
   */
  processingMethod?: 'regex' | 'brace-counting';
  
  /** Optionale Beschreibung */
  description?: string;
}

/**
 * Text-Boxen
 * Diese haben unterschiedlich viele Parameter und eine spezifische Formatierung
 */
export const DIV_BOX_CONFIGS: DivBoxConfig[] = [
  {
    macro: "sttpDefinitionskasten",
    targetEnv: "Definitionskasten",
    paramCount: 4,
    processingMethod: 'regex',
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
    processingMethod: 'regex',
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
    processingMethod: 'regex',
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
      
      //Prüfen ob Geburtsjahr und Todesjahr, oder nur Geburtsjahr vorhanden ist
      if (params[1] && params[1].trim()) {
        if (params[2] && params[2].trim()) {
          content += ` \\textbf{(${params[1]}--${params[2]})}`;
        } else {
          content += ` \\textbf{(*${params[1]})}`;
        }
      }
      content += `\n\n${params[3]}\n\n`;
      //content += `\\textit{\\small Bildquelle: ${params[6]} (${params[5]})}\n`;
      content += `\\emph{Bildquelle: ${params[6]} (${params[5]})}\n`;
      
      return content;
    },
    description: "Autoren-Kasten mit Bild und Lebensdaten"
  },
  {
    macro: "sttpKommLitItem",
    targetEnv: "KommLitItem",
    paramCount: 7,
    processingMethod: 'brace-counting',
    contentBuilder: (params) => {
      // params[0] = Autor
      // params[1] = Jahr
      // params[2] = Titel
      // params[3] = Zitat-Key
      // params[4] = (ignoriert)
      // params[5] = (ignoriert)
      // params[6] = Beschreibung
      const [author, year, title, cite, , , description] = params;
      return [
        `\\emph{${author}} `,
        `\\emph{${year}}. `,
        `\\emph{${title}} `,
        `[\\textbf{${cite}}]\n\n`,
        `${description}\n`
      ].join('');
    },
    description: "Literaturverzeichnis-Eintrag (7 Parameter)"
  },
  {
    macro: "sttpKommLitItemMitFussnote",
    targetEnv: "KommLitItem",
    paramCount: 8,
    processingMethod: 'brace-counting',
    contentBuilder: (params) => {
      // params[0] = Autor
      // params[1] = Jahr
      // params[2] = Titel
      // params[3] = Zitat-Key
      // params[4] = (ignoriert)
      // params[5] = (ignoriert)
      // params[6] = Beschreibung
      // params[7] = Fußnote
      const [author, year, title, cite, , , description, footnote] = params;
      return [
        `\\emph{${author}} `,
        `\\emph{${year}}. `,
        `\\emph{${title}} `,
        `[\\textbf{${cite}}]\\footnote{${footnote}}\n\n`,
        `${description}\n`
      ].join('');
    },
    description: "Literaturverzeichnis-Eintrag mit Fußnote (8 Parameter)"
  }
];

/**
 * Generiert RegexPattern für Text-Boxen (nur für processingMethod: 'regex')
 */
export function generateDivBoxPatterns(): RegexPattern[] {
  return DIV_BOX_CONFIGS
    .filter(config => config.processingMethod === 'regex' || !config.processingMethod)
    .map(config => {
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

/**
 * Gibt alle Configs zurück, die Klammerzählung benötigen
 */
export function getBraceCountingConfigs(): DivBoxConfig[] {
  return DIV_BOX_CONFIGS.filter(config => config.processingMethod === 'brace-counting');
}

/**
 * Patterns die manuelle Verarbeitung mit Brace-Counting benötigen
 * Diese werden im Preprocessor mit extractBracedContent() oder processMultiParamMacro() verarbeitet
 */
export const specialPatterns = {
  // \textrm{...}
  textrm: /\\textrm\{/g,
  
  // \sttpMindMapText[...]{...}
  mindMap: /\\sttpMindMapText(?:\[[^\]]*\])?\{/g,

  // \noindent{...}
  noindent:/\\noindent\s*\{/g

};

/**
 * adjIncludeGraphics 
 * Muss durch includegraphics ersetzt werden. Mit optionalem Parameter
 */
export const adjIncludeGraphicsPattern: RegexPattern = {
  name: "adjincludegraphics",
  regex: /\\adjincludegraphics(\[([^\]]*)\])?\{([^}]+)\}/g,
  replacement: (_m: string, optionsWithBrackets: string, _optionsContent: string, filename: string) => {
    return `\\includegraphics${optionsWithBrackets || ''}{${filename}}`;
  },
  description: "Ersetzt \\adjincludegraphics durch \\includegraphics (und behält optionalen Parameter)"
};

// ============================================================================
// EXPORT ALLER PATTERNS
// ============================================================================

/**
 * Generiert alle Patterns
 */
export function getAllPatterns() {
  return {
    environments: generateEnvironmentPatterns(),
    divBoxes: generateDivBoxPatterns(),
    braceCountingConfigs: getBraceCountingConfigs(),
    special: specialPatterns,
    adjIncludeGraphics: adjIncludeGraphicsPattern,
  };
}