import type { WordPair, InvestigationNote } from '../types';

export interface ParsedDrafterContent {
  wordPairs: WordPair[];
  notes: InvestigationNote[];
  totalNotesCount: number;
}

// Clean trailing empty breaks, whitespace, and empty spans from imported sheet text
export const cleanDarkColorsFromHtml = (html?: string): string => {
  if (!html) return '';
  return html.replace(/<span([^>]*?)style=(["'])(.*?)\2([^>]*?)>/gi, (match, before, quote, styleStr, after) => {
    const styles = styleStr.split(';').map((s) => s.trim()).filter(Boolean);
    const filteredStyles = styles.filter((s) => {
      const parts = s.split(':');
      if (parts[0].trim().toLowerCase() === 'color') {
        const val = parts.slice(1).join(':').trim();
        const c = val.toLowerCase();
        if (
          c === '#000' ||
          c === '#000000' ||
          c === 'black' ||
          c === '#292f33' ||
          c === '#111827' ||
          c === '#1f2937' ||
          c === '#333333' ||
          c === '#374151' ||
          c === '#434343' ||
          c === '#4b5563' ||
          c === '#555555' ||
          c === '#666666'
        ) {
          return false;
        }
        const hexMatch = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
        if (hexMatch) {
          let hex = hexMatch[1];
          if (hex.length === 3) hex = hex.split('').map((x) => x + x).join('');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          const isNeutral = Math.abs(r - g) < 25 && Math.abs(g - b) < 25;
          if (lum < 0.35 && isNeutral) return false;
        }
      }
      return true;
    });

    if (filteredStyles.length === 0) {
      const restAttrs = (before + ' ' + after).trim();
      return restAttrs ? `<span ${restAttrs}>` : '<span>';
    }
    const newStyle = filteredStyles.join('; ');
    return `<span${before}style=${quote}${newStyle}${quote}${after}>`;
  });
};

export const trimReadingHtml = (html?: string): string => {
  if (!html) return '';
  const cleaned = cleanDarkColorsFromHtml(html);
  return cleaned
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
      /were added|was added|added word|added words|was omitted|were omitted|omitted|note|grammar|variant|reason|because|register|sandhi|manuscript/i.test(
        textOnly
      );

    if (isNote) {
      const lower = textOnly.toLowerCase();
      let type: InvestigationNote['type'] = 'lexical';
      let title = 'Drafter Comment';

      if (lower.includes('variant') || lower.includes('manuscript')) {
        type = 'variant';
        title = 'Textual Variant Note';
      } else if (lower.includes('grammar') || lower.includes('register') || lower.includes('sandhi')) {
        type = 'grammar';
        title = 'Grammar & Syntax Note';
      } else {
        type = 'lexical';
        title = 'Drafter Comment';
      }

      notes.push({
        type,
        title,
        text: textOnly,
        html: trimReadingHtml(line)
      });
      i++;
    } else if (
      hasKannada &&
      nextLine &&
      nextIsEnglish &&
      !isNote &&
      !/were added|was added|was omitted|were omitted/i.test(nextTextOnly)
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
            kannadaHtml: trimReadingHtml(kannadaParts[p]),
            englishHtml: trimReadingHtml(englishParts[p])
          });
        }
      } else {
        const kText = line.replace(/<[^>]+>/g, '');
        const eText = nextLine.replace(/<[^>]+>/g, '');
        wordPairs.push({
          kannada: kText,
          english: eText,
          kannadaHtml: trimReadingHtml(line),
          englishHtml: trimReadingHtml(nextLine)
        });
      }
      i += 2;
    } else {
      // Standalone comment or general note
      notes.push({
        type: 'lexical',
        title: 'Drafter Comment',
        text: textOnly,
        html: trimReadingHtml(line)
      });
      i++;
    }
  }

  const totalNotesCount = (wordPairs.length > 0 ? wordPairs.length : 0) + notes.length;

  return { wordPairs, notes, totalNotesCount };
}
