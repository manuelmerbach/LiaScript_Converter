/**
 * Textmakros-Loader für JSON-Konfiguration
 * 
 * Diese Datei ersetzt text-macros.ts und lädt die Makros aus text-macros.json.
 * Die API bleibt identisch: export const textMacros und export function applyTextMacros()
 */

import fs from "fs";
import path from "path";

export interface TextMacro {
  name: string;
  regex: RegExp;
  replacement: string;
  description?: string;
}

interface TextMacroJSON {
  name: string;
  regex: string;
  flags: string;
  replacement: string;
  description?: string;
}

interface CategoryGroup {
  category: string;
  macros: TextMacroJSON[];
}

interface TextMacrosConfig {
  textMacros: CategoryGroup[];
}

/**
 * Lädt Textmakros aus einer JSON-Datei und konvertiert sie in TextMacro[]
 */
function loadTextMacrosFromJSON(jsonPath: string): TextMacro[] {
  try {
    const jsonContent = fs.readFileSync(jsonPath, "utf8");
    const config: TextMacrosConfig = JSON.parse(jsonContent);
    
    // Flatten: Alle Makros aus allen Kategorien sammeln
    const allMacros: TextMacro[] = [];
    
    for (const categoryGroup of config.textMacros) {
      for (const macro of categoryGroup.macros) {
        allMacros.push({
          name: macro.name,
          regex: new RegExp(macro.regex, macro.flags),
          replacement: macro.replacement,
          description: macro.description
        });
      }
    }
    
    return allMacros;
  } catch (error) {
    console.error(`Fehler beim Laden der text-macros.json: ${error}`);
    throw error;
  }
}

// Lade Makros aus JSON-Datei (im gleichen Verzeichnis)
const jsonPath = path.join(__dirname, "..", "src", "text-macros.json");

/**
 * Export der Textmakros - identisch zur alten API
 * Kann direkt als Drop-in Replacement verwendet werden
 */
export const textMacros: TextMacro[] = loadTextMacrosFromJSON(jsonPath);

/**
 * Wendet alle Textmakros auf einen String an
 * Diese Funktion ist optional - wird aktuell nicht im Preprocessor verwendet
 */
export function applyTextMacros(content: string): { processed: string; count: number } {
  let output = content;
  let count = 0;
  
  for (const macro of textMacros) {
    const beforeLength = output.length;
    output = output.replace(macro.regex, macro.replacement);
    if (output.length !== beforeLength) {
      count++;
    }
  }
  
  return { processed: output, count };
}