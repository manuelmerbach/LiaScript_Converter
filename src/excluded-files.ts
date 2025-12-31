/**
 * Definiert, welche .tex-Dateien (Exakte Dateinamen) vom Tex-Preprocessing ausgeschlossen werden sollen.
 */

export const excludedFileNames: string[] = [
  "macros.tex",
  "makros.tex",
];

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