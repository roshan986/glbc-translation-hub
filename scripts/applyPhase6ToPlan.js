const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'regenerate_full_plan_excel.js');
let code = fs.readFileSync(srcPath, 'utf8');

// 1. Update ws1: Add Pillar 7
const targetPillar6 = `['', 'Pillar 6: Intelligent Translation Partner & Contextual Coaching', 'The app actively speaks to the user like an expert in the field: provides dynamic inline guidance chips ("Action Needed", "What Happens Next", "Why Pending"), a collapsible Smart Assistant drawer with Greek/English lexical comparisons (NA28 / TR / KJV), explicit named-reviewer pending statuses (no cryptic 0/1 counters), and chapter milestone appreciations.'],`;
const pillar7 = `['', 'Pillar 6: Intelligent Translation Partner & Contextual Coaching', 'The app actively speaks to the user like an expert in the field: provides dynamic inline guidance chips ("Action Needed", "What Happens Next", "Why Pending"), a collapsible Smart Assistant drawer with Greek/English lexical comparisons (NA28 / TR / KJV), explicit named-reviewer pending statuses (no cryptic 0/1 counters), and chapter milestone appreciations.'],
    ['Architecture Pillars', 'Pillar 7: Translation Governance, Target Dates & Open Deliberation', 'Admins lock target completion dates per book driving dynamic daily pace tracking (required verses/day) and lag warnings. Initial rollout grants universal cross-stage discussion visibility (so drafters can review all reviewer and committee feedback), backed by an Admin Console with granular View/Edit permission toggles and Google OAuth.'],`;

if (code.includes(targetPillar6) && !code.includes('Pillar 7: Translation Governance')) {
  code = code.replace(targetPillar6, pillar7);
  console.log('1. ws1 Pillar 7 added.');
}

// 2. Update ws2: Feature Matrix
const targetMatrixEnd = `['Final Editorial', 'Editorial Pre-Flight Checklist Guidelines', 'Frontend Web App (UI)', 'Ad-hoc verification in spreadsheet cell without structured guidance', 'Structured 4-point editorial quality guideline (KJV Fidelity, Kannada Register, Theological Alignment, Orthography) visible to Final Editor pending team meeting confirmation.', 'Maintains highest translation fidelity and prepares team for formal sign-off protocol.', 'Quality Gate']
  ];`;

const matrixPhase6 = `['Final Editorial', 'Editorial Pre-Flight Checklist Guidelines', 'Frontend Web App (UI)', 'Ad-hoc verification in spreadsheet cell without structured guidance', 'Structured 4-point editorial quality guideline (KJV Fidelity, Kannada Register, Theological Alignment, Orthography) visible to Final Editor pending team meeting confirmation.', 'Maintains highest translation fidelity and prepares team for formal sign-off protocol.', 'Quality Gate'],
    ['Book Governance', 'Layman Target Date & Required Velocity Engine', 'Hybrid (Synced)', 'Static arbitrary velocity formula (remaining / 14 = ~31 days fixed pace)', 'Admin locks Target Completion Date per book; dynamically calculates required verses/day, tracks calendar lag, and triggers WhatsApp pace alerts.', 'Replaces unrealistic placeholder dates with authentic project deadlines managed by leadership.', 'High Trust ⭐'],
    ['Deliberation Transparency', 'Universal Cross-Stage Discussion Visibility', 'Frontend Web App (UI)', 'Reviewer and committee discussions were isolated; drafters could not see editorial findings', 'Drafters and all team members have 100% read visibility into all 4 reviewer findings and committee deliberation notes directly on the verse canvas.', 'Fosters collaborative learning: drafters understand reviewer critiques and align future chapters.', 'Massive Alignment ⭐'],
    ['Access Control', 'Initial Open Permissions with Dynamic Admin RBAC Toggles', 'Hybrid (API + UI)', 'Hardcoded role restrictions or spreadsheet-level sharing', 'Initial deployment grants open workspace access to all team members; Admin Console provides granular View/Edit permission toggle switches.', 'Prevents premature lockout while team establishes routine; allows gradual tightening as workflow stabilizes.', 'Low Friction ⭐'],
    ['UI / Styling', 'Smart Avatar Initials & Non-Squishing Presence Geometry', 'Frontend Web App (UI)', 'Squished oval presence dots on long role names; identical PA/SI/BR initials for honorific titles', 'Smart Name Parser stripping titles (Pastor Zack -> PZ, Sister Nancy -> SN) with role-themed color palettes and flex-shrink:0 circular active dots.', 'Restores polished UI geometry and unique visual identity to all scholars on the roster.', 'Visual Delight'],
    ['Administration', 'Dedicated Unified Admin Console', 'Frontend Web App (UI)', 'Administrative tasks split across disparate modals and spreadsheet menus', 'Unified command center tab in sidebar: Book Target Dates lock, 1-click sheet setup wizard, Team Directory with Google OAuth emails, and column protections sync.', 'Gives coordinators complete administrative governance without needing raw spreadsheet edits.', 'Governance ⭐'],
    ['Security & Auth', 'Google Sign-In (OAuth) Authentication Bridge', 'Frontend & Security', 'Persona switcher dropdown with zero authentication barrier', 'Secure Google OAuth login matching user email against the active ⚙ Config directory in Google Sheets.', '100% free ($0/month), zero passwords to remember, directly aligns with Google Sheets column protections.', 'Enterprise Security']
  ];`;

