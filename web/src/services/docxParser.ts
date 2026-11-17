import JSZip from 'jszip';
import type { ParsedImportVerse, WordPair, InvestigationNote, VerseItem } from '../types';

/**
 * Standard Word XML highlight color map
 */
const HIGHLIGHT_COLOR_MAP: Record<string, string> = {
  yellow: '#eab308',
  green: '#16a34a',
  cyan: '#06b6d4',
  magenta: '#d946ef',
  blue: '#2563eb',
  red: '#dc2626',
  darkBlue: '#1d4ed8',
  darkCyan: '#0e7490',
  darkGreen: '#15803d',
  darkMagenta: '#a21caf',
  darkRed: '#b91c1c',
  darkYellow: '#a16207',
  lightGray: '#94a3b8'
};

interface TextRun {
  text: string;
  isBold: boolean;
  isItalic: boolean;
  color?: string;
  highlight?: string;
}

interface ParsedBlock {
  type: 'paragraph' | 'table';
  text: string;
  html: string;
  runs?: TextRun[];
  tableRows?: string[][];
}

/**
 * Parses a .docx File or ArrayBuffer into structured blocks
 */
export async function extractDocxBlocks(fileOrBuffer: File | ArrayBuffer): Promise<ParsedBlock[]> {
  const zip = await JSZip.loadAsync(fileOrBuffer);
  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    throw new Error('Not a valid Word document: word/document.xml is missing.');
  }

  const xmlText = await docFile.async('text');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  const body = xmlDoc.getElementsByTagName('w:body')[0];
  if (!body) return [];

  const blocks: ParsedBlock[] = [];

  for (let i = 0; i < body.childNodes.length; i++) {
    const node = body.childNodes[i];
    if (node.nodeType !== 1) continue;
    const el = node as Element;
    const tagName = el.localName || el.tagName;

    if (tagName === 'p') {
      const parsedP = parseParagraph(el);
      if (parsedP.text.trim()) {
        blocks.push(parsedP);
      }
    } else if (tagName === 'tbl') {
      const parsedTbl = parseTable(el);
      if (parsedTbl.text.trim()) {
        blocks.push(parsedTbl);
      }
    }
  }

  return blocks;
}

function parseParagraph(pEl: Element): ParsedBlock {
  const runs: TextRun[] = [];
  let fullText = '';
  let fullHtml = '';

  const rEls = pEl.getElementsByTagName('w:r');
  for (let j = 0; j < rEls.length; j++) {
    const rEl = rEls[j];
    const tEls = rEl.getElementsByTagName('w:t');
    let runText = '';
    for (let k = 0; k < tEls.length; k++) {
      runText += tEls[k].textContent || '';
    }
    if (!runText) continue;

    const rPr = rEl.getElementsByTagName('w:rPr')[0];
    let isBold = false;
    let isItalic = false;
    let color: string | undefined;
    let highlight: string | undefined;

    if (rPr) {
      if (rPr.getElementsByTagName('w:b').length > 0) isBold = true;
      if (rPr.getElementsByTagName('w:i').length > 0) isItalic = true;

      const colorEl = rPr.getElementsByTagName('w:color')[0];
      if (colorEl) {
        const val = colorEl.getAttribute('w:val');
        if (val && val !== 'auto' && val !== '000000') {
          color = val.startsWith('#') ? val : `#${val}`;
        }
      }

      const hlEl = rPr.getElementsByTagName('w:highlight')[0];
      if (hlEl) {
        const hVal = hlEl.getAttribute('w:val');
        if (hVal && HIGHLIGHT_COLOR_MAP[hVal]) {
          highlight = HIGHLIGHT_COLOR_MAP[hVal];
          // Highlight colors map to bold colored text as per Google Sheets rules
          isBold = true;
          if (!color) color = highlight;
        }
      }
    }

    runs.push({ text: runText, isBold, isItalic, color, highlight });
    fullText += runText;

    // Build HTML representation
    let spanStyle = '';
    if (color) spanStyle += `color: ${color};`;
    if (isBold) spanStyle += 'font-weight: 700;';
    if (isItalic) spanStyle += 'font-style: italic;';

    const escaped = escapeHtml(runText);
    if (spanStyle) {
      fullHtml += `<span style="${spanStyle}">${escaped}</span>`;
    } else {
      fullHtml += escaped;
    }
  }

  return {
    type: 'paragraph',
    text: fullText,
    html: fullHtml || escapeHtml(fullText),
    runs
  };
}

