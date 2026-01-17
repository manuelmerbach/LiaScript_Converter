/**
 * Lädt Ausschlussliste für .tex-Dateien aus excluded-files.json
 * Exportiert Funktionen zur Prüfung und Filterung von Dateien
 */

import fs from "fs";
import path from "path";

interface ExcludedFileEntry {
  filename: string;
  comment?: string;
}

interface ExcludedFilesConfig {
  excludedFiles: ExcludedFileEntry[];
}

/**
 * Lädt die Ausschlussliste aus der JSON-Konfigurationsdatei
 */
function loadExcludedFilesFromJSON(jsonPath: string): string[] {
  try {
    const jsonContent = fs.readFileSync(jsonPath, "utf8");
    const config: ExcludedFilesConfig = JSON.parse(jsonContent);
    
    // Extrahiere nur die Dateinamen
    return config.excludedFiles.map(entry => entry.filename);
  } catch (error) {
    console.error(`Fehler beim Laden der excluded-files.json: ${error}`);
    throw error;
  }
}

// Lade Ausschlussliste aus JSON-Datei (im gleichen Verzeichnis wie macros.json)
const jsonPath = path.join(__dirname, "..", "src", "excluded-files.json");

/**
 * Export der Ausschlussliste - geladen aus JSON
 */
export const excludedFileNames: string[] = loadExcludedFilesFromJSON(jsonPath);

/**
 * Prüft, ob eine Datei ausgeschlossen werden soll
 * 
 * @param filePath - Vollständiger Pfad zur Datei
 * @returns true wenn die Datei ausgeschlossen werden soll
 * 
 * @example
 * isFileExcluded("C:/.../macros.tex")  // true
 * isFileExcluded("C:/.../Kapitel-1.tex")  // false
 */
export function isFileExcluded(filePath: string): boolean {
  // Extrahiere Dateinamen aus dem vollständigen Pfad
  const fileName = filePath.split(/[\/\\]/).pop() || "";
  
  // Prüfe ob Dateiname in der Ausschlussliste ist
  return excludedFileNames.includes(fileName);
}

/**
 * Gibt Informationen über ausgeschlossene Dateien aus
 * 
 * @param filePaths - Array von Dateipfaden
 * @returns Objekt mit Listen von inkludierten und exkludierten Dateien
 * 
 * @example
 * const info = getExclusionInfo(["file1.tex", "macros.tex", "file2.tex"]);
 * // { included: ["file1.tex", "file2.tex"], excluded: ["macros.tex"], total: 3 }
 */
export function getExclusionInfo(filePaths: string[]): {
  included: string[];
  excluded: string[];
  total: number;
} {
  const included: string[] = [];
  const excluded: string[] = [];
  
  for (const filePath of filePaths) {
    if (isFileExcluded(filePath)) {
      excluded.push(filePath);
    } else {
      included.push(filePath);
    }
  }
  
  return {
    included,
    excluded,
    total: filePaths.length
  };
}