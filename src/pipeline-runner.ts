// HINWEIS: Diese Datei muss in electron-app/ liegen
// Die Imports müssen auf die Module im übergeordneten Verzeichnis verweisen

import { convertLatexToMarkdown } from "./pandoc_markdown_converter";
import { fixDivs } from "./fix-pandoc-divs";
import { addCoderunnerMacros } from "./md-code-transformer";
import { fixPdf } from "./pdf_embedder";
import { exporter } from "./export/web";
import { exporter as exporter_ims } from "./export/ims";
import { exporter as exporter_scorm2004 } from "./export/scorm2004";
import { exporter as exporter_scorm12 } from "./export/scorm12";
import { preprocessLatexDirectory } from "./tex_preprocessor2_modular"
import { relocateFootnotes } from "./footnotes_shifter";
import { fixMath } from "./math_fixer";
import * as path from "path";
import * as fs from "fs-extra";
import * as os from "os";

export interface PipelineConfig {
  sourceLatexDir: string;
  mainTexFile: string;
  outputDir: string;
  prependMd: string;
  outputSteps: boolean;
  skipSteps: boolean[];
  exportFormats: boolean[];
  exportConfig: {
    lia: {
      str_title: string;
      definition: {
        macro: { comment: string };
        logo: string;
      };
    };
  };
}

export interface PipelineProgress {
  step: number;
  totalSteps: number;
  message: string;
  details?: string;
}

/**
 * Fügt CodeRunner.md am Anfang einer Markdown-Datei ein
 */
function prependFileToMarkdown(targetFile: string, prependFile: string) {
  const prependContent = fs.readFileSync(prependFile, "utf8");
  const targetContent = fs.readFileSync(targetFile, "utf8");
  const updated = `${prependContent}\n\n${targetContent}`;
  fs.writeFileSync(targetFile, updated, "utf8");
}

function skipStep(inputFile: string, outputFile: string){
  fs.copyFileSync(inputFile, outputFile);
}

/**
 * Kopiert rekursiv alle Dateien aus einem Verzeichnis in ein anderes
 */
async function copyDirectory(source: string, destination: string) {
  await fs.ensureDir(destination);
  await fs.copy(source, destination, {
    overwrite: true,
    errorOnExist: false,
  });
}

/**
 * Erstellt einen eindeutigen temporären Ordner
 */
function createTempDirectory(prefix: string = "latex-pipeline-"): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return tempDir;
}

/**
 * Hauptfunktion der Pipeline mit konfigurierbaren Parametern
 */
