import * as fs from "fs";

export function convertMathBlocks(text: string): string {
  const regex = /^\s*``` ?math\s*\n([\s\S]*?)\s*```/gm;

  return text.replace(regex, (_match, content) => {
    return `$$\n${content}\n$$`;
  });
}

export function removeBackticksFromInlineMath(text: string): string {
  const regex = /\$`([^`]+)`\$/g;
  
  return text.replace(regex, (_match, content) => {
    return `$${content}$`;
  });
}

/**
 * Verschiebt Leerzeichen zwischen Inline-Code und Mathe-Formeln
 * Besteht bei Verwendung von mathematischen Formeln innerhalb Inlinecode \texttt{.. $formula$ ..}
 * Beispiel: `IF NOT `$b$` wird zu `IF NOT` $b$
 */
export function fixSpacesAroundMath(text: string): string {
  let result = text;
  
  // Fall 1: Leerzeichen vor Mathe-Formel (innerhalb Backtick)
  // `text `$formula$ → `text` $formula$
  result = result.replace(/`([^`]+) `(\$[^$]+\$)/g, '`$1` $2');
  
  // Fall 2: Leerzeichen nach Mathe-Formel (vor nächstem Backtick)
  // $formula$` text` → $formula$ `text`
  result = result.replace(/(\$[^$]+\$)` ([^`]+)`/g, '$1 `$2`');
  
  return result;
}

export function fixMathFormatting(text: string): string {
  let result = text;
  result = convertMathBlocks(result);
  result = removeBackticksFromInlineMath(result);
  result = fixSpacesAroundMath(result);
  return result;
}

/**
 * Liest Markdown-Datei, korrigiert Math-Blöcke und schreibt Ergebnis
 * 
 * @param inputPath Pfad zur Eingabe-Markdown-Datei
 * @param outputPath Pfad zur Ausgabe-Datei
 */
export function fixMath(inputPath: string, outputPath: string): void {
  const content = fs.readFileSync(inputPath, "utf-8");
  const fixed = fixMathFormatting(content);
  fs.writeFileSync(outputPath, fixed, "utf-8");
}