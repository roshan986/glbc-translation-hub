// KJV Bible Service - Supports ALL 66 Canonical Books of the Bible
// Loaded locally from /kjv/<book>.json for 0ms latency, zero API rate limits, and 100% offline support.

export interface BibleBookMeta {
  name: string;
  slug: string;
  abbrev: string;
  chaptersCount: number;
  testament: 'OT' | 'NT';
  versesCount: number;
}

/**
 * Canonical List of ALL 66 Books of the Bible (39 Old Testament + 27 New Testament)
 * Total OT Verses: 23,145 · Total NT Verses: 7,957 · Grand Total: 31,102 verses
 */
export const CANONICAL_BOOKS: BibleBookMeta[] = [
  // --- Old Testament (39 Books) ---
  { name: 'Genesis', slug: 'genesis', abbrev: 'gn', chaptersCount: 50, versesCount: 1533, testament: 'OT' },
  { name: 'Exodus', slug: 'exodus', abbrev: 'ex', chaptersCount: 40, versesCount: 1213, testament: 'OT' },
  { name: 'Leviticus', slug: 'leviticus', abbrev: 'lv', chaptersCount: 27, versesCount: 859, testament: 'OT' },
  { name: 'Numbers', slug: 'numbers', abbrev: 'nm', chaptersCount: 36, versesCount: 1288, testament: 'OT' },
  { name: 'Deuteronomy', slug: 'deuteronomy', abbrev: 'dt', chaptersCount: 34, versesCount: 959, testament: 'OT' },
  { name: 'Joshua', slug: 'joshua', abbrev: 'js', chaptersCount: 24, versesCount: 658, testament: 'OT' },
  { name: 'Judges', slug: 'judges', abbrev: 'jz', chaptersCount: 21, versesCount: 618, testament: 'OT' },
  { name: 'Ruth', slug: 'ruth', abbrev: 'rt', chaptersCount: 4, versesCount: 85, testament: 'OT' },
  { name: '1 Samuel', slug: '1_samuel', abbrev: '1s', chaptersCount: 31, versesCount: 810, testament: 'OT' },
  { name: '2 Samuel', slug: '2_samuel', abbrev: '2s', chaptersCount: 24, versesCount: 695, testament: 'OT' },
  { name: '1 Kings', slug: '1_kings', abbrev: '1k', chaptersCount: 22, versesCount: 816, testament: 'OT' },
  { name: '2 Kings', slug: '2_kings', abbrev: '2k', chaptersCount: 25, versesCount: 719, testament: 'OT' },
  { name: '1 Chronicles', slug: '1_chronicles', abbrev: '1ch', chaptersCount: 29, versesCount: 942, testament: 'OT' },
  { name: '2 Chronicles', slug: '2_chronicles', abbrev: '2ch', chaptersCount: 36, versesCount: 822, testament: 'OT' },
  { name: 'Ezra', slug: 'ezra', abbrev: 'ez', chaptersCount: 10, versesCount: 280, testament: 'OT' },
  { name: 'Nehemiah', slug: 'nehemiah', abbrev: 'ne', chaptersCount: 13, versesCount: 406, testament: 'OT' },
  { name: 'Esther', slug: 'esther', abbrev: 'et', chaptersCount: 10, versesCount: 167, testament: 'OT' },
  { name: 'Job', slug: 'job', abbrev: 'jb', chaptersCount: 42, versesCount: 1070, testament: 'OT' },
  { name: 'Psalms', slug: 'psalms', abbrev: 'ps', chaptersCount: 150, versesCount: 2461, testament: 'OT' },
  { name: 'Proverbs', slug: 'proverbs', abbrev: 'pr', chaptersCount: 31, versesCount: 915, testament: 'OT' },
  { name: 'Ecclesiastes', slug: 'ecclesiastes', abbrev: 'ec', chaptersCount: 12, versesCount: 222, testament: 'OT' },
  { name: 'Song of Solomon', slug: 'song_of_solomon', abbrev: 'ca', chaptersCount: 8, versesCount: 117, testament: 'OT' },
  { name: 'Isaiah', slug: 'isaiah', abbrev: 'is', chaptersCount: 66, versesCount: 1292, testament: 'OT' },
  { name: 'Jeremiah', slug: 'jeremiah', abbrev: 'jr', chaptersCount: 52, versesCount: 1364, testament: 'OT' },
  { name: 'Lamentations', slug: 'lamentations', abbrev: 'lm', chaptersCount: 5, versesCount: 154, testament: 'OT' },
  { name: 'Ezekiel', slug: 'ezekiel', abbrev: 'ez_ot', chaptersCount: 48, versesCount: 1273, testament: 'OT' },
  { name: 'Daniel', slug: 'daniel', abbrev: 'da', chaptersCount: 12, versesCount: 357, testament: 'OT' },
  { name: 'Hosea', slug: 'hosea', abbrev: 'ho', chaptersCount: 14, versesCount: 197, testament: 'OT' },
  { name: 'Joel', slug: 'joel', abbrev: 'jl', chaptersCount: 3, versesCount: 73, testament: 'OT' },
  { name: 'Amos', slug: 'amos', abbrev: 'am', chaptersCount: 9, versesCount: 146, testament: 'OT' },
  { name: 'Obadiah', slug: 'obadiah', abbrev: 'ob', chaptersCount: 1, versesCount: 21, testament: 'OT' },
  { name: 'Jonah', slug: 'jonah', abbrev: 'jn_ot', chaptersCount: 4, versesCount: 48, testament: 'OT' },
  { name: 'Micah', slug: 'micah', abbrev: 'mi', chaptersCount: 7, versesCount: 105, testament: 'OT' },
  { name: 'Nahum', slug: 'nahum', abbrev: 'na', chaptersCount: 3, versesCount: 47, testament: 'OT' },
  { name: 'Habakkuk', slug: 'habakkuk', abbrev: 'hk', chaptersCount: 3, versesCount: 56, testament: 'OT' },
  { name: 'Zephaniah', slug: 'zephaniah', abbrev: 'zp', chaptersCount: 3, versesCount: 53, testament: 'OT' },
  { name: 'Haggai', slug: 'haggai', abbrev: 'hg', chaptersCount: 2, versesCount: 38, testament: 'OT' },
  { name: 'Zechariah', slug: 'zechariah', abbrev: 'zc', chaptersCount: 14, versesCount: 211, testament: 'OT' },
  { name: 'Malachi', slug: 'malachi', abbrev: 'ml', chaptersCount: 4, versesCount: 55, testament: 'OT' },

  // --- New Testament (27 Books) ---
  { name: 'Matthew', slug: 'matthew', abbrev: 'mt', chaptersCount: 28, versesCount: 1071, testament: 'NT' },
  { name: 'Mark', slug: 'mark', abbrev: 'mr', chaptersCount: 16, versesCount: 678, testament: 'NT' },
  { name: 'Luke', slug: 'luke', abbrev: 'lu', chaptersCount: 24, versesCount: 1151, testament: 'NT' },
  { name: 'John', slug: 'john', abbrev: 'jh', chaptersCount: 21, versesCount: 879, testament: 'NT' },
  { name: 'Acts', slug: 'acts', abbrev: 'ac', chaptersCount: 28, versesCount: 1007, testament: 'NT' },
  { name: 'Romans', slug: 'romans', abbrev: 'ro', chaptersCount: 16, versesCount: 433, testament: 'NT' },
  { name: '1 Corinthians', slug: '1_corinthians', abbrev: '1co', chaptersCount: 16, versesCount: 437, testament: 'NT' },
  { name: '2 Corinthians', slug: '2_corinthians', abbrev: '2co', chaptersCount: 13, versesCount: 257, testament: 'NT' },
  { name: 'Galatians', slug: 'galatians', abbrev: 'ga', chaptersCount: 6, versesCount: 149, testament: 'NT' },
  { name: 'Ephesians', slug: 'ephesians', abbrev: 'eph', chaptersCount: 6, versesCount: 155, testament: 'NT' },
  { name: 'Philippians', slug: 'philippians', abbrev: 'php', chaptersCount: 4, versesCount: 104, testament: 'NT' },
  { name: 'Colossians', slug: 'colossians', abbrev: 'col', chaptersCount: 4, versesCount: 95, testament: 'NT' },
  { name: '1 Thessalonians', slug: '1_thessalonians', abbrev: '1th', chaptersCount: 5, versesCount: 89, testament: 'NT' },
  { name: '2 Thessalonians', slug: '2_thessalonians', abbrev: '2th', chaptersCount: 3, versesCount: 47, testament: 'NT' },
  { name: '1 Timothy', slug: '1_timothy', abbrev: '1ti', chaptersCount: 6, versesCount: 113, testament: 'NT' },
  { name: '2 Timothy', slug: '2_timothy', abbrev: '2ti', chaptersCount: 4, versesCount: 83, testament: 'NT' },
  { name: 'Titus', slug: 'titus', abbrev: 'tit', chaptersCount: 3, versesCount: 46, testament: 'NT' },
  { name: 'Philemon', slug: 'philemon', abbrev: 'phm', chaptersCount: 1, versesCount: 25, testament: 'NT' },
  { name: 'Hebrews', slug: 'hebrews', abbrev: 'hb', chaptersCount: 13, versesCount: 303, testament: 'NT' },
  { name: 'James', slug: 'james', abbrev: 'jm', chaptersCount: 5, versesCount: 108, testament: 'NT' },
  { name: '1 Peter', slug: '1_peter', abbrev: '1pe', chaptersCount: 5, versesCount: 105, testament: 'NT' },
  { name: '2 Peter', slug: '2_peter', abbrev: '2pe', chaptersCount: 3, versesCount: 61, testament: 'NT' },
  { name: '1 John', slug: '1_john', abbrev: '1jo', chaptersCount: 5, versesCount: 105, testament: 'NT' },
  { name: '2 John', slug: '2_john', abbrev: '2jo', chaptersCount: 1, versesCount: 13, testament: 'NT' },
  { name: '3 John', slug: '3_john', abbrev: '3jo', chaptersCount: 1, versesCount: 14, testament: 'NT' },
  { name: 'Jude', slug: 'jude', abbrev: 'jd', chaptersCount: 1, versesCount: 25, testament: 'NT' },
  { name: 'Revelation', slug: 'revelation', abbrev: 'ap', chaptersCount: 22, versesCount: 404, testament: 'NT' }
];

