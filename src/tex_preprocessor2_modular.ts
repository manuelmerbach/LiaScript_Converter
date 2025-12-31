import fs from "fs";
import path from "path";
import { getAllPatterns } from "./regex-patterns-modular";
import { textMacros } from "./text-macros";
import { getExclusionInfo } from "./excluded-files";

interface ProcessingStats {
  filesProcessed: number;
  filesSkipped: number;
  replacements: number;
  errors: string[];
}

// ============================================================================
// HILFSFUNKTIONEN FÜR WIEDERVERWENDBARE LOGIK
// ============================================================================

/**
 * Extrahiert den Inhalt innerhalb geschweifter Klammern mit Brace-Counting
 * @param text Der vollständige Text
 * @param startPos Position NACH der öffnenden Klammer
 * @returns { content: string, endPos: number } oder null bei Fehler
 */
function extractBracedContent(text: string, startPos: number): { content: string; endPos: number } | null {
  let braceCount = 1;
  let pos = startPos;
  let content = "";

  while (pos < text.length && braceCount > 0) {
    const char = text[pos];
    
    // Escape-Sequenzen behandeln
    if (char === '\\' && pos + 1 < text.length) {
      const nextChar = text[pos + 1];
      if (nextChar !== undefined) {
        if (braceCount > 0) content += char + nextChar;
        pos += 2;
        continue;
      }
    }
    
    if (char === "{") braceCount++;
    else if (char === "}") braceCount--;
    
    if (braceCount > 0) content += char;
    pos++;
  }

  if (braceCount !== 0) {
    return null; // Ungeschlossene Klammern
  }

  return { content: content, endPos: pos };
}

/**
 * Extrahiert mehrere Parameter in geschweiften Klammern
 * @param text Der vollständige Text
 * @param startPos Position NACH dem Makronamen
 * @param paramCount Anzahl zu extrahierender Parameter
 * @returns { params: string[], endPos: number } oder null bei Fehler
 */
function extractParameters(text: string, startPos: number, paramCount: number): { params: string[]; endPos: number } | null {
  const params: string[] = [];
  let pos = startPos;

  for (let i = 0; i < paramCount; i++) {
    // Überspringe Whitespace
    while (pos < text.length && /\s/.test(text[pos] ?? '')) pos++;
    
    if (pos >= text.length || text[pos] !== '{') {
      return null; // Fehlende öffnende Klammer
    }
    
    pos++; // Öffnende Klammer überspringen
    
    const result = extractBracedContent(text, pos);
    if (!result) {
      return null; // Fehler beim Extrahieren
    }
    
    params.push(result.content.trim());
    pos = result.endPos;
  }

  return { params, endPos: pos };
}

/**
 * Verarbeitet ein Makro mit Brace-Counting und optionaler Content-Transformation
 * @param output Der zu verarbeitende Text
 * @param regex Das Regex-Pattern für das Makro
 * @param transformer Funktion zur Transformation des extrahierten Contents
 * @returns { output: string, count: number }
 */
function processBracedMacro(
  output: string,
  regex: RegExp,
  transformer: (content: string) => string
): { output: string; count: number } {
  let result = output;
  let count = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(result)) !== null) {
    const startIndex = match.index + match[0].length;
    const extracted = extractBracedContent(result, startIndex);
    
    if (!extracted) {
      console.warn(`Ungeschlossenes Makro ab Position ${match.index}`);
      break;
    }

    const transformed = transformer(extracted.content);
    result =
      result.substring(0, match.index) +
      transformed +
      result.substring(extracted.endPos);
    
    regex.lastIndex = match.index;
    count++;
  }

  return { output: result, count };
}

/**
 * Verarbeitet ein Makro mit mehreren Parametern
 * @param output Der zu verarbeitende Text
 * @param regex Das Regex-Pattern für das Makro
 * @param paramCount Anzahl der Parameter
 * @param builder Funktion zum Aufbau des Ersetzungstexts
 * @returns { output: string, count: number }
 */
function processMultiParamMacro(
  output: string,
  regex: RegExp,
  paramCount: number,
  builder: (params: string[]) => string
): { output: string; count: number } {
  let result = output;
  let count = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(result)) !== null) {
    const startIndex = match.index + match[0].length;
    const extracted = extractParameters(result, startIndex, paramCount);
    
    if (!extracted) {
      console.warn(`Unvollständiges Makro ab Position ${match.index} (${extracted?.params.length ?? 0}/${paramCount} Parameter)`);
      break;
    }

    const replacement = builder(extracted.params);
    result =
      result.substring(0, match.index) +
      replacement +
      result.substring(extracted.endPos);
    
    regex.lastIndex = match.index;
    count++;
  }

  return { output: result, count };
}