if (code.includes(targetMatrixEnd) && !code.includes('Layman Target Date & Required Velocity Engine')) {
  code = code.replace(targetMatrixEnd, matrixPhase6);
  console.log('2. ws2 Phase 6 features added.');
}

// 3. Update ws4: Web UI & UX Features
const targetUiEnd = `['Final Editorial', 'Editorial Pre-Flight Checklist Guidelines', 'Provides structured quality verification for Final Editor before sign-off.', '4-point interactive editorial guidelines (KJV Fidelity, Kannada Register, Theological Terminology, Orthography) visible to Final Editor.', 'Desktop & Tablet', 'Phase 5']
  ];`;

const uiPhase6 = `['Final Editorial', 'Editorial Pre-Flight Checklist Guidelines', 'Provides structured quality verification for Final Editor before sign-off.', '4-point interactive editorial guidelines (KJV Fidelity, Kannada Register, Theological Terminology, Orthography) visible to Final Editor.', 'Desktop & Tablet', 'Phase 5'],
    ['Focus Mode', 'Universal Discussion Visibility for Drafters & Team', 'Drafters feel excluded when they cannot see why their translations were critiqued or modified.', 'Drafter workspace includes full 4-Discipline Review Findings Matrix and Committee Deliberation notes in read-only mode with clear cross-stage banner.', 'Mobile & Desktop', 'Phase 6'],
    ['Navigation & Roster', 'Smart Avatar Initials & Circular Presence Dots', 'Broken initials (PA for everyone) and squished presence dots hurt visual credibility.', 'Smart Name Parser strips religious titles (Pastor, Sister, Brother) into personal initials; role-themed pastel backgrounds; fixed circular presence dot.', 'Mobile & Desktop', 'Phase 6'],
    ['Analytics & Stats', 'Layman Target Date & Dynamic Velocity Tracker', 'Arbitrary fixed 14 verses/day burn-down forecast created unrealistic December 14 completion dates.', 'Replaces placeholder with locked Target Completion Date; displays days remaining, required verses/day, on-track vs behind pace, and 1-tap WhatsApp nudges.', 'Desktop & Tablet', 'Phase 6'],
    ['Admin Command Center', 'Dedicated Unified Admin Console', 'Coordinators need a single screen to set book deadlines, manage permissions, and sync protections.', 'Consolidated admin page with Book Governance & Target Dates, Team Directory & OAuth Emails, Role Permission Toggles, and 1-Click Sheet Init.', 'Desktop & Tablet', 'Phase 6']
  ];`;

if (code.includes(targetUiEnd) && !code.includes('Universal Discussion Visibility for Drafters & Team')) {
  code = code.replace(targetUiEnd, uiPhase6);
  console.log('3. ws4 Phase 6 UX features added.');
}

