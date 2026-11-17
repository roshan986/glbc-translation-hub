/**
 * Greek New Testament Interlinear Service
 * Provides word-by-word Greek original lemmas, Strong's concordance numbers,
 * transliterations, morphological parsing, English glosses, and Textus Receptus verse text
 * for EVERY verse across all New Testament books.
 * Powered by Free Use Bible API (helloao.org) & GitHub Open Datasets with full offline caching.
 */

export interface GreekWord {
  pos: number;
  text: string;
  transliteration: string;
  strongs: string;
  parsing: string;
  parsingFull: string;
  gloss: string;
  kannadaHint?: string;
}

export interface GreekVerseData {
  verseNumber: number;
  greekTextusReceptus: string;
  words: GreekWord[];
}

// In-memory chapter cache
const chapterWordsCache: Record<string, Record<number, GreekWord[]>> = {};
let trBookCache: Record<string, string[][]> | null = null;

// Map canonical book names to helloao 3-letter code
const BOOK_CODE_MAP: Record<string, string> = {
  matthew: 'MAT',
  mark: 'MRK',
  luke: 'LUK',
  john: 'JHN',
  acts: 'ACT',
  romans: 'ROM',
  '1 corinthians': '1CO',
  '2 corinthians': '2CO',
  galatians: 'GAL',
  ephesians: 'EPH',
  philippians: 'PHP',
  colossians: 'COL',
  '1 thessalonians': '1TH',
  '2 thessalonians': '2TH',
  '1 timothy': '1TI',
  '2 timothy': '2TI',
  titus: 'TIT',
  philemon: 'PHM',
  hebrews: 'HEB',
  james: 'JAS',
  '1 peter': '1PE',
  '2 peter': '2PE',
  '1 john': '1JN',
  '2 john': '2JN',
  '3 john': '3JN',
  jude: 'JUD',
  revelation: 'REV'
};

const TR_BOOK_ABBREV_MAP: Record<string, string> = {
  matthew: 'mt',
  mark: 'mc',
  luke: 'lc',
  john: 'jo',
  acts: 'atos',
  romans: 'rm',
  '1 corinthians': '1co',
  '2 corinthians': '2co',
  galatians: 'gl',
  ephesians: 'ef',
  philippians: 'fp',
  colossians: 'cl',
  '1 thessalonians': '1ts',
  '2 thessalonians': '2ts',
  '1 timothy': '1tm',
  '2 timothy': '2tm',
  titus: 'tt',
  philemon: 'fm',
  hebrews: 'hb',
  james: 'tg',
  '1 peter': '1pe',
  '2 peter': '2pe',
  '1 john': '1jo',
  '2 john': '2jo',
  '3 john': '3jo',
  jude: 'jd',
  revelation: 'ap'
};

/**
 * Loads Textus Receptus Greek text for all books
 */
async function loadTextusReceptus(): Promise<Record<string, string[][]>> {
  if (trBookCache) return trBookCache;
  try {
    const res = await fetch('https://raw.githubusercontent.com/thiagobodruk/bible/master/json/grc_grctr.json');
    if (res.ok) {
      const data = await res.json();
      const map: Record<string, string[][]> = {};
      if (Array.isArray(data)) {
        for (const b of data) {
          if (b.abbrev && Array.isArray(b.chapters)) {
            map[b.abbrev.toLowerCase()] = b.chapters;
          }
        }
      }
      trBookCache = map;
      return map;
    }
  } catch (e) {
    console.warn('Failed to load online Greek Textus Receptus:', e);
  }
  return {};
}

/**
 * Fetches the complete word-by-word Greek interlinear data for a given chapter
 */
export async function loadChapterGreekInterlinear(
  bookName: string,
  chapter: number
): Promise<Record<number, GreekWord[]>> {
  const cleanBook = bookName.trim().toLowerCase();
  const bookCode = BOOK_CODE_MAP[cleanBook] || 'ROM';
  const cacheKey = `${bookCode}_${chapter}`;

  if (chapterWordsCache[cacheKey]) {
    return chapterWordsCache[cacheKey];
  }

  // Check sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const local = sessionStorage.getItem(`greek_interlinear_${cacheKey}`);
      if (local) {
        const parsed = JSON.parse(local);
        chapterWordsCache[cacheKey] = parsed;
        return parsed;
      }
    } catch (e) {}
  }

  try {
    const res = await fetch(`https://bible.helloao.org/api/d/bsb-interlinear/${bookCode}/${chapter}.json`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.chapter && Array.isArray(data.chapter.content)) {
        const verseMap: Record<number, GreekWord[]> = {};
        for (const item of data.chapter.content) {
          if (item && item.verse && Array.isArray(item.words)) {
            verseMap[item.verse] = item.words.map((w: any) => ({
              pos: w.pos || 0,
              text: w.text || '',
              transliteration: w.transliteration || '',
              strongs: w.strongs || '',
              parsing: w.parsing || '',
              parsingFull: w.parsingFull || '',
              gloss: w.gloss || ''
            }));
          }
        }
        chapterWordsCache[cacheKey] = verseMap;
        try {
          sessionStorage.setItem(`greek_interlinear_${cacheKey}`, JSON.stringify(verseMap));
        } catch (e) {}
        return verseMap;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch online Greek interlinear for chapter:', err);
  }

  return chapterWordsCache[cacheKey] || {};
}

/**
 * Returns full Greek TR text and word-by-word breakdown for an individual verse
 */
export async function getVerseGreekHelp(
  bookName: string,
  chapter: number,
  verseNumber: number
): Promise<GreekVerseData> {
  const chapterData = await loadChapterGreekInterlinear(bookName, chapter);
  const words = chapterData[verseNumber] || [];

  // Get full Greek TR verse text
  let greekTextusReceptus = '';
  try {
    const trData = await loadTextusReceptus();
    const abbrev = TR_BOOK_ABBREV_MAP[bookName.trim().toLowerCase()] || 'rm';
    const bookChapters = trData[abbrev];
    if (bookChapters && bookChapters[chapter - 1] && bookChapters[chapter - 1][verseNumber - 1]) {
      greekTextusReceptus = bookChapters[chapter - 1][verseNumber - 1];
    }
  } catch (e) {}

  // If words exist but TR text was missing, synthesize TR line
  if (!greekTextusReceptus && words.length > 0) {
    greekTextusReceptus = words.map((w) => w.text).join(' ');
  }

  return {
    verseNumber,
    greekTextusReceptus,
    words
  };
}
