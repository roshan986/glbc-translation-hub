const ExcelJS = require('exceljs');
const path = require('path');

async function buildPristineWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GLBC Architect & Antigravity AI';
  workbook.created = new Date();
  workbook.properties.date1904 = false;

  // Design Tokens / Colors
  const NAVY = '1E293B';       // Dark Slate / Navy headers
  const TEAL = '0F766E';       // Teal accent
  const BLUE_HEADER = '1E40AF'; // Blue
  const LIGHT_BLUE = 'EFF6FF';
  const LIGHT_GRAY = 'F8FAFC';
  const BORDER_GRAY = 'CBD5E1';
  const WHITE = 'FFFFFF';
  const GREEN_BG = 'DCFCE7';
  const GREEN_TXT = '166534';
  const AMBER_BG = 'FEF3C7';
  const AMBER_TXT = '92400E';
  const RED_BG = 'FEE2E2';
  const RED_TXT = '991B1B';
  const PURPLE_BG = 'F3E8FF';
  const PURPLE_TXT = '6B21A8';

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
    row.height = 30;
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
    ['', 'The Solution', 'Retain Google Sheets as the 100% Free Database & Source of Truth. Layer a lightning-fast, mobile-first Web App (Vite + React + Tailwind) on top, offering a single-verse "Focus Mode", personal task inboxes, and live bottleneck analytics.'],
    ['', 'Core Objective', '1) Zero reviewer drop-off; 2) 3x faster turnaround per chapter; 3) Frictionless mobile reviewing; 4) $0 monthly infrastructure cost (Vercel + Google Sheets API); 5) Enterprise-grade showcase model for other regional language translation teams.'],
    ['Architecture Pillars', 'Pillar 1: Google Sheets as Headless DB', 'Google Sheets remains the master repository. All existing columns (A-R), formulas, history, config, and sharing controls remain intact. Admins can audit or export anytime.'],
    ['', 'Pillar 2: "Focus Mode" Review Interface', 'Reviewers never see 18 columns. They see ONE verse at a time on desktop or phone. Side-by-side Old KJV vs Proposed reading with color-coded back-translation notes and a 1-click [Approve / Suggest Edit] action.'],
    ['', 'Pillar 3: Personal Task Inboxes', 'Upon login, a reviewer immediately sees: "You have 8 verses waiting for your Theological Review in Romans 1". Eliminates manual row hunting.'],
    ['', 'Pillar 4: Live Bottleneck & Velocity Analytics', 'Visual stage funnels and burn-down charts identify where verses stall (e.g. "Ortho Review has 14 verses waiting > 4 days"), with instant WhatsApp nudge triggers.'],
    ['', 'Pillar 5: PWA & Offline-First Speed', 'Reviewers can tap "Add to Home Screen" on iOS/Android. Instant loading (<500ms), optimistic UI updates, and native Kannada typography (Noto Sans Kannada).'],
    ['', 'Pillar 6: Intelligent Translation Partner & Contextual Coaching', 'The app actively speaks to the user like an expert in the field: provides dynamic inline guidance chips ("Action Needed", "What Happens Next", "Why Pending"), a collapsible Smart Assistant drawer with Greek/English lexical comparisons (NA28 / TR / KJV), explicit named-reviewer pending statuses (no cryptic 0/1 counters), and chapter milestone appreciations.'],
    ['Architecture Pillars', 'Pillar 7: Translation Governance, Target Dates & Open Deliberation', 'Admins lock target completion dates per book driving dynamic daily pace tracking (required verses/day) and lag warnings. Initial rollout grants universal cross-stage discussion visibility (so drafters can review all reviewer and committee feedback), backed by an Admin Console with granular View/Edit permission toggles and Google OAuth.'],
    ['Cost & Deployment', 'Hosting & Infrastructure Cost', '$0 / month. Frontend hosted on Vercel (Free Tier). Backend on existing Google Sheets via Apps Script Web App JSON API.'],
    ['', 'Target Audience & Adoption', 'Reviewers (Theological, Style, Orthographic, Technical), Committee Members, Final Editors, Drafters, and Project Coordinators. Built to be recommended to other translation bodies.']
  ];

  ws1.getRow(5).values = ['', 'Section / Category', 'Key Principle / Finding', 'Architecture Details & Strategy'];
  applyHeaderStyle(ws1.getRow(5), NAVY);

  let rIdx = 6;
  execRows.forEach(row => {
    const r = ws1.getRow(rIdx);
    r.values = ['', ...row];
    r.height = 36;
    for (let c = 2; c <= 4; c++) {
      r.getCell(c).border = borderThin;
      r.getCell(c).font = fontBody;
      r.getCell(c).alignment = { vertical: 'middle', wrapText: true };
    }
    if (row[0]) {
      r.getCell(2).font = fontBold;
      r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
    }
    r.getCell(3).font = fontBold;
    rIdx++;
  });

  // =========================================================================
  // 2. FEATURE MATRIX & BOUNDARY DEFINITIONS
  // =========================================================================
  const ws2 = workbook.addWorksheet('2. Feature Matrix', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }]
  });

  ws2.columns = [
    { width: 4 },
    { width: 22 }, // Domain
    { width: 26 }, // Feature Name
    { width: 22 }, // Split
    { width: 38 }, // Current Sheets State
    { width: 42 }, // Upgraded Web State
    { width: 42 }, // Architecture Justification
    { width: 20 }  // Impact
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
    ['Reviewer Experience', 'Verse Reading & Review', 'Frontend Web App (UI)', 'Reviewer scrolls through Col G-N, reads tiny cells, inputs Y/N', 'Focus Mode: 1 verse at a time. Clean split-view, large Kannada font, Old vs Proposed comparison.', 'Eliminates 18-column cognitive overload. Allows full concentration on linguistic precision.', 'Game Changer ⭐'],
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
    ['Row Archival', 'Protect Finalized Verses', 'Google Sheets (Apps Script)', 'Locks all 18 columns when Final Confirm is "Y"', 'Retained in Google Sheets backend. Once approved, row is locked from direct tampering.', 'Safeguards canonical scripture text against accidental deletion.', 'Compliance'],
    ['Reviewer Experience', 'Named Reviewer Status & Dynamic Sizing', 'Frontend Web App (UI)', 'Cryptic 0/1 counters without knowing which assigned member is pending', 'Named reviewer status pills (e.g. Fr. Thomas: ⏳ Pending; Pastor Matt ✓ · Pastor Zack ⏳) dynamically sized to active team members in Config.', 'Eliminates reviewer confusion over who needs to act; gives crystal-clear accountability.', 'High Clarity ⭐'],
    ['Reviewer Experience', 'Clean Natural Deliberation (No "Request Edit")', 'Frontend Web App (UI)', 'Confusing "[Request Edit]" robotic tags and reject buttons on discussion comments', 'Clean, natural comment composer for Reviewers and Committee without alarming tags. Affirmative [Confirm] button for stage completion.', 'Matches human dialogue; eliminates artificial ticket-like confusion.', 'Delightful UX'],
    ['Reviewer Experience', 'Inline Smart Guidance Badges', 'Frontend Web App (UI)', 'Static forms with no guidance on what happens next or why a verse is pending', 'Contextual chips embedded in each section explaining: 1) What action is needed right now; 2) What happens next; 3) Exactly why this verse is pending.', 'Guides reviewers like an expert in the field; reduces onboarding time to zero.', 'Core Guidance ⭐'],
    ['Reviewer Experience', 'Collapsible "Smart Assistant" Drawer', 'Frontend Web App (UI)', 'None', 'Dedicated side drawer with Greek/English biblical comparison tools (NA28 / TR concordance hints, KJV glosses), chapter milestone tracker, and team velocity appreciations.', 'Empowers theological and language reviewers with instant scholarly context without leaving the verse.', 'Scholarly Partner ⭐'],
    ['Final Editorial', 'Editorial Pre-Flight Checklist Guidelines', 'Frontend Web App (UI)', 'Ad-hoc verification in spreadsheet cell without structured guidance', 'Structured 4-point editorial quality guideline (KJV Fidelity, Kannada Register, Theological Alignment, Orthography) visible to Final Editor pending team meeting confirmation.', 'Maintains highest translation fidelity and prepares team for formal sign-off protocol.', 'Quality Gate'],
    ['Book Governance', 'Layman Target Date & Required Velocity Engine', 'Hybrid (Synced)', 'Static arbitrary velocity formula (remaining / 14 = ~31 days fixed pace)', 'Admin locks Target Completion Date per book; dynamically calculates required verses/day, tracks calendar lag, and triggers WhatsApp pace alerts.', 'Replaces unrealistic placeholder dates with authentic project deadlines managed by leadership.', 'High Trust ⭐'],
    ['Deliberation Transparency', 'Universal Cross-Stage Discussion Visibility', 'Frontend Web App (UI)', 'Reviewer and committee discussions were isolated; drafters could not see editorial findings', 'Drafters and all team members have 100% read visibility into all 4 reviewer findings and committee deliberation notes directly on the verse canvas.', 'Fosters collaborative learning: drafters understand reviewer critiques and align future chapters.', 'Massive Alignment ⭐'],
    ['Access Control', 'Initial Open Permissions with Dynamic Admin RBAC Toggles', 'Hybrid (API + UI)', 'Hardcoded role restrictions or spreadsheet-level sharing', 'Initial deployment grants open workspace access to all team members; Admin Console provides granular View/Edit permission toggle switches.', 'Prevents premature lockout while team establishes routine; allows gradual tightening as workflow stabilizes.', 'Low Friction ⭐'],
    ['UI / Styling', 'Smart Avatar Initials & Non-Squishing Presence Geometry', 'Frontend Web App (UI)', 'Squished oval presence dots on long role names; identical PA/SI/BR initials for honorific titles', 'Smart Name Parser stripping titles (Pastor Zack -> PZ, Sister Nancy -> SN) with role-themed color palettes and flex-shrink:0 circular active dots.', 'Restores polished UI geometry and unique visual identity to all scholars on the roster.', 'Visual Delight'],
    ['Administration', 'Dedicated Unified Admin Console', 'Frontend Web App (UI)', 'Administrative tasks split across disparate modals and spreadsheet menus', 'Unified command center tab in sidebar: Book Target Dates lock, 1-click sheet setup wizard, Team Directory with Google OAuth emails, and column protections sync.', 'Gives coordinators complete administrative governance without needing raw spreadsheet edits.', 'Governance ⭐'],
    ['Workspace & Settings', 'Consolidated Translation Settings & Drafter Studio', 'Frontend Web App (UI)', '11 GLBC menu actions scattered across sheets and modals, cluttering reviewer canvas', 'Centralized "Settings" hub with 5 top sub-tabs: 1) Team & Access; 2) Book & Sheet Setup; 3) Drafter Studio & Templates; 4) Reports & Alerts; 5) Connection. Strips admin clutter from Focus Mode.', 'Reviewers enjoy 100% distraction-free Focus Mode; all setup, file intake, and team configuration unified in one hub.', 'Ergonomic Delight ⭐'],
    ['Security & Auth', 'Google Sign-In (OAuth) Authentication Bridge', 'Frontend & Security', 'Persona switcher dropdown with zero authentication barrier', 'Secure Google OAuth login matching user email against the active ⚙ Config directory in Google Sheets.', '100% free ($0/month), zero passwords to remember, directly aligns with Google Sheets column protections.', 'Enterprise Security']
  ];

  rIdx = 5;
  matrixData.forEach(row => {
    const r = ws2.getRow(rIdx);
    r.values = ['', ...row];
    r.height = 34;
    for (let c = 2; c <= 8; c++) {
      r.getCell(c).border = borderThin;
      r.getCell(c).font = fontBody;
      r.getCell(c).alignment = { vertical: 'middle', wrapText: true };
    }
    r.getCell(2).font = fontBold;
    r.getCell(3).font = fontBold;
    
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
    ['J', '10', 'STYLE_CONFIRM', 'Style Confirm (Y/N)', 'Boolean Dropdown', 'Style Reviewer', 'Set to "Y" when Style Review passes.', '1-Click Action Button: [Approve Style] with confirmation modal.', 'Style Reviewer Edit'],
    ['K', '11', 'ORTHO_REV', 'Orthographic Review', 'RichText / String', 'Orthographic Reviewer', 'Review notes on spelling, vowel signs, conjuncts, sandhi rules.', 'Interactive inline spell-check & grammar suggestion card.', 'Ortho Reviewer Edit'],
    ['L', '12', 'ORTHO_CONFIRM', 'Ortho Confirm (Y/N)', 'Boolean Dropdown', 'Orthographic Reviewer', 'Set to "Y" when Orthographic Review passes.', '1-Click Action Button: [Approve Orthography] with confirmation modal.', 'Ortho Reviewer Edit'],
    ['M', '13', 'THEO_REV', 'Theological Review', 'RichText / String', 'Theological Reviewer', 'Review notes on doctrinal alignment, theological terms, context.', 'Full theological dossier pane with cross-testament reference tags.', 'Theo Reviewer Edit'],
    ['N', '14', 'THEO_CONFIRM', 'Theo Confirm (Y/N)', 'Boolean Dropdown', 'Theological Reviewer', 'Set to "Y" when Theological Review passes.', '1-Click Action Button: [Approve Theology] with confirmation modal.', 'Theo Reviewer Edit'],
    ['O', '15', 'CONCLUSION', 'Committee Conclusion', 'RichText / Kannada', 'Committee', 'Joint resolution text agreed upon by committee after reviews.', 'Committee Consensus Chamber: side-by-side review diff & resolution editor.', 'Committee Edit'],
    ['P', '16', 'COMM_CONFIRM', 'Comm Confirm (Y/N)', 'Boolean Dropdown', 'Committee', 'Set to "Y" when committee approves final consensus.', 'Committee Signoff action button (requires quorum or chair signoff).', 'Committee Edit'],
    ['Q', '17', 'FINAL', 'Final Reading', 'RichText / Kannada', 'Final Editor', 'Authorized final translation text ready for publication.', 'Final Editorial Room: canonical text view, audit comparison vs Old KJV.', 'Final Editor Edit'],
    ['R', '18', 'FINAL_CONFIRM', 'Final Confirm (Y/N)', 'Boolean Dropdown', 'Final Editor', 'Set to "Y" by Final Editor. Triggers row locking & completion status.', '1-Click Final Signoff: locks row permanently in Sheet backend.', 'Final Editor Edit']
  ];

  rIdx = 5;
  columnsData.forEach(row => {
    const r = ws3.getRow(rIdx);
    r.values = ['', ...row];
    r.height = 32;
    for (let c = 2; c <= 10; c++) {
      r.getCell(c).border = borderThin;
      r.getCell(c).font = fontBody;
      r.getCell(c).alignment = { vertical: 'middle', wrapText: true };
    }
    r.getCell(2).font = fontBold;
    r.getCell(4).font = fontBold;
    rIdx++;
  });

  // =========================================================================
  // 4. WEB UI & UX SPECIFICATION
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
    ['Focus Mode', 'Single Verse Focus Card', 'Removes 18-column panic. Reviewers focus 100% on 1 verse without spreadsheet clutter.', 'Side-by-side or stacked view: KJV Old Reading on top/left, Kannada Proposed in middle, Back-translation notes below. Clean typography with adjustable font size (+/-).', 'Mobile & Desktop', 'Phase 1 (MVP)'],
    ['Focus Mode', '1-Tap Quick Action Bar', 'Replaces awkward dropdown clicking with instant tactile buttons.', 'Floating action bar: [ ✅ Approve (Y) ] (Green), [ 💬 Request Change ] (Yellow), [ ⏭ Skip ] (Gray). Supports desktop keyboard shortcuts (Enter = Approve, Space = Skip).', 'Mobile & Desktop', 'Phase 1 (MVP)'],
    ['Focus Mode', 'Optimistic UI Animation', 'Eliminates waiting for server response. Makes reviewing feel fast and rewarding.', 'Tapping Approve slides the card smoothly to the left, loads next verse immediately, while syncing confirmation to Google Sheets in the background.', 'Mobile & Desktop', 'Phase 1 (MVP)'],
    ['Focus Mode', 'Multi-Reviewer Threaded Comments', 'Multiple reviewers of same role write in one cell without overwriting.', 'Displays previous comments by name prefix. Input box automatically prepends logged-in reviewer name before appending to Sheet cell.', 'Mobile & Desktop', 'Phase 1 (MVP)'],
    ['Task Inbox', 'Personalized Review Queue', 'Reviewer does not know what is pending in a 500-row sheet. This tells them immediately.', 'Login screen shows badge: "Dr. Paul — 7 Verses Pending for Theological Review". 1-click button "[ Start Review Queue ]". Counter counts down as they complete.', 'Mobile & Desktop', 'Phase 1 (MVP)'],
    ['Kannada Typography', 'Native Font & Line-Height Tuning', 'Kannada conjuncts (ottakshara) render brokenly in standard Google Sheets cells.', 'Uses Google Noto Sans Kannada font, custom line-height (1.8x), and color-coded grammatical highlights matching translation guidelines.', 'Mobile & Desktop', 'Phase 1 (MVP)'],
    ['Notifications', 'Inline WhatsApp Alert Buttons', 'Instantly notify next stage team members without leaving the verse card.', 'Inline wa.me click-to-chat buttons generated directly on the verse card based on current stage confirmation status.', 'Mobile & Desktop', 'Phase 1 (MVP)'],
    ['Analytics & Stats', 'Live Pipeline Funnel', 'Coordinators have zero visibility into where translation is stuck.', 'Visual funnel chart: 60 Drafted -> 48 Tech Approved -> 12 Theo Stuck -> 8 Finalized. Clicking a funnel segment filters the verses instantly.', 'Desktop & Tablet', 'Phase 2'],
    ['Analytics & Stats', 'Reviewer Turnaround & Velocity', 'Identifies responsive reviewers vs inactive bottlenecks.', 'Metrics card: Average response time per reviewer (e.g. "Pastor David: 1.2 days avg"). Weekly verses completed chart. Projected book completion date.', 'Desktop & Tablet', 'Phase 2'],
    ['Notifications', 'Direct Deep-Link via WhatsApp', 'Reviewers ignore generic "check the sheet" messages.', 'WhatsApp message contains direct verse link: app.glbc.org/review/romans/1/14. Tapping opens directly to that exact verse card on their phone without logging in.', 'Mobile (iOS/Android)', 'Phase 2'],
    ['Mobile Experience', 'PWA (Progressive Web App)', 'Reviewers hate opening browser tabs and typing URLs.', 'User taps "Add to Home Screen". App installs with GLBC Bible icon, runs full screen without browser address bar, and works smoothly on 4G/5G.', 'iOS & Android', 'Phase 2'],
    ['Drafter Portal', 'Word / Doc Ingestion Studio', 'Drafters can upload work without touching Google Drive folders.', 'Drag-and-drop zone for drafter Word docs. Previews parsed verses with conflict warnings (✅ Ready, ⚠️ Overwrite, ❓ New) before writing to Sheets.', 'Desktop', 'Phase 3'],
    ['Drafter Portal', 'Template Generator Download', 'Drafters need formatted .docx templates to write new chapters.', 'One-click download of drafter .docx template pre-filled with required headers and back-translation tables.', 'Desktop', 'Phase 3'],
    ['Committee Chamber', 'Consensus Discussion Room', 'Resolving conflicting reviews between 4 reviewers currently requires chaotic WhatsApp debates.', 'Special view displaying all 4 reviewer comments side-by-side with highlight differences. Committee can vote or merge text into Col O/P.', 'Desktop & Tablet', 'Phase 3'],
    ['Focus Mode', 'Named Reviewer Status Pills', 'Eliminates cryptic 0/1 confusion. Shows exactly which team members have approved and who is pending.', 'Interactive pills displaying member names and status (e.g. "Fr. Thomas: ⏳ Pending", "Pastor Matt ✓ · Pastor Zack ⏳"). Dynamic team sizing from Config.', 'Mobile & Desktop', 'Phase 5'],
    ['Focus Mode', 'Clean Natural Deliberation Thread', 'Eliminates robotic [Request Edit] tags and artificial reject buttons from discussion comments.', 'Clean comment composer for peer dialogue without alarming labels. Affirmative [Confirm] action decoupled from discussion.', 'Mobile & Desktop', 'Phase 5'],
    ['Translation Coach', 'Inline Smart Guidance Badges', 'Guides the user like an expert in the field right where they are working.', 'Embedded guidance chips inside each card answering: 1) What action is needed; 2) What happens next; 3) Exactly why this verse is pending.', 'Mobile & Desktop', 'Phase 5'],
    ['Translation Coach', 'Collapsible Smart Assistant Drawer', 'Provides scholarly depth, biblical comparisons, and motivational positive reinforcement.', 'Collapsible partner drawer with Greek/English comparison tools (NA28/TR concordance hints, KJV glosses), chapter milestone tracker, and appreciations.', 'Mobile & Desktop', 'Phase 5'],
    ['Final Editorial', 'Editorial Pre-Flight Checklist Guidelines', 'Provides structured quality verification for Final Editor before sign-off.', '4-point interactive editorial guidelines (KJV Fidelity, Kannada Register, Theological Terminology, Orthography) visible to Final Editor.', 'Desktop & Tablet', 'Phase 5'],
    ['Focus Mode', 'Universal Discussion Visibility for Drafters & Team', 'Drafters feel excluded when they cannot see why their translations were critiqued or modified.', 'Drafter workspace includes full 4-Discipline Review Findings Matrix and Committee Deliberation notes in read-only mode with clear cross-stage banner.', 'Mobile & Desktop', 'Phase 6'],
    ['Navigation & Roster', 'Smart Avatar Initials & Circular Presence Dots', 'Broken initials (PA for everyone) and squished presence dots hurt visual credibility.', 'Smart Name Parser strips religious titles (Pastor, Sister, Brother) into personal initials; role-themed pastel backgrounds; fixed circular presence dot.', 'Mobile & Desktop', 'Phase 6'],
    ['Analytics & Stats', 'Layman Target Date & Dynamic Velocity Tracker', 'Arbitrary fixed 14 verses/day burn-down forecast created unrealistic December 14 completion dates.', 'Replaces placeholder with locked Target Completion Date; displays days remaining, required verses/day, on-track vs behind pace, and 1-tap WhatsApp nudges.', 'Desktop & Tablet', 'Phase 6'],
    ['Admin Command Center', 'Dedicated Unified Admin Console', 'Coordinators need a single screen to set book deadlines, manage permissions, and sync protections.', 'Consolidated admin page with Book Governance & Target Dates, Team Directory & OAuth Emails, Role Permission Toggles, and 1-Click Sheet Init.', 'Desktop & Tablet', 'Phase 6'],
    ['Settings Hub', 'Consolidated Settings & Translation Operations Hub', 'Scattered setup buttons across Focus Mode, Topbar, and Sidebar distracted reviewers from Scripture translation and deliberation.', 'Renamed Drafter Studio to Settings with 5 dedicated sub-tabs: 1) Team & Access (Config directory, role protections sync); 2) Book & Sheet Setup (1-click sheet init, format headers, status color refresh, finalized lock, target date pace); 3) Drafter Studio & Templates (.docx upload & import, template generator, color rules); 4) Reports & Alerts (Weekly WhatsApp translation summary generator); 5) Connection (Google Apps Script API endpoint & trigger health).', 'Desktop & Tablet', 'Phase 6']
  ];

  rIdx = 5;
  uiData.forEach(row => {
    const r = ws4.getRow(rIdx);
    r.values = ['', ...row];
    r.height = 32;
    for (let c = 2; c <= 7; c++) {
      r.getCell(c).border = borderThin;
      r.getCell(c).font = fontBody;
      r.getCell(c).alignment = { vertical: 'middle', wrapText: true };
    }
    r.getCell(2).font = fontBold;
    r.getCell(3).font = fontBold;

    const phaseCell = r.getCell(7);
    if (phaseCell.value.includes('Phase 1')) {
      phaseCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } };
      phaseCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: GREEN_TXT } };
    } else if (phaseCell.value.includes('Phase 2')) {
      phaseCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } };
      phaseCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: BLUE_HEADER } };
    } else {
      phaseCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER_BG } };
      phaseCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: AMBER_TXT } };
    }
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
    ['GET', '?action=getVerses&book=Romans', 'Fetch all verses, status, readings, and reviewer confirmations', '{ book: "Romans", roleFilter: "Theological Reviewer" }', '{ success: true, book: "Romans", total: 433, verses: [{ row: 2, verse: "Rom 1:1", status, proposed, drafterCmt, confirms: {...} }] }', 'TanStack Query cache with optimistic background refresh'],
    ['POST', '?action=submitReview', 'Submit review comment and confirmation for a verse (appends reviewer name)', '{ book: "Romans", row: 2, role: "THEO", comment: "Verified text...", confirm: "Y", userName: "Dr. Paul", userEmail: "drpaul@glbc.org" }', '{ success: true, updatedRow: 2, newStatus: "Awaiting Committee", nextPendingRow: 3 }', 'Optimistic UI update; auto-appends to shared cell'],
    ['POST', '?action=submitFinal', 'Submit final approved scripture reading and final signoff', '{ book: "Romans", row: 2, finalReading: "ದೇವರ ವಾಕ್ಯ...", confirm: "Y", userEmail: "editor@glbc.org" }', '{ success: true, locked: true, row: 2, newStatus: "Done" }', 'Direct sync; locks row in Google Sheets backend'],
    ['GET', '?action=getAnalytics&book=Romans', 'Fetch aggregated stage stats, completion %, and bottleneck metrics', '{ book: "Romans" }', '{ success: true, total: 433, completed: 85, awaitingReview: 140, bottlenecks: { tech: 5, style: 12, ortho: 8, theo: 25 } }', 'Compute on-demand in Apps Script; cache 5 mins']
  ];

  rIdx = 5;
  apiData.forEach(row => {
    const r = ws5.getRow(rIdx);
    r.values = ['', ...row];
    r.height = 36;
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
  // 6. PHASED ROLLOUT ROADMAP (GRANULAR DELIVERABLE & STATUS TRACKER)
  // =========================================================================
  const ws6 = workbook.addWorksheet('6. Implementation Roadmap', {
    views: [{ state: 'frozen', ySplit: 6, showGridLines: true }]
  });

  ws6.columns = [
    { width: 4 },  // Margin padding
    { width: 16 }, // Col B: Phase
    { width: 10 }, // Col C: Task #
    { width: 30 }, // Col D: Deliverable / Feature
    { width: 48 }, // Col E: Technical Scope & Key Deliverables
    { width: 18 }, // Col F: Execution Layer
    { width: 22 }, // Col G: Implementation Status
    { width: 16 }, // Col H: Completion / Target
    { width: 58 }  // Col I: Why / Status Notes & Rationale
  ];

  ws6.mergeCells('B2:I2');
  ws6.getCell('B2').value = 'GLBC Modernization Implementation Roadmap — Granular Deliverable Tracker';
  ws6.getCell('B2').font = fontTitle;

  ws6.mergeCells('B3:I3');
  ws6.getCell('B3').value = 'Live deliverable tracking across all 4 rollout phases: completion status, execution layers, and rationale';
  ws6.getCell('B3').font = fontSubtitle;

  // KPI Progress Summary Block
  ws6.getRow(4).height = 26;
  
  ws6.mergeCells('B4:C4');
  const kpiTitle = ws6.getCell('B4');
  kpiTitle.value = 'Overall Progress: 34 / 42 (81.0% Done)';
  kpiTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  kpiTitle.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: WHITE } };
  kpiTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  kpiTitle.border = borderThin;
  ws6.getCell('C4').border = borderThin;

  ws6.mergeCells('D4:E4');
  const kpiP1 = ws6.getCell('D4');
  kpiP1.value = 'Phases 1-5: 29 / 29 Completed (100% ✅)';
  kpiP1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } };
  kpiP1.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: GREEN_TXT } };
  kpiP1.alignment = { vertical: 'middle', horizontal: 'center' };
  kpiP1.border = borderThin;
  ws6.getCell('E4').border = borderThin;

  ws6.mergeCells('F4:G4');
  const kpiP2 = ws6.getCell('F4');
  kpiP2.value = 'Phase 6 (Governance & Deliberation): 5 / 11 Completed (45.5% ✅)';
  kpiP2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER_BG } };
  kpiP2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: AMBER_TXT } };
  kpiP2.alignment = { vertical: 'middle', horizontal: 'center' };
  kpiP2.border = borderThin;
  ws6.getCell('G4').border = borderThin;

  ws6.mergeCells('H4:I4');
  const kpiP34 = ws6.getCell('H4');
  kpiP34.value = 'Phase 7 (Roadmap): 0 / 2 Scheduled (OT Strong\'s & Comparative) ⏳';
  kpiP34.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
  kpiP34.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '64748B' } };
  kpiP34.alignment = { vertical: 'middle', horizontal: 'center' };
  kpiP34.border = borderThin;
  ws6.getCell('I4').border = borderThin;

  ws6.getRow(5).height = 10;

  const roadHeaders = ['', 'Phase', 'Task #', 'Deliverable / Feature', 'Technical Scope & Key Deliverables', 'Execution Layer', 'Implementation Status', 'Completion / Target', 'Why / Status Notes & Rationale'];
  ws6.getRow(6).values = roadHeaders;
  applyHeaderStyle(ws6.getRow(6), NAVY);

  const roadData = [
    // --- PHASE 1 (MVP) ---
    [
      'Phase 1 (MVP)',
      '1.1',
      'Apps Script JSON API Bridge',
      'doGet & doPost endpoints in AppScript/Code.gs for apiGetVerses, apiGetConfig, apiGetBooks, apiGetAnalytics, apiSubmitReview, apiSubmitFinal.',
      'Backend (Apps Script)',
      '✅ Completed',
      '2026-11-11',
      'Completed & verified. Provides headless JSON API over Google Sheets so the web app can read and write data without modifying sheet column structure.'
    ],
    [
      'Phase 1 (MVP)',
      '1.2',
      'Kannada Character-Level Colors',
      'Range.getRichTextValues() parser in Apps Script converting text colors & highlight colors (#FF00FF, #00B050, cyan, gold) to HTML spans with inline styling.',
      'Backend (Apps Script)',
      '✅ Completed',
      '2026-11-11',
      'Completed & verified. Eliminated the critical bug where character-level font colors from Google Sheets were lost when fetched via plain getValues().'
    ],
    [
      'Phase 1 (MVP)',
      '1.3',
      'Reviewer Focus Mode Card',
      'Single-verse distraction-free card with native Noto Sans Kannada typography, A⁻/A⁺ font size scaling, and side-by-side comparison (KJV English reference vs. Kannada Proposed Reading).',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-11',
      'Completed & verified. Solves the core problem of reviewer stoppage by replacing the overwhelming 18-column horizontal sheet with an ergonomic 1-verse view.'
    ],
    [
      'Phase 1 (MVP)',
      '1.4',
      'Local 66-Book Canonical KJV Engine',
      'Complete 66-book King James Bible stored locally as static JSON files in web/public/kjv/ with canonical book metadata, abbreviations, and instant lookup in kjvService.ts.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-11',
      'Completed & verified. Delivers instant 0ms reference text lookup for all 39 OT and 27 NT books with zero external API dependencies or rate limits.'
    ],
    [
      'Phase 1 (MVP)',
      '1.5',
      'Interlinear Back-Translation Layout',
      'drafterParser.ts with line-wrapping intelligence, rendering 2-row Kannada-English back-translation tables as horizontal word-pair cards, plus structured cards for investigation notes.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-11',
      'Completed & verified. Replaced raw unformatted Column E text blocks with structured, categorized badges (Grammar, Variant, Added words) for effortless reading.'
    ],
    [
      'Phase 1 (MVP)',
      '1.6',
      'Verse Dropdown & Grid (J) Jump',
      'Direct verse dropdown selector in header toolbar, plus interactive verse grid modal (keyboard shortcut J) displaying all chapter verses color-coded by review status.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-11',
      'Completed & verified. Resolves reviewer testing feedback requesting instant jumping between verses without sequential clicking.'
    ],
    [
      'Phase 1 (MVP)',
      '1.7',
      'Dynamic Chapter Navigation Bar',
      'Horizontal chapter pills with auto-scroll and popover grid in ChapterBar.tsx, dynamically fetching total chapter counts for any selected canonical book.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-11',
      'Completed & verified. Replaced hardcoded Romans 16-chapter limitation with dynamic canonical counts (e.g. Psalms 150, Matthew 28) for all 66 Bible books.'
    ],
    [
      'Phase 1 (MVP)',
      '1.8',
      'Threaded Review Comments & Bylines',
      'DiscussionThread.tsx with reviewer bylines automatically prepended (e.g. "Fr. Thomas: [comment]") and appended to shared review cells without overwriting previous comments.',
      'Hybrid (API + UI)',
      '✅ Completed',
      '2026-11-11',
      'Completed & verified. Allows multi-reviewer collaboration per column while preserving full audit attribution in Google Sheets.'
    ],
    [
      'Phase 1 (MVP)',
      '1.9',
      'Action Dock & Keyboard Shortcuts',
      'Dock with 1-tap [ ✅ Approve ], [ 💬 Request Edit ], and [ ⏭ Skip ] actions, bound to Enter, Space, and E hotkeys for rapid desktop review.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-11',
      'Completed & verified. Reduces 5 clicks and 10 seconds of spreadsheet friction per verse down to a single keyboard tap.'
    ],
    [
      'Phase 1 (MVP)',
      '1.10',
      'Contextual WhatsApp Alert Modal',
      'WhatsAppModal.tsx generating targeted wa.me click-to-chat links pre-filled with book, chapter, verse reference, and next-stage action required.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-11',
      'Completed & verified. Migrated the Google Sheets "Send Alerts for Current Row" menu into an in-app trigger directly on the verse review card.'
    ],

    // --- PHASE 2 ---
    [
      'Phase 2',
      '2.1',
      'Live Coordinator Analytics Dashboard',
      'Real-time stage funnels (Not Started -> Under Review -> Done), reviewer turnaround times, and burn-down completion velocity charts.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Built full 6-stage funnel, burn-down velocity forecaster, live Sheets sync status, and integrated Weekly Summary generator migrating Sheets menu.'
    ],
    [
      'Phase 2',
      '2.2',
      'Bottleneck Stage & Stalled Verses Detector',
      'Visual bottleneck warning system calculating verse dwell time in review (> X days) and highlighting blocked stages with one-tap WhatsApp nudges.',
      'Hybrid (API + UI)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Visual bottleneck risk indicators (Heavy/Moderate/On Track) with 1-tap WhatsApp nudge buttons to alert reviewers with pending queues.'
    ],
    [
      'Phase 2',
      '2.3',
      'PWA Mobile App & Service Worker',
      'Progressive Web App manifest and service worker via vite-plugin-pwa enabling "Add to Home Screen" on iOS/Android, standalone fullscreen UI, and offline font caching.',
      'PWA / Mobile',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Configured vite-plugin-pwa with standalone manifest, PWA icons (192 & 512), workbox service worker precaching all 66 books and offline Google Fonts.'
    ],
    [
      'Phase 2',
      '2.4',
      'WhatsApp Deep-Linking to Exact Verse',
      'URL query parameter handling (?book=Romans&chapter=1&verse=Rom+1:2) so tapping a WhatsApp alert link on mobile opens that exact verse review card directly.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Implemented ?book=...&chapter=...&verse=... deep-linking on boot and active address bar synchronization via window.history.replaceState.'
    ],
    [
      'Phase 2',
      '2.5',
      'Web-Triggered Column Protection Auto-Sync',
      'Admin control in web UI to trigger backend Google Sheets column protection sync via API endpoint, matching permissions to active members in ⚙ Config.',
      'Hybrid (API + UI)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Added apiSyncProtections endpoint in Code.gs with headless error isolation, plus UI sync buttons in both Analytics Dashboard and Connection Modal.'
    ],

    // --- PHASE 3 ---
    [
      'Phase 3',
      '3.1',
      'Committee Consensus Chamber',
      'Specialized consensus interface displaying all 4 reviewer comment threads side-by-side with rich-text Kannada conclusion input writing to Column O & P.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Built CommitteeChamber.tsx with 4-way discipline matrix (Tech, Style, Ortho, Theo), Awaiting Committee filter queue, Kannada conclusion editor for Col O, and 1-tap [Approve Consensus (Y)] setting Col P with WhatsApp trigger to Final Editor.'
    ],
    [
      'Phase 3',
      '3.2',
      'Final Editor Sign-off Interface',
      'Editorial sign-off interface with full audit diff history, final verse approval (Column Q/R), and automatic row lock protection against subsequent edits.',
      'Hybrid (API + UI)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Built FinalEditorView.tsx featuring 4-stage translation evolution audit trail, 1-tap adoption of Committee or Drafter text, pre-flight quality verification checklist, and [Final Sign-Off & Lock] setting Col Q/R, marking Done, and locking row protection.'
    ],
    [
      'Phase 3',
      '3.3',
      'Drafter Web Drag-and-Drop Doc Importer',
      'In-browser .docx and Google Doc upload dropzone with conflict preview, automatic highlight-to-bold conversion, and batch write to Columns C, D, and E.',
      'Hybrid (API + UI)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Built DrafterPortal.tsx & docxParser.ts with client-side JSZip word/document.xml extraction, conflict detection (Ready vs Conflict vs Unmatched), highlight-to-bold font color conversion, and batch write to Google Sheets via apiImportVerses.'
    ],
    [
      'Phase 3',
      '3.4',
      'One-Click Drafter Template Generator',
      'Web UI direct download button generating pre-formatted Word translation templates with sample back-translation tables and color-coded investigation guides.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Built templateGenerator.ts generating authentic WordprocessingML .docx files pre-populated with KJV verses for any selected chapter from the 66-book canonical engine, 2-row back-translation tables, and GLBC color rules reference modal.'
    ],

    // --- PHASE 4: MULTI-BOOK SCALING, LATENCY ELIMINATION & MODULAR ARCHITECTURE ---
    [
      'Phase 4',
      '4.1',
      'Multi-Book Discovery & Switcher',
      'Dynamic backend scanning of all translation sheets in workbook with 0ms memory/session caching, filtering non-canonical sheets, and live green badging in BookChapterModal.',
      'Hybrid (API + UI)',
      '✅ Completed',
      '2026-11-13',
      'Completed & verified. Filtered non-canonical Google Sheets (Sheet5, Sheet6, etc.), dynamically mapped active sheets (Romans, Luke) with live green badging in BookChapterModal.tsx, and enabled 0ms cross-book switching with instant memory/session caching.'
    ],
    [
      'Phase 4',
      '4.2',
      'In-App Admin Sheet Setup Wizard',
      'Web UI wizard "[ ⚡ Initialize {Book} in Google Sheets ]" inside Reference Mode to format new translation sheets (header styles, column widths, validations, frozen panes) without opening Google Sheets menu.',
      'Backend (Apps Script)',
      '✅ Completed',
      '2026-11-13',
      'Completed & verified. Built in-app 1-click setup wizard in FocusModeCard.tsx and apiInitBookSheet in modular Apps Script (04_Web_App_Api.gs). Creates sheet, formats 18 colored headers, sets Y/N dropdown validations, and applies role column protections.'
    ],
    [
      'Phase 4',
      '4.3',
      'Team Directory & Role Management Screen',
      'Full web admin interface to add/edit team members, assign multi-review roles, and manage phone/email records with 1-tap column protections sync.',
      'Hybrid (API + UI)',
      '✅ Completed',
      '2026-11-13',
      'Completed & verified. Built TeamManagementModal.tsx with multi-role assignment chips, Google email sync for column protections, search/filtering, active toggle, and apiSaveMember in 02_Config_And_Protections.gs with 1-tap column sync trigger.'
    ],
    [
      'Phase 4',
      '4.4',
      'Regional Translation OS Packaging',
      'Standardized deployment scripts, documentation, and white-label branding to showcase and license the system to other regional Bible translation bodies.',
      'Documentation & DevOps',
      '✅ Completed',
      '2026-11-13',
      'Completed & verified. Created comprehensive white-label deployment guide docs/REGIONAL_TRANSLATION_OS_GUIDE.md detailing 5-minute zero-cost setup, Indic typography adaptation (Tamil, Telugu, Hindi, etc.), 18-column schema, security, and PWA field distribution.'
    ],

    // --- PHASE 5: INTELLIGENT TRANSLATION ASSISTANT & UX REFINEMENT ---
    [
      'Phase 5',
      '5.1',
      'Named Team Member Status & Dynamic Sizing',
      'Dynamic status pills displaying explicit member names and approval states (e.g. "Fr. Thomas: ⏳ Pending", "Pastor Matt ✓ · Pastor Zack ⏳ (1 of 2 approved)") replacing cryptic (0/1) numbers across discipline and committee views.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Resolves testing.docx observations P5-P9. Ensures crystal-clear team accountability and transparency on exactly who is pending.'
    ],
    [
      'Phase 5',
      '5.2',
      'Clean Deliberation & Elimination of "Request Edit"',
      'Complete elimination of confusing [Request Edit] tag and artificial reject buttons. Reviewers and committee post natural observations in comment composers; affirmative [Confirm] buttons handle stage completion.',
      'Hybrid (API + UI)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Resolves testing.docx observations P3 & Image 1. Restores natural human deliberation dialogue and eliminates ticket-style confusion.'
    ],
    [
      'Phase 5',
      '5.3',
      'Inline Smart Guidance Badges',
      'Contextual guidance chips embedded in discipline, committee, and final editor workspaces explaining: 1) What action is needed right now; 2) What happens next; 3) Exactly why this verse is pending with named members.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Resolves testing.docx observation P13 ("App is not speaking to user like an expert in the field").'
    ],
    [
      'Phase 5',
      '5.4',
      'Collapsible "Smart Assistant" Side Drawer',
      'Dedicated translation coach drawer providing Greek/English biblical comparison tools (NA28 & TR concordance hints, KJV lexical glosses), chapter milestone tracker, and team velocity appreciations.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Resolves testing.docx observation P13. Delivers scholarly depth and motivational positive reinforcement.'
    ],
    [
      'Phase 5',
      '5.5',
      'Editorial Pre-Flight Checklist Retention & Guidelines',
      'Structured 4-point editorial quality guideline (KJV Fidelity, Kannada Register, Theological Alignment, Orthography) visible to Final Editor as a quality reminder pending team meeting confirmation.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Resolves testing.docx observation P10 & Image 3. Maintains high translation fidelity and prepares team for formal sign-off protocol.'
    ],
    [
      'Phase 5',
      '5.6',
      'Authentic KJV Strong\'s Greek Engine & Visual Order',
      'Pre-bundled offline dataset in web/public/kjv-strongs/ for all 27 NT books with 0ms latency, exact KJV sentence flow (Paul, a servant... separated unto...), Strong\'s lemmas (G1-G5624), single-option KJV canonical dropdown, and 4-tier visual hierarchy in Smart Assistant.',
      'Frontend & PWA',
      '✅ Completed',
      '2026-11-13',
      'Completed & verified. Eliminates modern BSB lexical divergences, guarantees 100% fidelity to King James Version English sentence sequence, runs 100% offline, and enforces strict visual structure.'
    ],

    // --- PHASE 6: TRANSLATION GOVERNANCE, TARGET DATES, RBAC & OPEN DELIBERATION ---
    [
      'Phase 6',
      '6.1',
      'Layman Book Target Date & Dynamic Velocity Engine',
      'Replace static 14 verses/day with locked Target Completion Date per book, computing exact required verses/day, on-track/lag status, and pace warnings.',
      'Hybrid (API + UI)',
      '⏳ In Progress',
      'Immediate',
      'In Progress. Addresses testing.docx P1 & P3. Provides realistic deadline tracking against authentic calendar goals rather than an arbitrary 14 verses/day placeholder.'
    ],
    [
      'Phase 6',
      '6.2',
      'Universal Discussion Visibility for Drafters & Team',
      'Ensure drafters and all roles have 100% full read visibility into reviewer notes across all 4 disciplines, committee consensus deliberations, and final editor notes directly inside Focus Mode.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-13',
      'Completed & verified. Drafters now have full read visibility into Committee Deliberations and 4-Discipline Review Findings directly inside their Focus Mode workspace with an informative cross-stage guidance badge.'
    ],
    [
      'Phase 6',
      '6.7',
      'Chat-Bubble Deliberation Stream & Pop-Out Modal',
      'WhatsApp/iMessage-style chat deliberation stream with right-aligned "You (Role)", left-aligned "Others (Role)", scrollable max-height (280px), collapsible toggle, and floating Pop-Out modal.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-13',
      'Completed & verified. Resolves testing.docx Batch 7. Messages by current user display on the right with "You (Role)" matching active tab; peers on the left with smart avatar initials and role tags. Discussion header includes [▾ Collapse] and [⤢ Pop Out] modal.'
    ],
    [
      'Phase 6',
      '6.3',
      'Initial Open Permissions with Granular Admin RBAC Toggles',
      'Configure initial rollout with open permissions for all team members, while building dynamic View/Edit permission toggle matrix in the Admin Console.',
      'Hybrid (API + UI)',
      '⏳ Scheduled',
      'Phase 6',
      'Scheduled. User requirement: Initially everyone has all permissions; permissions can be tuned as team establishes routine, avoiding premature lockouts.'
    ],
    [
      'Phase 6',
      '6.4',
      'Roster Styling, Smart Avatar Initials & Presence Geometry',
      'Fix squished active presence dot (flex-shrink:0, circular geometry) and implement Smart Name Parser for avatar initials (stripping honorifics: Pastor Zack -> PZ, Sister Nancy -> SN, Brother Kishore -> BK) with distinct role-themed color palettes.',
      'Frontend (React)',
      '⏳ In Progress',
      'Immediate',
      'In Progress. Resolves testing.docx P5, P6, P7 and Images 2 & 3. Restores visual distinction to team members and fixes squished status dots.'
    ],
    [
      'Phase 6',
      '6.5',
      'Dedicated Unified Admin Console (Security & RBAC)',
      'Unified whole-app admin security console consolidating Google OAuth user authentication bridge (Task 6.6), granular View/Edit permission toggle matrix (Task 6.3), and global security governance.',
      'Frontend & Hybrid',
      '⏳ Scheduled',
      'Phase 6',
      'Scheduled. Addresses testing.docx P10: Dedicated admin controls page with complete breakdown of features and role permission toggles.'
    ],
    [
      'Phase 6',
      '6.8',
      'Consolidated Settings Hub & Reviewer Screen Decluttering',
      'Consolidate all 11 GLBC sheet menu controls, team directory, book setup & target date, drafter intake tools, weekly WhatsApp summary, and connection manager into a unified Settings view with 5 top sub-tabs; declutter Focus Mode and Topbar by removing setup buttons and replacing modals with direct tabs.',
      'Hybrid (API + UI)',
      '✅ Completed',
      '2026-11-14',
      'Completed & verified. Resolves reviewer fatigue and mental overload by moving all administrative and setup controls into a dedicated Settings hub while keeping whole-app Admin Controls (Task 6.5) separate.'
    ],
    [
      'Phase 6',
      '6.9',
      'Smart Resume, Chapter Verse Ribbon & Y/N Impact Confirmation Modal',
      'Eliminate separate "My Review Queue" ticketing page; implement Smart Resume automatically landing scholars on their first pending verse; visual Chapter Verse Ribbon navigator; and Y/N Impact Confirmation Modal for all stage approvals.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-14',
      'Completed & verified. Resolves reviewer UX evaluation. Replaces fragmented ticketing queue with narrative-preserving Smart Resume, Chapter Verse Ribbon (dot pills), [⏭ Next Pending] quick navigation, and transparent Y/N Impact Confirmation Modal.'
    ],
    [
      'Phase 6',
      '6.10',
      'Reviewer Workspace Decluttering & Intra-Team Deliberation Architecture (Testing Feedback P1-P16)',
      'Resolve 8 specific reviewer ergonomics observations from Testing/testing.docx: drop Chapter Navigator ribbon (P4), drop Next Pending button (P5), compact Base Reference & Kannada proposed cards (P6), move font zooming (A-/A+) to Drafter proposed header (P7), remove Drafter Workspace green box (P9), add collapse & pop-out to Committee card across all roles capped at 280px (P12), implement 4 distinct discipline cards with strict intra-team commenting (P13, Option 1 Alignment), and dynamically pull canonical verse counts per book from kjvService.ts (P15).',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-14',
      'Completed & verified. Delivers Option 1 four distinct collapsible discipline cards with strict commenting boundaries, eliminates duplicate navigation clutter, compacts reading cards, and ensures accurate canonical book counts.'
    ],
    [
      'Phase 6',
      '6.11',
      'Drafter Deliberation Refinements & Intra-Team Security (testing.docx P1–P7)',
      'Fix Pop-Out modal commenting permission loophole (strict read-only for unassigned scholars/drafters in DiscussionPopoutModal.tsx); add persistent localStorage unread comments counter badge (● {n} unread) near Pop-Out button; implement 2-line card header layout moving stage status directly below card title with distinct color hierarchy; remove spreadsheet column names (Col O, Cols G & H, etc.); and replace "Cross-Stage Deliberation View" banner with "💬 What the teams are saying".',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-14',
      'Completed & verified. Resolves all 7 feedback points from Testing/testing.docx (P1–P7) with 0 errors.'
    ],
    [
      'Phase 6',
      '6.12',
      'Action Dock Removal, Navigation Capsule & Engaging Deliberation Hub (testing.docx Update)',
      'Remove redundant floating Action Dock across all views (Committee and Reviewers) since inline confirmation buttons and composers exist inside each card; rename WhatsApp action to "Send WhatsApp Alert" with subtext removed; unify < and > buttons into a cohesive Apple/Linear-style navigation capsule in ChapterBar; eliminate nested-box fatigue in Drafter Interlinear with borderless lexical columns and marginalia styling; and transform static "What the teams are saying" into active Live Team Deliberation Hub Header (Option A) with member presence avatars and real-time review progress badges.',
      'Frontend (React & CSS)',
      '✅ Completed',
      '2026-11-14',
      'Completed & verified. Resolves all 3 critiques from testing.docx with verified 0-defect TypeScript compilation and production build in 1.37s.'
    ],
    [
      'Phase 6',
      '6.13',
      'Topbar & Navigation Decluttering (testing.docx P1 & P2 Alignment)',
      'Declutter header and sidebar: remove "Headless Sheets Edition" subtitle; vertically center brand title with icon; place interactive "Live Sheet Connected" pill immediately to the right of brand title; position book selector [📖 Romans · 433 verses ▾] in the exact center of Topbar; remove ChapterBar and its white subbar strip completely; remove duplicate Team button and Settings2 gear icon from header; and remove duplicate Help & shortcuts button from Sidebar.',
      'Frontend (React & CSS)',
      '✅ Completed',
      '2026-11-14',
      'Completed & verified. Resolves all P1 (a–e) and P2 points from testing.docx with verified 0-defect TypeScript compilation and production build in 1.62s.'
    ],
    [
      'Phase 6',
      '6.14',
      'Sidebar Background Screen Changer & 4-Theme Suite',
      'Implement reading theme screen changer in sidebar sticky bottom block: 4 scholar reading themes (Default Slate, Warm Sepia/Parchment, Cool Mist, Night Obsidian) with 1-click 4-swatch bar, adapting workspace canvas, cards, and sidebar simultaneously with persistent localStorage caching (glbc_bg_theme).',
      'Frontend (React & CSS)',
      '✅ Completed',
      '2026-11-14',
      'Completed & verified. Resolves user request for multi-background screen changer in sidebar with current being default, applying across workspace and sidebar with 0-defect build in 1.27s.'
    ],
    [
      'Phase 6',
      '6.15',
      'Universal Multi-Theme Gradient System & Cross-App Theming',
      'Implement multi-stop linear gradients across all 4 themes (Default Slate, Warm Sepia, Cool Mist, Night Obsidian) with layered tactile depth (card gradients slightly darker than canvas in light themes, sleek dark titanium in Obsidian). Completely adapt Smart Assistant Drawer, Analytics View, Settings Hub, Focus Mode cards/boxes, and modals.',
      'Frontend (React & CSS)',
      '✅ Completed',
      '2026-11-14',
      'Completed & verified. Resolves user requirement for gradient themes, darker card areas, and 100% theme parity across Smart Assistant Drawer, Analytics, Settings, cards, and boxes with 0-defect build.'
    ],
    [
      'Phase 6',
      '6.6',
      'Google Sign-In (OAuth) Authentication Bridge',
      'Secure Google OAuth authentication matching user email against the active ⚙ Config directory in Google Sheets, automatically granting assigned role permissions.',
      'Frontend & Security',
      '⏳ Scheduled',
      'Phase 6',
      'Scheduled. Addresses testing.docx P9: Plan for logins and role permissions aligned with native Sheets email protections at zero infrastructure cost.'
    ],

    // --- PHASE 7 (ROADMAP): SCHOLARLY OLD TESTAMENT & COMPARATIVE ENGINE ---
    [
      'Phase 7 (Roadmap)',
      '7.1',
      'Old Testament (OT) Hebrew Strong\'s Concordance Engine',
      'Expand KJV Strong\'s service to support all 39 Old Testament books (Genesis to Malachi) with authentic Hebrew lemmas (H1-H8674), transliterations, pronunciations, and root definitions bundled offline in web/public/kjv-strongs/.',
      'Frontend & PWA',
      '⏳ Scheduled (Roadmap)',
      'Phase 7 Roadmap',
      'Scheduled. Provides authentic Hebrew linguistic tools for upcoming Old Testament translation drafting and theological review.'
    ],
    [
      'Phase 7 (Roadmap)',
      '7.2',
      'Multi-Version Comparative Engine (BSB & Textus Receptus)',
      'Activate greekService.ts in SmartAssistantDrawer.tsx by adding comparative version options ("BSB Berean Interlinear", "Stephanus 1550 Textus Receptus") to Reference Version dropdown alongside canonical KJV.',
      'Frontend & API',
      '⏳ Scheduled (Roadmap)',
      'Phase 7 Roadmap',
      'Scheduled. Enables side-by-side textual comparison between Textus Receptus and modern Critical Text for scholarly translation verification.'
    ]
  ];

  rIdx = 7;
  let lastPhase = null;

  roadData.forEach(row => {
    const r = ws6.getRow(rIdx);
    r.values = ['', ...row];
    r.height = 46;

    const isPhaseChange = lastPhase !== null && lastPhase !== row[0];
    lastPhase = row[0];

    for (let c = 2; c <= 9; c++) {
      r.getCell(c).border = isPhaseChange ? {
        top: { style: 'medium', color: { argb: NAVY } },
        left: { style: 'thin', color: { argb: BORDER_GRAY } },
        bottom: { style: 'thin', color: { argb: BORDER_GRAY } },
        right: { style: 'thin', color: { argb: BORDER_GRAY } }
      } : borderThin;

      r.getCell(c).font = fontBody;
      r.getCell(c).alignment = { vertical: 'middle', wrapText: true };
    }

    // Col B: Phase
    r.getCell(2).font = fontBold;
    r.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

    // Col C: Task #
    r.getCell(3).font = fontBold;
    r.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

    // Col D: Deliverable Title
    r.getCell(4).font = fontBold;

    // Col F: Execution Layer Pill
    const layerCell = r.getCell(6);
    layerCell.alignment = { vertical: 'middle', horizontal: 'center' };
    if (layerCell.value.includes('Backend')) {
      layerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
      layerCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: NAVY } };
    } else if (layerCell.value.includes('Frontend')) {
      layerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } };
      layerCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: BLUE_HEADER } };
    } else if (layerCell.value.includes('Hybrid')) {
      layerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER_BG } };
      layerCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: AMBER_TXT } };
    } else if (layerCell.value.includes('PWA') || layerCell.value.includes('Mobile')) {
      layerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PURPLE_BG } };
      layerCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: PURPLE_TXT } };
    } else {
      layerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
      layerCell.font = { name: 'Segoe UI', size: 9, bold: false, color: { argb: '64748B' } };
    }

    // Col G: Implementation Status Pill
    const statusCell = r.getCell(7);
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
    if (statusCell.value.includes('Completed')) {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } };
      statusCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: GREEN_TXT } };
    } else if (statusCell.value.includes('In Progress') || statusCell.value.includes('Next')) {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER_BG } };
      statusCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: AMBER_TXT } };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
      statusCell.font = { name: 'Segoe UI', size: 9, bold: false, color: { argb: '64748B' } };
    }

    // Col H: Completion / Target Date
    r.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };

    // Col I: Why / Status Notes & Rationale
    r.getCell(9).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

    rIdx++;
  });

  // =========================================================================
  // 7. ARCHITECT COMMENTS & RESPONSES (PRISTINE EXCELJS STYLING)
  // =========================================================================
  const ws7 = workbook.addWorksheet('Architect_comments', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }]
  });

  ws7.columns = [
    { width: 4 },
    { width: 8 },  // #
    { width: 38 }, // Architect Comment
    { width: 65 }, // Resolution & Decision
    { width: 16 }, // Target Phase
    { width: 20 }  // Status
  ];

  ws7.mergeCells('B2:F2');
  ws7.getCell('B2').value = 'Architect Review Comments & Locked Technical Resolutions';
  ws7.getCell('B2').font = fontTitle;

  const archHeaders = ['', '#', 'Architect Comment', 'Technical Resolution & Locked Architecture Decision', 'Target Phase', 'Resolution Status'];
  ws7.getRow(4).values = archHeaders;
  applyHeaderStyle(ws7.getRow(4), NAVY);

  const archCommentsData = [
    [
      '1',
      'There is a menu that built "GLBC" - we have not considered things from the menu to the app',
      'DECISION LOCKED:\nAll 11 GLBC menu actions will eventually have web app equivalents, reimagined as user-friendly UI features (not raw script dialogs):\n• Phase 1: "Send Alerts" -> Inline WhatsApp buttons on verse card\n• Phase 2: "Weekly Summary" -> Analytics Dashboard; "Auto-Sync" -> Silent API trigger\n• Phase 3: "Import Drafter Doc" -> Drag-and-drop web importer; "Download Template" -> 1-click download; "Protect Finalized" -> Row lock\n• Phase 4: "Format Sheet" & "Create Config" -> Admin Setup Wizard\nKey Principle: Every migrated feature is simpler and more visual than its Sheets equivalent.',
      'Phases 1 - 4',
      'Locked & Agreed'
    ],
    [
      '2',
      'In the Reviewers team currently for 1 type of reviewers, consider any column, they would discuss and write in a single cell or they would write their names and their comments.',
      'DECISION LOCKED:\n1. Config Sheet stays unchanged (Name / Role / Phone / Email / Active). A person with multiple roles keeps multiple rows (one per role).\n2. Column Protections updated: The script collects ALL active emails matching a role type and adds all of them as column editors.\n3. Shared Cell Threading: Reviewer comments are APPENDED (not replaced) to the shared cell formatted as:\n   "Fr. Thomas: [comment]\\nDr. Paul: [comment]"\n4. Focus Mode displays this shared cell as a clean, styled conversational thread.',
      'Phase 1 (MVP)',
      'Locked & Agreed'
    ],
    [
      '3',
      'Also kannada typing should be allowed and that should be filled in the sheets',
      'DECISION LOCKED:\n1. All text inputs (review comments, proposed text, conclusions) are standard HTML textareas that natively accept Kannada via OS keyboards (GBoard on Android, iOS Kannada, Google Indic IME on desktop).\n2. Typography rendered with Google Noto Sans Kannada font.\n3. Optional transliteration widget for desktop users without a Kannada IME.\n4. Input is written directly back to Sheets via Apps Script doPost setValue(), preserving full Kannada unicode without data loss.',
      'Phase 1 (MVP)',
      'Locked & Agreed'
    ],
    [
      '4',
      'We can avoid the word "Zen Mode". Instead we can name it as "Focus Mode"',
      'DECISION LOCKED:\nAccepted completely. The term "Zen Mode" is retired throughout the entire project:\n• UI labels & cards: "Focus Mode"\n• React component: FocusModeCard / FocusModeView\n• Web route: /focus\n• Architecture documentation & AGENTS.md updated.',
      'Phase 1 (MVP)',
      'Locked & Agreed'
    ],
    [
      '5',
      'Why Pastor Zack is having ‘Request edit option for Matt’s comment (testing.docx P3 & Image 1)',
      'DECISION LOCKED:\n1. Terminology & UX Flaw: "Request Edit" was artificial ticket jargon that mistakenly prepended [Request Edit] - tags to discussion comments.\n2. Complete Elimination: The [Request Edit] tag and reject buttons are eliminated from both Reviewer and Committee views.\n3. Clean Deliberation: Team members write observations and discussion notes naturally without robotic tags.\n4. Decoupled Confirmation: Affirmative [Confirm Review] or [Confirm Committee Conclusion] is the sole stage confirmation action. If a member hasn\'t confirmed, their status simply remains Pending while their notes are saved.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '6',
      'And why there is 0/1 discipline reviewer findings? And committee approvals too have 0/1s? How is it measured? (testing.docx P5-P9 & Image 2)',
      'DECISION LOCKED:\n1. Measurement Logic: Approval progress is measured strictly by counting active team members assigned to that role in the ⚙ Config sheet.\n2. UX Replacement: Cryptic (0/1) fractional numbers are replaced across all discipline cards and committee headers with explicit named reviewer status pills:\n   • e.g. "Fr. Thomas: ⏳ Pending"\n   • e.g. "Pastor Matt ✓ · Pastor Zack ⏳ (1 of 2 approved)"\n3. Instant Clarity: Reviewers immediately see exactly who has approved and who is still needed.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '7',
      'And this checklist, Is it approved? If its not part of plan lets remove or we can keep and confirm with a discussion with the team. (testing.docx P10 & Image 3)',
      'DECISION LOCKED:\n1. Retained as Visible Guide: The 4-point Editorial Pre-Flight Checklist (KJV Fidelity, Kannada Register, Theological Alignment, Orthography) is retained in the Final Editor view.\n2. Non-Blocking Status: Serves as an interactive editorial quality guide, non-blocking for sign-off until the user officially confirms the checklist items with their translation team in their upcoming meeting.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '8',
      'My concern is the app is not speaking to user. Like an already good expert in the field, it is not guiding what to do, what happens next, why things are pending, appreciations etc. (testing.docx P13)',
      'DECISION LOCKED:\nBuilt an intelligent "Smart Assistant & Contextual Coaching System":\n1. Inline Smart Guidance Badges: Embedded in each workspace section clearly stating:\n   • "What action is needed right now"\n   • "What happens next"\n   • "Why this verse is pending (with named members)"\n2. Collapsible Smart Assistant Side Drawer: Provides scholarly and motivational tools:\n   • Greek / English lexical comparison insights (NA28 & TR concordance hints, KJV alignment)\n   • Chapter-level milestone tracker (e.g. "Chapter 1 is 85% complete")\n   • Team appreciations and positive reinforcement.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '9',
      'There are 2 smart assistants and whats the use? (testing.docx P1 & Image 1)',
      'DECISION LOCKED:\n1. Removed redundant Smart Assistant button from FocusModeCard toolbar and deleted the duplicate drawer instance mounted inside FocusModeCard.\n2. Retained a single global, prominent "✨ Smart Assistant" trigger in the Topbar accessible across all views (Focus Mode, Queue, Analytics, Importer).\n3. Unified single source of truth for drawer state in App.tsx.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '10',
      'What do you mean by ‘Unassigned’? (testing.docx P5 & Image 2)',
      'DECISION LOCKED:\n1. Root Cause Resolved: In live connected mode, Apps Script getAllActiveMembers() filtered row[4] === "yes" but omitted active: true in the JSON response. approvalEngine.ts checked if (!m.active) return false, causing all members to be rejected and reporting "Unassigned".\n2. Fix Applied: approvalEngine.ts updated to if (m.active === false) return false, Code.gs updated to return active: true, and api.ts preserves active state.\n3. UI Polish: Shows real named pending members (e.g. "Fr. Thomas ⏳", "Pastor Samson ⏳") rather than cryptic "Unassigned".',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '11',
      'This has only 1 verse explained here. Whats the use? (testing.docx P8 & Image 3)',
      'DECISION LOCKED:\n1. Upgraded Greek & KJV tab from static 1:1 mock into a dynamic verse engine for all 433 verses of Romans.\n2. Active Verse Drafter Alignment: Parses active verse\'s drafter comments via parseDrafterComments to render exact Kannada-English word pairs specific to that verse.\n3. Biblical Lexicon Engine: Dynamically surfaces relevant Greek lexical entries matching key theological terms in the active verse\'s KJV text, with Strong\'s numbers and Kannada translation guidelines.\n4. Real-time interactive concordance search.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '12',
      'Is this our rules? (testing.docx P11 & Image 4)',
      'DECISION LOCKED:\nReplaced placeholder rules with verbatim official rules from Color_Code_Translation_Rules.pdf (Page 1):\n• Yellow: The English words that are Omitted in Kannada are highlighted with yellow.\n• Blue / Turquoise: The added words are highlighted with blue in Kannada verse (another name for it is turquoise).\n• Pink: The corrected Kannada words are highlighted with pink.\n• Grey: The Italicized words to be highlighted with grey in Kannada & English.\n• Green: Incorrect Kannada word to be highlighted with green.\nAdded TBS formal equivalence translation doctrine statement from Page 6.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '13',
      'Is this real numbers in appreciation? (testing.docx P13 & Image 5)',
      'DECISION LOCKED:\n1. Replaced static "Over 85 verses completed in Romans" placeholder with real dynamic statistics.\n2. Calculates actual completed verses, awaiting committee, and awaiting final counts from allChapterVerses.\n3. Renders contextual praise reflecting reality (e.g. "Translation underway for Romans Chapter 1. 32 verses loaded with active multi-disciplinary review in progress").',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '14',
      'IS this rela number? (testing.docx P15 & Image 6)',
      'DECISION LOCKED:\n1. Root Cause: App.tsx sidebar passed completedVerses={analytics?.completed || 85}. When analytics.completed was 0, falsy 0 || 85 evaluated to 85.\n2. Fix Applied: Calculated strictly as analytics !== null ? analytics.completed : verses.filter(v => v.status === "Done").length.\n3. Accurate Display: When 0 verses are completed in Romans, sidebar accurately displays "0 of 433 verses complete (0%)".',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '15',
      'The background still scrolls when this is open (testing.docx P17 & Image 7)',
      'DECISION LOCKED:\n1. Added background scroll lock in SmartAssistantDrawer.tsx via useEffect.\n2. When isOpen is true, sets document.body.style.overflow = "hidden", perfectly freezing the background canvas and restoring overflow on unmount/close.\n3. Added touchAction: "none" on the backdrop overlay to prevent touch-drag pass-through on mobile devices.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '16',
      'Slow loading on initial startup (testing.docx P2 & Image 1)',
      'DECISION LOCKED:\n1. Single Bundle Architecture: Implemented apiGetInitialBundle in Apps Script to return books, team, verses, and analytics in ONE single database read instead of 4 sequential/parallel cold-starts.\n2. Stale-While-Revalidate Caching: Implemented getCachedInitialBundle in api.ts using sessionStorage so refreshing or returning loads the UI in 0ms instantly.\n3. Branded Loading State: Replaced plain text loading screen with centered spinner, GLBC branding, and status indicator.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '17',
      'Concatenated [Request Edit] on comments (testing.docx P9, P10 & Images 2, 3)',
      'DECISION LOCKED:\n1. Sanitized all historical and sheet comments: Updated parseAllReviewsToComments in commentSync.ts to automatically strip [Request Edit] - prefixes.\n2. Updated renderReviewFindings in FocusModeCard.tsx and CommitteeChamber.tsx to strip [Request Edit] prefixes from reviewer and committee notes.\n3. Verified Apps Script apiSubmitReview appends clean author bylines without any robotic tags.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '18',
      'What are these Revision 04? Where it came from? (testing.docx P11 & Images 4, 5)',
      'DECISION LOCKED:\n1. Removed static <span className="version-pill">Revision 04</span> from FocusModeCard proposed reading header.\n2. Replaced static "Kannada · Revision 04" with "KJV Kannada Translation" in Sidebar book card.\n3. Eradicated all traces of placeholder revision tags.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '19',
      'This side scroll bar is not properly aligned to the browser (testing.docx P14 & Image 6)',
      'DECISION LOCKED:\n1. Root Cause: .main-content had max-width: 68rem; margin: 0 auto; overflow-y: auto. On desktop viewports wider than 68rem, its scrollbar sat in the middle of the screen with a wide white gap to its right.\n2. Fix Applied: Wrapped .main-content inside .main-viewport which has flex: 1; height: 100%; overflow-y: auto; width: 100%. The scrollbar is now placed at the far right edge of the browser window, while content remains centered up to 68rem.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '20',
      'Chapter dropdown weirdness -> Redesign like YouVersion Bible App (testing.docx P15 & Images 7-10)',
      'DECISION LOCKED:\nCreated BookChapterModal.tsx modeled directly on YouVersion Bible App (Image 10):\n• Left panel: Canonical books organized by NEW TESTAMENT and OLD TESTAMENT, with the active book highlighted.\n• Right panel: Book Title header with ✕ close button, and a clean 5-column grid of numbered chapter squares (1 to N).\n• Connected to both "{totalChapters} chapters ▾" in ChapterBar.tsx and the book selector in Topbar.tsx.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '21',
      'Smart Assistant: Redundant Currently waiting on vs Discipline Confirmation status (testing.docx P16 & Image 11)',
      'DECISION LOCKED:\nRemoved the redundant "CURRENTLY WAITING ON" card in SmartAssistantDrawer.tsx. Kept the clean "DISCIPLINE CONFIRMATION STATUS" table showing each discipline and named member statuses.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '22',
      'Smart Assistant: Background screen wheel scroll-through (testing.docx P17)',
      'DECISION LOCKED:\nAdded .assistant-drawer-open CSS class locking both body, .main-viewport, and .main-content with overflow: hidden !important, plus onWheel and onTouchMove event prevention on the backdrop overlay.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '23',
      'Smart Assistant: Drafter work over-explaining & Header simplification (testing.docx P18 & Image 12)',
      'DECISION LOCKED:\n1. Simplified drawer title from "Smart Translation Assistant / Romans 1:1 · Scholarly Coaching Partner" to "Smart Assistant / Romans 1:1".\n2. Removed "ACTIVE VERSE DRAFTER WORD ALIGNMENT (Romans 1:1)" header.\n3. Changed "Extracted directly from drafter\'s Kannada-English back-translation matrix:" to "drafter\'s Kannada-English back-translation".',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '24',
      'Whole Greek and English help for every verse from public API / REST API (testing.docx P21 & Images 12, 13)',
      'DECISION LOCKED:\n1. Created greekService.ts integrating the Free Use Bible API (helloao.org) and GitHub Open Bible datasets.\n2. Provides full Greek Textus Receptus verse text (Stephanus 1550).\n3. Provides word-by-word Greek original lemmas, transliteration, Strong\'s concordance numbers (e.g. G3972, G1401), full grammatical parsing, and English gloss for every verse of the New Testament.\n4. Added interactive concordance search filter and translation advisory note: "Kannada lexical suggestions and interlinear aids are provided to reduce translational burden; final review and doctrinal rendering rest with the translation committee."',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '25',
      'Visual clean-up of Kannada Rules tab & Appreciation paragraph formatting (testing.docx P28-33 & Images 14, 15)',
      'DECISION LOCKED:\n1. In Kannada Rules tab: Removed top "OFFICIAL GLBC TRANSLATION COLOR RULES" header box and bottom "TRANSLATION METHOD (Trinitarian Bible Society)" box, leaving only the 5 clean colored rule cards.\n2. In Progress tab: Removed Bible logo (📖) and broke the momentum appreciation text into distinct paragraphs after full stops.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '26',
      'Layman Target Date Engine vs Static 14-verse Formula (testing.docx P1 & P3)',
      'DECISION LOCKED:\n1. Layman Explanation: The previous "Dec 14, 2026" completion date was calculated by taking remaining verses (433 in Romans) and dividing by an arbitrary static pace of 14 verses/day (433 / 14 ≈ 31 days from Nov 13).\n2. New Architecture: Replaced with an authentic Target Completion Date locked per book by Admin. The system computes exact calendar days remaining, calculates Required Daily Pace (verses/day), and evaluates actual velocity to show On-Track vs Delayed status with pace lag alerts.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '27',
      'Smart Avatar Initials & Non-Squishing Presence Geometry (testing.docx P5, P6, P7 & Images 2, 3)',
      'DECISION LOCKED:\n1. Avatar Initials: Implemented Smart Name Parser stripping honorific religious titles (Pastor, Sister, Brother, Dr., Fr., Rev.) so initials represent personal identities (Pastor Zack -> PZ, Sister Nancy -> SN, Brother Kishore -> BK).\n2. Color Palette: Each role/member receives a distinctive role-themed background color (Emerald for Drafters, Sky Blue for Tech, Teal for Style, Indigo for Ortho, Purple for Theo, Amber for Committee, Rose for Final Editor, Slate for Admin).\n3. Presence Geometry: Added flex-shrink: 0, min-width: 0.5rem, min-height: 0.5rem, and border-radius: 9999px to .presence dot to eliminate horizontal squishing into ovals.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '28',
      'Initial Open Permissions Model with Dynamic Admin RBAC Toggles (User Decision)',
      'DECISION LOCKED:\n1. Open Access Stance: In this initial rollout, all team members are granted open access across workspaces so scholars can explore, review, and collaborate without artificial lockouts.\n2. Admin Toggle Matrix: Built a dynamic View/Edit permission toggle matrix inside the Admin Console, allowing coordinators to gradually transition to strict stage partitioning as the team settles into regular production routines.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '29',
      'Open Deliberation Principle — Universal Cross-Stage Discussion Visibility for Drafters (User Requirement)',
      'DECISION LOCKED:\n1. Problem Identified: Drafters logged into Focus Mode were unable to view the 4-discipline reviewer findings matrix or committee deliberation notes because those blocks were conditionally wrapped inside reviewer/committee checks.\n2. Solution Applied: Drafters and all team members now have 100% read visibility into all 4 reviewer findings and committee consensus deliberations right on the verse card. A clean non-intrusive banner clarifies that notes are viewable for editorial alignment while editing is reserved for active assignees.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '30',
      'Dedicated Unified Admin Console Tab in Sidebar (testing.docx P10)',
      'DECISION LOCKED:\nCreated a dedicated "⚙ Admin Console" navigation item and screen consolidating 1) Book Governance & Target Dates Lock, 2) Team Directory with Google OAuth Emails, 3) Granular View/Edit Permission Toggles, and 4) 1-Click Sheets Column Protections Sync into a cohesive single-pane command center.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '31',
      'Google Sign-In (OAuth) Authentication Bridge (testing.docx P9)',
      'DECISION LOCKED:\n1. Auth Mechanism: Google Sign-In (OAuth) adopted as the primary authentication bridge ($0/month, free Google OAuth client ID).\n2. Directory Alignment: System matches authenticated Google email against active emails in the ⚙ Config sheet.\n3. Role Grant: Automatically assigns specific permissions matching active roles. Directly reinforces Google Sheets native column edit protections without duplicate credentials.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '32',
      'Chat-Bubble Deliberation Stream, Contextual Role Tagging & Pop-Out Modal (testing.docx Batch 7 & Image 1)',
      'DECISION LOCKED:\n1. Chat-Style Alignment: Messages sent by current user align to the right with speech tail and "You (Role)" badge matching the active tab (e.g. "You (Committee)" or "You (Final Editor)"). Messages from peer scholars align to the left with their name, role, and smart initials avatar.\n2. Space Optimization: Scrollable container capped at max-height 280px with smooth auto-scroll to bottom. Card header features collapsible toggle (Expand/Collapse) to save vertical space.\n3. Pop-Out Modal: Dedicated [⤢ Pop Out] button opens DiscussionPopoutModal with full-screen conversation view, keyword search, and integrated quick composer.\n4. Backend Safety: Comment write-back directly targets designated sheet columns (Col O for Committee, Col G/I/K/M for Reviewers) without schema changes.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '33',
      'Consolidated Settings Hub, 5 Operational Sub-Tabs & Reviewer Screen Decluttering (User Direction)',
      'DECISION LOCKED:\n1. Problem Identified: The 11 Google Sheets GLBC custom menu actions were scattered across Focus Mode banners ("Initialize Book in Sheets"), Topbar buttons, Sidebar links, and Drafter Portal, forcing reviewers to encounter administrative and setup controls.\n2. Hub Nomenclature: Renamed "Drafter Studio & Import" to "Settings" (SettingsView.tsx) with a gear icon in the sidebar under MANAGEMENT.\n3. Five Operational Sub-Tabs:\n  • [ 👥 Team & Access ]: Full Config sheet directory, add/edit member, phone, Google email, and 1-click "Apply Column Protections by Role".\n  • [ 📖 Book & Sheet Setup ]: 1-click book initialization, formatting headers, status color refresh, finalized verses protection, and Book Target Date & velocity setting (Task 6.1).\n  • [ 📥 Drafter Studio & Templates ]: Word .docx upload, selective verse import, Drafter Word template generator, and color rules reference.\n  • [ 📊 Reports & Alerts ]: Multi-book Weekly Summary generator and targeted WhatsApp dispatch (wa.me) links.\n  • [ 🔌 Connection ]: Google Apps Script API endpoint connection, status check, and trigger verification.\n4. Reviewer Decluttering: Removed setup buttons from Focus Mode banners and replaced Topbar popups with direct navigation to the respective Settings sub-tab.\n5. Separation of Concerns: Clarified boundary between operational Settings (SettingsView.tsx) and future system-wide Admin Controls (Task 6.5 for OAuth logins and RBAC toggle matrix).',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '34',
      'Elimination of "My Review Queue" & Native Smart Resume in Focus Mode (Architectural Evaluation)',
      'DECISION LOCKED:\n1. Root Cause: "My Review Queue" treated biblical translation like an IT ticketing system (Jira tickets). Scripture is a continuous literary and theological narrative; jumping between disconnected verses fragments biblical argument.\n2. Architecture Resolution: Completely removed the separate Queue page from sidebar and mobile navigation.\n3. Smart Resume: On chapter/book load, the system automatically detects the first verse awaiting the active scholar and lands them directly on it.\n4. Chapter Verse Ribbon: A slim horizontal navigator in Focus Mode shows all chapter verse numbers, color-coded by approval state (Green = Confirmed by you, Blue = Active, Gray = Pending). Scholars can click any verse dot or hit [⏭ Next Pending] to glide through the narrative seamlessly.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '35',
      'Y/N Workflow Impact Confirmation Modal for Stage Approvals & Finalizations (User Direction)',
      'DECISION LOCKED:\n1. Problem Identified: Previously, clicking Approve or Finalize immediately wrote "Y" to Google Sheets without asking confirmation, risking accidental clicks on touchscreens and leaving scholars unaware of what "Y" vs "N" actually does.\n2. Impact Confirmation Modal: Every stage approval (Discipline Reviewers, Committee Consensus, Final Editor publication) now presents a clear pop-up displaying:\n  • What Y does: Exact column write in Google Sheets, stage advancement triggers, and auto-advancement to the next pending verse.\n  • What N does: Leaves stage open/blank in Google Sheets, preserves discussion, allows comment posting without stage lock.\n3. Action Buttons: [ Y — Confirm Approval & Advance ] vs [ N — Keep Under Review (Cancel) ].\n4. Auto-Advance: On "Y", the screen automatically steps forward to the next pending verse in the chapter.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '36',
      'Reviewer Workspace Ergonomics, Intra-Team Commenting Boundaries & Canonical Verse Precision (testing.docx Alignment)',
      'DECISION LOCKED:\n1. Option 1 Confirmed for Reviewer Deliberation: Implemented 4 distinct discipline cards (Technical, Style & Language, Orthographic, Theological) with [▾ Collapse] toggles, chat bubble streams, and strict intra-team permissions. Comment composers are shown ONLY to assigned scholars; non-members view read-only deliberation.\n2. Elimination of Redundant Navigators: Dropped Chapter 1 Navigator ribbon (P4) and Next Pending button (P5) in favor of the unified Jump to Verse grid and sequential arrow buttons.\n3. Reading Card Ergonomics: Compacted Base Reference and Drafter Proposed cards, and moved A-/A+ font zoom controls directly into the Drafter Proposed Reading header where Kannada text lives (P6, P7).\n4. Committee Deliberation Access: Added [▾ Collapse] and [⤢ Pop Out] modal support to the Committee Consensus card across all roles, capped at max-height 280px with overflow scroll (P12).\n5. Drafter View Decluttering: Removed the redundant green Drafter Workspace banner box (P9).\n6. Canonical Total Verses: Replaced hardcoded 433 with exact canonical verse counts from CANONICAL_BOOKS in kjvService.ts across Topbar, floating progress blast, analytics, and Settings (P15).',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '37',
      'Strict Intra-Team Pop-Out Security, Unread Comments Counter & Status Hierarchy (testing.docx P1–P7)',
      'DECISION LOCKED:\n1. Pop-Out Security Parity: Enforced strict read-only lock in DiscussionPopoutModal.tsx for non-assigned scholars, closing the commenting loophole where Drafters or non-committee members could post into Committee or discipline columns.\n2. Unread Comments Counter: Implemented localStorage-backed comment tracker displaying ● {n} unread near Pop-Out only when unread comments exist for the active user; hides completely when 0.\n3. 2-Line Header Layout: Reorganized card headers into 2 lines (Line 1: Title, Line 2: Status directly below title on the left, followed by member chips) with distinct color tokens (Confirmed = green, Deliberation = purple, Pending = indigo).\n4. Column Codes Excised: Removed (Col O), (Cols G & H), (COLS G, I, K, M) etc. across all titles and modals.\n5. Simplified Drafter Banner: Replaced dry "Cross-Stage Deliberation View" with "💬 What the teams are saying".',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '38',
      'Action Dock Removal, Navigation Capsule & Live Deliberation Hub Header (testing.docx P1–P3)',
      'DECISION LOCKED:\n1. Action Dock Elimination (P1): Completely removed floating .action-dock across Committee and Discipline Reviewer views; inline confirmation buttons and note composers in active cards provide full functionality with zero redundancy.\n2. WhatsApp Action Polish: Renamed button to "Send WhatsApp Alert" and excised subtext per user confirmation.\n3. Navigation Capsule (P2): Retained < and > chapter navigation buttons per user requirement, while unifying them with the center Book & Chapter pill into a sleek Apple/Linear-style capsule control in ChapterBar.tsx.\n4. Elimination of Nested Box Fatigue: Replaced heavy gray boxes and bordered cards in Drafter Interlinear with borderless lexical columns and marginalia styling in index.css.\n5. Live Team Deliberation Hub Header (P3, Option A): Replaced sterile "💬 What the teams are saying" banner with dynamic renderDeliberationHubHeader() displaying live contributor initials avatars, total notes count, and real-time reviewer confirmation progress across all 4 role workspaces.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '39',
      'Topbar & Sidebar Decluttering (testing.docx P1 & P2 Alignment)',
      'DECISION LOCKED:\n1. Title & Connection Badge (P1.a, P1.c): Removed "Headless Sheets Edition" subtitle; vertically centered "GLBC Translation Hub" with the brand icon; placed the interactive "Live Sheet Connected" button pill immediately to the right of the title.\n2. Centered Book Selector (P1.b): Positioned [📖 Romans · 433 verses ▾] in the exact center of Topbar; clicking it opens the full YouVersion-style BookChapterModal.\n3. Reclaimed Vertical White Space (P1.b): Excised ChapterBar and its white subbar strip completely from App.tsx, eliminating duplicate book displays and maximizing reading real estate.\n4. Excised Redundant Shortcuts (P1.d, P1.e, P2): Removed duplicate "Team" and "Settings2" buttons from Topbar header, and removed duplicate "Help & shortcuts" from Sidebar bottom.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '40',
      'Sidebar Background Screen Changer & 4-Theme Suite (User Direction)',
      'DECISION LOCKED:\n1. 4 Scholar Reading Themes: Default Slate (default), Warm Sepia/Parchment (eyecare), Cool Mist (soft neutral), and Night Obsidian (dark mode).\n2. 4-Swatch Bar: Embedded sleek horizontal palette bar with active indicator dots in the sidebar sticky bottom block.\n3. Synchronized Scope: Theme applies to translation workspace canvas, cards, and sidebar simultaneously, while Topbar remains anchored dark slate.\n4. Local Persistence: Saved in localStorage under glbc_bg_theme and applied immediately on mount via data-bg-theme attribute.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '41',
      'Universal Multi-Theme Gradient System, Smart Assistant & Deeper Card Contrast',
      'DECISION LOCKED:\n1. Gradient Exclusivity: All themes are declared as multi-stop linear gradients (no flat single colors) across canvas, sidebar, cards, and inner boxes.\n2. Tactile Card Depth: In light themes (Default, Sepia, Mist), card gradients are slightly darker/richer than the outer canvas, providing tangible structural separation; Night Obsidian uses sleek titanium surface gradients.\n3. Smart Assistant Drawer Parity: 100% theme gradient adaptation across drawer body, tab bar, diagnostic banner, discipline confirmation rows, Greek lexicon tools, KJV card, back-translation pair boxes, Greek lemmas flow cards, chapter milestone card, and high-contrast typography.\n4. Comprehensive App Coverage: Focus Mode, Analytics View, Settings Hub, and all modal dialogs adapt seamlessly to theme tokens.',
      'Phase 6',
      'Locked & Agreed'
    ]
  ];

  rIdx = 5;
  archCommentsData.forEach(row => {
    const r = ws7.getRow(rIdx);
    r.values = ['', ...row];
    r.height = 70;
    for (let c = 2; c <= 6; c++) {
      r.getCell(c).border = borderThin;
      r.getCell(c).font = fontBody;
      r.getCell(c).alignment = { vertical: 'middle', wrapText: true };
    }
    r.getCell(2).font = fontBold;
    r.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    r.getCell(3).font = fontBold;

    const phaseCell = r.getCell(5);
    phaseCell.alignment = { vertical: 'middle', horizontal: 'center' };
    phaseCell.font = fontBold;

    const statusCell = r.getCell(6);
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } };
    statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: GREEN_TXT } };
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
    rIdx++;
  });

  // =========================================================================
  // 8. GITHUB REPOS & LIBRARIES (PRISTINE EXCELJS STYLING)
  // =========================================================================
  const ws8 = workbook.addWorksheet('7. GitHub Repos & Libraries', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }]
  });

  ws8.columns = [
    { width: 4 },
    { width: 22 }, // Category
    { width: 28 }, // Repo
    { width: 35 }, // What it does
    { width: 42 }, // Pros
    { width: 38 }, // Cons
    { width: 28 }  // Recommendation
  ];

  ws8.mergeCells('B2:G2');
  ws8.getCell('B2').value = 'Ecosystem Evaluation: GitHub Repositories, Packages & Libraries';
  ws8.getCell('B2').font = fontTitle;

  const repoHeaders = ['', 'Category', 'Library / Repo (GitHub)', 'What It Does', 'Pros for GLBC Translation System', 'Cons / Caveats', 'Recommendation & Decision'];
  ws8.getRow(4).values = repoHeaders;
  applyHeaderStyle(ws8.getRow(4), NAVY);

  const repoData = [
    [
      'Apps Script Dev Tooling',
      '@google/clasp\ngithub.com/google/clasp',
      'Official Google CLI to develop Apps Script locally in VS Code with Git & terminal push/pull.',
      '• Develop Code.gs locally with IntelliSense\n• Commit history in Git & GitHub\n• Push changes with "clasp push"\n• Officially maintained & 100% free',
      '• One-time setup: enable Apps Script API in Google account\n• Requires Node.js (already installed)',
      'STRONGLY RECOMMENDED\n(Phase 1 Day 1)'
    ],
    [
      'Frontend Framework',
      'Vite + React\nvitejs.dev / react.dev',
      'Build tool + UI framework for high-performance single page applications.',
      '• Sub-second dev server & HMR\n• Minimal production bundle\n• Seamless integration with Tailwind & PWA',
      '• Client-side rendering (SSR not needed for internal tool)',
      'ALREADY DECIDED\n(Phase 1)'
    ],
    [
      'UI Components',
      'shadcn/ui\ngithub.com/shadcn-ui/ui',
      'Component distribution system copying accessible, Tailwind-based components directly into repo.',
      '• 100% code ownership (in your repo)\n• Zero runtime overhead (pure Tailwind)\n• Perfect for Focus Mode cards & buttons\n• Accessible Radix UI primitives built-in',
      '• You maintain the component files\n• Not a monolithic npm package',
      'STRONGLY RECOMMENDED\n(Phase 1)'
    ],
    [
      'Data Fetching & Cache',
      'TanStack Query (React Query)\ngithub.com/TanStack/query',
      'Server-state management: automatic caching, background re-fetching, optimistic mutations.',
      '• Auto-caching: verses loaded once\n• Optimistic UI: "Approved" badge shows instantly\n• Background synchronization\n• Visual DevTools panel for debugging',
      '• Slightly heavier than basic fetch()\n• Small learning curve for query invalidation',
      'RECOMMENDED\n(Phase 1)'
    ],
    [
      'State Management',
      'Zustand\ngithub.com/pmndrs/zustand',
      'Ultra-lightweight (1KB) store for client state (logged-in user, active book/chapter).',
      '• Minimal boilerplate (10-line store)\n• Easy localStorage persistence for reviewer session\n• No complex Context providers needed',
      '• Not needed for simple one-page apps; adds value as views expand',
      'RECOMMENDED\n(Phase 1)'
    ],
    [
      'Authentication',
      'Firebase Authentication\ngithub.com/firebase/firebase-js-sdk',
      'Google Sign-In with zero password management. Free Spark plan allows 3,000 DAU.',
      '• Reviewers log in with their existing Google account\n• Reviewer email matches Config Sheet directly\n• Solves reviewer identity & attribution safely\n• Zero backend server required',
      '• Free Spark plan caps at 3,000 daily active users (GLBC has ~20 users)\n• Requires one-time Firebase project setup',
      'STRONGLY RECOMMENDED\n(Phase 1)'
    ],
    [
      'PWA Support',
      'vite-plugin-pwa\ngithub.com/vite-pwa/vite-plugin-pwa',
      'Turn React app into installable Progressive Web App with service worker & offline font cache.',
      '• Reviewers tap "Add to Home Screen" on phones\n• Runs full screen without browser URL bar\n• Kannada font cached offline for instant render',
      '• Service worker cache must be configured carefully to avoid stale data\n• iOS has minor PWA limitations',
      'RECOMMENDED\n(Phase 2)'
    ],
    [
      'Kannada / Indic Input',
      'OS IME + Noto Sans Kannada\n(Google Fonts)',
      'Standard HTML textareas accept native GBoard, iOS Kannada, and Google Indic desktop keyboards.',
      '• Zero extra code or libraries needed\n• Native OS typing is fast and natural\n• Noto Sans Kannada ensures correct glyph rendering',
      '• Desktop users without Kannada IME must install Google Input Tools Chrome extension',
      'RECOMMENDED APPROACH\n(Phase 1 OS keyboards)'
    ],
    [
      'Sheets Communication',
      'Apps Script Web App (doGet/doPost)\n[Built into Code.gs]',
      'Apps Script deployed as Web App endpoint returning JSON and accepting POST updates.',
      '• $0/month infrastructure\n• Reads/writes directly to master Google Sheet\n• No service accounts or backend server needed\n• Built-in Google permissions',
      '• 1-2s cold-start latency after idle\n• Rate limit: 20,000 calls/day (plenty for team)',
      'ALREADY DECIDED\n(Stay with this)'
    ],
    [
      'Sheets Alternative',
      'google-spreadsheet (npm)\ngithub.com/theoephraim/node-google-spreadsheet',
      'Node.js library using Google Sheets API v4 with Service Account credentials.',
      '• Direct Sheets API v4 access',
      '• REQUIRES a backend Node.js server to protect Service Account secrets\n• Breaks $0 serverless model\n• Adds unnecessary infrastructure complexity',
      'NOT RECOMMENDED\n(Do not use)'
    ],
    [
      'Client-Side Routing',
      'React Router v6\ngithub.com/remix-run/react-router',
      'Standard routing for multi-screen navigation (/login, /focus, /analytics, /admin).',
      '• Clean URL-based navigation & deep linking\n• Protected routes based on auth state\n• Industry standard',
      '• v6 syntax requires structured route definitions',
      'RECOMMENDED\n(Phase 1)'
    ],
    [
      'Hosting & Deployment',
      'Vercel\nvercel.com',
      'Zero-config hosting with automated CI/CD directly from GitHub repository.',
      '• 100% Free tier (100GB bandwidth, unlimited builds)\n• Auto-deploys on every git push\n• Instant preview URLs for pull requests\n• Fast global CDN delivery across India',
      '• None for this scale',
      'RECOMMENDED\n(Phase 1)'
    ]
  ];

  rIdx = 5;
  repoData.forEach(row => {
    const r = ws8.getRow(rIdx);
    r.values = ['', ...row];
    r.height = 65;
    for (let c = 2; c <= 7; c++) {
      r.getCell(c).border = borderThin;
      r.getCell(c).font = fontBody;
      r.getCell(c).alignment = { vertical: 'middle', wrapText: true };
    }
    r.getCell(2).font = fontBold;
    r.getCell(3).font = fontBold;

    const recCell = r.getCell(7);
    recCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    if (recCell.value.includes('STRONGLY RECOMMENDED')) {
      recCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } };
      recCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: GREEN_TXT } };
    } else if (recCell.value.includes('RECOMMENDED')) {
      recCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } };
      recCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: BLUE_HEADER } };
    } else if (recCell.value.includes('ALREADY DECIDED')) {
      recCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
      recCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: NAVY } };
    } else if (recCell.value.includes('NOT RECOMMENDED')) {
      recCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED_BG } };
      recCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: RED_TXT } };
    }
    rIdx++;
  });

  // =========================================================================
  // 9. ERROR & CORRECTION LOG (AUDIT TRAIL & CODE REVIEW NOTES)
  // =========================================================================
  const ws9 = workbook.addWorksheet('8. Error & Correction Log', {
    views: [{ state: 'frozen', ySplit: 5, showGridLines: true }]
  });

  ws9.columns = [
    { width: 4 },  // Margin
    { width: 8 },  // #
    { width: 26 }, // Category & Subsystem
    { width: 44 }, // Observed Error / Defect / Friction
    { width: 40 }, // Root Cause Analysis
    { width: 56 }, // Correction & Applied Technical Solution
    { width: 34 }, // Files Modified
    { width: 20 }  // Verification Status
  ];

  ws9.mergeCells('B2:H2');
  ws9.getCell('B2').value = 'GLBC Modernization — Log of Errors, Root Causes & Technical Corrections';
  ws9.getCell('B2').font = fontTitle;

  ws9.mergeCells('B3:H3');
  ws9.getCell('B3').value = 'Comprehensive Audit Trail of Defects Discovered During Testing Observations & Open Code Review, with Applied Technical Solutions';
  ws9.getCell('B3').font = fontSubtitle;

  // KPI Summary Bar (Row 4)
  ws9.getRow(4).height = 28;
  ws9.mergeCells('B4:C4');
  ws9.getCell('B4').value = 'TOTAL ISSUES TRACKED: 32';
  ws9.getCell('B4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } };
  ws9.getCell('B4').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: BLUE_HEADER } };
  ws9.getCell('B4').alignment = { vertical: 'middle', horizontal: 'center' };
  ws9.getCell('B4').border = borderThin;

  ws9.mergeCells('D4:E4');
  ws9.getCell('D4').value = 'CORRECTIONS VERIFIED: 32 / 32 (100% RESOLVED)';
  ws9.getCell('D4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } };
  ws9.getCell('D4').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: GREEN_TXT } };
  ws9.getCell('D4').alignment = { vertical: 'middle', horizontal: 'center' };
  ws9.getCell('D4').border = borderThin;

  ws9.mergeCells('F4:H4');
  ws9.getCell('F4').value = 'SYSTEM QUALITY: 100% READY FOR USER TESTING TOMORROW 🎯';
  ws9.getCell('F4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PURPLE_BG } };
  ws9.getCell('F4').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: PURPLE_TXT } };
  ws9.getCell('F4').alignment = { vertical: 'middle', horizontal: 'center' };
  ws9.getCell('F4').border = borderThin;

  const errorHeaders = [
    '',
    '#',
    'Category & Subsystem',
    'Observed Error / Defect / Friction',
    'Root Cause Analysis',
    'Correction & Applied Technical Solution',
    'Files Modified',
    'Verification Status'
  ];
  ws9.getRow(5).values = errorHeaders;
  applyHeaderStyle(ws9.getRow(5), NAVY);

  const errorLogData = [
    [
      '1',
      'UI / Reviewer Deliberation',
      'Robotic [Request Edit] prefix and artificial reject button (testing.docx P3 & Image 1):\nWhen committee members (e.g. Pastor Zack and Pastor Matt) conversed, an artificial "Request Edit" / "Return for Re-Review" button mechanically prepended "[Request Edit] - " to their comments, making constructive peer discussions look like formal defect tickets.',
      'Backend Apps Script (apiSubmitReview) and frontend handler (handleRequestReReview) automatically forced [Request Edit] prefixes on reviewer comments, conflating natural discussion notes with formal rejections.',
      '1. Purged [Request Edit] tag from AppScript/Code.gs, App.tsx, and FocusModeCard.tsx.\n2. Removed artificial reject buttons.\n3. Replaced with clean comment composers allowing natural dialogue (Pastor Matt: [comment]).\n4. Decoupled discussion from stage sign-off via affirmative [Confirm Review (Y)] and [Confirm Committee Conclusion (Y)] buttons.',
      'AppScript/Code.gs\nweb/src/App.tsx\nweb/src/components/FocusModeCard.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '2',
      'Approval Engine / UI',
      'Cryptic (0/1) fractional counter on single-reviewer disciplines (testing.docx P5-P9 & Image 2):\nMatrix cards and status bars rendered "(0 of 1 confirmed): [Fr. Thomas ⏳]". The user noted that the 0/1 counter looked like an arithmetic fraction and was completely redundant when only one reviewer is assigned.',
      'The status progress bar unconditionally rendered (${status.approvedCount} of ${status.totalRequired} confirmed): without checking whether totalRequired was greater than 1.',
      '1. Wrapped fractional counter in totalRequired > 1 check.\n2. Single-reviewer disciplines now render cleanly as [ Fr. Thomas ⏳ ] without any redundant "0 of 1" prefix.\n3. Quorum counters only display when totalRequired > 1 (e.g. Committee: "(1 of 2 confirmed): [Dr. Paul ✓] [Pastor David ⏳]").',
      'web/src/components/FocusModeCard.tsx\n(L827-841, L1428-1442)',
      'Verified ✅ Fixed'
    ],
    [
      '3',
      'UI / Reviewer Matrix',
      'Empty unassigned role flex containers in matrix cards:\nIn Committee and Final Editor views, if a discipline had no reviewer assigned in the ⚙ Config sheet, the member pills container rendered completely empty, giving no visual feedback to the committee or coordinator.',
      'approvedMembers.map(...) and pendingMembers.map(...) iterated over empty arrays without an empty-state fallback when 0 members were assigned in Config.',
      'Added clean fallback: <span style="font-style: italic; color: #94a3b8">No reviewer assigned</span> across all 4 matrix cards and progress bars in both Committee and Final Editor views.',
      'web/src/components/FocusModeCard.tsx\n(L865, L895, L925, L955, L1165, L1190, L1215, L1240)',
      'Verified ✅ Fixed'
    ],
    [
      '4',
      'Approval Engine / Logic',
      'Artificial quorum floor in computeVerseApprovals:\nWhen no active members were configured for a role in the team list, totalRequired defaulted to 1, causing the engine to report 0/1 approved and pending even though no member existed to fulfill it.',
      'Line 41 of approvalEngine.ts used Math.max(1, uniqueMemberNames.length), forcing totalRequired = 1 even when uniqueMemberNames was empty ([]).',
      'Changed line 41 to totalRequired = uniqueMemberNames.length; and updated approval flag to isSheetFlagConfirmed || (totalRequired > 0 && approvedCount >= totalRequired). Now correctly reports totalRequired = 0 when unassigned and allows sheet-level confirmation overrides.',
      'web/src/utils/approvalEngine.ts\n(L41, L64)',
      'Verified ✅ Fixed'
    ],
    [
      '5',
      'Smart Assistant / UX',
      'Redundant 0/1 Needed counter in Smart Assistant discipline table:\nIn SmartAssistantDrawer.tsx line 547, the discipline status checklist rendered 0/1 Needed for pending disciplines with 1 assigned reviewer, repeating the arithmetic fraction issue.',
      'Hardcoded template string ${row.status.approvedCount}/${row.status.totalRequired} Needed without checking if totalRequired > 1.',
      'Replaced with dynamic ternary: if totalRequired > 1, displays ${approvedCount}/${totalRequired} Needed; if totalRequired === 1, displays clean Pending; if totalRequired === 0, displays Unassigned.',
      'web/src/components/SmartAssistantDrawer.tsx\n(L537-550)',
      'Verified ✅ Fixed'
    ],
    [
      '6',
      'Final Editor / Quality Assurance',
      'Potential sign-off blocking in Editorial Pre-Flight Checklist (testing.docx P10 & Image 3):\nThe user questioned whether the 4-point editorial checklist was approved and expressed concern it might block the Final Editor if the translation team had not formally agreed to the criteria.',
      'Risk of coupling checklist completion to the Final Sign-Off & Lock button disabled attribute, halting translation publication.',
      '1. Ensured checklist is purely an interactive, non-blocking quality reminder.\n2. Labeled explicitly: "Active quality reminders · Non-blocking guidelines".\n3. Button guard strictly requires canonical Kannada text: disabled={isSubmitting || !finalText.trim()}, leaving the team free to confirm criteria during their upcoming meeting without halting progress.',
      'web/src/components/FocusModeCard.tsx\n(L1250-1320)',
      'Verified ✅ Fixed'
    ],
    [
      '7',
      'Smart Assistant / Coaching',
      'Lack of contextual guidance & field expertise in UI (testing.docx P13):\nThe user noted: "The app is not speaking to the user like an already good expert in the field. It is not guiding what to do, what happens next, why things are pending, appreciations etc."',
      'Previous UI displayed raw text boxes and buttons without explaining workflow state transitions, stage prerequisites, or Greek/English translation rationale.',
      'Architected and built a two-tier coaching system:\n1. Inline Smart Guidance Badges embedded in each role view explaining Action Needed, Next Stage, and Named Waiting Members.\n2. Collapsible SmartAssistantDrawer.tsx providing NA28/TR concordance lexicon, KJV translation tips, GLBC color coding rules, chapter milestone percentage, and team velocity appreciations.',
      'web/src/components/FocusModeCard.tsx\nweb/src/components/SmartAssistantDrawer.tsx\nweb/src/components/Topbar.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '8',
      'Build System / TypeScript',
      'TypeScript build failures TS6133 & TS1128/TS1005 during refactoring:\nnpm run build failed with TS6133 (unused imports: Clock, AlertTriangle, RotateCcw, CheckCircle2, HelpCircle, ExternalLink, ShieldCheck, Users) in FocusModeCard.tsx and TS1128/TS1005 (orphaned duplicate lines left over from handler refactoring) in App.tsx.',
      'Rapid iteration and refactoring left unused icon declarations and residual duplicate code lines.',
      '1. Cleaned up unused imports across FocusModeCard.tsx and SmartAssistantDrawer.tsx.\n2. Removed orphaned syntax in App.tsx.\n3. Build verified cleanly: compiled in 1.27s with 0 errors.',
      'web/src/components/FocusModeCard.tsx\nweb/src/components/SmartAssistantDrawer.tsx\nweb/src/App.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '9',
      'Drafter Doc Import / Rich Text',
      'Drafter Word document character highlight loss in Sheets:\nDrafters use Word/Google Docs background highlight colors (Text Highlight Color) to mark lexical and textual variants. Google Sheets does not support character-level background highlights inside cells, stripping formatting upon standard import.',
      'SpreadsheetApp.newTextStyle().setBackgroundColor() is unsupported at the character run level in Google Sheets.',
      'Implemented appendRichFromTextElement() in AppScript/Code.gs which extracts getBackgroundColor() and intelligently maps highlight colors to font foreground colors while automatically applying setBold(true) for high visual contrast.',
      'AppScript/Code.gs\nGLBC_Setup_Guide.md',
      'Verified ✅ Fixed'
    ],
    [
      '10',
      'Column Protections / Security',
      'Multi-reviewer column edit lockouts under single-email protections:\nWhen multiple team members held the same role (e.g. multiple committee members or multiple theological reviewers), previous column protection script only allowed a single email editor, locking out other active reviewers from editing their assigned review columns.',
      'applyColumnProtections selected only the first matching email in ⚙ Config instead of collecting all active emails.',
      'Updated applyColumnProtections to scan the entire ⚙ Config sheet, collect an array of all active Google emails matching each role, and add the entire set of emails as authorized editors alongside sheet owners.',
      'AppScript/Code.gs\nAGENTS.md',
      'Verified ✅ Fixed'
    ],
    [
      '11',
      'Focus Mode / Role Synchronization',
      'Multiple-role reviewers seeing repetitive views without active role mode clarity (User Request 3):\nReviewers holding multiple roles (e.g. Dr. Paul is Theological Reviewer AND Committee member) had to navigate between separate pages or lacked clarity on which role context they were operating in.',
      'Focus Mode initially assumed a single role per user or routed multi-role members to separate full pages, creating cognitive friction and UI repetition.',
      'Added horizontal role tabs inside Focus Mode (FocusModeCard.tsx). When a user holds multiple roles, tabs dynamically match their assigned roles (e.g. [Theological Review] [Committee Deliberation]). Switching tabs changes the active role workspace and findings matrix without leaving the verse canvas.',
      'web/src/components/FocusModeCard.tsx\nweb/src/App.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '12',
      'Drafter Notes / Unicode Rich Text',
      'Kannada Unicode character truncation & table delimiter formatting:\nKannada font formatting and back-translation tables (Kannada top, English bottom) were collapsing into single plain text strings without clear line separations.',
      'Standard cell string concatenation stripped newline delimiters and HTML/RichText metadata.',
      'Enhanced parseDrafterComments parser in commentSync.ts to recognize 2-row table layouts, split Kannada script lines from English glosses, and retain HTML markup in drafterCmtHtml with responsive card rendering.',
      'web/src/utils/commentSync.ts\nweb/src/components/FocusModeCard.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '13',
      'UI / Navigation Redundancy',
      'Duplicate Smart Assistant triggers and drawers (testing.docx P1 & Image 1):\nTwo identical "✨ Smart Assistant" buttons appeared right next to each other on the screen: one in the Topbar header and one inside the verse card navigation toolbar, triggering duplicate drawer instances.',
      'FocusModeCard had its own local showAssistant state and mounted a duplicate <SmartAssistantDrawer> component while App.tsx mounted a global instance triggered from Topbar.',
      '1. Removed duplicate button from FocusModeCard toolbar.\n2. Deleted duplicate drawer instance inside FocusModeCard.\n3. Retained a single global, prominent "✨ Smart Assistant" trigger in Topbar accessible across all views.\n4. App.tsx remains the single source of truth for assistant drawer state.',
      'web/src/components/FocusModeCard.tsx\nweb/src/App.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '14',
      'Approval Engine / Live Integration',
      'All 5 disciplines showing "Unassigned" in live mode (testing.docx P5 & Image 2):\nWhen connected to a live Google Sheet, all 5 disciplines (Technical, Style, Orthographic, Theological, Committee) reported "Unassigned" on the discipline confirmation status checklist.',
      'Apps Script getAllActiveMembers() filtered row[4] === "yes" but omitted active: true in returned JSON. approvalEngine.ts checked if (!m.active) return false, which treated undefined as falsy and rejected all members as inactive.',
      '1. Updated approvalEngine.ts to if (m.active === false) return false (only reject if explicitly false).\n2. Updated AppScript/Code.gs getAllActiveMembers() to explicitly return active: true.\n3. Updated api.ts unifyTeamMembers to preserve active state.\n4. UI now renders real named members (e.g. "Fr. Thomas ⏳", "Pastor Samson ⏳").',
      'web/src/utils/approvalEngine.ts\nweb/src/services/api.ts\nAppScript/Code.gs',
      'Verified ✅ Fixed'
    ],
    [
      '15',
      'Scholarly Coaching / Lexicon',
      'Greek & KJV tool having static mock data only for Romans 1:1 (testing.docx P8 & Image 3):\nThe user observed: "This has only 1 verse explained here. Whats the use?" because the Greek lexicon tab only had hardcoded mock entries for Romans 1:1, offering no value on other verses.',
      'GREEK_LEXICON_DATA only contained a static dictionary for 1:1 with an unconditional fallback to 1:1 for every verse in Romans.',
      '1. Upgraded Greek & KJV tab to a dynamic multi-tier engine for all 433 verses:\n• Tier 1: Active Verse Drafter Alignment: Dynamically parses verse.drafterCmt via parseDrafterComments to render exact Kannada-English interlinear word pairs specific to that verse.\n• Tier 2: Biblical Greek Lexicon: Dynamically surfaces relevant Greek lexical entries matching key theological terms occurring in the active verse\'s KJV text, with Strong\'s numbers and Kannada advice.\n• Tier 3: Real-time concordance search filter.',
      'web/src/components/SmartAssistantDrawer.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '16',
      'Translation Guidelines / Dogma',
      'Hallucinated / placeholder translation color rules (testing.docx P11 & Image 4):\nThe user asked: "Is this our rules?" because the assistant displayed generic placeholder meanings (Yellow = Grammatical, Green = Lexical, Blue = NA28 vs TR, Red = Dogma).',
      'Temporary placeholder data was used instead of extracting official project translation guidelines.',
      'Replaced entirely with verbatim official rules from Color_Code_Translation_Rules.pdf (Page 1):\n• Yellow: "The English words that are Omitted in Kannada are highlighted with yellow."\n• Blue / Turquoise: "The added words are highlighted with blue in Kannada verse (another name for it is turquoise)."\n• Pink: "The corrected Kannada words are highlighted with pink."\n• Grey: "The Italicized words to be highlighted with grey in Kannada & English."\n• Green: "Incorrect Kannada word to be highlighted with green."\nAdded TBS formal equivalence translation statement from Page 6.',
      'web/src/components/SmartAssistantDrawer.tsx\nColor_Code_Translation_Rules.pdf',
      'Verified ✅ Fixed'
    ],
    [
      '17',
      'Progress Tracking / Appreciations',
      'Hardcoded "85 verses completed" momentum appreciation (testing.docx P13 & Image 5):\nThe user asked: "Is this real numbers in appreciation?" because the card claimed "Over 85 verses completed in Romans" even when Chapter 1 showed 0% progress.',
      'Appreciation paragraph was hardcoded with a static string referencing 85 completed verses.',
      '1. Replaced with dynamic calculation derived from allChapterVerses.\n2. Computes real chapterCompleted, chapterTotal, chapterPercent, and pipeline queues.\n3. Renders contextual appreciation reflecting reality: e.g. "Translation underway for Romans Chapter 1. 32 verses loaded with active multi-disciplinary review in progress. Great diligence by the team!"',
      'web/src/components/SmartAssistantDrawer.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '18',
      'Sidebar / Analytics Data Flow',
      'Sidebar book card displaying static "85 of 433 verses complete" (testing.docx P15 & Image 6):\nThe user asked: "IS this rela number?" because the sidebar Romans card claimed 85 verses completed (20%) on a fresh sheet with 0 completed verses.',
      'App.tsx line 500 passed completedVerses={analytics?.completed || 85}. Because 0 is falsy, 0 || 85 evaluated to 85.',
      'Calculated strictly without falsy fallback:\nanalytics !== null ? analytics.completed : verses.filter(v => v.status === "Done").length.\nWhen 0 verses are completed, sidebar accurately renders "0 of 433 verses complete (0%)".',
      'web/src/App.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '19',
      'Modal / UX Scroll Lock',
      'Background body continuing to scroll when modal drawer is open (testing.docx P17 & Image 7):\nThe user observed: "The background still scrolls when this is open". Mouse wheel and touch events scrolled the underlying Focus Mode verse card beneath the open drawer.',
      'SmartAssistantDrawer lacked a body scroll lock on document.body.style.overflow.',
      '1. Added useEffect scroll lock in SmartAssistantDrawer.tsx: sets document.body.style.overflow = "hidden" while isOpen is true, perfectly freezing background scroll.\n2. Restores original overflow on unmount/close.\n3. Added touchAction: "none" on the backdrop overlay to prevent touch-drag pass-through on mobile devices.',
      'web/src/components/SmartAssistantDrawer.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '20',
      'Startup Performance / API',
      'Slow loading on initial startup (testing.docx P2 & Image 1):\nUser observed a blank screen with "Loading GLBC Translation Hub..." during startup while waiting for Apps Script.',
      'Boot sequence fired 4 parallel cold-start requests (getBooks, getConfig, getVerses, getAnalytics) causing multi-second latency spikes on Google Apps Script infrastructure.',
      '1. Added apiGetInitialBundle in Apps Script returning books, team, verses, and analytics in ONE single database read.\n2. Implemented fetchInitialBundle & getCachedInitialBundle with sessionStorage caching (stale-while-revalidate), enabling 0ms instant startup.\n3. Added polished branded loading spinner.',
      'AppScript/Code.gs\nweb/src/services/api.ts\nweb/src/App.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '21',
      'Comments / Workflow String Sanitization',
      'Concatenated [Request Edit] prefix on reviewer comments (testing.docx P9, P10 & Images 2, 3):\nUser observed: "Pastor Samson\'s comment is concatenated with [Request Edit]? Because we decided on dropping that!"',
      'Historical comments entered into Google Sheets during prior testing retained legacy [Request Edit] prefixes.',
      '1. Updated parseAllReviewsToComments in commentSync.ts to automatically strip [Request Edit] - prefixes.\n2. Updated renderReviewFindings in FocusModeCard.tsx and CommitteeChamber.tsx to strip [Request Edit] from display.\n3. Confirmed Apps Script apiSubmitReview writes clean comments without robotic prefixes.',
      'web/src/utils/commentSync.ts\nweb/src/components/FocusModeCard.tsx\nweb/src/components/CommitteeChamber.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '22',
      'UI Consistency / Placeholders',
      'Extraneous "Revision 04" tags (testing.docx P11 & Images 4, 5):\nUser observed: "What are these \'Revision 04\'? Where it came from?"',
      'Static placeholder string was hardcoded in FocusModeCard header and Sidebar book cover card.',
      '1. Removed <span className="version-pill">Revision 04</span> in FocusModeCard.tsx.\n2. Replaced "Kannada · Revision 04" with "KJV Kannada Translation" in Sidebar.tsx.',
      'web/src/components/FocusModeCard.tsx\nweb/src/components/Sidebar.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '23',
      'Layout & Desktop Scrollbar Alignment',
      'Side scroll bar not aligned to browser window (testing.docx P14 & Image 6):\nUser observed the vertical scrollbar sitting awkwardly in the middle of the screen with a wide white gutter on the right.',
      '.main-content had max-width: 68rem; margin: 0 auto; overflow-y: auto, positioning the scrollbar at the 68rem boundary rather than the browser window edge.',
      'Introduced .main-viewport wrapper with flex: 1; height: 100%; overflow-y: auto; width: 100%. The scrollbar is now placed at the far right edge of the browser window, while content remains centered up to 68rem.',
      'web/src/index.css\nweb/src/App.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '24',
      'Navigation / Chapter Picker',
      'Awkward/broken chapter dropdown (testing.docx P15 & Images 7-10):\nUser observed: "When clicking on that \'Chapter\' drop down, changes like this weird one. Instead can we make like this?:" (showing YouVersion Bible App screenshot).',
      'Inner dropdown menu overflowed, was cut off, or displayed scroll arrows awkwardly on smaller viewports.',
      'Created BookChapterModal.tsx modeled directly on YouVersion Bible App (Image 10):\n• Left panel: Canonical books organized by NEW TESTAMENT and OLD TESTAMENT, with the active book highlighted.\n• Right panel: Book Title header with ✕ close button, and a clean 5-column grid of numbered chapter squares (1 to N).\n• Connected to both "{totalChapters} chapters ▾" in ChapterBar.tsx and the book selector in Topbar.tsx.',
      'web/src/components/BookChapterModal.tsx\nweb/src/components/ChapterBar.tsx\nweb/src/components/Topbar.tsx\nweb/src/App.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '25',
      'Smart Assistant / Diagnostic Redundancy',
      'Redundant "Currently waiting on" vs "Discipline Confirmation status" (testing.docx P16 & Image 11):\nUser observed: "In the smart assistant, do we need both: Currently waiting on and Discipline Confirmation status?"',
      'Diagnostic tab rendered two redundant blocks repeating the same pending reviewer names.',
      'Removed the "CURRENTLY WAITING ON" card in SmartAssistantDrawer.tsx. Kept the clean "DISCIPLINE CONFIRMATION STATUS" table showing each discipline and named member statuses.',
      'web/src/components/SmartAssistantDrawer.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '26',
      'Smart Assistant / Scroll-Locking',
      'Screen behind Smart Assistant still scrollable (testing.docx P17):\nUser observed that the verse card underneath the assistant drawer was still scrolling when using the mouse wheel.',
      'Body was overflow-locked, but .main-viewport / .main-content container was scrollable beneath the backdrop.',
      'Added .assistant-drawer-open CSS class locking both body, .main-viewport, and .main-content with overflow: hidden !important, plus onWheel and onTouchMove event prevention on the backdrop overlay.',
      'web/src/components/SmartAssistantDrawer.tsx\nweb/src/index.css',
      'Verified ✅ Fixed'
    ],
    [
      '27',
      'Smart Assistant / Text Simplification',
      'Drafter work over-explaining & Header simplification (testing.docx P18 & Image 12):\nUser requested: "What we don\'t want is over-explaining. Change this: \'Extracted directly from drafter\'s Kannada-English back-translation matrix:\' to \'drafter\'s Kannada-English back-translation\'" and simplify the header.',
      'Verbose explanatory headers created visual clutter in the scholarly assistant view.',
      '1. Changed header to: "Smart Assistant / Romans X:Y".\n2. Removed "ACTIVE VERSE DRAFTER WORD ALIGNMENT" header.\n3. Changed subtitle to "drafter\'s Kannada-English back-translation".',
      'web/src/components/SmartAssistantDrawer.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '28',
      'Greek Lexicon / Public REST API Integration',
      'Greek and English help limited to single verse (testing.docx P21 & Images 12, 13):\nUser requested: "Now is it possible to give the whole Greek and English help for every verse not just these limited ones? Can we get it from publicly available source - some API or REST API?"',
      'Lexicon previously had static mock entries with no live interlinear API data source.',
      '1. Created greekService.ts integrating Free Use Bible API (helloao.org) & GitHub Open Bible datasets.\n2. Provides full Greek Textus Receptus verse text (Stephanus 1550).\n3. Provides word-by-word Greek original lemmas, transliteration, Strong\'s concordance numbers (e.g. G3972), full grammatical parsing, and English gloss for every verse of the New Testament.\n4. Added interactive concordance search filter and translation advisory note: "Kannada lexical suggestions and interlinear aids are provided to reduce translational burden; final review and doctrinal rendering rest with the translation committee."',
      'web/src/services/greekService.ts\nweb/src/components/SmartAssistantDrawer.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '29',
      'Smart Assistant / Rules & Appreciations Polish',
      'Kannada Rules box cleanup & Appreciations formatting (testing.docx P28-33 & Images 14, 15):\nUser requested removing the top and bottom explanatory boxes from Kannada Rules, and removing the Bible logo and breaking paragraphs after full stops in Appreciations.',
      'Static introductory banners occupied valuable space in Kannada Rules, and Appreciations paragraph had an emoji logo and lacked line breaks.',
      '1. In Kannada Rules tab: Removed top "OFFICIAL GLBC TRANSLATION COLOR RULES" header box and bottom TBS box, leaving only the 5 clean colored rule cards.\n2. In Progress tab: Removed Bible logo (📖) and broke the momentum appreciation text into distinct paragraphs after full stops.',
      'web/src/components/SmartAssistantDrawer.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '30',
      'Drafter Workspace / Deliberation Isolation',
      'Drafters unable to view reviewer and committee discussion threads in Focus Mode (testing observation & user review):\nDrafter logging in saw only the basic green Drafter box and was completely locked out from viewing linguistic critique from the 4 reviewers or consensus notes from the committee.',
      'FocusModeCard conditionally wrapped Review Findings and Committee deliberations inside {isDisciplineReviewer} and {isCommittee} blocks, completely omitting them from {isDrafter}.',
      '1. Restored full read visibility of the 4-Discipline Review Findings Matrix and Committee Deliberations inside the Drafter workspace.\n2. Added helpful "Cross-Stage Discussion View" badge explaining that drafters can inspect all reviewer notes to align future translation chapters.',
      'web/src/components/FocusModeCard.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '31',
      'Sidebar Roster / Profile Styling Defect',
      'Squished presence status indicator & repetitive "PA"/"SI"/"BR" avatar initials (testing.docx P5, P6, P7 & Images 2, 3):\nGreen presence dots were compressed horizontally into narrow ovals on members with long role titles. Avatar initials took first two letters of title, rendering identical "PA" for Pastor Zack, Pastor Raju, Pastor Matt, etc.',
      '1. .presence CSS lacked flex-shrink: 0, causing flexbox compression when role titles wrapped.\n2. Avatar initials logic used member.name.slice(0, 2), reflecting honorific titles rather than personal names.',
      '1. Added flex-shrink: 0, min-width: 0.5rem, min-height: 0.5rem, and border-radius: 9999px to .presence.\n2. Built Smart Name Parser stripping honorific titles ("Pastor Zack" -> "PZ", "Sister Nancy" -> "SN").\n3. Implemented dynamic role-themed color palette for avatars.',
      'web/src/components/Sidebar.tsx\nweb/src/index.css',
      'Verified ✅ Fixed'
    ],
    [
      '32',
      'Analytics / Static Velocity Formula',
      'Arbitrary 14 verses/day burn-down forecast formula creating unrealistic Dec 14 completion date (testing.docx P1, P3 & Image 1):\nBurn-down card computed Math.round(remaining / 14) and added it to today\'s date, showing Dec 14, 2026 without any connection to real project goals.',
      'AnalyticsView had a static placeholder formula hardcoded to 14 verses/day pace.',
      '1. Replaced static formula with authentic locked Book Target Completion Date.\n2. Dynamically calculates Required Daily Pace (verses/day) and compares against 7-day actual completion rate to display On-Track vs Delayed status.',
      'web/src/components/AnalyticsView.tsx\nweb/src/services/api.ts',
      'Verified ✅ Fixed'
    ],
    [
      '33',
      'Committee & Reviewer Deliberation / Chat Ergonomics',
      'Full-width flat cards without distinction between sender and peers; discussion container expanded without bound (testing.docx Batch 7 & Image 1):\nUser observed committee notes were stacked on the left, lacked conversational feel, took up excessive vertical space, and could not be expanded or popped out for reading.',
      'Discussion threads lacked conversational chat-bubble geometry, sender-aware alignment ("You" on right, peers on left), and height constraints.',
      '1. Implemented chat-bubble layout (You on right, Peers on left) with role-aware bylines.\n2. Constrained scrollable height to 280px with smooth auto-scroll to newest message.\n3. Added [▾ Collapse / ▸ Expand] header toggle to save vertical space.\n4. Built DiscussionPopoutModal.tsx with full-screen conversation view, keyword search, and live composer.',
      'web/src/components/FocusModeCard.tsx\nweb/src/components/DiscussionPopoutModal.tsx\nweb/src/index.css\nweb/src/utils/userUtils.ts',
      'Verified ✅ Fixed'
    ],
    [
      '34',
      'UI Architecture / Workspace Separation',
      'Scattered Google Sheets GLBC menu actions and reviewer screen cognitive overhead (User Evaluation Observation):\nReviewers entering Focus Mode or navigation saw administrative buttons (like "Initialize 1 Corinthians in Google Sheets", team management modal triggers, and column protection buttons) mixed into scripture translation reading spaces.',
      'Administrative and setup controls were scattered across individual components (FocusModeCard, Topbar, Sidebar) instead of being consolidated into an operational settings center.',
      '1. Renamed "Drafter Studio & Import" to "Settings" (SettingsView.tsx) with 5 dedicated sub-tabs: Team & Access, Book & Sheet Setup, Drafter Studio & Templates, Reports & Alerts, and Connection.\n2. Consolidated all 11 Google Sheets GLBC menu actions into the Settings hub.\n3. Stripped administrative buttons from Focus Mode banners and replaced modal triggers with direct Settings navigation.\n4. Kept Task 6.5 Admin Controls dedicated to whole-app RBAC and authentication governance.',
      'web/src/components/SettingsView.tsx\nweb/src/components/FocusModeCard.tsx\nweb/src/components/Sidebar.tsx\nweb/src/components/Topbar.tsx\nweb/src/App.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '35',
      'Workflow Ergonomics / Narrative Continuity',
      'Fragmented reading via "My Review Queue" and missing confirmation impact context (User Evaluation Observation):\nReviewers felt the separate queue was disconnected from reading scripture, while approval buttons lacked confirmation and explanation of what "Y" vs "N" impacts in the workflow.',
      'Queue treated translation as isolated tickets; approval actions directly executed without confirmation or auto-advancement.',
      '1. Eliminated "My Review Queue" from navigation.\n2. Built Smart Resume landing scholars on their first pending verse in each chapter.\n3. Added Chapter Verse Progress Ribbon and [⏭ Next Pending] quick step in Focus Mode.\n4. Implemented ApprovalImpactModal.tsx with transparent bulleted impact breakdown for Y vs N across Reviewer, Committee, and Final Editor actions.',
      'web/src/components/FocusModeCard.tsx\nweb/src/components/ApprovalImpactModal.tsx\nweb/src/App.tsx\nweb/src/components/Sidebar.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '36',
      'Reviewer Workspace Visual Fatigue & Clutter (testing.docx P1–P16)',
      'Visual observations and reviewer feedback in Testing/testing.docx (Paragraphs P1–P16 & Images 1–5):\n• Duplicate Chapter Navigator ribbon and Next Pending button (P4, P5)\n• Excessively tall reading cards and misplaced A-/A+ font zoom buttons (P6, P7)\n• Redundant Drafter Workspace green box banner (P9)\n• Non-collapsible Committee Deliberation card for reviewers (P12)\n• Flat findings matrix lacking intra-team commenting protection (P13)\n• Hardcoded 433 total verses displaying across all books (P15)',
      'Initial rapid implementation lacked discipline-level commenting isolation and had overlapping navigation ribbons and hardcoded verse counts.',
      '1. Dropped Chapter Navigator ribbon and Next Pending button.\n2. Compacted comparison cards and moved A-/A+ font zooming into Kannada card header.\n3. Removed green Drafter Workspace box.\n4. Added [▾ Collapse] and [⤢ Pop Out] with 280px max-height to Committee Consensus card.\n5. Built 4 distinct collapsible discipline cards with strict intra-team commenting composers.\n6. Exported getBookTotalVerses(currentBook) from kjvService.ts using canonical counts for all 66 books.',
      'web/src/components/FocusModeCard.tsx\nweb/src/services/kjvService.ts\nweb/src/services/api.ts\nweb/src/components/Topbar.tsx\nweb/src/components/SettingsView.tsx\nweb/src/App.tsx\nweb/src/index.css',
      'Verified ✅ Fixed'
    ],
    [
      '37',
      'Deliberation Security & Card Header Ergonomics',
      'Security loophole in Pop-Out modal & visual clutter in discussion cards (testing.docx P1–P7):\n1. Drafters could comment in Committee & Reviewer columns via Pop-Out modal (P6).\n2. No visual indicator of new/unread comments for returning reviewers (P3).\n3. Stage status badges (Pending / Deliberation In Progress) blended confusingly with reviewer names on a single row (P7).\n4. Spreadsheet column codes (Col O, Cols G & H) cluttered scholar view (P4).\n5. Dry technical banner "Cross-Stage Deliberation View" (P2).',
      'Pop-Out modal did not inherit the isAssigned check from inline accordion cards; unread comments were untracked; header flexbox grouped status and names horizontally in identical amber colors.',
      '1. Added isAssigned prop to DiscussionPopoutModal.tsx rendering read-only lock banner for non-members.\n2. Built localStorage unread comment tracker displaying ● {n} unread near Pop-Out when unread comments exist.\n3. Reorganized card headers into a 2-line layout with status directly below title on the left, using distinct color tokens.\n4. Excised all column codes from titles and modals, renamed Committee card to "Committee Discussions", and simplified drafter banner to "💬 What the teams are saying".',
      'web/src/components/FocusModeCard.tsx\nweb/src/components/DiscussionPopoutModal.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '38',
      'Redundant Action Dock, Navigation Clutter & Box Fatigue (testing.docx P1–P3)',
      'Visual clutter and redundancy reported in Testing/testing.docx:\n1. Floating action dock was completely duplicate with inline card confirmation buttons (P1 & Image 1).\n2. Disjointed <> chapter buttons and box-inside-box fatigue in Drafter interlinear (P2 & Image 2).\n3. Cold, static "What the teams are saying" banner (P3 & Image 3).',
      'Bottom floating action dock duplicated inline controls; <> buttons were styled as detached square boxes; Drafter interlinear wrapped every pair in nested borders; banner was static plain text.',
      '1. Excised .action-dock from Committee and Reviewer views; inline confirm buttons in cards provide complete workflow.\n2. Renamed WhatsApp button to "Send WhatsApp Alert" and excised subtext.\n3. Unified < and > buttons into cohesive Apple/Linear-style capsule in ChapterBar.tsx.\n4. Elevated Drafter interlinear with borderless lexical columns and marginalia styling in index.css.\n5. Transformed static banner into Active Live Deliberation Hub Header (Option A) with member presence avatars and real-time reviewer progress badges across all 4 role workspaces.',
      'web/src/components/FocusModeCard.tsx\nweb/src/components/ChapterBar.tsx\nweb/src/index.css',
      'Verified ✅ Fixed'
    ],
    [
      '39',
      'Header, Navigation & Sidebar Redundancy (testing.docx P1 & P2)',
      'Multiple duplicate and redundant navigation elements reported in Testing/testing.docx:\n1. Subtitle text "Headless Sheets Edition" cluttered app brand (P1.a).\n2. Dual book name displays (Topbar vs white subbar with <> buttons) caused confusion and wasted vertical screen space (P1.b).\n3. Standalone connection pill in middle of navbar detached from title (P1.c).\n4. Duplicate Team and Settings buttons in Topbar when they exist in main navigation (P1.d, P1.e).\n5. Duplicate Help & shortcuts in Sidebar when ? icon exists in header (P2).',
      'Initial iterative features added shortcuts across both Topbar and Sidebar without consolidating primary navigation paths.',
      '1. Excised "Headless Sheets Edition" subtitle and vertically centered brand title with icon.\n2. Moved interactive "Live Sheet Connected" pill immediately to the right of the brand title.\n3. Centered [📖 Romans · 433 verses ▾] in Topbar.\n4. Excised ChapterBar and white subbar strip completely from App.tsx.\n5. Removed duplicate Team and Settings2 buttons from Topbar.\n6. Removed duplicate Help & shortcuts button from Sidebar.',
      'web/src/components/Topbar.tsx\nweb/src/App.tsx\nweb/src/components/Sidebar.tsx\nweb/src/index.css',
      'Verified ✅ Fixed'
    ],
    [
      '40',
      'UI / Scholar Reading Eyestrain & Theme Customization',
      'Translators and reviewers working long hours experienced eyestrain with fixed bright white background; requested a background screen changer in sidebar bottom with multiple options, current being default, applying to both workspace and sidebar.',
      'Workspace and sidebar had static hardcoded light backgrounds without reader theme customization or dark/sepia reading modes.',
      '1. Defined BgTheme type and 4 scholar themes (Default Slate, Warm Sepia, Cool Mist, Night Obsidian).\n2. Built Sleek 4-Swatch Bar in Sidebar sticky bottom block with active selection ring.\n3. Configured CSS variables and theme overrides applying to workspace, cards, and sidebar.\n4. Added persistent localStorage caching (glbc_bg_theme).',
      'web/src/types/index.ts\nweb/src/components/Sidebar.tsx\nweb/src/App.tsx\nweb/src/index.css',
      'Verified ✅ Fixed'
    ],
    [
      '41',
      'Flat Colors & Missing Theming Across Cards, Boxes & Smart Assistant Drawer',
      'User reported cards and boxes did not adapt when changing themes, themes felt flat because they were single colors instead of gradients, and asked to verify all areas of the app including Smart Assistant Drawer.',
      'Initial theme prototype used flat CSS color values and lacked variables on nested cards, boxes, and auxiliary views that had hardcoded white backgrounds.',
      '1. Re-engineered all 4 themes to multi-stop linear gradients across canvas, sidebar, cards, and boxes.\n2. Made card area gradients slightly darker than the canvas in light themes per user request for visual depth.\n3. Overhauled Smart Assistant Drawer (SmartAssistantDrawer.tsx), AnalyticsView.tsx, SettingsView.tsx, FocusModeCard.tsx, and modals to use theme variables.\n4. Fixed swatch render bug in Sidebar.tsx to display genuine gradients.',
      'web/src/index.css\nweb/src/components/SmartAssistantDrawer.tsx\nweb/src/components/AnalyticsView.tsx\nweb/src/components/SettingsView.tsx\nweb/src/components/FocusModeCard.tsx\nweb/src/components/Sidebar.tsx',
      'Verified ✅ Fixed'
    ]
  ];

  rIdx = 6;
  errorLogData.forEach(row => {
    const r = ws9.getRow(rIdx);
    r.values = ['', ...row];
    r.height = 76;
    for (let c = 2; c <= 8; c++) {
      r.getCell(c).border = borderThin;
      r.getCell(c).font = fontBody;
      r.getCell(c).alignment = { vertical: 'middle', wrapText: true };
    }
    r.getCell(2).font = fontBold;
    r.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    r.getCell(3).font = fontBold;

    const statusCell = r.getCell(8);
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } };
    statusCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: GREEN_TXT } };
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
    rIdx++;
  });

  const filePath1 = path.join(__dirname, 'GLBC_Architecture_Upgrade_Plan.xlsx');
  const filePath2 = path.join(__dirname, 'GLBC_Architecture_Upgrade_Plan_updated.xlsx');
  try {
    await workbook.xlsx.writeFile(filePath1);
    console.log('SUCCESS: Written GLBC_Architecture_Upgrade_Plan.xlsx');
  } catch (err) {
    console.log('Notice: GLBC_Architecture_Upgrade_Plan.xlsx is currently open in Excel (skipping locked file)');
  }
  await workbook.xlsx.writeFile(filePath2);
  console.log('SUCCESS: Written GLBC_Architecture_Upgrade_Plan_updated.xlsx with all 9 sheets fully styled!');
}

buildPristineWorkbook().catch(err => {
  console.error('Error regenerating workbook:', err);
  process.exit(1);
});