// 4. Update ws6 KPI block
const oldKpiBlock = `  // KPI Progress Summary Block
  ws6.getRow(4).height = 26;
  
  ws6.mergeCells('B4:C4');
  const kpiTitle = ws6.getCell('B4');
  kpiTitle.value = 'Overall Progress: 24 / 28 (86% Done)';
  kpiTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  kpiTitle.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: WHITE } };
  kpiTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  kpiTitle.border = borderThin;
  ws6.getCell('C4').border = borderThin;

  ws6.mergeCells('D4:E4');
  const kpiP1 = ws6.getCell('D4');
  kpiP1.value = 'Phases 1, 2, 3 & 5: 24 / 24 Completed (100% ✅)';
  kpiP1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } };
  kpiP1.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: GREEN_TXT } };
  kpiP1.alignment = { vertical: 'middle', horizontal: 'center' };
  kpiP1.border = borderThin;
  ws6.getCell('E4').border = borderThin;

  ws6.mergeCells('F4:G4');
  const kpiP2 = ws6.getCell('F4');
  kpiP2.value = 'Phase 5 Ready for Testing Tomorrow! 🎯';
  kpiP2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } };
  kpiP2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: GREEN_TXT } };
  kpiP2.alignment = { vertical: 'middle', horizontal: 'center' };
  kpiP2.border = borderThin;
  ws6.getCell('G4').border = borderThin;

  ws6.mergeCells('H4:I4');
  const kpiP34 = ws6.getCell('H4');
  kpiP34.value = 'Phase 4 (Multi-Book Scaling): 0 / 4 Scheduled ⏳';
  kpiP34.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
  kpiP34.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '64748B' } };
  kpiP34.alignment = { vertical: 'middle', horizontal: 'center' };
  kpiP34.border = borderThin;
  ws6.getCell('I4').border = borderThin;`;

const newKpiBlock = `  // KPI Progress Summary Block
  ws6.getRow(4).height = 26;
  
  ws6.mergeCells('B4:C4');
  const kpiTitle = ws6.getCell('B4');
  kpiTitle.value = 'Overall Progress: 29 / 37 (78.4% Done)';
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
  kpiP2.value = 'Phase 6 (Governance & Open Deliberation): 0 / 6 In Progress 🎯';
  kpiP2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER_BG } };
  kpiP2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: AMBER_TXT } };
  kpiP2.alignment = { vertical: 'middle', horizontal: 'center' };
  kpiP2.border = borderThin;
  ws6.getCell('G4').border = borderThin;

  ws6.mergeCells('H4:I4');
  const kpiP34 = ws6.getCell('H4');
  kpiP34.value = 'Phase 7 (Roadmap): 0 / 2 Scheduled (OT Strong\\'s & Comparative) ⏳';
  kpiP34.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
  kpiP34.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '64748B' } };
  kpiP34.alignment = { vertical: 'middle', horizontal: 'center' };
  kpiP34.border = borderThin;
  ws6.getCell('I4').border = borderThin;`;

if (code.includes(oldKpiBlock)) {
  code = code.replace(oldKpiBlock, newKpiBlock);
  console.log('4. ws6 KPI summary block updated.');
}

