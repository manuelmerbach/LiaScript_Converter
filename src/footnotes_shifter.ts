import fs from "fs";

interface Footnote {
  id: string;
  text: string;
}

/**
 * Extrahiert alle Fußnoten-Definitionen (auch mehrzeilige).
 */
function extractFootnotes(markdown: string): { cleaned: string; footnotes: Footnote[] } {
  const lines: string[] = markdown.split(/\r?\n/);
  const footnotes: Footnote[] = [];
  const toRemove = new Set<number>();

  let i = 0;
  while (i < lines.length) {
    const line: string | undefined = lines[i];
    if (!line) {
      i++;
      continue;
    }

    // Beginn einer Fußnotendefinition erkannt?
    const startMatch = line.match(/^\[\^(\d+)\]:\s*(.*)$/);
    if (startMatch) {
      const id: string = startMatch[1] ?? "";
      const firstLine: string = startMatch[2] ?? "";
      const buffer: string[] = [firstLine];
      toRemove.add(i);

      let j = i + 1;
      while (j < lines.length) {
        const next: string | undefined = lines[j];
        if (!next) break;

        // Neue Fußnote → aktuelle Definition beenden
        if (/^\[\^\d+\]:/.test(next)) break;

        // eingerückt oder leer → gehört zur aktuellen Fußnote
        if (/^( {2,}|\t)/.test(next) || next.trim() === "") {
          buffer.push(next.replace(/^( {2,}|\t)/, ""));
          toRemove.add(j);
          j++;
          continue;
        }

        break; // sonst Ende der Fußnote
      }

      if (id.trim().length > 0) {
        footnotes.push({
          id,
          text: buffer.join("\n").trimEnd(),
        });
      }

      i = j;
      continue;
    }

    i++;
  }

  // alle gefundenen Fußnotenzeilen entfernen
  const cleanedLines = lines.filter((_, idx) => !toRemove.has(idx));
  const cleaned = cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";

  return { cleaned, footnotes };
}

/**
 * Verschiebt Fußnoten-Definitionen an das Ende des jeweiligen Abschnitts
 * (vor die nächste Überschrift) – in korrekter numerischer Reihenfolge.
 */
export function relocateFootnotes(markdown: string): string {
  const { cleaned, footnotes } = extractFootnotes(markdown);
  let text = cleaned;

  interface Insertion {
    pos: number;
    idNum: number;
    block: string;
  }

  const insertions: Insertion[] = [];

  for (const fn of footnotes) {
    const refRe = new RegExp(`\\[\\^${fn.id}\\]`, "g");
    let match: RegExpExecArray | null;

    while ((match = refRe.exec(text)) !== null) {
      const refIndex = match.index;
      const afterRef = text.slice(refIndex);
      const headingMatch = afterRef.match(/^#{1,6}\s.+$/m);

      // wenn keine Überschrift folgt → ans Dokumentende
      const insertPos =
        headingMatch && typeof headingMatch.index === "number"
          ? refIndex + headingMatch.index
          : text.length;

      const indented = fn.text.replace(/\n/g, "\n    ");
      const block = `\n[^${fn.id}]: ${indented}\n\n`;

      insertions.push({
        pos: insertPos,
        idNum: parseInt(fn.id, 10),
        block,
      });
    }
  }

  // sortieren: zuerst Position, dann Fußnoten-ID
  insertions.sort((a, b) => {
    if (a.pos !== b.pos) return a.pos - b.pos;
    return a.idNum - b.idNum;
  });

  // von hinten nach vorn einfügen, um Indizes stabil zu halten
  for (let k = insertions.length - 1; k >= 0; k--) {
    const ins = insertions[k];
    if (!ins) continue;
    const left = text.slice(0, ins.pos).replace(/\n+$/g, "\n");
    const right = text.slice(ins.pos).replace(/^\n+/g, "\n");
    text = left + ins.block + right;
  }

  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trimEnd() + "\n";
}

// Beispielverwendung
if (require.main === module) {
  const input = fs.readFileSync("markdown_transformed.md", "utf8");
  //const input = fs.readFileSync("dokument.md", "utf8");
  const output = relocateFootnotes(input);
  fs.writeFileSync("dokument_footnotes_relocated.md", output, "utf8");
  console.log("✅ Fußnoten erfolgreich verschoben (bereinigte Version).");
}
