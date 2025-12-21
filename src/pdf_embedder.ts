import * as fs from "fs";
import * as path from "path";

/**
 * Sucht in einer Markdown-Datei nach falsch eingebundenen PDFs (![...](...pdf))und ersetzt sie durch <figure><embed>.
 *
 * @param inputPath Pfad zur Eingabe-Markdown-Datei
 * @param outputPath Pfad zur Ausgabe-Datei
 */
export function fixPdf(inputPath: string, outputPath: string) {
  const content = fs.readFileSync(inputPath, "utf-8");

  // Regex findet ![...](pfad/datei.pdf)
  const pdfImageRegex = /!\[([^\]]*)\]\(([^)]+\.pdf)\)/gi;

  const replaced = content.replace(pdfImageRegex, (_match, alt, pdfPath) => {
    // Erstellt Caption aus Dateiname ohne Endung
    const baseName = path.basename(pdfPath, ".pdf").replace(/[_-]+/g, " ");
     // Verwendet Caption aus Alt-Text fals vorhanden, andernfalls Dateiname ohne Endung
    const caption = (alt?.trim() && alt.trim().toLowerCase() !== "image") 
      ? alt.trim() 
      : baseName;

    return `
<figure>
  <embed src="${pdfPath}"
         type="application/pdf"
         width="100%"
         height="460px" />
  <figcaption>${caption}</figcaption>
</figure>`;
  });

  fs.writeFileSync(outputPath, replaced, "utf-8");
  console.log(`Fertige Datei geschrieben: ${outputPath}`);
}

// Beispielaufruf
//const inputFile = path.resolve(__dirname, "../Input/dokument1.md");
//const outputFile = path.resolve(__dirname, "../Output/dokument1_pdfembedded.md");

//fixPdf(inputFile, outputFile);
