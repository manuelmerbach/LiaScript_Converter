/**
 * Lädt Makros aus macros.json.
 * Exportiert const Macros und applyMacros()
 */

import fs from "fs";
import path from "path";

export interface Macro {
  name: string;
  regex: RegExp;
  replacement: string;
  description?: string;
}

interface MacroJSON {
  name: string;
  regex: string;
  flags: string;
  replacement: string;
  description?: string;
}

interface CategoryGroup {
  category: string;
  macros: MacroJSON[];
}

interface MacrosConfig {
  Macros: CategoryGroup[];
}

/**
 * Lädt Textmakros aus einer JSON-Datei und konvertiert sie in TextMacro[]
 */
function loadMacrosFromJSON(jsonPath: string): Macro[] {
  try {
    const jsonContent = fs.readFileSync(jsonPath, "utf8");
    const config: MacrosConfig = JSON.parse(jsonContent);
    
    // Flatten: Alle Makros aus allen Kategorien sammeln
    const allMacros: Macro[] = [];
    
    for (const categoryGroup of config.Macros) {
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
    console.error(`Fehler beim Laden der macros.json: ${error}`);
    throw error;
  }
}

// Lade Makros aus JSON-Datei (im gleichen Verzeichnis)
const jsonPath = path.join(__dirname, "..", "src", "macros.json");

/**
 * Export der Textmakros - identisch zur alten API
 * Kann direkt als Drop-in Replacement verwendet werden
 */
export const Macros: Macro[] = loadMacrosFromJSON(jsonPath);

/**
 * Wendet alle Textmakros auf einen String an
 * wird aktuell nicht im Preprocessor verwendet
 
export function applyMacros(content: string): { processed: string; count: number } {
  let output = content;
  let count = 0;
  
  for (const macro of Macros) {
    const beforeLength = output.length;
    output = output.replace(macro.regex, macro.replacement);
    if (output.length !== beforeLength) {
      count++;
    }
  }
  
  return { processed: output, count };
}
  */