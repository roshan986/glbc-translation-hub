const fs = require('fs');
const JSZip = require('../web/node_modules/jszip');

async function inspectDocStructure() {
  const data = fs.readFileSync('Testing/testing.docx');
  const zip = await JSZip.loadAsync(data);
  const docXml = await zip.file('word/document.xml').async('string');
  const relsXml = await zip.file('word/_rels/document.xml.rels').async('string');
  console.log('--- RELS ---');
  console.log(relsXml);
  
  const pRegex = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g;
  let pMatch;
  let idx = 1;
  while ((pMatch = pRegex.exec(docXml)) !== null) {
    const p = pMatch[1];
    const hasImage = p.includes('drawing') || p.includes('graphic');
    const tMatch = p.match(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g) || [];
    const text = tMatch.map(t => t.replace(/<\/?w:t(?:\s[^>]*)?>/g, '')).join('');
    if (text || hasImage) {
      console.log(`Item ${idx}: text=[${text}] hasImage=${hasImage}`);
      if (hasImage) {
        const blipMatch = p.match(/r:embed="([^"]+)"/);
        if (blipMatch) console.log(`  -> image embed: ${blipMatch[1]}`);
      }
      idx++;
    }
  }
}
inspectDocStructure().catch(console.error);