// ============================================================================
// HAUPTVERARBEITUNGSFUNKTION
// ============================================================================

/**
 * Führt Preprocessing für LaTeX-Dateien durch
 */
function preprocessLatex(content: string): { processed: string; replacements: number } {
  let output = content;
  let replacements = 0;

  const patterns = getAllPatterns();

  // 1. --- Entferne \textrm{...} und behalte nur den Inhalt ---
  const textrm = processBracedMacro(output, patterns.special.textrm, (content) => content);
  output = textrm.output;
  replacements += textrm.count;

  // 1b. --- Entferne \noindent{...} und behalte nur den Inhalt ---
  const noindent = processBracedMacro(output, /\\noindent\s*\{/g, (content) => content);
  output = noindent.output;
  replacements += noindent.count;

  // 4. --- Wende Textmakros an (aus text-macros.ts) ---
  for (const macro of textMacros) {
    const beforeLength = output.length;
    output = output.replace(macro.regex, macro.replacement);
    if (output.length !== beforeLength) {
      replacements++;
    }
  }

  // 5. --- adjincludegraphics-Ersetzung ---
  output = output.replace(patterns.adjIncludeGraphics.regex, patterns.adjIncludeGraphics.replacement as any);
  
  // 6. --- Environment-Patterns (mit optionalen Parametern) ---
  for (const pattern of patterns.environments) {
    const matches = output.match(pattern.regex);
    if (matches) {
      replacements += matches.length;
    }
    output = output.replace(pattern.regex, pattern.replacement as string);
  }

  // 7. --- sttpMindMapText - Entferne \textbf und \textsf ---
  const mindMap = processBracedMacro(output, patterns.special.mindMap, (content) => {
    // Entferne alle \textbf{...} und \textsf{...} Schichten iterativ
    let cleanContent = content;
    let previousContent;
    do {
      previousContent = cleanContent;
      cleanContent = cleanContent.replace(/\\textbf\{(.+?)\}/g, '$1');
      cleanContent = cleanContent.replace(/\\textsf\{(.+?)\}/g, '$1');
    } while (cleanContent !== previousContent);
    
    return `\\texttt{${cleanContent}}`;
  });
  output = mindMap.output;
  replacements += mindMap.count;

  // 8. --- sttpKommLitItem (7 Parameter) ---
  const kommLit = processMultiParamMacro(
    output,
    /\\sttpKommLitItem/g,
    7,
    (params) => {
      const [author, year, title, cite, , , description] = params;
      return [
        `\\begin{KommLitItem}\n\n`,
        `\\emph{${author}} `,
        `\\emph{${year}}. `,
        `\\emph{${title}} `,
        `[\\textbf{${cite}}]\n\n`,
        `${description}\n\n`,
        `\\end{KommLitItem}\n\n`
      ].join('');
    }
  );
  output = kommLit.output;
  replacements += kommLit.count;

  // 9. --- sttpKommLitItemMitFussnote (8 Parameter) ---
  const kommLitFn = processMultiParamMacro(
    output,
    /\\sttpKommLitItemMitFussnote/g,
    8,
    (params) => {
      const [author, year, title, cite, , , description, footnote] = params;
      return [
        `\\begin{KommLitItem}\n\n`,
        `\\emph{${author}} `,
        `\\emph{${year}}. `,
        `\\emph{${title}} `,
        `[\\textbf{${cite}}]\\footnote{${footnote}}\n\n`,
        `${description}\n\n`,
        `\\end{KommLitItem}\n\n`
      ].join('');
    }
  );
  output = kommLitFn.output;
  replacements += kommLitFn.count;

  // 10. --- Wende div-Box-Patterns an (Definitionskasten, etc.) ---
  for (const pattern of patterns.divBoxes) {
    output = output.replace(pattern.regex, pattern.replacement as any);
  }

  return { processed: output, replacements };
}

// ============================================================================
// DATEI-VERARBEITUNG
// ============================================================================

/**
 * Durchsucht rekursiv einen Ordner nach .tex-Dateien
 */
function findTexFiles(directory: string): string[] {
  const texFiles: string[] = [];

  function searchRecursive(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          searchRecursive(fullPath);
        } else if (entry.isFile() && path.extname(entry.name) === ".tex") {
          texFiles.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warnung: Kann Ordner nicht lesen: ${dir}`, error);
    }
  }

  searchRecursive(directory);
  return texFiles;
}

/**
 * Verarbeitet eine einzelne .tex-Datei
 */
function preprocessTexFile(filePath: string): number {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;
    let totalReplacements = 0;

    // Schritt 1: Makro-Ersetzungen
    const macroResult = preprocessLatex(content);
    content = macroResult.processed;
    totalReplacements += macroResult.replacements;

    // Schritt 2: Ersetze spezielle Blöcke / Problemstellen (codeRahmen)
    const patterns = getAllPatterns();
    const regex = patterns.special.codeRahmen;
    let match;
    const replacements: Array<{
      start: number;
      end: number;
      replacement: string;
    }> = [];

    while ((match = regex.exec(content)) !== null) {
      const label = match[1];
      const file = match[2];
      const startPos = match.index + match[0].length;

      const extracted = extractBracedContent(content, startPos);
      
      if (extracted) {
        const caption = extracted.content;
        replacements.push({
          start: match.index,
          end: extracted.endPos,
          replacement: `\\lstinputlisting[language=Go, caption={${caption.replace(
            /~/g,
            " "
          )}}, label=${label}]{${file}}`,
        });
        totalReplacements++;
      }
    }

    // Replacements rückwärts anwenden
    for (let i = replacements.length - 1; i >= 0; i--) {
      const r = replacements[i];
      if (!r) continue;
      content =
        content.substring(0, r.start) +
        r.replacement +
        content.substring(r.end);
    }
    
    // Nach einer Änderung speichern
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✓ Verarbeitet: ${filePath} (${totalReplacements} Ersetzungen)`);
    }

    return totalReplacements;
  } catch (error) {
    throw new Error(`Fehler beim Verarbeiten von ${filePath}: ${error}`);
  }
}

