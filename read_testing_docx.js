const fs = require('fs');
const path = require('path');
const JSZip = require('./web/node_modules/jszip');

async function main() {
  const buf = fs.readFileSync('Testing/testing.docx');
  const zip = await JSZip.loadAsync(buf);
  const docXml = await zip.file('word/document.xml').async('text');
  const relsXml = await zip.file('word/_rels/document.xml.rels').async('text');

  // Map rId to target
  const rels = {};
  const relRegex = /<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g;
  let rMatch;
  while ((rMatch = relRegex.exec(relsXml)) !== null) {
    rels[rMatch[1]] = rMatch[2];
  }

  // Extract images to Testing/extracted_latest/ (optional try-catch)
  const outDir = 'Testing/extracted_latest';
  try {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const mediaFiles = Object.keys(zip.files).filter(f => f.startsWith('word/media/'));
    console.log('Total media files found in docx:', mediaFiles.length);
    for (const m of mediaFiles) {
      const imgBuf = await zip.file(m).async('nodebuffer');
      const filename = path.basename(m);
      fs.writeFileSync(path.join(outDir, filename), imgBuf);
    }
  } catch (err) {
    console.log('Image extraction note (non-fatal):', err.message);
  }

  // Parse paragraphs
  const pRegex = /<w:p[\s>].*?<\/w:p>/gs;
  let match;
  let pIdx = 0;
  while ((match = pRegex.exec(docXml)) !== null) {
    pIdx++;
    const pXml = match[0];
    
    // Check for blip r:embed
    const blipMatches = pXml.match(/r:embed="([^"]+)"/g);
    let imgRef = '';
    if (blipMatches) {
      const targets = blipMatches.map(b => {
        const id = b.replace(/r:embed="|"/g, '');
        return id + ' -> ' + (rels[id] || 'unknown');
      });
      imgRef = ' [IMAGES: ' + targets.join(', ') + ']';
    }

    const tMatches = pXml.match(/<w:t[\s>].*?<\/w:t>/g);
    if (tMatches) {
      const line = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');
      if (line.trim()) {
        console.log(`P${pIdx}: ${line}${imgRef}`);
      } else if (imgRef) {
        console.log(`P${pIdx}:${imgRef}`);
      }
    } else if (imgRef) {
      console.log(`P${pIdx}:${imgRef}`);
    }
  }
}

main().catch(console.error);
