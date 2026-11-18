import JSZip from 'jszip';
import type { ParsedImportVerse, WordPair, InvestigationNote, VerseItem, RichTextRunPayload, RichTextSectionPayload } from '../types';

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
  tableRuns?: TextRun[][][];
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
        const vLower = (val || '').toLowerCase();
        const isDarkBodyColor = ['auto', '000000', '292f33', '111827', '1f2937', '333333', '434343', '555555'].includes(vLower);
        if (val && !isDarkBodyColor) {
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
  const tableRuns: TextRun[][][] = [];
  let tableText = '';
  let tableHtml = '<div class="parsed-import-table"><table style="border-collapse: collapse; width: 100%; margin: 6px 0;">';

  const trEls = tblEl.getElementsByTagName('w:tr');
  for (let r = 0; r < trEls.length; r++) {
    const trEl = trEls[r];
    const rowCells: string[] = [];
    const rowRuns: TextRun[][] = [];
    tableHtml += '<tr>';

    const tcEls = trEl.getElementsByTagName('w:tc');
    for (let c = 0; c < tcEls.length; c++) {
      const tcEl = tcEls[c];
      const pEls = tcEl.getElementsByTagName('w:p');
      let cellText = '';
      let cellHtml = '';
      const cellRuns: TextRun[] = [];

      for (let p = 0; p < pEls.length; p++) {
        const parsedP = parseParagraph(pEls[p]);
        if (cellText && parsedP.text) {
          cellText += ' ';
          cellHtml += ' ';
        }
        cellText += parsedP.text;
        cellHtml += parsedP.html;
        if (parsedP.runs) cellRuns.push(...parsedP.runs);
      }

      rowCells.push(cellText.trim());
      rowRuns.push(cellRuns);
      tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 4px 8px; font-size: 0.8125rem;">${cellHtml || escapeHtml(cellText.trim())}</td>`;
    }
    tableRows.push(rowCells);
    tableRuns.push(rowRuns);
    tableText += rowCells.join(' | ') + '\n';
    tableHtml += '</tr>';
  }
  tableHtml += '</table></div>';

  return {
    type: 'table',
    text: tableText.trim(),
    html: tableHtml,
    tableRows,
    tableRuns
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
    const oldReadingRuns: RichTextRunPayload[] = [];
    let proposed = '';
    let proposedHtml = '';
    const proposedRuns: RichTextRunPayload[] = [];
    let drafterCmt = '';
    let drafterCmtHtml = '';
    const drafterCmtRuns: RichTextRunPayload[] = [];
    const wordPairs: WordPair[] = [];
    const notes: InvestigationNote[] = [];

    let currentSection: 'old' | 'proposed' | 'comment' = 'proposed';

    const addParagraphRuns = (targetRuns: RichTextRunPayload[], b: ParsedBlock, skipChars = 0) => {
      if (b.runs && b.runs.length > 0) {
        let charsSkipped = 0;
        for (const r of b.runs) {
          if (charsSkipped + r.text.length <= skipChars) {
            charsSkipped += r.text.length;
            continue;
          } else if (charsSkipped < skipChars) {
            const needed = r.text.substring(skipChars - charsSkipped);
            charsSkipped = skipChars;
            if (needed) {
              targetRuns.push({
                text: needed,
                color: r.color || null,
                bold: r.isBold || false,
                italic: r.isItalic || false
              });
            }
          } else {
            targetRuns.push({
              text: r.text,
              color: r.color || null,
              bold: r.isBold || false,
              italic: r.isItalic || false
            });
          }
        }
      } else if (b.text) {
        const needed = b.text.substring(skipChars).trim();
        if (needed) {
          targetRuns.push({ text: needed, color: null, bold: false, italic: false });
        }
      }
    };

    for (const b of group.blocks) {
      const lower = b.text.toLowerCase().trim();

      if (lower.includes('old reading') || lower.includes('kjv:')) {
        currentSection = 'old';
        const match = b.text.match(/^(?:old reading\s*(?:\(kjv\))?\s*:?|kjv\s*:?)\s*/i);
        const skipLen = match ? match[0].length : 0;
        const cleaned = b.text.substring(skipLen).trim();
        if (cleaned) {
          if (oldReadingRuns.length > 0) {
            oldReadingRuns.push({ text: ' ', color: null, bold: false, italic: false });
          }
          addParagraphRuns(oldReadingRuns, b, skipLen);
        }
        continue;
      } else if (lower.includes('proposed reading') || lower.includes('proposed:')) {
        currentSection = 'proposed';
        const match = b.text.match(/^(?:proposed reading\s*:?|proposed\s*:?)\s*/i);
        const skipLen = match ? match[0].length : 0;
        const cleaned = b.text.substring(skipLen).trim();
        if (cleaned) {
          if (proposedRuns.length > 0) {
            proposedRuns.push({ text: '\n', color: null, bold: false, italic: false });
          }
          addParagraphRuns(proposedRuns, b, skipLen);
          proposedHtml += (proposedHtml ? '<br/>' : '') + b.html;
        }
        continue;
      } else if (lower.includes('drafter comments') || lower.includes('comments:') || lower.includes('investigation') || lower.includes('back-translation')) {
        currentSection = 'comment';
        const match = b.text.match(/^(?:drafter comments\s*:?|comments\s*:?|investigations?\s*:?|back-translation\s*:?)\s*/i);
        const skipLen = match ? match[0].length : 0;
        const cleaned = b.text.substring(skipLen).trim();
        if (cleaned) {
          if (drafterCmtRuns.length > 0) {
            drafterCmtRuns.push({ text: '\n\n', color: null, bold: false, italic: false });
          }
          addParagraphRuns(drafterCmtRuns, b, skipLen);
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
        if (drafterCmtRuns.length > 0) {
          drafterCmtRuns.push({ text: '\n\n', color: null, bold: false, italic: false });
        }
        drafterCmtHtml += (drafterCmtHtml ? '<br/>' : '') + b.html;

        // Add table runs with ' | ' delimiters exactly matching Google Sheets menu
        if (b.tableRuns && b.tableRuns.length > 0) {
          for (let r = 0; r < b.tableRuns.length; r++) {
            const rowRun = b.tableRuns[r];
            for (let c = 0; c < rowRun.length; c++) {
              const cellRuns = rowRun[c];
              for (const cr of cellRuns) {
                drafterCmtRuns.push({
                  text: cr.text,
                  color: cr.color || null,
                  bold: cr.isBold || false,
                  italic: cr.isItalic || false
                });
              }
              if (c < rowRun.length - 1) {
                drafterCmtRuns.push({ text: ' | ', color: null, bold: false, italic: false });
              }
            }
            if (r < b.tableRuns.length - 1) {
              drafterCmtRuns.push({ text: '\n', color: null, bold: false, italic: false });
            }
          }
        } else {
          drafterCmtRuns.push({ text: b.text, color: null, bold: false, italic: false });
        }
      } else {
        // Regular paragraph in current section
        if (currentSection === 'old') {
          if (oldReadingRuns.length > 0) {
            oldReadingRuns.push({ text: ' ', color: null, bold: false, italic: false });
          }
          addParagraphRuns(oldReadingRuns, b);
        } else if (currentSection === 'proposed') {
          if (proposedRuns.length > 0) {
            proposedRuns.push({ text: '\n', color: null, bold: false, italic: false });
          }
          proposedHtml += (proposedHtml ? '<br/>' : '') + b.html;
          addParagraphRuns(proposedRuns, b);
        } else {
          if (drafterCmtRuns.length > 0) {
            drafterCmtRuns.push({ text: '\n\n', color: null, bold: false, italic: false });
          }
          drafterCmtHtml += (drafterCmtHtml ? '<br/><br/>' : '') + b.html;
          addParagraphRuns(drafterCmtRuns, b);
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

    const proposedText = proposedRuns.map((r) => r.text).join('').trim();
    const drafterCmtText = drafterCmtRuns.map((r) => r.text).join('').trim();
    const oldReadingText = oldReadingRuns.map((r) => r.text).join('').trim();

    const proposedSection: RichTextSectionPayload = {
      text: proposedText,
      runs: proposedRuns
    };
    const drafterCmtSection: RichTextSectionPayload = {
      text: drafterCmtText,
      runs: drafterCmtRuns
    };
    const oldReadingSection: RichTextSectionPayload = {
      text: oldReadingText,
      runs: oldReadingRuns
    };

    verseResults.push({
      verse: matchedSheetVerse ? matchedSheetVerse.verse : group.rawRef,
      chapter: group.chapter,
      verseNumber: group.verseNumber,
      oldReading: oldReadingText || (matchedSheetVerse ? matchedSheetVerse.oldReading : ''),
      oldReadingSection,
      proposed: proposedText,
      proposedHtml: proposedHtml || undefined,
      proposedSection,
      drafterCmt: drafterCmtText,
      drafterCmtHtml: drafterCmtHtml || undefined,
      drafterCmtSection,
      wordPairs: wordPairs.length > 0 ? wordPairs : undefined,
      notes: notes.length > 0 ? notes : undefined,
      status,
      existingRow,
      existingProposed,
      selectedForImport: status === 'ready' || status === 'unmatched'
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
