import type { WordPair, InvestigationNote } from '../types';

export interface ParsedDrafterContent {
  wordPairs: WordPair[];
  notes: InvestigationNote[];
  totalNotesCount: number;
}

// Clean trailing empty breaks, whitespace, and empty spans from imported sheet text
export const trimReadingHtml = (html?: string): string => {
  if (!html) return '';
  return html
    .replace(/(?:<br\s*\/?>|\s|&nbsp;|<span[^>]*>\s*<\/span>)+$/gi, '')
    .replace(/^(?:<br\s*\/?>|\s|&nbsp;)+/gi, '')
    .trim();
};

export const trimReadingText = (text?: string): string => {
  if (!text) return '';
  return text.replace(/(?:\r\n|\r|\n|\s)+$/g, '').trim();
};

/**
 * Preprocesses lines by merging wrapped lines where a pipe '|' was placed at line break,
 * or where multiple Kannada sub-lines precede an English line.
 */
function preprocessLines(rawContent: string): string[] {
  const rawLines = rawContent
    .split(/<br\s*\/?>|\n/gi)
    .map((l) => l.trim())
    .filter(Boolean);

  const merged: string[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const cur = rawLines[i];
    const textOnly = cur.replace(/<[^>]+>/g, '').trim();
    const endsWithPipe = textOnly.endsWith('|');

    if (endsWithPipe && i + 1 < rawLines.length) {
      const next = rawLines[i + 1];
      const nextText = next.replace(/<[^>]+>/g, '').trim();
      const curHasKannada = /[\u0C80-\u0CFF]/.test(textOnly);
      const nextHasKannada = /[\u0C80-\u0CFF]/.test(nextText);

      // If both are Kannada, merge them across the wrapped line break
      if (curHasKannada && nextHasKannada) {
        merged.push(cur + ' ' + next);
        i++; // skip next line as it was merged
        continue;
      }
    }
    merged.push(cur);
  }
  return merged;
}

export function parseDrafterComments(rawContent: string): ParsedDrafterContent {
  if (!rawContent || !rawContent.trim()) {
    return { wordPairs: [], notes: [], totalNotesCount: 0 };
  }

  const rawLines = preprocessLines(rawContent);

  const wordPairs: WordPair[] = [];
  const notes: InvestigationNote[] = [];

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    const nextLine = rawLines[i + 1];

    // Strip HTML to analyze text semantics
    const textOnly = line.replace(/<[^>]+>/g, '').trim();
    const nextTextOnly = nextLine ? nextLine.replace(/<[^>]+>/g, '').trim() : '';

    const hasKannada = /[\u0C80-\u0CFF]/.test(textOnly);
    const nextIsEnglish =
      nextLine &&
      /[a-zA-Z]/.test(nextTextOnly) &&
      (!/[\u0C80-\u0CFF]/.test(nextTextOnly) ||
        (nextTextOnly.match(/[a-zA-Z]/g) || []).length > (nextTextOnly.match(/[\u0C80-\u0CFF]/g) || []).length);

    // Identify if this line is an investigation note rather than a back-translation pair
    const isNote =
      /were added|was omitted|omitted|added words|note|grammar|variant|reason|because|register|sandhi|manuscript/i.test(
        textOnly
      );

    if (isNote) {
      const lower = textOnly.toLowerCase();
      let type: InvestigationNote['type'] = 'grammar';
      let title = 'Drafter Additional Comment';

      if (lower.includes('variant') || lower.includes('manuscript') || lower.includes('kjv')) {
        type = 'variant';
        title = 'Textual Variant Note';
      } else if (lower.includes('grammar') || lower.includes('register') || lower.includes('sandhi')) {
        type = 'grammar';
        title = 'Grammar & Syntax Note';
      } else {
        type = 'lexical';
        title = 'Drafter Additional Comment';
      }

      notes.push({
        type,
        title,
        text: textOnly,
        html: line
      });
      i++;
    } else if (
      hasKannada &&
      nextLine &&
      nextIsEnglish &&
      !isNote &&
      !/were added|was omitted/i.test(nextTextOnly)
    ) {
      // It's a Kannada (top) / English (bottom) back-translation pair!
      const kannadaParts = line.split('|').map((s) => s.trim()).filter(Boolean);
      const englishParts = nextLine.split('|').map((s) => s.trim()).filter(Boolean);

      if (kannadaParts.length === englishParts.length && kannadaParts.length > 1) {
        for (let p = 0; p < kannadaParts.length; p++) {
          const kText = kannadaParts[p].replace(/<[^>]+>/g, '');
          const eText = englishParts[p].replace(/<[^>]+>/g, '');
          wordPairs.push({
            kannada: kText,
            english: eText,
            kannadaHtml: kannadaParts[p],
            englishHtml: englishParts[p]
          });
        }
      } else {
        const kText = line.replace(/<[^>]+>/g, '');
        const eText = nextLine.replace(/<[^>]+>/g, '');
        wordPairs.push({
          kannada: kText,
          english: eText,
          kannadaHtml: line,
          englishHtml: nextLine
        });
      }
      i += 2;
    } else {
      // Standalone comment or general note
      notes.push({
        type: 'grammar',
        title: 'Drafter Observation',
        text: textOnly,
        html: line
      });
      i++;
    }
  }

  const totalNotesCount = (wordPairs.length > 0 ? wordPairs.length : 0) + notes.length;

  return { wordPairs, notes, totalNotesCount };
}
