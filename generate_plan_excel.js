const ExcelJS = require('exceljs');
const path = require('path');

async function createPlanWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GLBC Architect & Antigravity AI';
  workbook.created = new Date();
  workbook.properties.date1904 = false;

  // Colors
  const NAVY = '1E293B';      // Dark Slate / Navy for primary headers
  const TEAL = '0F766E';      // Teal for accents
  const BLUE_HEADER = '1E40AF';// Blue for secondary headers
  const LIGHT_BLUE = 'EFF6FF';
  const LIGHT_GRAY = 'F8FAFC';
  const BORDER_GRAY = 'CBD5E1';
  const WHITE = 'FFFFFF';
  const GREEN_BG = 'DCFCE7';
  const GREEN_TXT = '166534';
  const AMBER_BG = 'FEF3C7';
  const AMBER_TXT = '92400E';

  const fontHeader = { name: 'Segoe UI', size: 11, bold: true, color: { argb: WHITE } };
  const fontTitle = { name: 'Segoe UI', size: 16, bold: true, color: { argb: NAVY } };
  const fontSubtitle = { name: 'Segoe UI', size: 11, italic: true, color: { argb: '64748B' } };
  const fontBody = { name: 'Segoe UI', size: 10 };
  const fontBold = { name: 'Segoe UI', size: 10, bold: true };

  const borderThin = {
    top: { style: 'thin', color: { argb: BORDER_GRAY } },
    left: { style: 'thin', color: { argb: BORDER_GRAY } },
    bottom: { style: 'thin', color: { argb: BORDER_GRAY } },
    right: { style: 'thin', color: { argb: BORDER_GRAY } }
  };

  function applyHeaderStyle(row, bgColor = NAVY) {
    row.height = 28;
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.font = fontHeader;
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = borderThin;
    });
  }

  // =========================================================================
  // 1. EXECUTIVE SUMMARY & VISION
  // =========================================================================
  const ws1 = workbook.addWorksheet('1. Executive Overview', {
    views: [{ showGridLines: true }]
  });

  ws1.columns = [
    { width: 4 },
    { width: 28 },
    { width: 55 },
    { width: 45 }
  ];

  ws1.mergeCells('B2:D2');
  ws1.getCell('B2').value = 'GLBC Bible Translation System — Modernization Architecture Plan';
  ws1.getCell('B2').font = fontTitle;

  ws1.mergeCells('B3:D3');
  ws1.getCell('B3').value = 'Strategic Transition: Decoupling Editorial UX from Google Sheets Backend Database';
  ws1.getCell('B3').font = fontSubtitle;

  const execRows = [
    ['Executive Summary', 'Core Problem', 'Reviewers (Pastors, Scholars, Linguists) have completely halted reviews. Drafters continue to submit work, but the 18-column Google Sheet causes severe fatigue: heavy horizontal scrolling, poor Kannada mobile rendering, no task queue, and lack of visual progress.'],
    ['', 'The Solution', 'Retain Google Sheets as the 100% Free Database & Source of Truth. Layer a lightning-fast, mobile-first Web App (Vite + React + Tailwind) on top, offering a single-verse "Zen Focus Mode", personal task inboxes, and live bottleneck analytics.'],
    ['', 'Core Objective', '1) Zero reviewer drop-off; 2) 3x faster turnaround per chapter; 3) Frictionless mobile reviewing; 4) $0 monthly infrastructure cost (Vercel + Cloudflare + Google Sheets API); 5) Enterprise-grade showcase model for other regional language translation teams.'],
    ['Architecture Pillars', 'Pillar 1: Google Sheets as Headless DB', 'Google Sheets remains the master repository. All existing columns (A-R), formulas, history, config, and sharing controls remain intact. Admins can audit or export anytime.'],
    ['', 'Pillar 2: "Zen Mode" Review Interface', 'Reviewers never see 18 columns. They see ONE verse at a time on desktop or phone. Side-by-side Old KJV vs Proposed reading with color-coded back-translation notes and a 1-click [Approve / Suggest Edit] action.'],
    ['', 'Pillar 3: Personal Task Inboxes', 'Upon login, a reviewer immediately sees: "You have 8 verses waiting for your Theological Review in Romans 1". Eliminates manual row hunting.'],
    ['', 'Pillar 4: Live Bottleneck & Velocity Analytics', 'Visual stage funnels and burn-down charts identify where verses stall (e.g. "Ortho Review has 14 verses waiting > 4 days"), with instant WhatsApp nudge triggers.'],
    ['', 'Pillar 5: PWA & Offline-First Speed', 'Reviewers can tap "Add to Home Screen" on iOS/Android. Instant loading (<500ms), optimistic UI updates, and native Kannada typography (Noto Sans Kannada).'],
    ['Cost & Deployment', 'Hosting & Infrastructure Cost', '$0 / month. Frontend hosted on Vercel or Cloudflare Pages (Free Tier). Backend on existing Google Sheets via Apps Script Web App JSON API or Sheets API v4.'],
    ['', 'Target Audience & Adoption', 'Reviewers (Theological, Style, Orthographic, Technical), Committee Members, Final Editors, Drafters, and Project Coordinators. Built to be recommended to other translation bodies.']
  ];

  let rIdx = 5;
  ws1.getRow(rIdx).values = ['', 'Section / Category', 'Key Principle / Finding', 'Architecture Details & Strategy'];
  applyHeaderStyle(ws1.getRow(rIdx), NAVY);
  rIdx++;

  execRows.forEach(([cat, title, desc]) => {
    const row = ws1.getRow(rIdx);
    row.values = ['', cat, title, desc];
    row.height = 36;
    row.getCell(2).font = fontBold;
    row.getCell(2).alignment = { vertical: 'top', wrapText: true };
    row.getCell(3).font = fontBold;
    row.getCell(3).alignment = { vertical: 'top', wrapText: true };
    row.getCell(4).font = fontBody;
    row.getCell(4).alignment = { vertical: 'top', wrapText: true };
    for (let c = 2; c <= 4; c++) row.getCell(c).border = borderThin;
    rIdx++;
  });

  // =========================================================================
  // 2. FEATURE RESPONSIBILITY MATRIX (SHEETS VS FRONTEND)
  // =========================================================================
  const ws2 = workbook.addWorksheet('2. Feature Matrix', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }]
  });

  ws2.columns = [
    { width: 4 },
    { width: 22 }, // Category
    { width: 28 }, // Feature Name
    { width: 20 }, // Location / Tier
    { width: 35 }, // Current State (Google Sheet)
    { width: 45 }, // Proposed State (Modern Web Frontend)
    { width: 35 }, // Architectural Justification
    { width: 16 }  // User Experience Impact
  ];

  ws2.mergeCells('B2:H2');
  ws2.getCell('B2').value = 'System Feature Matrix: Boundary Definition (Sheets vs Frontend)';
  ws2.getCell('B2').font = fontTitle;

  const matrixHeaders = ['', 'Domain / Category', 'Feature / Workflow', 'Execution Location', 'Current State (Google Sheets Script v3.2)', 'Upgraded State (Modern Web App)', 'Why This Split? (Architectural Justification)', 'UX / Reviewer Impact'];
  ws2.getRow(4).values = matrixHeaders;
  applyHeaderStyle(ws2.getRow(4), NAVY);

  const matrixData = [
    ['Data Storage', 'Single Source of Truth', 'Google Sheets (Backend)', 'All 18 columns stored in book sheets (Romans, etc.)', 'Remains 100% in Google Sheets. UI reads & writes via JSON API.', 'Prevents migration risk. Client retains full spreadsheet ownership, easy backup & manual export.', 'High Trust'],
    ['User Management', 'Team Directory & Roles', 'Google Sheets (Backend)', 'Managed in "⚙ Config" sheet (Name, Role, Phone, Email, Active)', 'Maintained in "⚙ Config". Frontend fetches active members & permissions on boot.', 'No external SQL/Auth DB required. Coordinator edits members in familiar Sheets UI.', 'Low Friction'],
    ['Access Control', 'Cell & Column Protections', 'Hybrid (Synced)', 'Column protections applied via native Sheets permissions mapped to emails', 'Sheets retains backend column locks. Frontend enforces role-based view & edit permissions in UI.', 'Defense in depth: Sheet is safe if opened directly; Frontend provides zero-clutter role views.', 'High Security'],
    ['Reviewer Experience', 'Verse Reading & Review', 'Frontend Web App (UI)', 'Reviewer scrolls through Col G-N, reads tiny cells, inputs Y/N', 'Zen Focus Mode: 1 verse at a time. Clean split-view, large Kannada font, Old vs Proposed comparison.', 'Eliminates 18-column cognitive overload. Allows full concentration on linguistic precision.', 'Game Changer ⭐'],
    ['Reviewer Experience', 'One-Click Confirmation', 'Frontend Web App (UI)', 'Reviewer must click cell, open dropdown, pick "Y", tab away', 'Single tap on "[ ✅ Approve ]" or "[ 💬 Request Edit ]". Instant optimistic advance to next verse.', 'Reduces 5 clicks & 10 seconds of friction per verse down to 1 tap.', 'Massive Velocity'],
    ['Reviewer Experience', 'Mobile & Tablet Usability', 'Frontend Web App (UI)', 'Unusable. Multi-line Kannada text truncates. Sheet app is sluggish.', 'PWA (Progressive Web App). Responsive, installable on mobile home screen, offline cache.', 'Enables reviewers to review anywhere (bus, bed, waiting room) without needing a laptop.', 'Core Adoption Fix ⭐'],
    ['Task Management', 'Personal "Pending Tasks" Queue', 'Frontend Web App (UI)', 'None. Reviewer must scan 500 rows to find their pending blanks', 'Dedicated Dashboard: "You have 8 verses awaiting Theological Review". 1-click "Start Review".', 'Eliminates reviewer confusion on "what should I do next?".', 'Zero Drop-off'],
    ['Drafter Workflow', 'Document / Word Doc Import', 'Google Sheets (Apps Script)', 'Apps Script parses Google Docs, extracts highlights to bold text, trashes source', 'Retained in Sheets for drafters + Option to upload directly in Web UI file dropzone.', 'Drafters are already comfortable with current Word import. Keep it working without disruption.', 'Zero Learning Curve'],
    ['Drafter Workflow', 'Back-Translation Table Layout', 'Frontend Web App (UI)', 'Stored in Col E as plain text delimited by " | "', 'Rendered in Web UI as an elegant bilingual interlinear card (Kannada top, English bottom).', 'High aesthetic quality; makes notes effortless to read compared to condensed raw text.', 'Linguistic Clarity'],
    ['Workflow Engine', 'Status Auto-Progression', 'Google Sheets (Apps Script)', 'Calculated via onEdit logic (Not Started -> Under Review -> Done)', 'Apps Script continues to auto-compute Col A Status & Colors on every backend change.', 'Ensures sheet stays 100% consistent even if edits occur directly in the spreadsheet.', 'Data Integrity'],
    ['Notifications', 'WhatsApp Link Dispatch', 'Frontend Web App (UI)', 'Modal dialog in Google Sheets generates wa.me links', 'Interactive notification center in Web UI + 1-click wa.me links with pre-filled deep links to verse.', 'Deep link opens the exact verse card on reviewer’s phone directly.', 'Instant Nudge'],
    ['Reporting & Analytics', 'Weekly Summary', 'Google Sheets (Apps Script)', 'Modal text generator aggregating book completion counts', 'Retained in Sheets menu as fallback text summary for WhatsApp broadcasts.', 'Allows coordinator to send weekly text report without opening the web dashboard.', 'Convenient'],
    ['Reporting & Analytics', 'Live Visual Bottleneck Dashboard', 'Frontend Web App (UI)', 'None. Impossible to see bottlenecks without custom formulas', 'Real-time charts: Stage funnel, completion velocity, reviewer turnaround time, stalled verses alert.', 'Gives leadership clear visibility into who is blocking progress and where to provide help.', 'Leadership Delight ⭐'],
    ['Editorial Finalization', 'Committee & Final Editor Signoff', 'Frontend Web App (UI)', 'Committee writes in Col O/P, Final Editor in Col Q/R', 'Dedicated "Committee Room" & "Final Signoff" UI with full review history & consensus notes.', 'Elevates final review to a formal editorial room rather than editing raw cells.', 'Professionalism'],
    ['Row Archival', 'Protect Finalized Verses', 'Google Sheets (Apps Script)', 'Locks all 18 columns when Final Confirm is "Y"', 'Retained in Google Sheets backend. Once approved, row is locked from direct tampering.', 'Safeguards canonical scripture text against accidental deletion.', 'Compliance']
  ];

  rIdx = 5;
  matrixData.forEach(row => {
    const r = ws2.getRow(rIdx);
    r.values = ['', ...row];
    r.height = 32;
    for (let c = 2; c <= 8; c++) {
      r.getCell(c).border = borderThin;
      r.getCell(c).font = fontBody;
      r.getCell(c).alignment = { vertical: 'middle', wrapText: true };
    }
    r.getCell(2).font = fontBold;
    r.getCell(3).font = fontBold;
    
    // Tag styling
    const locCell = r.getCell(4);
    if (locCell.value.includes('Frontend')) {
      locCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } };
      locCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: BLUE_HEADER } };
    } else if (locCell.value.includes('Backend')) {
      locCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
      locCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: NAVY } };
    } else {
      locCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER_BG } };
      locCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: AMBER_TXT } };
    }

    const impactCell = r.getCell(8);
    if (impactCell.value.includes('⭐') || impactCell.value.includes('Game Changer')) {
      impactCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } };
      impactCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: GREEN_TXT } };
    }
    rIdx++;
  });

  // =========================================================================
  // 3. DATA MODEL & 18-COLUMN FIELD MAPPING
  // =========================================================================
  const ws3 = workbook.addWorksheet('3. Data Model & Column Map', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }]
  });

  ws3.columns = [
    { width: 4 },
    { width: 8 },  // Col Letter
    { width: 6 },  // Index
    { width: 20 }, // Variable Name
    { width: 22 }, // Column Header Label
    { width: 16 }, // Data Type
    { width: 25 }, // Assigned Role
    { width: 35 }, // Google Sheet Handling
    { width: 40 }, // Frontend Web UI Handling
    { width: 22 }  // API Read/Write Scope
  ];

  ws3.mergeCells('B2:J2');
  ws3.getCell('B2').value = 'Translation Sheet: 18-Column Data Contract & UI Mapping';
  ws3.getCell('B2').font = fontTitle;

  const colHeaders = ['', 'Col', 'Idx', 'Variable', 'Sheet Header Name', 'Data Type', 'Assigned Role', 'Google Sheet Behavior (Backend)', 'Frontend UI Component & Behavior', 'API Permissions'];
  ws3.getRow(4).values = colHeaders;
  applyHeaderStyle(ws3.getRow(4), NAVY);

  const columnsData = [
    ['A', '1', 'STATUS', 'Status', 'Formula / Calculated', 'System Engine', 'Auto-calculated label & color (🔴 Not Started, 🟡 Under Review, etc.)', 'Rendered as color-coded status badge & filter chip in verse lists', 'Read-Only (Auto-computed)'],
    ['B', '2', 'VERSE', 'Verse Ref', 'String (e.g. Rom 1:1)', 'Drafter / System', 'Identifier column. Frozen pane anchor.', 'Primary key / Navigation header. Searchable & filterable in breadcrumbs.', 'Read-Only for Reviewers'],
    ['C', '3', 'OLD_READING', 'Old Reading (KJV)', 'RichText / String', 'Drafter (Imported)', 'Base reference text in KJV. Read-only for reviewers.', 'Left pane reference text with copy button and cross-reference tooltip.', 'Read-Only'],
    ['D', '4', 'PROPOSED', 'Proposed Reading', 'RichText / Kannada', 'Drafter', 'Kannada proposed translation. Triggers workflow when filled.', 'Right pane main focal card. Large Kannada font, diff highlighting vs Old.', 'Drafter / Admin Edit'],
    ['E', '5', 'DRAFTER_CMT', 'Drafter Comments', 'RichText / Tables', 'Drafter', 'Linguistic notes & back-translation table (Kannada | English).', 'Interactive bilingual table card. Text colors preserved, expandable notes.', 'Drafter / Admin Edit'],
    ['F', '6', 'DRAFTER_CONFIRM', 'Drafter Confirm (Y/N)', 'Boolean Dropdown', 'Drafter', 'Set to "Y" by drafter. Unlocks review stage.', 'Toggle switch: [Draft in progress] -> [Ready for Review]. Instant sync.', 'Drafter / Admin Edit'],
    ['G', '7', 'TECH_REV', 'Technical Review', 'RichText / String', 'Technical Reviewer', 'Review notes on syntax, Greek/Hebrew structural alignment.', 'Dedicated collapsible review comment card with timestamp & reviewer name.', 'Tech Reviewer Edit'],
    ['H', '8', 'TECH_CONFIRM', 'Tech Confirm (Y/N)', 'Boolean Dropdown', 'Technical Reviewer', 'Set to "Y" when Technical Review passes.', '1-Click Action Button: [Approve Syntax] with confirmation modal.', 'Tech Reviewer Edit'],
    ['I', '9', 'STYLE_REV', 'Style & Language Review', 'RichText / String', 'Style Reviewer', 'Review notes on Kannada fluency, natural phrasing, register.', 'Dedicated comment box with Kannada virtual keyboard / suggestion tags.', 'Style Reviewer Edit'],
    ['J', '10', 'STYLE_CONFIRM', 'Style Confirm (Y/N)', 'Boolean Dropdown', 'Style Reviewer', 'Set to "Y" when Kannada style & naturalness is approved.', '1-Click Action Button: [Approve Phrasing] with confirmation modal.', 'Style Reviewer Edit'],
    ['K', '11', 'ORTHO_REV', 'Orthographic Review', 'RichText / String', 'Orthographic Reviewer', 'Spelling, script conjuncts (ottakshara), punctuation notes.', 'Dedicated spelling suggestion card with clickable inline corrections.', 'Ortho Reviewer Edit'],
    ['L', '12', 'ORTHO_CONFIRM', 'Ortho Confirm (Y/N)', 'Boolean Dropdown', 'Orthographic Reviewer', 'Set to "Y" when orthography is verified.', '1-Click Action Button: [Approve Orthography] with confirmation modal.', 'Ortho Reviewer Edit'],
    ['M', '13', 'THEO_REV', 'Theological Review', 'RichText / String', 'Theological Reviewer', 'Doctrinal consistency, theological fidelity, cross-testament coherence.', 'Dedicated doctrinal annotation panel with theological glossary support.', 'Theo Reviewer Edit'],
    ['N', '14', 'THEO_CONFIRM', 'Theo Confirm (Y/N)', 'Boolean Dropdown', 'Theological Reviewer', 'Set to "Y" when theology is verified.', '1-Click Action Button: [Approve Theology] with confirmation modal.', 'Theo Reviewer Edit'],
    ['O', '15', 'CONCLUSION', 'Committee Conclusion', 'RichText / String', 'Committee', 'Joint consensus notes when 4 reviewers disagree.', 'Discussion thread & consensus voting card. Displays all 4 reviews.', 'Committee / Admin Edit'],
    ['P', '16', 'COMM_CONFIRM', 'Comm Confirm (Y/N)', 'Boolean Dropdown', 'Committee', 'Set to "Y" to advance to Final Editor.', '1-Click Action Button: [Adopt Conclusion] to unlock final reading.', 'Committee / Admin Edit'],
    ['Q', '17', 'FINAL', 'Final Reading', 'RichText / Kannada', 'Final Editor', 'The polished, approved canonical text for publication.', 'High-visibility "Crown" reading editor with audit trail vs Proposed.', 'Final Editor Edit'],
    ['R', '18', 'FINAL_CONFIRM', 'Final Confirm (Y/N)', 'Boolean Dropdown', 'Final Editor', 'Set to "Y". Triggers row green highlight & row lock.', '1-Click Action Button: [Seal Final Verse] with celebratory animation.', 'Final Editor Edit']
  ];

  rIdx = 5;
  columnsData.forEach(row => {
    const r = ws3.getRow(rIdx);
    r.values = ['', ...row];
    r.height = 28;
    for (let c = 2; c <= 10; c++) {
      r.getCell(c).border = borderThin;
      r.getCell(c).font = fontBody;
      r.getCell(c).alignment = { vertical: 'middle', wrapText: true };
    }
    r.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    r.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
    r.getCell(2).font = fontBold;
    r.getCell(4).font = fontBold;
    r.getCell(5).font = fontBold;

    // Highlight confirmation columns
    if (row[2].includes('CONFIRM')) {
      r.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } };
    }
    rIdx++;
  });

  // =========================================================================
  // 4. REVIEWER & ADMIN UI SPECIFICATION
  // =========================================================================
  const ws4 = workbook.addWorksheet('4. Web UI & UX Features', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }]
  });

  ws4.columns = [
    { width: 4 },
    { width: 22 }, // Screen / Module
    { width: 28 }, // Feature Name
    { width: 35 }, // Reviewer Psychology / Purpose
    { width: 45 }, // UI Components & Interactions
    { width: 25 }, // Supported Devices
    { width: 16 }  // Priority
  ];

  ws4.mergeCells('B2:G2');
  ws4.getCell('B2').value = 'Modern Web App: UX Modules & Feature Breakdown';
  ws4.getCell('B2').font = fontTitle;

  const uiHeaders = ['', 'Module / Screen', 'Feature / Component', 'Reviewer Psychology & Problem Solved', 'Detailed Interaction & Visual Design', 'Platform / Device', 'Rollout Phase'];
  ws4.getRow(4).values = uiHeaders;
  applyHeaderStyle(ws4.getRow(4), NAVY);

  const uiData = [
    ['Reviewer Zen Mode', 'Single Verse Focus Card', 'Removes 18-column panic. Reviewers focus 100% on 1 verse without spreadsheet clutter.', 'Side-by-side or stacked view: KJV Old Reading on top/left, Kannada Proposed in middle, Back-translation notes below. Clean typography with adjustable font size (+/-).', 'Mobile & Desktop', 'Phase 1 (MVP)'],
    ['Reviewer Zen Mode', '1-Tap Quick Action Bar', 'Replaces awkward dropdown clicking with instant tactile buttons.', 'Floating action bar: [ ✅ Approve (Y) ] (Green), [ 💬 Request Change ] (Yellow), [ ⏭ Skip ] (Gray). Supports desktop keyboard shortcuts (Enter = Approve, Space = Skip).', 'Mobile & Desktop', 'Phase 1 (MVP)'],
    ['Reviewer Zen Mode', 'Optimistic UI Animation', 'Eliminates waiting for server response. Makes reviewing feel fast and rewarding.', 'Tapping Approve slides the card smoothly to the left, loads next verse immediately, while syncing confirmation to Google Sheets in the background.', 'Mobile & Desktop', 'Phase 1 (MVP)'],
    ['Task Inbox', 'Personalized Review Queue', 'Reviewer does not know what is pending in a 500-row sheet. This tells them immediately.', 'Login screen shows badge: "Dr. Paul — 7 Verses Pending for Theological Review". 1-click button "[ Start Review Queue ]". Counter counts down as they complete.', 'Mobile & Desktop', 'Phase 1 (MVP)'],
    ['Kannada Typography', 'Native Font & Line-Height Tuning', 'Kannada conjuncts (ottakshara) render brokenly in standard Google Sheets cells.', 'Uses Google Noto Sans Kannada font, custom line-height (1.8x), and color-coded grammatical highlights matching translation guidelines.', 'Mobile & Desktop', 'Phase 1 (MVP)'],
    ['Analytics & Stats', 'Live Pipeline Funnel', 'Coordinators have zero visibility into where translation is stuck.', 'Visual funnel chart: 60 Drafted -> 48 Tech Approved -> 12 Theo Stuck -> 8 Finalized. Clicking a funnel segment filters the verses instantly.', 'Desktop & Tablet', 'Phase 2'],
    ['Analytics & Stats', 'Reviewer Turnaround & Velocity', 'Identifies responsive reviewers vs inactive bottlenecks.', 'Metrics card: Average response time per reviewer (e.g. "Pastor David: 1.2 days avg"). Weekly verses completed chart. Projected book completion date.', 'Desktop & Tablet', 'Phase 2'],
    ['Notifications', 'Direct Deep-Link via WhatsApp', 'Reviewers ignore generic "check the sheet" messages.', 'WhatsApp message contains direct verse link: app.glbc.org/review/romans/1/14. Tapping opens directly to that exact verse card on their phone without logging in.', 'Mobile (iOS/Android)', 'Phase 2'],
    ['Mobile Experience', 'PWA (Progressive Web App)', 'Reviewers hate opening browser tabs and typing URLs.', 'User taps "Add to Home Screen". App installs with GLBC Bible icon, runs full screen without browser address bar, and works smoothly on 4G/5G.', 'iOS & Android', 'Phase 2'],
    ['Drafter Portal', 'Word / Doc Ingestion Studio', 'Drafters can upload work without touching Google Drive folders.', 'Drag-and-drop zone for drafter Word docs. Previews parsed verses with conflict warnings (✅ Ready, ⚠️ Overwrite, ❓ New) before writing to Sheets.', 'Desktop', 'Phase 3'],
    ['Committee Chamber', 'Consensus Discussion Room', 'Resolving conflicting reviews between 4 reviewers currently requires chaotic WhatsApp debates.', 'Special view displaying all 4 reviewer comments side-by-side with highlight differences. Committee can vote or merge text into Col O/P.', 'Desktop & Tablet', 'Phase 3']
  ];

  rIdx = 5;
  uiData.forEach(row => {
    const r = ws4.getRow(rIdx);
    r.values = ['', ...row];
    r.height = 30;
    for (let c = 2; c <= 7; c++) {
      r.getCell(c).border = borderThin;
      r.getCell(c).font = fontBody;
      r.getCell(c).alignment = { vertical: 'middle', wrapText: true };
    }
    r.getCell(2).font = fontBold;
    r.getCell(3).font = fontBold;
    rIdx++;
  });

  // =========================================================================
  // 5. API CONTRACT & INTEGRATION ARCHITECTURE
  // =========================================================================
  const ws5 = workbook.addWorksheet('5. API & System Architecture', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }]
  });

  ws5.columns = [
    { width: 4 },
    { width: 12 }, // Method
    { width: 25 }, // Endpoint
    { width: 35 }, // Purpose
    { width: 40 }, // Request Payload
    { width: 45 }, // Response Payload
    { width: 25 }  // Sync & Caching Strategy
  ];

  ws5.mergeCells('B2:G2');
  ws5.getCell('B2').value = 'Backend Integration Contract: Google Apps Script Web App JSON API';
  ws5.getCell('B2').font = fontTitle;

  const apiHeaders = ['', 'HTTP Method', 'API Action / Endpoint', 'Purpose & Target Sheet', 'Request Payload (JSON)', 'Response Payload (JSON)', 'Performance & Cache Strategy'];
  ws5.getRow(4).values = apiHeaders;
  applyHeaderStyle(ws5.getRow(4), NAVY);

  const apiData = [
    ['GET', '?action=getBooks', 'List all translation book sheets available in the spreadsheet', 'None', '{ success: true, books: ["Romans", "Galatians", "Ephesians"] }', 'Cache in localStorage for 1 hour'],
    ['GET', '?action=getConfig', 'Fetch team members, roles, phone numbers, and active status', 'None', '{ success: true, team: [{ name, role, email, phone, active }] }', 'Cache for 30 minutes; revalidate on login'],
    ['GET', '?action=getVerses&book=Romans', 'Fetch all verses, status, readings, and reviewer confirmations', '{ book: "Romans", roleFilter: "Theological Reviewer" }', '{ success: true, book: "Romans", total: 433, verses: [{ row: 2, verse: "Rom 1:1", status, proposed, drafterCmt, confirms: {...} }] }', 'SWR / React Query cache with optimistic background refresh'],
    ['POST', '?action=submitReview', 'Submit review comment and confirmation for a verse', '{ book: "Romans", row: 2, role: "THEO", comment: "Verified text against Greek...", confirm: "Y", userEmail: "drpaul@glbc.org" }', '{ success: true, updatedRow: 2, newStatus: "Awaiting Committee", nextPendingRow: 3 }', 'Optimistic UI update; retry queue on network drop'],
    ['POST', '?action=submitFinal', 'Submit final approved scripture reading and final signoff', '{ book: "Romans", row: 2, finalReading: "ದೇವರ ವಾಕ್ಯ...", confirm: "Y", userEmail: "editor@glbc.org" }', '{ success: true, locked: true, row: 2, newStatus: "Done" }', 'Direct sync; locks row in Google Sheets backend'],
    ['GET', '?action=getAnalytics&book=Romans', 'Fetch aggregated stage stats, completion %, and bottleneck metrics', '{ book: "Romans" }', '{ success: true, total: 433, completed: 85, awaitingReview: 140, bottlenecks: { tech: 5, style: 12, ortho: 8, theo: 25 } }', 'Compute on-demand in Apps Script; cache 5 mins']
  ];

  rIdx = 5;
  apiData.forEach(row => {
    const r = ws5.getRow(rIdx);
    r.values = ['', ...row];
    r.height = 34;
    for (let c = 2; c <= 7; c++) {
      r.getCell(c).border = borderThin;
      r.getCell(c).font = fontBody;
      r.getCell(c).alignment = { vertical: 'middle', wrapText: true };
    }
    r.getCell(2).font = fontBold;
    r.getCell(3).font = fontBold;

    const methodCell = r.getCell(2);
    if (methodCell.value === 'GET') {
      methodCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } };
      methodCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: BLUE_HEADER } };
    } else {
      methodCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } };
      methodCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: GREEN_TXT } };
    }
    rIdx++;
  });

  // =========================================================================
  // 6. PHASED ROLLOUT ROADMAP & ARCHITECT APPROVAL
  // =========================================================================
  const ws6 = workbook.addWorksheet('6. Implementation Roadmap', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }]
  });

  ws6.columns = [
    { width: 4 },
    { width: 14 }, // Phase
    { width: 28 }, // Deliverable Name
    { width: 45 }, // Scope & Features Included
    { width: 25 }, // Reviewer Experience Benefit
    { width: 18 }, // Estimated Timeline
    { width: 20 }  // Architect Signoff
  ];

  ws6.mergeCells('B2:G2');
  ws6.getCell('B2').value = 'Implementation Roadmap & Architect Signoff Schedule';
  ws6.getCell('B2').font = fontTitle;

  const roadHeaders = ['', 'Phase', 'Milestone / Deliverable', 'Technical Scope & Key Deliverables', 'Reviewer Impact', 'Estimated Effort', 'Architect Status'];
  ws6.getRow(4).values = roadHeaders;
  applyHeaderStyle(ws6.getRow(4), NAVY);

  const roadData = [
    ['Phase 1 (MVP)', 'API Bridge & Reviewer Zen Mode', '1. Add doGet/doPost JSON API in Code.gs\n2. Build Vite + React frontend with single-verse Zen card\n3. One-tap [Approve] / [Comment] actions\n4. Role-based view (Theological, Style, Ortho, Tech)', 'Solves reviewer stoppage immediately. Reviewers can start approving verses on mobile/desktop.', '3 to 5 Days', 'Pending Review'],
    ['Phase 2', 'Analytics Dashboard & PWA Mobile', '1. Real-time chapter progress bars & burn-down chart\n2. Bottleneck stage detector (alerts coordinator on stuck verses)\n3. PWA manifest & icon (Add to Home Screen on phones)\n4. WhatsApp deep-link integration for instant verse opening', 'Coordinators gain total visibility. Reviewers experience app-like speed on mobile phones.', '3 to 4 Days', 'Pending Review'],
    ['Phase 3', 'Committee Chamber & Word Ingestion', '1. Committee consensus comparison screen (view 4 reviews)\n2. Final Editor sign-off interface with audit diff\n3. Web UI drag-and-drop Word doc import for drafters', 'Full end-to-end translation pipeline migrated to web UI, while Sheets stays backend.', '3 to 4 Days', 'Pending Review'],
    ['Phase 4', 'Showcase & Multi-Book Scale', '1. Multi-book switcher (Romans, Psalms, Gospels)\n2. Performance optimization & offline review queue\n3. Documentation & presentation for regional translation bodies', 'System becomes a deployable product that can be licensed/shared with other language teams.', '2 to 3 Days', 'Pending Review']
  ];

  rIdx = 5;
  roadData.forEach(row => {
    const r = ws6.getRow(rIdx);
    r.values = ['', ...row];
    r.height = 45;
    for (let c = 2; c <= 7; c++) {
      r.getCell(c).border = borderThin;
      r.getCell(c).font = fontBody;
      r.getCell(c).alignment = { vertical: 'middle', wrapText: true };
    }
    r.getCell(2).font = fontBold;
    r.getCell(3).font = fontBold;

    const signoffCell = r.getCell(7);
    signoffCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER_BG } };
    signoffCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: AMBER_TXT } };
    signoffCell.alignment = { vertical: 'middle', horizontal: 'center' };
    rIdx++;
  });

  const filePath = path.join(__dirname, 'GLBC_Architecture_Upgrade_Plan.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log('Workbook created successfully at:', filePath);
}

createPlanWorkbook().catch(err => {
  console.error('Error creating workbook:', err);
  process.exit(1);
});