// 5. Update ws6 Roadmap Data (Phases 4, 5, 6, 7)
const oldPhase4To5 = `    // --- PHASE 4 ---
    [
      'Phase 4',
      '4.1',
      'Multi-Book Discovery & Switcher',
      'Dynamic backend scanning of all translation sheets in the workbook (Romans, Psalms, Gospels) with seamless switching and cross-book navigation.',
      'Hybrid (API + UI)',
      '⏳ Scheduled',
      'Phase 4 Sprint',
      'Not started / Scheduled: Book selector UI is already present. Full multi-book backend scanning will be enabled after Romans completes its validation run.'
    ],
    [
      'Phase 4',
      '4.2',
      'In-App Admin Sheet Setup Wizard',
      'Web UI wizard to initialize and format new translation sheets (header styles, column widths, validations, frozen panes) without opening Google Sheets menu.',
      'Backend (Apps Script)',
      '⏳ Scheduled',
      'Phase 4 Sprint',
      'Not started / Scheduled: Migrates "Format This Sheet" menu action. Google Sheets menu currently performs this setup reliably for new books.'
    ],
    [
      'Phase 4',
      '4.3',
      'Team Directory & Role Management Screen',
      'Full web admin interface to add/edit team members, assign review roles, and manage phone/email records without manually editing the ⚙ Config sheet.',
      'Hybrid (API + UI)',
      '⏳ Scheduled',
      'Phase 4 Sprint',
      'Not started / Scheduled: The ⚙ Config sheet currently serves as an easy spreadsheet directory. Web CRUD interface scheduled for the enterprise admin suite in Phase 4.'
    ],
    [
      'Phase 4',
      '4.4',
      'Regional Translation OS Packaging',
      'Standardized deployment scripts, documentation, and white-label branding to showcase and license the system to other regional Bible translation bodies.',
      'Documentation & DevOps',
      '⏳ Scheduled',
      'Phase 4 Sprint',
      'Not started / Scheduled: Strategic showcase milestone once the GLBC Kannada translation demonstrates verified production turnaround metrics.'
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
      'Completed & verified. Resolves testing.docx observations P5-P9. Ensures crystal-clear team accountability and transparency on exactly who is pending. Ready for client testing tomorrow.'
    ],
    [
      'Phase 5',
      '5.2',
      'Clean Deliberation & Elimination of "Request Edit"',
      'Complete elimination of confusing [Request Edit] tag and artificial reject buttons. Reviewers and committee post natural observations in comment composers; affirmative [Confirm] buttons handle stage completion.',
      'Hybrid (API + UI)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Resolves testing.docx observations P3 & Image 1. Restores natural human deliberation dialogue and eliminates ticket-style confusion. Ready for client testing tomorrow.'
    ],
    [
      'Phase 5',
      '5.3',
      'Inline Smart Guidance Badges',
      'Contextual guidance chips embedded in discipline, committee, and final editor workspaces explaining: 1) What action is needed right now; 2) What happens next; 3) Exactly why this verse is pending with named members.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Resolves testing.docx observation P13 ("App is not speaking to user like an expert in the field"). Ready for client testing tomorrow.'
    ],
    [
      'Phase 5',
      '5.4',
      'Collapsible "Smart Assistant" Side Drawer',
      'Dedicated translation coach drawer providing Greek/English biblical comparison tools (NA28 & TR concordance hints, KJV lexical glosses), chapter milestone tracker, and team velocity appreciations.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Resolves testing.docx observation P13. Delivers scholarly depth and motivational positive reinforcement. Ready for client testing tomorrow.'
    ],
    [
      'Phase 5',
      '5.5',
      'Editorial Pre-Flight Checklist Retention & Guidelines',
      'Structured 4-point editorial quality guideline (KJV Fidelity, Kannada Register, Theological Alignment, Orthography) visible to Final Editor as a quality reminder pending team meeting confirmation.',
      'Frontend (React)',
      '✅ Completed',
      '2026-11-12',
      'Completed & verified. Resolves testing.docx observation P10 & Image 3. Maintains high translation fidelity and prepares team for formal sign-off protocol. Ready for client testing tomorrow.'
    ]
  ];`;

const newPhase4To7 = `    // --- PHASE 4: MULTI-BOOK SCALING, LATENCY ELIMINATION & MODULAR ARCHITECTURE ---
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
      'Authentic KJV Strong\\'s Greek Engine & Visual Order',
      'Pre-bundled offline dataset in web/public/kjv-strongs/ for all 27 NT books with 0ms latency, exact KJV sentence flow (Paul, a servant... separated unto...), Strong\\'s lemmas (G1-G5624), single-option KJV canonical dropdown, and 4-tier visual hierarchy in Smart Assistant.',
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
      '⏳ In Progress',
      'Immediate',
      'In Progress. User requirement: Drafters must see reviewer and committee discussion threads to understand editorial guidance and refine future translation chapters.'
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
      'Dedicated Admin Console Page & Book Setup Hub',
      'Unified admin command center tab in the sidebar consolidating Book Target Dates lock, 1-click sheet setup, Team Directory with Google OAuth emails, and column protections sync.',
      'Frontend & Hybrid',
      '⏳ Scheduled',
      'Phase 6',
      'Scheduled. Addresses testing.docx P10: Dedicated admin controls page with complete breakdown of features and role permission toggles.'
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
      'Old Testament (OT) Hebrew Strong\\'s Concordance Engine',
      'Expand KJV Strong\\'s service to support all 39 Old Testament books (Genesis to Malachi) with authentic Hebrew lemmas (H1-H8674), transliterations, pronunciations, and root definitions bundled offline in web/public/kjv-strongs/.',
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
  ];`;

