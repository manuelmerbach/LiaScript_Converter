import fs from "fs";
import path from "path";
import {
  getAllPatterns,
  simpleMacroReplacements,
  beginEnvironmentPatterns,
  tcolorboxPatterns,
  adjIncludeGraphicsPattern,
  inputReplacements,
  specialPatterns,
  type RegexPattern,
  liwrPattern,
  liwrOptionalPattern
} from "./regex-patterns-modular";
import { textMacros } from "./text-macros";
import { isFileExcluded, getExclusionInfo } from "./excluded-files";

interface ProcessingStats {
  filesProcessed: number;
  filesSkipped: number;
  replacements: number;
  errors: string[];
}

/**
 * Führt Preprocessing für LaTeX-Dateien durch mit dem neuen modularen System
 */
function preprocessLatex(content: string): { processed: string; replacements: number } {
  let output = content;
  let replacements = 0;

  // Hole alle generierten Patterns
  const patterns = getAllPatterns();
/*
  // 1. --- Entferne \textrm{...} und behalte nur den Inhalt ---
  const textrm_regex = patterns.special.textrm;
  let textrm_match: RegExpExecArray | null;

  while ((textrm_match = textrm_regex.exec(output)) !== null) {
    const startIndex = textrm_match.index + textrm_match[0].length;
    let braceCount = 1;
    let pos = startIndex;
    let content = "";

    while (pos < output.length && braceCount > 0) {
      const char = output[pos];
      if (char === "{") braceCount++;
      else if (char === "}") braceCount--;
      if (braceCount > 0) content += char;
      pos++;
    }

    if (braceCount === 0) {
      output =
        output.substring(0, textrm_match.index) +
        content +
        output.substring(pos);
      textrm_regex.lastIndex = textrm_match.index;
      replacements++;
    } else {
      console.warn("Ungeschlossenes \\textrm ab Position", textrm_match.index);
    }
  }
    */

  // 2. --- Wende einfache Makro-Ersetzungen an ---
  for (const pattern of patterns.simpleMacros) {
    const beforeLength = output.length;
    output = output.replace(pattern.regex, (_m, ...groups) => {
      if (typeof pattern.replacement === 'function') {
        return pattern.replacement(_m, ...groups);
      }
      return pattern.replacement.replace(/\$(\d+)/g, (_, num) => groups[parseInt(num) - 1] || '');
    });
    if (output.length !== beforeLength) {
      replacements++;
    }
  }

  // 3. --- Wende Multi-Parameter-Makros an ---
  for (const pattern of patterns.multiParamMacros) {
    const beforeLength = output.length;
    output = output.replace(pattern.regex, pattern.replacement as any);
    if (output.length !== beforeLength) {
      replacements++;
    }
  }

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

  // 5. --- liwr Ersetzung ---
  output = output.replace(liwrOptionalPattern.regex, liwrOptionalPattern.replacement as any);
  output = output.replace(liwrPattern.regex, liwrPattern.replacement as any);
  
  // 6. --- Environment-Patterns (mit optionalen Parametern) ---
  for (const pattern of patterns.environments) {
    const matches = output.match(pattern.regex);
    if (matches) {
      replacements += matches.length;
    }
    output = output.replace(pattern.regex, pattern.replacement as string);
  }

  // 7. --- sttpMindMapText - benötigt spezielle Verarbeitung ---
  const mindMapRegex = patterns.special.mindMap;
  let mindMapMatch: RegExpExecArray | null;

  while ((mindMapMatch = mindMapRegex.exec(output)) !== null) {
    const startIndex = mindMapMatch.index + mindMapMatch[0].length;
    let braceCount = 1;
    let pos = startIndex;
    let content = "";

    while (pos < output.length && braceCount > 0) {
      const char = output[pos];
      if (char === "{") braceCount++;
      else if (char === "}") braceCount--;
      if (braceCount > 0) content += char;
      pos++;
    }

    if (braceCount === 0) {
      // Entferne alle \textbf{...} und \textsf{...} Schichten iterativ
      let cleanContent = content;
      let previousContent;
      do {
        previousContent = cleanContent;
        cleanContent = cleanContent.replace(/\\textbf\{(.+?)\}/g, '$1');
        cleanContent = cleanContent.replace(/\\textsf\{(.+?)\}/g, '$1');
      } while (cleanContent !== previousContent);
      
      output =
        output.substring(0, mindMapMatch.index) +
        `\\texttt{${cleanContent}}` +
        output.substring(pos);
      mindMapRegex.lastIndex = mindMapMatch.index;
      replacements++;
    } else {
      console.warn("Ungeschlossenes \\sttpMindMapText ab Position", mindMapMatch.index);
    }
  }

  // 8. --- sttpKommLitItem - benötigt spezielle Verarbeitung ---
  let kommLitIndex = 0;
  const kommLitRegex = /\\sttpKommLitItem/g;
  let kommLitMatch: RegExpExecArray | null;

  while ((kommLitMatch = kommLitRegex.exec(output)) !== null) {
    const startIndex = kommLitMatch.index + kommLitMatch[0].length;
    const params: string[] = [];
    let pos = startIndex;
    
    for (let i = 0; i < 7; i++) {
      while (pos < output.length && /\s/.test(output[pos] ?? '')) pos++;
      
      if (pos >= output.length || output[pos] !== '{') break;
      
      pos++;
      let braceCount = 1;
      let param = '';
      
      while (pos < output.length && braceCount > 0) {
        const char = output[pos];
        if (char === '\\' && pos + 1 < output.length) {
          const nextChar = output[pos + 1];
          if (nextChar !== undefined) {
            param += char + nextChar;
            pos += 2;
            continue;
          }
        }
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        if (braceCount > 0) param += char;
        pos++;
      }
      
      params.push(param.trim());
    }
    
    if (params.length === 7) {
      const author = params[0] ?? '';
      const year = params[1] ?? '';
      const title = params[2] ?? '';
      const cite = params[3] ?? '';
      const description = params[6] ?? '';
      
      let result = `\\begin{KommLitItem}\n\n`;
      result += `\\emph{${author}} `;
      result += `\\emph{${year}}. `;
      result += `\\emph{${title}} `;
      result += `[\\textbf{${cite}}]\n\n`;
      result += `${description}\n\n`;
      result += `\\end{KommLitItem}\n\n`;
      
      output =
        output.substring(0, kommLitMatch.index) +
        result +
        output.substring(pos);
      kommLitRegex.lastIndex = kommLitMatch.index;
      replacements++;
    } else {
      console.warn(`Unvollständiges \\sttpKommLitItem ab Position ${kommLitMatch.index} (${params.length}/7 Parameter)`);
    }
  }

  // 9. --- sttpKommLitItemMitFussnote - mit Fußnotentext als 8. Parameter ---
  const kommLitFnRegex = /\\sttpKommLitItemMitFussnote/g;
  let kommLitFnMatch: RegExpExecArray | null;
  
  while ((kommLitFnMatch = kommLitFnRegex.exec(output)) !== null) {
    const startIndex = kommLitFnMatch.index + kommLitFnMatch[0].length;
    const params: string[] = [];
    let pos = startIndex;
    
    for (let i = 0; i < 8; i++) {
      while (pos < output.length && /\s/.test(output[pos] ?? '')) pos++;
      
      if (pos >= output.length || output[pos] !== '{') break;
      
      pos++;
      let braceCount = 1;
      let param = '';
      
      while (pos < output.length && braceCount > 0) {
        const char = output[pos];
        if (char === '\\' && pos + 1 < output.length) {
          const nextChar = output[pos + 1];
          if (nextChar !== undefined) {
            param += char + nextChar;
            pos += 2;
            continue;
          }
        }
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        if (braceCount > 0) param += char;
        pos++;
      }
      
      params.push(param.trim());
    }
    
    if (params.length === 8) {
      const author = params[0] ?? '';
      const year = params[1] ?? '';
      const title = params[2] ?? '';
      const cite = params[3] ?? '';
      const description = params[6] ?? '';
      const footnote = params[7] ?? '';
      
      let result = `\\begin{KommLitItem}\n\n`;
      result += `\\emph{${author}} `;
      result += `\\emph{${year}}. `;
      result += `\\emph{${title}} `;
      result += `[\\textbf{${cite}}]\\footnote{${footnote}}\n\n`;
      result += `${description}\n\n`;
      result += `\\end{KommLitItem}\n\n`;
      
      output =
        output.substring(0, kommLitFnMatch.index) +
        result +
        output.substring(pos);
      kommLitFnRegex.lastIndex = kommLitFnMatch.index;
      replacements++;
    } else {
      console.warn(`Unvollständiges \\sttpKommLitItemMitFussnote ab Position ${kommLitFnMatch.index} (${params.length}/8 Parameter)`);
    }
  }

  // 10. --- Wende div-Box-Patterns an (Definitionskasten, etc.) ---
  for (const pattern of patterns.divBoxes) {
    output = output.replace(pattern.regex, pattern.replacement as any);
  }

  // 11. --- Cites-Pattern ---
  output = output.replace(patterns.citeOptional.regex, patterns.citeOptional.replacement as string);
  output = output.replace(patterns.cite.regex, patterns.cite.replacement as string);

   // 12. --- MiniSec-Pattern ---
  output = output.replace(patterns.minisec.regex, patterns.minisec.replacement as string);

  return { processed: output, replacements };
}

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

    // Schritt 2: Ersetze spezielle Blöcke / Problemstellen
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

      let braceCount = 1;
      let pos = startPos;
      let caption = "";

      while (pos < content.length && braceCount > 0) {
        const char = content[pos];
        if (char === "{") braceCount++;
        else if (char === "}") braceCount--;
        if (braceCount > 0) caption += char;
        pos++;
      }

      if (braceCount === 0) {
        replacements.push({
          start: match.index,
          end: pos,
          replacement: `\\lstinputlisting[language=Go, caption={${caption.replace(
            /~/g,
            " "
          )}}, label=${label}]{${file}}`,
        });
        totalReplacements++;
      }
    }

    for (let i = replacements.length - 1; i >= 0; i--) {
      const r = replacements[i];
      if (!r) continue;
      content =
        content.substring(0, r.start) +
        r.replacement +
        content.substring(r.end);
    }

    // Schritt 3: Input-Ersetzungen
    for (const pattern of patterns.inputReplacements) {
      const matches = content.match(pattern.regex);
      if (matches) {
        totalReplacements += matches.length;
      }
      content = content.replace(pattern.regex, pattern.replacement as string);
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

/**
 * Einzeldatei-Helfer
 */
export function preprocessSingleLatexFile(filePath: string): void {
  if (isFileExcluded(filePath)) {
    console.log(`⊘ Datei übersprungen (ausgeschlossen): ${filePath}`);
    return;
  }
  
  try {
    const replacements = preprocessTexFile(filePath);
    console.log(`✓ ${filePath} verarbeitet (${replacements} Ersetzungen)`);
  } catch (error) {
    console.error(`❌ Fehler beim Verarbeiten von ${filePath}:`, error);
    throw error;
  }
}

// Direkter Testlauf
function main(): void {
  const inputDirectory = "C:\\Uni\\FinalApp\\Input\\Kurstext_Go_Merbach";

  console.log("🚀 Starte LaTeX Preprocessing (Modulares System)...\n");

  try {
    const stats = preprocessLatexDirectory(inputDirectory, {
      verbose: true,
    });
    console.log("\n🎉 Preprocessing abgeschlossen!");
    console.log("Jetzt kannst du Pandoc ausführen.");
  } catch (error) {
    console.error("💥 Fehler beim Preprocessing:", error);
  }
}

if (require.main === module) {
  main();
}
