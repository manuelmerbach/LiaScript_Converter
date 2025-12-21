/**
 * Fügt LiaScript CodeRunner-Makros zu Code-Blöcken hinzu
 * Findet ```language und fügt nach ``` das entsprechende @LIA.xxx Makro hinzu
 */

import * as fs from 'fs';

/**
 * Mapping von Sprachen zu LiaScript-Makros
 * Basierend auf der offiziellen LiaScript CodeRunner-Dokumentation
 */
const LANGUAGE_TO_MACRO: { [key: string]: string } = {
  
  // A
  'ada': '@LIA.ada',
  'algol': '@LIA.algol',
  'apl': '@LIA.apl',
  'awk': '@LIA.awk',
  
  // B
  'basic': '@LIA.basic',
  'bas': '@LIA.basic',
  
  // C
  'c': '@LIA.c',
  'clojure': '@LIA.clojure',
  'clj': '@LIA.clojure',
  'cpp': '@LIA.cpp',
  'c++': '@LIA.cpp',
  'cxx': '@LIA.cpp',
  'cobol': '@LIA.cobol',
  'cob': '@LIA.cobol',
  'coq': '@LIA.coq',
  'csharp': '@LIA.dotnet',
  'cs': '@LIA.dotnet',
  'c#': '@LIA.dotnet',
  
  // D
  'd': '@LIA.d',
  
  // E
  'elixir': '@LIA.elixir',
  'exs': '@LIA.elixir',
  'erlang': '@LIA.erlang',
  'erl': '@LIA.erlang',
  
  // F
  'forth': '@LIA.forth',
  'fs': '@LIA.forth',
  'fortran': '@LIA.fortran',
  'f90': '@LIA.fortran',
  'fsharp': '@LIA.fsharp',
  'f#': '@LIA.fsharp',
  
  // G
  'go': '@LIA.go',
  'golang': '@LIA.go',
  'groovy': '@LIA.groovy',
  
  // H
  'haskell': '@LIA.haskell',
  'hs': '@LIA.haskell',
  'haxe': '@LIA.haxe',
  'hx': '@LIA.haxe',
  
  // I
  'inform': '@LIA.inform',
  'io': '@LIA.io',
  
  // J
  'java': '@LIA.java',
  'javascript': '@LIA.nodejs',
  'js': '@LIA.nodejs',
  'julia': '@LIA.julia',
  'jl': '@LIA.julia',
  
  // K
  'kotlin': '@LIA.kotlin',
  'kt': '@LIA.kotlin',
  
  // L
  'lua': '@LIA.lua',
  
  // M
  'mono': '@LIA.mono',
  
  // N
  'nasm': '@LIA.nasm',
  'asm': '@LIA.nasm',
  'nim': '@LIA.nim',
  'nodejs': '@LIA.nodejs',
  'node': '@LIA.nodejs',
  
  // O
  'ocaml': '@LIA.ocaml',
  'ml': '@LIA.ocaml',
  
  // P
  'perl': '@LIA.perl',
  'pl': '@LIA.perl',
  'php': '@LIA.php',
  'postscript': '@LIA.postscript',
  'ps': '@LIA.postscript',
  'prolog': '@LIA.prolog',
  'python': '@LIA.python',
  'py': '@LIA.python',
  'python2': '@LIA.python2',
  'python3': '@LIA.python3',
  
  // Q
  'qsharp': '@LIA.qsharp',
  'qs': '@LIA.qsharp',
  
  // R
  'r': '@LIA.r',
  'racket': '@LIA.racket',
  'rkt': '@LIA.racket',
  'ruby': '@LIA.ruby',
  'rb': '@LIA.ruby',
  'rust': '@LIA.rust',
  'rs': '@LIA.rust',
  
  // S
  'scala': '@LIA.scala',
  'scheme': '@LIA.scheme',
  'scm': '@LIA.scheme',
  'selectscript': '@LIA.selectscript',
  's2': '@LIA.selectscript',
  'smalltalk': '@LIA.smalltalk',
  'st': '@LIA.smalltalk',
  'bash': '@LIA.bash',
  'sh': '@LIA.bash',
  'shell': '@LIA.bash',
  
  // T
  'tcl': '@LIA.tcl',
   'typescript': '@LIA.nodejs',
  'ts': '@LIA.nodejs',
  
  // V
  'v': '@LIA.v',
  'vlang': '@LIA.v',
  'verilog': '@LIA.verilog',
  'vhdl': '@LIA.vhdl',
  
  // Z
  'zig': '@LIA.zig'
};

/**
 * Fügt LiaScript CodeRunner-Makros zu Code-Blöcken hinzu
 * @param inputPath Pfad zur Eingabedatei
 * @param outputPath Pfad zur Ausgabedatei
 */
export function addCoderunnerMacros(inputPath: string, outputPath: string): void {
  const markdown = fs.readFileSync(inputPath, 'utf-8');
  
  // Regex zum erfassen von ``` language
  const codeBlockRegex = /(```\s*([a-zA-Z0-9_+-]+)\s*\n)([\s\S]*?)(```)/g;
  
  let result = markdown;
  const replacements: Array<{
    start: number;
    end: number;
    replacement: string;
  }> = [];
  
  let match;
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const fullMatch = match[0];
    const openingLine = match[1] || '';
    const language = match[2]?.toLowerCase().trim() || '';
    const codeContent = match[3] || '';
    const closingBackticks = match[4] || '';
    
    const macro = LANGUAGE_TO_MACRO[language];
    
    if (macro) {
      // Füge das Makro in einer neuen Zeile nach schließendem ``` hinzu
      const newBlock = `${openingLine}${codeContent}${closingBackticks}\n${macro}`;
      
      replacements.push({
        start: match.index,
        end: match.index + fullMatch.length,
        replacement: newBlock
      });
    }
  }
  
  // Von hinten nach vorne ersetzen, damit Indizes korrekt bleiben
  replacements.sort((a, b) => b.start - a.start);
  
  for (const replacement of replacements) {
    result =
      result.substring(0, replacement.start) +
      replacement.replacement +
      result.substring(replacement.end);
  }
  
  fs.writeFileSync(outputPath, result, 'utf-8');
  console.log(`✓ CodeRunner-Makros hinzugefügt: ${outputPath}`);
}