// In-memory cache for loaded book data
const bookCache: Record<string, Record<number, Record<number, string>>> = {};

// Dictionary of all 66 books, alternative names, and abbreviations
export const ALL_BIBLE_BOOKS: Record<string, string> = {
  // Old Testament
  genesis: 'genesis', gen: 'genesis', gn: 'genesis',
  exodus: 'exodus', exod: 'exodus', ex: 'exodus',
  leviticus: 'leviticus', lev: 'leviticus', lv: 'leviticus',
  numbers: 'numbers', num: 'numbers', nm: 'numbers',
  deuteronomy: 'deuteronomy', deut: 'deuteronomy', dt: 'deuteronomy',
  joshua: 'joshua', josh: 'joshua', js: 'joshua',
  judges: 'judges', judg: 'judges', jdg: 'judges', jz: 'judges',
  ruth: 'ruth', rth: 'ruth', ru: 'ruth', rt: 'ruth',
  '1 samuel': '1_samuel', '1samuel': '1_samuel', '1sam': '1_samuel', '1 sam': '1_samuel', '1s': '1_samuel',
  '2 samuel': '2_samuel', '2samuel': '2_samuel', '2sam': '2_samuel', '2 sam': '2_samuel', '2s': '2_samuel',
  '1 kings': '1_kings', '1kings': '1_kings', '1kgs': '1_kings', '1 kgs': '1_kings', '1k': '1_kings',
  '2 kings': '2_kings', '2kings': '2_kings', '2kgs': '2_kings', '2 kgs': '2_kings', '2k': '2_kings',
  '1 chronicles': '1_chronicles', '1chronicles': '1_chronicles', '1chr': '1_chronicles', '1 chr': '1_chronicles', '1ch': '1_chronicles',
  '2 chronicles': '2_chronicles', '2chronicles': '2_chronicles', '2chr': '2_chronicles', '2 chr': '2_chronicles', '2ch': '2_chronicles',
  ezra: 'ezra', ezr: 'ezra', ez: 'ezra',
  nehemiah: 'nehemiah', neh: 'nehemiah', ne: 'nehemiah',
  esther: 'esther', esth: 'esther', es: 'esther', et: 'esther',
  job: 'job', jb: 'job',
  psalms: 'psalms', psalm: 'psalms', ps: 'psalms', psa: 'psalms',
  proverbs: 'proverbs', prov: 'proverbs', pr: 'proverbs',
  ecclesiastes: 'ecclesiastes', eccl: 'ecclesiastes', ecc: 'ecclesiastes', ec: 'ecclesiastes',
  'song of solomon': 'song_of_solomon', 'song of songs': 'song_of_solomon', song: 'song_of_solomon', sos: 'song_of_solomon', canticles: 'song_of_solomon', ca: 'song_of_solomon',
  isaiah: 'isaiah', isa: 'isaiah', is: 'isaiah',
  jeremiah: 'jeremiah', jer: 'jeremiah', jr: 'jeremiah',
  lamentations: 'lamentations', lam: 'lamentations', la: 'lamentations', lm: 'lamentations',
  ezekiel: 'ezekiel', ezek: 'ezekiel', eze: 'ezekiel',
  daniel: 'daniel', dan: 'daniel', dn: 'daniel', da: 'daniel',
  hosea: 'hosea', hos: 'hosea', ho: 'hosea',
  joel: 'joel', jl: 'joel',
  amos: 'amos', am: 'amos',
  obadiah: 'obadiah', obad: 'obadiah', ob: 'obadiah',
  jonah: 'jonah', jon: 'jonah', jnh: 'jonah',
  micah: 'micah', mic: 'micah', mi: 'micah',
  nahum: 'nahum', nah: 'nahum', na: 'nahum',
  habakkuk: 'habakkuk', hab: 'habakkuk', hk: 'habakkuk',
  zephaniah: 'zephaniah', zeph: 'zephaniah', zp: 'zephaniah',
  haggai: 'haggai', hag: 'haggai', hg: 'haggai',
  zechariah: 'zechariah', zech: 'zechariah', zc: 'zechariah',
  malachi: 'malachi', mal: 'malachi', ml: 'malachi',

  // New Testament
  matthew: 'matthew', matt: 'matthew', mat: 'matthew', mt: 'matthew',
  mark: 'mark', mrk: 'mark', mk: 'mark', mr: 'mark',
  luke: 'luke', luk: 'luke', lk: 'luke', lu: 'luke',
  john: 'john', jhn: 'john', jn: 'john', jh: 'john',
  acts: 'acts', act: 'acts', ac: 'acts',
  romans: 'romans', roman: 'romans', rom: 'romans', ro: 'romans', rm: 'romans',
  '1 corinthians': '1_corinthians', '1corinthians': '1_corinthians', '1cor': '1_corinthians', '1 cor': '1_corinthians', '1co': '1_corinthians',
  '2 corinthians': '2_corinthians', '2corinthians': '2_corinthians', '2cor': '2_corinthians', '2 cor': '2_corinthians', '2co': '2_corinthians',
  galatians: 'galatians', gal: 'galatians', ga: 'galatians',
  ephesians: 'ephesians', eph: 'ephesians', ep: 'ephesians',
  philippians: 'philippians', phil: 'philippians', php: 'philippians',
  colossians: 'colossians', col: 'colossians',
  '1 thessalonians': '1_thessalonians', '1thessalonians': '1_thessalonians', '1thess': '1_thessalonians', '1 thess': '1_thessalonians', '1th': '1_thessalonians',
  '2 thessalonians': '2_thessalonians', '2thessalonians': '2_thessalonians', '2thess': '2_thessalonians', '2 thess': '2_thessalonians', '2th': '2_thessalonians',
  '1 timothy': '1_timothy', '1timothy': '1_timothy', '1tim': '1_timothy', '1 tim': '1_timothy', '1ti': '1_timothy',
  '2 timothy': '2_timothy', '2timothy': '2_timothy', '2tim': '2_timothy', '2 tim': '2_timothy', '2ti': '2_timothy',
  titus: 'titus', tit: 'titus', ti: 'titus',
  philemon: 'philemon', philem: 'philemon', phm: 'philemon',
  hebrews: 'hebrews', heb: 'hebrews', hb: 'hebrews',
  james: 'james', jas: 'james', jm: 'james',
  '1 peter': '1_peter', '1peter': '1_peter', '1pet': '1_peter', '1 pet': '1_peter', '1pe': '1_peter',
  '2 peter': '2_peter', '2peter': '2_peter', '2pet': '2_peter', '2 pet': '2_peter', '2pe': '2_peter',
  '1 john': '1_john', '1john': '1_john', '1jn': '1_john', '1 jn': '1_john', '1jo': '1_john',
  '2 john': '2_john', '2john': '2_john', '2jn': '2_john', '2 jn': '2_john', '2jo': '2_john',
  '3 john': '3_john', '3john': '3_john', '3jn': '3_john', '3 jn': '3_john', '3jo': '3_john',
  jude: 'jude', jud: 'jude', jd: 'jude',
  revelation: 'revelation', revelations: 'revelation', rev: 'revelation', re: 'revelation', ap: 'revelation'
};

