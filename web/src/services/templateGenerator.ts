import JSZip from 'jszip';
import { getKjvChapterVerses } from './kjvService';

/**
 * Generates an authentic Microsoft Word (.docx) document formatted for GLBC drafters
 * with official instructions, color code guide, and pre-populated KJV verses for the given chapter.
 */
export async function generateDrafterDocx(book: string, chapter: number): Promise<Blob> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // 3. word/_rels/document.xml.rels
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  // 4. word/styles.xml
  zip.file(
    'word/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:cs="Noto Sans Kannada"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="24"/>
        <w:color w:val="1E293B"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`
  );

  // Fetch KJV verses for this book and chapter
  const chapterVerses = await getKjvChapterVerses(book, chapter);
  const totalVerses = chapterVerses.length > 0 ? chapterVerses.length : 5;

  // Build document XML body
  let docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- TITLE -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="160"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="36"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>GLBC Drafter Translation Document</w:t>
      </w:r>
    </w:p>

    <!-- SUBTITLE -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:sz w:val="24"/>
          <w:color w:val="2563EB"/>
        </w:rPr>
        <w:t>${escapeXml(book)} — Chapter ${chapter}</w:t>
      </w:r>
    </w:p>

    <!-- INSTRUCTIONS BOX -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="120" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr>
        <w:t>GLBC OFFICIAL COLOR CODE GUIDELINES (Color_Code_Translation_Rules.pdf):</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:highlight w:val="yellow"/></w:rPr><w:t>YELLOW</w:t></w:r>
      <w:r><w:t> — English words omitted in Kannada are highlighted with yellow.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:highlight w:val="cyan"/></w:rPr><w:t>BLUE / TURQUOISE</w:t></w:r>
      <w:r><w:t> — Added words are highlighted with blue/turquoise in Kannada verse.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:highlight w:val="magenta"/></w:rPr><w:t>PINK</w:t></w:r>
      <w:r><w:t> — Corrected Kannada words are highlighted with pink in Proposed Reading.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:highlight w:val="lightGray"/></w:rPr><w:t>GREY</w:t></w:r>
      <w:r><w:t> — Italicized words in King James Bible highlighted with grey in Kannada &amp; English.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:highlight w:val="green"/></w:rPr><w:t>GREEN</w:t></w:r>
      <w:r><w:t> — Incorrect Kannada word to be highlighted with green.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="300"/></w:pPr>
      <w:r><w:t>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</w:t></w:r>
    </w:p>
`;

  // Add verse sections matching exact real drafter layout (image7 & image8 in testing.docx)
  for (let v = 1; v <= totalVerses; v++) {
    const verseObj = chapterVerses.find((cv: { verseNumber: number; text: string }) => cv.verseNumber === v);
    const kjvText = verseObj ? verseObj.text : '';
    const verseRef = `${book} ${chapter}:${v}`;

    docXml += `
    <!-- VERSE HEADER (e.g. Rom 11:1) -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="280" w:after="60"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="28"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>${escapeXml(verseRef)}</w:t>
      </w:r>
    </w:p>

    <!-- ENGLISH KJV VERSE TEXT -->
    <w:p>
      <w:pPr><w:spacing w:after="160"/></w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="22"/>
          <w:color w:val="334155"/>
        </w:rPr>
        <w:t>${escapeXml(kjvText)}</w:t>
      </w:r>
    </w:p>

    <!-- OLD READING (KJV) -->
    <w:p>
      <w:pPr><w:spacing w:after="60"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr>
        <w:t>Old Reading (KJV):</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="140"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:cs="Noto Sans Kannada"/><w:szCs w:val="24"/><w:color w:val="475569"/></w:rPr>
        <w:t>[ಇಲ್ಲಿ ಹಳೆಯ TBS ಕನ್ನಡ ವಾಕ್ಯವನ್ನು ನಮೂದಿಸಿ / Existing TBS Kannada text to be examined]</w:t>
      </w:r>
    </w:p>

    <!-- DRAFTER COMMENTS -->
    <w:p>
      <w:pPr><w:spacing w:after="60"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr>
        <w:t>Drafter Comments:</w:t>
      </w:r>
    </w:p>

    <!-- 2-ROW BACK TRANSLATION TABLE (Kannada on top, English below) -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="0F172A"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="0F172A"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="0F172A"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="0F172A"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        </w:tblBorders>
      </w:tblPr>
      <!-- Row 1: Kannada Clause (with highlights if any) -->
      <w:tr>
        <w:tc>
          <w:p><w:r><w:rPr><w:rFonts w:cs="Noto Sans Kannada"/><w:szCs w:val="24"/></w:rPr><w:t>ಕನ್ನಡ ವಾಕ್ಯ ಭಾಗ ೧</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:p><w:r><w:rPr><w:rFonts w:cs="Noto Sans Kannada"/><w:szCs w:val="24"/></w:rPr><w:t>ಕನ್ನಡ ವಾಕ್ಯ ಭಾಗ ೨</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
      <!-- Row 2: English Back-Translation / KJV Clause -->
      <w:tr>
        <w:tc>
          <w:p><w:r><w:rPr><w:sz w:val="20"/><w:color w:val="475569"/></w:rPr><w:t>English back-translation phrase 1</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:p><w:r><w:rPr><w:sz w:val="20"/><w:color w:val="475569"/></w:rPr><w:t>English back-translation phrase 2</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>

    <w:p>
      <w:pPr><w:spacing w:before="60" w:after="140"/></w:pPr>
      <w:r><w:rPr><w:i/><w:color w:val="64748B"/></w:rPr><w:t>[ಇಲ್ಲಿ ವಿವರಣಾತ್ಮಕ ಟಿಪ್ಪಣಿಗಳನ್ನು ಸೇರಿಸಿ / Add notes on omitted words (yellow), added words (blue), or syntax changes]</w:t></w:r>
    </w:p>

    <!-- PROPOSED READING -->
    <w:p>
      <w:pPr><w:spacing w:after="60"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr>
        <w:t>Proposed Reading:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="200"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:cs="Noto Sans Kannada"/><w:szCs w:val="24"/><w:color w:val="0F172A"/></w:rPr>
        <w:t>[ಪ್ರಸ್ತಾಪಿತ ನೂತನ ಕನ್ನಡ ಭಾಷಾಂತರ - ಬದಲಾಯಿಸಿದ ಪದಗಳಿಗೆ Pink highlight ಬಳಸಿ]</w:t>
      </w:r>
    </w:p>

    <!-- DIVIDER -->
    <w:p>
      <w:pPr><w:spacing w:after="240"/></w:pPr>
      <w:r><w:color w:val="CBD5E1"/><w:t>────────────────────────────────────────────────────────</w:t></w:r>
    </w:p>
`;
  }

  docXml += `
  </w:body>
</w:document>`;

  zip.file('word/document.xml', docXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Triggers instant browser download of the generated .docx file
 */
export async function downloadDrafterTemplate(book: string, chapter: number): Promise<void> {
  const blob = await generateDrafterDocx(book, chapter);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GLBC_Drafter_Template_${book}_Ch${chapter}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