if (code.includes(oldPhase4To5)) {
  code = code.replace(oldPhase4To5, newPhase4To7);
  console.log('5. ws6 Roadmap Phases 4-7 updated.');
}

// 6. Update ws7: Architect Comments (Decisions 26-31)
const targetArchEnd = `    [
      '25',
      'Visual clean-up of Kannada Rules tab & Appreciation paragraph formatting (testing.docx P28-33 & Images 14, 15)',
      'DECISION LOCKED:\\n1. In Kannada Rules tab: Removed top "OFFICIAL GLBC TRANSLATION COLOR RULES" header box and bottom "TRANSLATION METHOD (Trinitarian Bible Society)" box, leaving only the 5 clean colored rule cards.\\n2. In Progress tab: Removed Bible logo (📖) and broke the momentum appreciation text into distinct paragraphs after full stops.',
      'Phase 5',
      'Locked & Agreed'
    ]
  ];`;

const archDecisionsPhase6 = `    [
      '25',
      'Visual clean-up of Kannada Rules tab & Appreciation paragraph formatting (testing.docx P28-33 & Images 14, 15)',
      'DECISION LOCKED:\\n1. In Kannada Rules tab: Removed top "OFFICIAL GLBC TRANSLATION COLOR RULES" header box and bottom "TRANSLATION METHOD (Trinitarian Bible Society)" box, leaving only the 5 clean colored rule cards.\\n2. In Progress tab: Removed Bible logo (📖) and broke the momentum appreciation text into distinct paragraphs after full stops.',
      'Phase 5',
      'Locked & Agreed'
    ],
    [
      '26',
      'Layman Target Date Engine vs Static 14-verse Formula (testing.docx P1 & P3)',
      'DECISION LOCKED:\\n1. Layman Explanation: The previous "Dec 14, 2026" completion date was calculated by taking remaining verses (433 in Romans) and dividing by an arbitrary static pace of 14 verses/day (433 / 14 ≈ 31 days from Nov 13).\\n2. New Architecture: Replaced with an authentic Target Completion Date locked per book by Admin. The system computes exact calendar days remaining, calculates Required Daily Pace (verses/day), and evaluates actual velocity to show On-Track vs Delayed status with pace lag alerts.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '27',
      'Smart Avatar Initials & Non-Squishing Presence Geometry (testing.docx P5, P6, P7 & Images 2, 3)',
      'DECISION LOCKED:\\n1. Avatar Initials: Implemented Smart Name Parser stripping honorific religious titles (Pastor, Sister, Brother, Dr., Fr., Rev.) so initials represent personal identities (Pastor Zack -> PZ, Sister Nancy -> SN, Brother Kishore -> BK).\\n2. Color Palette: Each role/member receives a distinctive role-themed background color (Emerald for Drafters, Sky Blue for Tech, Teal for Style, Indigo for Ortho, Purple for Theo, Amber for Committee, Rose for Final Editor, Slate for Admin).\\n3. Presence Geometry: Added flex-shrink: 0, min-width: 0.5rem, min-height: 0.5rem, and border-radius: 9999px to .presence dot to eliminate horizontal squishing into ovals.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '28',
      'Initial Open Permissions Model with Dynamic Admin RBAC Toggles (User Decision)',
      'DECISION LOCKED:\\n1. Open Access Stance: In this initial rollout, all team members are granted open access across workspaces so scholars can explore, review, and collaborate without artificial lockouts.\\n2. Admin Toggle Matrix: Built a dynamic View/Edit permission toggle matrix inside the Admin Console, allowing coordinators to gradually transition to strict stage partitioning as the team settles into regular production routines.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '29',
      'Open Deliberation Principle — Universal Cross-Stage Discussion Visibility for Drafters (User Requirement)',
      'DECISION LOCKED:\\n1. Problem Identified: Drafters logged into Focus Mode were unable to view the 4-discipline reviewer findings matrix or committee deliberation notes because those blocks were conditionally wrapped inside reviewer/committee checks.\\n2. Solution Applied: Drafters and all team members now have 100% read visibility into all 4 reviewer findings and committee consensus deliberations right on the verse card. A clean non-intrusive banner clarifies that notes are viewable for editorial alignment while editing is reserved for active assignees.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '30',
      'Dedicated Unified Admin Console Tab in Sidebar (testing.docx P10)',
      'DECISION LOCKED:\\nCreated a dedicated "⚙ Admin Console" navigation item and screen consolidating 1) Book Governance & Target Dates Lock, 2) Team Directory with Google OAuth Emails, 3) Granular View/Edit Permission Toggles, and 4) 1-Click Sheets Column Protections Sync into a cohesive single-pane command center.',
      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '31',
      'Google Sign-In (OAuth) Authentication Bridge (testing.docx P9)',
      'DECISION LOCKED:\\n1. Auth Mechanism: Google Sign-In (OAuth) adopted as the primary authentication bridge ($0/month, free Google OAuth client ID).\\n2. Directory Alignment: System matches authenticated Google email against active emails in the ⚙ Config sheet.\\n3. Role Grant: Automatically assigns specific permissions matching active roles. Directly reinforces Google Sheets native column edit protections without duplicate credentials.',
      'Phase 6',
      'Locked & Agreed'
    ]
  ];`;

