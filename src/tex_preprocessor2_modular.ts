import fs from "fs";
import path from "path";
import { getAllPatterns } from "./regex-patterns-modular";
import { Macros } from "./macros";
import { getExclusionInfo } from "./excluded-files";

interface ProcessingStats {
  filesProcessed: number;
  filesSkipped: number;
  replacements: number;
  errors: string[];
}

// ============================================================================
// HILFSFUNKTIONEN
// ============================================================================

/**
 * Extrahiert den Inhalt innerhalb geschweifter Klammern mit Klammerzählung
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
 * @param text vollständiger Text
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
 * Verarbeitet ein Makro mit Klammerzählung und optionaler Content-Transformation
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

/**
 * Verarbeitet \codeRahmenDateiName[label=...]{file}{caption} Makros
 * Extrahiert nur den Dateipfad und überspringt optionale-Parameter
 * @param output Der zu verarbeitende Text
 * @returns { output: string, count: number }
 */
function processCodeRahmen(output: string): { output: string; count: number } {
  let result = output;
  let count = 0;
  const regex = /\\codeRahmenDateiName\[label=([^\]]+)\]\{([^}]+)\}/g;
  let match: RegExpExecArray | null;
  const replacements: Array<{ start: number; end: number; replacement: string }> = [];

  // Sammle alle Ersetzungen
  while ((match = regex.exec(result)) !== null) {
    const file = match[2]; // Dateipfad
    const matchEnd = match.index + match[0].length;
    
    // Überspringe Whitespace falls vorhanden
    let pos = matchEnd;
    while (pos < result.length && /\s/.test(result[pos] ?? '')) pos++;
    
    // Sucht die erste öffnende Klammer
    if (pos < result.length && result[pos] === '{') {
      pos++;
      
      // Extrahiere caption-Parameter zur Bestimmung der Endpositon
      const extracted = extractBracedContent(result, pos);
      
      if (extracted) {
        replacements.push({
          start: match.index,
          end: extracted.endPos,
          replacement: `\\lstinputlisting{${file}}`
        });
      } else {
        console.warn(`Ungeschlossene Klammer in codeRahmen ab Position ${match.index}`);
      }
    }
  }

  // Ersetzungen rückwärts anwenden (damit Positionen sich nicht verändern)
  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i];
    //if (!r) continue;
    result = result.substring(0, r.start) + r.replacement + result.substring(r.end);
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

  // 2. --- Entferne \noindent{...} und behalte nur den Inhalt ---
  //const noindent = processBracedMacro(output, /\\noindent\s*\{/g, (content) => content);
  const noindent = processBracedMacro(output, patterns.special.noindent, (content) => content);
  output = noindent.output;
  replacements += noindent.count;
  
  // 3. --- Wende Textmakros an (aus macros.ts) ---
  for (const macro of Macros) {
    const beforeLength = output.length;
    output = output.replace(macro.regex, macro.replacement);
    if (output.length !== beforeLength) {
      replacements++;
    }
  }
    
  // 4. --- adjincludegraphics-Ersetzung ---
  output = output.replace(patterns.adjIncludeGraphics.regex, patterns.adjIncludeGraphics.replacement as any);
  
  // 5. --- Environment-Patterns (mit optionalen Parametern) ---
  for (const pattern of patterns.environments) {
    const matches = output.match(pattern.regex);
    if (matches) {
      replacements += matches.length;
    }
    output = output.replace(pattern.regex, pattern.replacement as string);
  }

  // 6. --- sttpMindMapText - Extrahiert Inhalt und gibt diesen als Inline-Code zurück
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

  // 7. --- Verarbeite alle DivBox-Configs mit Klammerzählung ---
  for (const config of patterns.braceCountingConfigs) {
    const result = processMultiParamMacro(
      output,
      new RegExp(`\\\\${config.macro}`, 'g'),
      config.paramCount,
      (params) => {
        const content = config.contentBuilder(params);
        return `\\begin{${config.targetEnv}}\n\n${content}\\end{${config.targetEnv}}`;
      }
    );
    output = result.output;
    replacements += result.count;
  }

  // 8. --- Wende Box-Patterns an (mit einfachem Regex) ---
  for (const pattern of patterns.divBoxes) {
    output = output.replace(pattern.regex, pattern.replacement as any);
  }

  // 9. --- Verarbeitet codeRahmen Makro ---
  const codeRahmen = processCodeRahmen(output);
  output = codeRahmen.output;
  replacements += codeRahmen.count;

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

    // Alle Makro-Ersetzungen in einem Schritt
    const macroResult = preprocessLatex(content);
    content = macroResult.processed;
    const totalReplacements = macroResult.replacements;
    
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