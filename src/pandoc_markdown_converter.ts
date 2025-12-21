import { exec } from "child_process";
import path from "path";
import fs from "fs";

export function convertLatexToMarkdown(inputFile: string, outputFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const inputPath = path.resolve(inputFile);
    const outputPath = path.resolve(outputFile);
    const workingDir = path.dirname(inputPath);
  
    const command = `pandoc -s -f latex -t gfm --wrap=preserve --verbose -o "${outputPath}" "${inputPath}"`;
    //const command = `pandoc -s -f latex -t gfm --wrap=none --verbose -o "${outputPath}" "${inputPath}"`;
    //const command = `pandoc -s -f latex -t gfm --wrap=auto --columns=72 --verbose -o "${outputPath}" "${inputPath}"`;
  
    exec(command, { cwd: workingDir }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Fehler beim Ausführen von pandoc: ${error.message}`));
        return;
      }
      if (stderr) {
        console.error(`Pandoc Warnung/Fehlerausgabe: ${stderr}`);
      }
      console.log(`Pandoc erfolgreich ausgeführt: ${stdout}`);
      resolve();
    });
  });
}

export function convertLatexToMarkdownWithFilter(
  inputFile: string,
  outputFile: string,
  luaFilter: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const inputPath = path.resolve(inputFile);
    const outputPath = path.resolve(outputFile);
    const workingDir = path.dirname(inputPath);

    // Temporäre Datei für die gefilterte Zwischenstufe
    const tempTexFile = path.join(workingDir, "filtered_temp.tex");

    // 1️⃣ Schritt 1: LaTeX → LaTeX (Lua-Filter anwenden)
    const filterCommand = `pandoc -s -f latex -t latex --lua-filter="${luaFilter}" -o "${tempTexFile}" "${inputPath}"`;

    console.log("🧩 Wende Lua-Filter an...");
    exec(filterCommand, { cwd: workingDir }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Fehler beim Anwenden des Lua-Filters: ${error.message}`));
        return;
      }
      if (stderr) console.warn(`Pandoc Warnung (Filter): ${stderr}`);

      console.log("✅ Lua-Filter erfolgreich angewendet.");

      // 2️⃣ Schritt 2: Gefiltertes TeX → Markdown
      const mdCommand = `pandoc -s -f latex -t markdown --listings --mathjax -o "${outputPath}" "${tempTexFile}"`;

      console.log("🔄 Konvertiere gefiltertes TeX in Markdown...");
      exec(mdCommand, { cwd: workingDir }, (err, out, errout) => {
        // Temporäre Datei löschen
        if (fs.existsSync(tempTexFile)) fs.unlinkSync(tempTexFile);

        if (err) {
          reject(new Error(`Fehler bei der Markdown-Konvertierung: ${err.message}`));
          return;
        }
        if (errout) console.warn(`Pandoc Warnung (Markdown): ${errout}`);

        console.log("🎉 Konvertierung erfolgreich abgeschlossen!");
        resolve();
      });
    });
  });
}