export async function runPipeline(
  config: PipelineConfig,
  progressCallback?: (progress: PipelineProgress) => void
): Promise<{ success: boolean; message: string; outputs?: string[] }> {
  
  const reportProgress = (step: number, message: string, details?: string) => {
    if (progressCallback) {
      progressCallback({ step, totalSteps: 10, message, details });
    }
  };

  let tempDir: string | null = null;
  const outputs: string[] = [];

  try {
    reportProgress(1, "Erstelle temporären Arbeitsordner");
    
    tempDir = createTempDirectory("latex-pipeline-");
    await copyDirectory(config.sourceLatexDir, tempDir);

    // SCHRITT 2: TEX PREPROCESSING
    reportProgress(2, "LaTeX Preprocessing");
    
    const preprocessStats = preprocessLatexDirectory(tempDir, {
      verbose: false,
    });
    
    if (preprocessStats.errors.length > 0) {
      console.warn(`Preprocessing-Fehler: ${preprocessStats.errors.length}`);
    }

    // SCHRITT 3: PANDOC KONVERTIERUNG
    reportProgress(3, "LaTeX → Markdown Konvertierung");
    
    const texFilePath = path.join(tempDir, config.mainTexFile);
    const rawMd = path.join(tempDir, "dokument.md");
    
    await convertLatexToMarkdown(texFilePath, rawMd);

    if (config.outputSteps) {
      const rawMdOutput = path.join(config.outputDir, path.basename(rawMd));
      await fs.copy(rawMd, rawMdOutput);
    }

    // SCHRITT 4: PDF EMBEDDER
    const fixedPdfMd = path.join(tempDir, "dokument_pdffixed.md");

    if (config.skipSteps[0]) {
      reportProgress(4, "PDF-Einbindungen verarbeiten");
      fixPdf(rawMd, fixedPdfMd);
 
      if (config.outputSteps) {
        const fixedPdfMdOutput = path.join(config.outputDir, path.basename(fixedPdfMd));
        await fs.copy(fixedPdfMd, fixedPdfMdOutput);
      }
    } else {
      skipStep(rawMd, fixedPdfMd);
    }
    
    // SCHRITT 5: MATH FIXER
    const rawMdwMth = path.join(tempDir, "dokument_mth.md");

    if (config.skipSteps[1]) {
      reportProgress(5, "Math-Blöcke korrigieren");
      fixMath(fixedPdfMd, rawMdwMth);
      
      if (config.outputSteps) {
        const rawMdwMthOutput = path.join(config.outputDir, path.basename(rawMdwMth));
        await fs.copy(rawMdwMth, rawMdwMthOutput);
      }
    } else {
      skipStep(fixedPdfMd, rawMdwMth);
    }
    
    // SCHRITT 6: DIV-BLÖCKE FIXEN
    const fixedDivMd = path.join(tempDir, "markdown_divfixed.md");

    if (config.skipSteps[2]) {
      reportProgress(6, "Pandoc Div-Blöcke korrigieren");
      fixDivs(rawMdwMth, fixedDivMd, "plain");

      if (config.outputSteps) {
        const fixedDivMdOutput = path.join(config.outputDir, path.basename(fixedDivMd));
        await fs.copy(fixedDivMd, fixedDivMdOutput);
      }
    } else {
      skipStep(rawMdwMth, fixedDivMd);
    }

    // SCHRITT 7: CODERUNNER MAKROS
    const transformedMd = path.join(tempDir, "markdown_transformed.md");

    if (config.skipSteps[3]) {
      reportProgress(7, "CodeRunner-Makros hinzufügen");
      addCoderunnerMacros(fixedDivMd, transformedMd);

      if (config.outputSteps) {
        const transformedMdOutput = path.join(config.outputDir, path.basename(transformedMd));
        await fs.copy(transformedMd, transformedMdOutput);
      }
    } else {
      skipStep(fixedDivMd, transformedMd);
    }

    // SCHRITT 8: FUSSNOTEN VERSETZEN
    const transformedMdFn = path.join(tempDir, `${path.parse(config.mainTexFile).name}.md`);

    if (config.skipSteps[4]) {
      reportProgress(8, "Fußnoten versetzen");
      
      const contentWithMacros = fs.readFileSync(transformedMd, "utf8");
      const contentWithFootnotes = relocateFootnotes(contentWithMacros);
      fs.writeFileSync(transformedMdFn, contentWithFootnotes, "utf8");

      if (config.outputSteps) {
        const transformedMdFnOutput = path.join(config.outputDir, path.basename(transformedMdFn));
        await fs.copy(transformedMdFn, transformedMdFnOutput);
      }
    } else {
      skipStep(transformedMd, transformedMdFn);
    }
    
    // SCHRITT 9: CODERUNNER.MD VORANSTELLEN
    reportProgress(9, "CodeRunner.md voranstellen");
    
    if (fs.existsSync(config.prependMd)) {
      prependFileToMarkdown(transformedMdFn, config.prependMd);
    }

    // SCHRITT 10: EXPORT
    reportProgress(10, "Exportiere in verschiedenen Formaten");

    await fs.ensureDir(config.outputDir);

    // Finale Markdown-Datei
    if (config.exportFormats[0]) {
      const finalMdOutput = path.join(config.outputDir, path.basename(transformedMdFn));
      await fs.copy(transformedMdFn, finalMdOutput);
      outputs.push(finalMdOutput);
    }

    // IMS Package
    if (config.exportFormats[1]) {
      await exporter_ims(
        {
          input: transformedMdFn,
          readme: path.basename(transformedMdFn),
          format: "ims",
          path: tempDir,
          output: path.join(config.outputDir, "course-ims"),
        },
        config.exportConfig as any
      );
      outputs.push(path.join(config.outputDir, "course-ims.zip"));
    }

    // SCORM 1.2
    if (config.exportFormats[2]) {
      await exporter_scorm12(
        {
          input: transformedMdFn,
          readme: path.basename(transformedMd),
          format: "scorm1.2",
          path: tempDir,
          output: path.join(config.outputDir, "course-scorm12"),
        },
        config.exportConfig as any
      );
      outputs.push(path.join(config.outputDir, "course-scorm12.zip"));
    }

    // SCORM 2004
    if (config.exportFormats[3]) {
      await exporter_scorm2004(
        {
          input: transformedMdFn,
          readme: path.basename(transformedMd),
          format: "scorm2004",
          path: tempDir,
          output: path.join(config.outputDir, "course-scorm2004"),
        },
        config.exportConfig as any
      );
      outputs.push(path.join(config.outputDir, "course-scorm2004.zip"));
    }

    // Website
    if (config.exportFormats[4]) {
      await exporter(
        {
          input: transformedMdFn,
          readme: path.basename(transformedMdFn),
          output: path.join(config.outputDir, "course-web"),
          format: "web",
          path: tempDir,
          "web-zip": true,
        },
        config.exportConfig
      );
      outputs.push(path.join(config.outputDir, "course-web.zip"));
    }

    return {
      success: true,
      message: "Pipeline erfolgreich abgeschlossen!",
      outputs
    };

  } catch (error) {
    console.error("Pipeline-Fehler:", error);
    return {
      success: false,
      message: `Fehler: ${error instanceof Error ? error.message : String(error)}`
    };
  } finally {
    // Cleanup
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        await fs.remove(tempDir);
      } catch (cleanupError) {
        console.warn(`Konnte temporären Ordner nicht löschen: ${tempDir}`);
      }
    }
  }
}