function parseTable(tblEl: Element): ParsedBlock {
  const tableRows: string[][] = [];
  let tableText = '';
  let tableHtml = '<div class="parsed-import-table"><table style="border-collapse: collapse; width: 100%; margin: 6px 0;">';

  const trEls = tblEl.getElementsByTagName('w:tr');
  for (let r = 0; r < trEls.length; r++) {
    const trEl = trEls[r];
    const rowCells: string[] = [];
    tableHtml += '<tr>';

    const tcEls = trEl.getElementsByTagName('w:tc');
    for (let c = 0; c < tcEls.length; c++) {
      const tcEl = tcEls[c];
      const pEls = tcEl.getElementsByTagName('w:p');
      let cellText = '';
      for (let p = 0; p < pEls.length; p++) {
        cellText += pEls[p].textContent || '';
      }
      rowCells.push(cellText.trim());
      tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 4px 8px; font-size: 0.8125rem;">${escapeHtml(cellText.trim())}</td>`;
    }
    tableRows.push(rowCells);
    tableText += rowCells.join(' | ') + '\n';
    tableHtml += '</tr>';
  }
  tableHtml += '</table></div>';

  return {
    type: 'table',
    text: tableText.trim(),
    html: tableHtml,
    tableRows
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Groups extracted blocks into individual verse entries and matches against sheet rows
 */
export function groupBlocksIntoVerses(
  blocks: ParsedBlock[],
  bookName: string,
  existingSheetVerses: VerseItem[]
): ParsedImportVerse[] {
  const verseResults: ParsedImportVerse[] = [];
  
  // Verse reference regex: Matches "Rom 1:1", "Romans 1:1", "1:1", "Verse 1:1", etc.
  const verseRefRegex = /^(?:verse\s+)?(?:([1-3]?\s*[A-Za-z]+)\s+)?(\d+)[:.](\d+)\b/i;

  interface RawVerseGroup {
    rawRef: string;
    chapter: number;
    verseNumber: number;
    blocks: ParsedBlock[];
  }

  const rawGroups: RawVerseGroup[] = [];
  let currentGroup: RawVerseGroup | null = null;

  for (const block of blocks) {
    const textTrim = block.text.trim();
    const match = textTrim.match(verseRefRegex);

    // If block starts with a verse header
    if (match && (textTrim.length < 35 || textTrim.toLowerCase().startsWith('verse'))) {
      const chap = parseInt(match[2], 10);
      const vNum = parseInt(match[3], 10);
      const cleanRef = `${bookName.slice(0, 3)} ${chap}:${vNum}`;

      currentGroup = {
        rawRef: cleanRef,
        chapter: chap,
        verseNumber: vNum,
        blocks: []
      };
      rawGroups.push(currentGroup);
    } else if (currentGroup) {
      currentGroup.blocks.push(block);
    }
  }

  // If no verse headers matched, attempt to parse blocks sequentially or check if the entire doc is 1 verse
  if (rawGroups.length === 0 && blocks.length > 0) {
    // Treat as current chapter verse 1 fallback or first verse of chapter
    rawGroups.push({
      rawRef: `${bookName.slice(0, 3)} 1:1`,
      chapter: 1,
      verseNumber: 1,
      blocks
    });
  }

  // Parse each group into Old Reading, Proposed Reading, and Drafter Comments
  for (const group of rawGroups) {
    let oldReading = '';
    let proposed = '';
    let proposedHtml = '';
    let drafterCmt = '';
    let drafterCmtHtml = '';
    const wordPairs: WordPair[] = [];
    const notes: InvestigationNote[] = [];

    let currentSection: 'old' | 'proposed' | 'comment' = 'proposed';

    for (const b of group.blocks) {
      const lower = b.text.toLowerCase().trim();

      if (lower.includes('old reading') || lower.includes('kjv:')) {
        currentSection = 'old';
        const cleaned = b.text.replace(/old reading\s*(?:\(kjv\))?\s*:?/i, '').trim();
        if (cleaned) oldReading += (oldReading ? ' ' : '') + cleaned;
        continue;
      } else if (lower.includes('proposed reading') || lower.includes('proposed:')) {
        currentSection = 'proposed';
        const cleaned = b.text.replace(/proposed reading\s*:?/i, '').trim();
        if (cleaned) {
          proposed += (proposed ? '\n' : '') + cleaned;
          proposedHtml += (proposedHtml ? '<br/>' : '') + b.html;
        }
        continue;
      } else if (lower.includes('drafter comments') || lower.includes('comments:') || lower.includes('investigation') || lower.includes('back-translation')) {
        currentSection = 'comment';
        const cleaned = b.text.replace(/(?:drafter comments|investigations?)\s*:?/i, '').trim();
        if (cleaned) {
          drafterCmt += (drafterCmt ? '\n\n' : '') + cleaned;
          drafterCmtHtml += (drafterCmtHtml ? '<br/><br/>' : '') + b.html;
        }
        continue;
      }

      if (b.type === 'table') {
        // Table in Drafter Comments (Standard 2-row back translation)
        if (b.tableRows && b.tableRows.length >= 2) {
          const row1 = b.tableRows[0];
          const row2 = b.tableRows[1];
          for (let col = 0; col < Math.min(row1.length, row2.length); col++) {
            const k = row1[col]?.trim();
            const e = row2[col]?.trim();
            if (k || e) {
              wordPairs.push({ kannada: k || '', english: e || '' });
            }
          }
        }
        drafterCmt += (drafterCmt ? '\n\n' : '') + b.text;
        drafterCmtHtml += (drafterCmtHtml ? '<br/>' : '') + b.html;
      } else {
        // Regular paragraph in current section
        if (currentSection === 'old') {
          oldReading += (oldReading ? ' ' : '') + b.text.trim();
        } else if (currentSection === 'proposed') {
          proposed += (proposed ? '\n' : '') + b.text.trim();
          proposedHtml += (proposedHtml ? '<br/>' : '') + b.html;
        } else {
          drafterCmt += (drafterCmt ? '\n\n' : '') + b.text.trim();
          drafterCmtHtml += (drafterCmtHtml ? '<br/><br/>' : '') + b.html;
        }
      }
    }

    // Match against existing sheet verses
    const normRef = group.rawRef.toLowerCase().replace(/\s+/g, '');
    const matchedSheetVerse = existingSheetVerses.find((sv) => {
      const svNorm = sv.verse.toLowerCase().replace(/\s+/g, '');
      return svNorm === normRef || (sv.chapter === group.chapter && sv.verseNumber === group.verseNumber);
    });

    let status: 'ready' | 'conflict' | 'unmatched' = 'ready';
    let existingRow: number | undefined;
    let existingProposed: string | undefined;

    if (!matchedSheetVerse) {
      status = 'unmatched';
    } else {
      existingRow = matchedSheetVerse.row;
      if (matchedSheetVerse.proposed && matchedSheetVerse.proposed.trim().length > 0) {
        status = 'conflict';
        existingProposed = matchedSheetVerse.proposed;
      } else {
        status = 'ready';
      }
    }

    verseResults.push({
      verse: matchedSheetVerse ? matchedSheetVerse.verse : group.rawRef,
      chapter: group.chapter,
      verseNumber: group.verseNumber,
      oldReading: oldReading || (matchedSheetVerse ? matchedSheetVerse.oldReading : ''),
      proposed: proposed.trim(),
      proposedHtml: proposedHtml || undefined,
      drafterCmt: drafterCmt.trim(),
      drafterCmtHtml: drafterCmtHtml || undefined,
      wordPairs: wordPairs.length > 0 ? wordPairs : undefined,
      notes: notes.length > 0 ? notes : undefined,
      status,
      existingRow,
      existingProposed,
      selectedForImport: status === 'ready'
    });
  }

  return verseResults;
}

/**
 * Parses raw pasted text into verse blocks (for quick paste workflow)
 */
export function parsePastedText(text: string, bookName: string, existingSheetVerses: VerseItem[]): ParsedImportVerse[] {
  const lines = text.split(/\r?\n/);
  const blocks: ParsedBlock[] = lines.map((l) => ({
    type: 'paragraph',
    text: l,
    html: escapeHtml(l)
  }));
  return groupBlocksIntoVerses(blocks, bookName, existingSheetVerses);
}
