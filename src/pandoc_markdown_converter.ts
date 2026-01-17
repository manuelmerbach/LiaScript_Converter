import { exec } from "child_process";
import path from "path";

export function convertLatexToMarkdown(inputFile: string, outputFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const inputPath = path.resolve(inputFile);
    const outputPath = path.resolve(outputFile);
    const workingDir = path.dirname(inputPath);
  
    const command = `pandoc -s -f latex -t gfm --wrap=preserve --verbose -o "${outputPath}" "${inputPath}"`;
  
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