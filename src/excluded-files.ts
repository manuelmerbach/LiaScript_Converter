/**
 * Ausschlussliste für Dateien
 * 
 * Diese Datei enthält Listen von Dateien und Mustern, die von der
 * Vorverarbeitung ausgeschlossen werden sollen.
 */

/**
 * Exakte Dateinamen (ohne Pfad), die nicht verarbeitet werden sollen
 */
export const excludedFileNames: string[] = [
  // Beispiele:
  // "declarations.tex",
  // "config_mdframed.tex",
  "macros.tex",
  "makros.tex",
  // "config_listings.tex"
];

/**
 * Dateimuster (Regex), die nicht verarbeitet werden sollen
 */
export const excludedFilePatterns: RegExp[] = [
  // Beispiele:
  // /^config_.*\.tex$/,        // Alle config_*.tex Dateien
  // /^_.*\.tex$/,              // Alle Dateien die mit _ beginnen
  // /backup.*\.tex$/,          // Alle Dateien die "backup" enthalten
];

/**
 * Pfad-Muster (Regex), die nicht verarbeitet werden sollen
 * Dies kann verwendet werden um ganze Verzeichnisse auszuschließen
 */
export const excludedPathPatterns: RegExp[] = [
  // Beispiele:
  // /[\/\\]archive[\/\\]/,     // Verzeichnis "archive"
  // /[\/\\]backup[\/\\]/,      // Verzeichnis "backup"
  // /[\/\\]old[\/\\]/,         // Verzeichnis "old"
  // /[\/\\]\.git[\/\\]/,       // Git-Verzeichnis
];

/**
 * Prüft, ob eine Datei ausgeschlossen werden soll
 * @param filePath - Vollständiger Pfad zur Datei
 * @returns true wenn die Datei ausgeschlossen werden soll
 */
export function isFileExcluded(filePath: string): boolean {
  const fileName = filePath.split(/[\/\\]/).pop() || "";
  
  // Prüfe exakte Dateinamen
  if (excludedFileNames.includes(fileName)) {
    return true;
  }
  
  // Prüfe Dateimuster
  for (const pattern of excludedFilePatterns) {
    if (pattern.test(fileName)) {
      return true;
    }
  }
  
  // Prüfe Pfad-Muster
  for (const pattern of excludedPathPatterns) {
    if (pattern.test(filePath)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Filtert eine Liste von Dateipfaden und entfernt ausgeschlossene Dateien
 * @param filePaths - Array von Dateipfaden
 * @returns Gefiltertes Array ohne ausgeschlossene Dateien
 */
export function filterExcludedFiles(filePaths: string[]): string[] {
  return filePaths.filter(filePath => !isFileExcluded(filePath));
}

/**
 * Gibt Informationen über ausgeschlossene Dateien aus
 * @param filePaths - Array von Dateipfaden
 * @returns Objekt mit Listen von inkludierten und exkludierten Dateien
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