if (code.includes(targetArchEnd) && !code.includes('Layman Target Date Engine vs Static 14-verse Formula')) {
  code = code.replace(targetArchEnd, archDecisionsPhase6);
  console.log('6. ws7 Architect Comments 26-31 added.');
}

// 7. Update ws9: Error & Correction Log (Issues 30-32)
const targetErrorEnd = `    [
      '29',
      'Smart Assistant / Rules & Appreciations Polish',
      'Kannada Rules box cleanup & Appreciations formatting (testing.docx P28-33 & Images 14, 15):\\nUser requested removing the top and bottom explanatory boxes from Kannada Rules, and removing the Bible logo and breaking paragraphs after full stops in Appreciations.',
      'Static introductory banners occupied valuable space in Kannada Rules, and Appreciations paragraph had an emoji logo and lacked line breaks.',
      '1. In Kannada Rules tab: Removed top "OFFICIAL GLBC TRANSLATION COLOR RULES" header box and bottom TBS box, leaving only the 5 clean colored rule cards.\\n2. In Progress tab: Removed Bible logo (📖) and broke the momentum appreciation text into distinct paragraphs after full stops.',
      'web/src/components/SmartAssistantDrawer.tsx',
      'Verified ✅ Fixed'
    ]
  ];`;

const errorLogPhase6 = `    [
      '29',
      'Smart Assistant / Rules & Appreciations Polish',
      'Kannada Rules box cleanup & Appreciations formatting (testing.docx P28-33 & Images 14, 15):\\nUser requested removing the top and bottom explanatory boxes from Kannada Rules, and removing the Bible logo and breaking paragraphs after full stops in Appreciations.',
      'Static introductory banners occupied valuable space in Kannada Rules, and Appreciations paragraph had an emoji logo and lacked line breaks.',
      '1. In Kannada Rules tab: Removed top "OFFICIAL GLBC TRANSLATION COLOR RULES" header box and bottom TBS box, leaving only the 5 clean colored rule cards.\\n2. In Progress tab: Removed Bible logo (📖) and broke the momentum appreciation text into distinct paragraphs after full stops.',
      'web/src/components/SmartAssistantDrawer.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '30',
      'Drafter Workspace / Deliberation Isolation',
      'Drafters unable to view reviewer and committee discussion threads in Focus Mode (testing observation & user review):\\nDrafter logging in saw only the basic green Drafter box and was completely locked out from viewing linguistic critique from the 4 reviewers or consensus notes from the committee.',
      'FocusModeCard conditionally wrapped Review Findings and Committee deliberations inside {isDisciplineReviewer} and {isCommittee} blocks, completely omitting them from {isDrafter}.',
      '1. Restored full read visibility of the 4-Discipline Review Findings Matrix and Committee Deliberations inside the Drafter workspace.\\n2. Added helpful "Cross-Stage Discussion View" badge explaining that drafters can inspect all reviewer notes to align future translation chapters.',
      'web/src/components/FocusModeCard.tsx',
      'Verified ✅ Fixed'
    ],
    [
      '31',
      'Sidebar Roster / Profile Styling Defect',
      'Squished presence status indicator & repetitive "PA"/"SI"/"BR" avatar initials (testing.docx P5, P6, P7 & Images 2, 3):\\nGreen presence dots were compressed horizontally into narrow ovals on members with long role titles. Avatar initials took first two letters of title, rendering identical "PA" for Pastor Zack, Pastor Raju, Pastor Matt, etc.',
      '1. .presence CSS lacked flex-shrink: 0, causing flexbox compression when role titles wrapped.\\n2. Avatar initials logic used member.name.slice(0, 2), reflecting honorific titles rather than personal names.',
      '1. Added flex-shrink: 0, min-width: 0.5rem, min-height: 0.5rem, and border-radius: 9999px to .presence.\\n2. Built Smart Name Parser stripping honorific titles ("Pastor Zack" -> "PZ", "Sister Nancy" -> "SN").\\n3. Implemented dynamic role-themed color palette for avatars.',
      'web/src/components/Sidebar.tsx\\nweb/src/index.css',
      'Verified ✅ Fixed'
    ],
    [
      '32',
      'Analytics / Static Velocity Formula',
      'Arbitrary 14 verses/day burn-down forecast formula creating unrealistic Dec 14 completion date (testing.docx P1, P3 & Image 1):\\nBurn-down card computed Math.round(remaining / 14) and added it to today\\'s date, showing Dec 14, 2026 without any connection to real project goals.',
      'AnalyticsView had a static placeholder formula hardcoded to 14 verses/day pace.',
      '1. Replaced static formula with authentic locked Book Target Completion Date.\\n2. Dynamically calculates Required Daily Pace (verses/day) and compares against 7-day actual completion rate to display On-Track vs Delayed status.',
      'web/src/components/AnalyticsView.tsx\\nweb/src/services/api.ts',
      'Verified ✅ Fixed'
    ]
  ];`;

if (code.includes(targetErrorEnd) && !code.includes('Drafter Workspace / Deliberation Isolation')) {
  code = code.replace(targetErrorEnd, errorLogPhase6);
  console.log('7. ws9 Error Log 30-32 added.');
}

// 8. Update File Output to BOTH files
const oldWrite = `  const filePath = path.join(__dirname, 'GLBC_Architecture_Upgrade_Plan.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log('SUCCESS: Pristine workbook regenerated with all 9 sheets fully styled!');`;

const newWrite = `  const filePath1 = path.join(__dirname, 'GLBC_Architecture_Upgrade_Plan.xlsx');
  const filePath2 = path.join(__dirname, 'GLBC_Architecture_Upgrade_Plan_updated.xlsx');
  await workbook.xlsx.writeFile(filePath1);
  await workbook.xlsx.writeFile(filePath2);
  console.log('SUCCESS: Pristine workbooks regenerated with all 9 sheets fully styled in BOTH files!');`;

if (code.includes(oldWrite)) {
  code = code.replace(oldWrite, newWrite);
  console.log('8. File writing updated for both workbooks.');
}

fs.writeFileSync(srcPath, code, 'utf8');
console.log('Successfully updated regenerate_full_plan_excel.js with Phase 6!');