/**
 * Hauptfunktion: verarbeitet alle .tex-Dateien in einem Ordner
 * 
 * WICHTIG: Diese Funktion hat die gleiche API wie das Original!
 */
export function preprocessLatexDirectory(
  directory: string,
  options: { verbose?: boolean } = {}
): ProcessingStats {
  const { verbose = false } = options;

  console.log(`🔍 Durchsuche Ordner: ${directory}`);
  const allTexFiles = findTexFiles(directory);
  
  // Filtere ausgeschlossene Dateien
  const exclusionInfo = getExclusionInfo(allTexFiles);
  const texFiles = exclusionInfo.included;
  
  console.log(`📄 ${allTexFiles.length} .tex-Dateien gefunden`);
  if (exclusionInfo.excluded.length > 0) {
    console.log(`⊘  ${exclusionInfo.excluded.length} Dateien ausgeschlossen`);
    if (verbose) {
      console.log("\nAusgeschlossene Dateien:");
      exclusionInfo.excluded.forEach((f) => console.log(`  ⊘ ${f}`));
    }
  }
  console.log(`✓ ${texFiles.length} Dateien werden verarbeitet`);

  if (verbose) {
    console.log("\nZu verarbeitende Dateien:");
    texFiles.forEach((f) => console.log(`  - ${f}`));
  }

  const stats: ProcessingStats = { 
    filesProcessed: 0, 
    filesSkipped: exclusionInfo.excluded.length,
    replacements: 0, 
    errors: [] 
  };

  for (const filePath of texFiles) {
    try {
      const replacements = preprocessTexFile(filePath);
      stats.filesProcessed++;
      stats.replacements += replacements;
    } catch (error) {
      const msg = `Fehler bei ${filePath}: ${error}`;
      stats.errors.push(msg);
      console.error(`❌ ${msg}`);
    }
  }

  console.log("\n📊 Verarbeitungsstatistik:");
  console.log(`  - Dateien verarbeitet: ${stats.filesProcessed}/${texFiles.length}`);
  console.log(`  - Dateien übersprungen: ${stats.filesSkipped}`);
  console.log(`  - Gesamte Ersetzungen: ${stats.replacements}`);
  console.log(`  - Fehler: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log("\n❌ Fehlerdetails:");
    stats.errors.forEach((e) => console.log(`  - ${e}`));
  }

  return stats;
}