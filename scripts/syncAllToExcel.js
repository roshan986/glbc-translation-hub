const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const excelPath = path.join(__dirname, '..', 'GLBC_Architecture_Upgrade_Plan.xlsx');
const excelUpdatedPath = path.join(__dirname, '..', 'GLBC_Architecture_Upgrade_Plan_updated.xlsx');
const wb = xlsx.readFile(excelPath);

// 1. Update Sheet 5: API & System Architecture
const ws5 = wb.Sheets['5. API & System Architecture'];
const s5Data = xlsx.utils.sheet_to_json(ws5, { header: 1 });

// Check if section already added
const hasFrontendSection = s5Data.some(r => r && r[1] && r[1].includes('Frontend Data Architecture'));
if (!hasFrontendSection) {
  s5Data.push([]);
  s5Data.push([null, 'Frontend Data Architecture: Tiered Progressive Loading (KJV & Lexical Engines)']);
  s5Data.push([]);
  s5Data.push([
    '',
    'Architecture Tier',
    'Service Module',
    'Data Source & Bundle Path',
    'Scope & Bible Content',
    'Performance & Payload',
    'UX Role & Status'
  ]);
  s5Data.push([
    '',
    'Tier 1: Fast Reading Engine',
    'kjvService.ts',
    'web/public/kjv/{slug}.json',
    'All 66 Canonical Books (Genesis to Revelation)',
    '~50 KB / book (Instant 5ms load, 0ms memory cache)',
    'Powers Focus Mode, unstarted Reference & Study Mode (e.g. 1 Cor), Drafter Portal, and template generator. ✅ Active.'
  ]);
  s5Data.push([
    '',
    'Tier 2A: Canonical Strong\'s Lexicon',
    'kjvStrongsService.ts',
    'web/public/kjv-strongs/{CODE}.json',
    '27 New Testament Books (Phrase-by-phrase KJV Strong\'s Greek G1-G5624)',
    '~1.5 MB / book (Cached offline via PWA CacheFirst)',
    'Powers Smart Assistant "Greek & KJV" tab in exact KJV sentence flow with authentic Greek lemmas, pronunciations, and roots. ✅ Active.'
  ]);
  s5Data.push([
    '',
    'Tier 2B: Comparative Interlinear & TR',
    'greekService.ts',
    'bible.helloao.org (BSB) + thiagobodruk/bible (TR 1550)',
    'Berean Standard Bible Greek Interlinear + Stephanus 1550 Textus Receptus',
    'On-demand REST API fetch with in-memory + sessionStorage caching',
    'Preserved and documented for future multi-version Smart Assistant comparative study. ⏳ Roadmap.'
  ]);
  wb.Sheets['5. API & System Architecture'] = xlsx.utils.aoa_to_sheet(s5Data);
}

// 2. Update Sheet 6: Implementation Roadmap
const wsRoadmap = wb.Sheets['6. Implementation Roadmap'];
const roadmapData = xlsx.utils.sheet_to_json(wsRoadmap, { header: 1 });

// Update summary in row 2
roadmapData[2][1] = 'Overall Progress: 25 / 31 (81% Done)';
roadmapData[2][3] = 'Phases 1, 2, 3 & 5: 25 / 25 Completed (100% ✅)';
roadmapData[2][5] = 'Phase 5 Ready for Testing! OT Strong\'s & Multi-Version Roadmap Scheduled 🎯';

// Check if Task 6.2 already exists
const hasTask62 = roadmapData.some(r => r && r[2] === '6.2');
if (!hasTask62) {
  roadmapData.push([
    '',
    'Phase 6 (Roadmap)',
    '6.2',
    'Multi-Version Smart Assistant Expansion (BSB & Textus Receptus)',
    'Activate greekService.ts in SmartAssistantDrawer.tsx by adding comparative version options ("BSB Berean Interlinear", "Stephanus 1550 Textus Receptus") to the Reference Version dropdown alongside canonical KJV.',
    'Frontend & API',
    '⏳ Scheduled (Roadmap)'
  ]);
  wb.Sheets['6. Implementation Roadmap'] = xlsx.utils.aoa_to_sheet(roadmapData);
}

// 3. Update Sheet 7: GitHub Repos & Libraries
const ws7 = wb.Sheets['7. GitHub Repos & Libraries'];
const s7Data = xlsx.utils.sheet_to_json(ws7, { header: 1 });

// Check if 1John419/kjs exists
const hasKjs = s7Data.some(r => r && r[2] && r[2].includes('1John419/kjs'));
if (!hasKjs) {
  s7Data.push([
    '',
    'Bible Concordance & Lexicon',
    '1John419/kjs\ngithub.com/1John419/kjs',
    'Authentic phrase-by-phrase King James Version Strong\'s Concordance dataset (G1-G5624 Greek & H1-H8674 Hebrew) with roots, lemmas, and pronunciations.',
    '• Exact word-for-word KJV flow alignment (\'unto\', \'separated\', \'Jesus Christ\')\n• Zero external API latency (0ms)\n• 100% offline PWA caching\n• Eliminates NA28/BSB modern text discrepancies'
  ]);
}

// Check if helloao exists
const hasHelloao = s7Data.some(r => r && r[2] && r[2].includes('helloao'));
if (!hasHelloao) {
  s7Data.push([
    '',
    'Comparative Greek Interlinear',
    'Free Use Bible API (helloao)\nbible.helloao.org',
    'Open REST API for Berean Standard Bible (BSB) word-by-word Greek interlinear with morphological tagging.',
    '• Integrated in greekService.ts\n• Preserved for future multi-version comparative study\n• Zero API key required'
  ]);
}

wb.Sheets['7. GitHub Repos & Libraries'] = xlsx.utils.aoa_to_sheet(s7Data);

// Try writing directly to original; if locked by Excel, write to updated file and retry
try {
  xlsx.writeFile(wb, excelPath);
  console.log('SUCCESS: Written directly to GLBC_Architecture_Upgrade_Plan.xlsx!');
} catch(err) {
  if (err.code === 'EBUSY') {
    xlsx.writeFile(wb, excelUpdatedPath);
    console.log('LOCKED: Original file is currently open in Excel. Successfully saved to GLBC_Architecture_Upgrade_Plan_updated.xlsx!');
  } else {
    throw err;
  }
}