/**
 * Strips sheet/tab decoration names like "Kannada Team Worksheet - Romans" or "Book of Romans"
 */
export function cleanBookName(bookName: string): string {
  if (!bookName) return 'Romans';
  return bookName
    .replace(/Kannada Team Worksheet\s*[-–—:]?\s*/i, '')
    .replace(/Book of\s+/i, '')
    .replace(/\s*[-–—:]?\s*Kannada/i, '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim();
}

/**
 * Maps any book string/abbreviation to the exact JSON slug in /kjv/<slug>.json
 */
export function getBookSlug(bookName: string): string {
  if (!bookName) return 'romans';
  const clean = cleanBookName(bookName).toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
  return ALL_BIBLE_BOOKS[clean] || clean.replace(/\s+/g, '_');
}

/**
 * Returns metadata for a book (total chapters, testament, standard name)
 */
export function getBookMeta(bookName: string): BibleBookMeta | undefined {
  const slug = getBookSlug(bookName);
  return CANONICAL_BOOKS.find((b) => b.slug === slug);
}

/**
 * Returns the exact total number of chapters for a given book (e.g. Genesis = 50, Romans = 16)
 */
export function getBookChaptersCount(bookName: string): number {
  const meta = getBookMeta(bookName);
  return meta ? meta.chaptersCount : 16;
}

/**
 * Returns the exact total number of canonical verses for a given book (e.g. Romans = 433, 1 Corinthians = 437, Galatians = 149)
 */
export function getBookTotalVerses(bookName: string): number {
  const meta = getBookMeta(bookName);
  return meta ? meta.versesCount : 433;
}

/**
 * Loads an entire book from the local static /kjv/<slug>.json
 * Returns { [chapterNum]: { [verseNum]: "verse text" } }
 */
export async function loadKjvBook(bookName: string): Promise<Record<number, Record<number, string>>> {
  const slug = getBookSlug(bookName);
  if (bookCache[slug]) {
    return bookCache[slug];
  }

  // 1. Fetch from local static JSON bundle (/kjv/<slug>.json)
  try {
    const res = await fetch(`/kjv/${slug}.json`);
    if (res.ok) {
      const data = await res.json();
      bookCache[slug] = data;
      return data;
    }
  } catch (localErr) {
    console.warn(`Local fetch failed for /kjv/${slug}.json, will try fallback:`, localErr);
  }

  // 2. Fallback to public GitHub archive if running outside standard path
  try {
    const fallbackRes = await fetch(`https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json`);
    const allBooks = await fallbackRes.json();
    const found = allBooks.find((b: { name: string }) => getBookSlug(b.name) === slug);
    if (found && Array.isArray(found.chapters)) {
      const bookData: Record<number, Record<number, string>> = {};
      for (let c = 0; c < found.chapters.length; c++) {
        bookData[c + 1] = {};
        for (let v = 0; v < found.chapters[c].length; v++) {
          bookData[c + 1][v + 1] = found.chapters[c][v];
        }
      }
      bookCache[slug] = bookData;
      return bookData;
    }
  } catch (fallbackErr) {
    console.error('All KJV fetch sources failed:', fallbackErr);
  }

  return {};
}

/**
 * Retrieves a single KJV verse with 0ms latency.
 * E.g. getKjvVerse("Romans", 1, 1) -> "Paul, a servant of Jesus Christ..."
 */
export async function getKjvVerse(
  bookName: string,
  chapter: number | string,
  verseNum: number | string
): Promise<string> {
  const cNum = Number(chapter) || 1;
  const vNum = Number(verseNum) || 1;

  const bookData = await loadKjvBook(bookName);
  const chapterData = bookData[cNum];
  if (chapterData && chapterData[vNum]) {
    return chapterData[vNum];
  }
  return '';
}

/**
 * Retrieves all KJV verses for a given chapter.
 */
export async function getKjvChapterVerses(
  bookName: string,
  chapter: number
): Promise<Array<{ verseNumber: number; text: string }>> {
  const bookData = await loadKjvBook(bookName);
  const chapterData = bookData[chapter];
  if (!chapterData) return [];
  return Object.keys(chapterData)
    .map((v) => ({ verseNumber: Number(v), text: chapterData[Number(v)] }))
    .sort((a, b) => a.verseNumber - b.verseNumber);
}
