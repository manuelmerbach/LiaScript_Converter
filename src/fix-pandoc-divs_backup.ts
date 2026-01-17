import * as fs from "fs";

/**
 * - Verarbeitet <div class="..."> Tags
 * - Unterstützt beliebige Verschachtelung
 */

interface DivBlockInfo {
  fullMatch: string;
  type: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Liest Markdown-Datei, korrigiert Div-Blöcke und schreibt Ergebnis
 * 
 * @param inputPath Pfad zur Eingabe-Markdown-Datei
 * @param outputPath Pfad zur Ausgabe-Datei
 * @param mode Konvertierungsmodus ('blockquote' oder 'plain')
 */
export function fixDivs(
  inputPath: string,
  outputPath: string,
  mode: 'blockquote' | 'plain' = 'plain'
): void {
  const content = fs.readFileSync(inputPath, "utf-8");
  const fixed = fixPandocDivBlocks(content, mode);
  fs.writeFileSync(outputPath, fixed, "utf-8");
}

/**
 * Fügt bei <div class="KommLitItem"> margin hinzu, um einen Abstand ober- und unterhalb zu erzielen
 */
function fixKommLitItemDiv(markdown: string): string {
  return markdown.replace(
    /<div\s+class="KommLitItem">/g,
    `<div class="KommLitItem" style="margin: 1.5em 0;">`
  );
}

/**
 * Findet die äußerste Ebene von (nicht verschachtelten) <div> Blöcken
 */
function findTopLevelDivBlocks(markdown: string): DivBlockInfo[] {
  const lines = markdown.split('\n');
  const blocks: DivBlockInfo[] = [];

  let depth = 0;
  let currentBlock: {
    type: string;
    startIndex: number;
    contentLines: string[];
  } | null = null;

  let charIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Prüfe auf öffnende <div class="..."> Tags
    const openMatch = trimmed.match(/<div\s+class="([^"]+)">/i);

    if (openMatch) {
      depth++;

      // Nur den äußersten Block erfassen
      if (depth === 1) {
        const className = openMatch[1]?.trim() || 'text';

        currentBlock = {
          type: className,
          startIndex: charIndex,
          contentLines: []
        };
      } else if (currentBlock) {
        // Innerer Block → Inhalt speichern
        currentBlock.contentLines.push(line);
      }
    }

    // Prüfe auf schließende </div>
    else if (trimmed === '</div>' && depth > 0) {
      depth--;

      if (depth === 0 && currentBlock) {
        // Block fertig
        const content = currentBlock.contentLines.join('\n');
        const endIndex = charIndex + line.length;

        blocks.push({
          fullMatch: markdown.slice(currentBlock.startIndex, endIndex + 1),
          type: currentBlock.type,
          content,
          startIndex: currentBlock.startIndex,
          endIndex: endIndex + 1
        });

        currentBlock = null;
      } else if (currentBlock) {
        // inneres </div>
        currentBlock.contentLines.push(line);
      }
    }

    // normaler Inhalt
    else if (currentBlock) {
      currentBlock.contentLines.push(line);
    }

    charIndex += line.length + 1;
  }

  return blocks;
}

/**
 * Mapping der bekannten Typen auf Titel (mit Emoji)
 */
const BLOCK_TYPE_LABELS: { [key: string]: string } = {
  'hinweis': 'Hinweis ⚠️',
  'sprachvgl': 'Sprachvergleich 🗣️',
  'experten': 'Expertenwissen 🧠',
  'exkurs': 'Exkurs ⛕',
  'definitionskasten': 'Definition 📓'
};

/**
 * Typen, die zu Blockquote ohne Überschrift werden
 */
const BLOCKQUOTE_WITHOUT_LABEL = [
  'universalkasten',
  'tcolorbox',
  'autorenkasten',
  'picture'
];

/**
 * Typen, die als Blockquote MIT Label dargestellt werden
 */
const SPECIAL_BLOCK_TYPES = [
  'hinweis',
  'sprachvgl',
  'experten',
  'exkurs',
  'definitionskasten'
];

/**
 * Typen, die als Codeblock dargestellt werden
 */
const CODE_BLOCK_TYPES = [
  'codekurz',
  'ausgabe',
  'eingabe',
  'synkurz'
];

/**
 * Liste ALLER bekannten Div-Typen (wird verarbeitet)
 */
const ALL_KNOWN_DIV_TYPES = [
  ...BLOCKQUOTE_WITHOUT_LABEL,
  ...SPECIAL_BLOCK_TYPES,
  ...CODE_BLOCK_TYPES,
];

/**
 * Fügt nach </span> automatisch Leerzeilen ein
 */
function fixSpanTags(content: string): string {
  return content.replace(/<\/span>\s*\n/g, '</span>\n\n');
}

/**
 * Konvertiert einen bekannten Div-Block in Markdown
 */
function convertDivBlock(
  block: DivBlockInfo,
  conversionMode: 'blockquote' | 'plain' = 'blockquote'
): string {
  const blockTypeLower = block.type.toLowerCase();
  let trimmed = block.content.trim();

  // Für spezielle Blocks: zusätzliche Formatierung
  if (SPECIAL_BLOCK_TYPES.includes(blockTypeLower)) {
    trimmed = fixSpanTags(trimmed);
  }

  // → Codeblocks
  if (CODE_BLOCK_TYPES.includes(blockTypeLower)) {
    return `\`\`\`\n${trimmed}\n\`\`\`\n`;
  }

  // → Blockquote ohne Label
  if (BLOCKQUOTE_WITHOUT_LABEL.includes(blockTypeLower)) {
    const quoted = trimmed
      .split('\n')
      .map(line => (line.trim() === '' ? '>' : `> ${line}`))
      .join('\n');
    return `${quoted}\n\n`;
  }

  // → Spezialfall Definitionskasten
  if (blockTypeLower === 'definitionskasten') {
    const label = BLOCK_TYPE_LABELS[blockTypeLower] || blockTypeLower;

    const lines = trimmed.split('\n');
    let firstFound = false;

    const quoted = lines
      .map(line => {
        if (line.trim() === '') return '>';

        if (!firstFound) {
          firstFound = true;
          return `>> ${line}`;
        }

        return `> ${line}`;
      })
      .join('\n');

    return `> **${label}**\n>\n${quoted}\n\n`;
  }

  // → normale Blöcke mit Label
  if (SPECIAL_BLOCK_TYPES.includes(blockTypeLower)) {
    const label = BLOCK_TYPE_LABELS[blockTypeLower] || blockTypeLower;
    const quoted = trimmed
      .split('\n')
      .map(line => (line.trim() === '' ? '>' : `> ${line}`))
      .join('\n');

    return `> **${label}**\n>\n${quoted}\n\n`;
  }

  // → fallback
  if (conversionMode === 'blockquote') {
    const quoted = trimmed
      .split('\n')
      .map(line => (line.trim() === '' ? '>' : `> ${line}`))
      .join('\n');
    return `${quoted}\n\n`;
  }

  return `${trimmed}\n\n`;
}

/**
 * Hauptfunktion zum Umwandeln von Div-Blöcken
 */
export function fixPandocDivBlocks(
  markdown: string,
  mode: 'blockquote' | 'plain' = 'plain'
): string {

  markdown = fixKommLitItemDiv(markdown);

  const blocks = findTopLevelDivBlocks(markdown);

  if (blocks.length === 0) return markdown;

  let result = markdown;

  // Von hinten nach vorne ersetzen
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (!block) continue;

    const blockTypeLower = block.type.toLowerCase();

    // Nur bekannte Div-Typen → verarbeiten
    if (!ALL_KNOWN_DIV_TYPES.includes(blockTypeLower)) {
      // Unbekannter Typ → komplett ignorieren (nicht rekursiv)
      continue;
    }

    // Rekursiv verarbeiten, aber NUR innerhalb bekannter Divs
    const processedContent = fixPandocDivBlocks(block.content, mode);

    const converted = convertDivBlock(
      { ...block, content: processedContent },
      mode
    );

    // Block ersetzen
    result =
      result.substring(0, block.startIndex) +
      converted +
      result.substring(block.endIndex);
  }

  return result;
}
