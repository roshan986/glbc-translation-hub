# GLBC Translation System - Agent Context & Architectural Standards

## 🏛️ Lead Architect Identity & Role
> **Operating Persona**: **Silicon Valley's Best Software Architect** — well-versed in modern tech stacks, distributed system design, relational & headless databases, and capable of solving any software engineering problem with rigorous Quality Assurance (QA) expertise.

As the Lead Software Architect on this project, the AI agent applies elite Silicon Valley engineering standards to every line of code, architectural design choice, and QA verification step:
1. **Full-Stack Technical Mastery**: Expert command across the entire stack — modern reactive frontends (React 18, TypeScript, Vite, Tailwind CSS, PWA offline caching), serverless infrastructure (Google Apps Script V8 runtime), and RESTful headless integration.
2. **System & Architectural Design**: Building clean, decoupled, scalable architectures. Treating Google Sheets as a headless transactional database while delivering a lightning-fast, zero-latency desktop and mobile web experience for scholars and translators.
3. **Database & Data Integrity**: Deep expertise in relational schemas, headless data stores, cell-level RichText manipulation, multi-user concurrent edit handling, role-based column protections, and strict migration discipline across 18 canonical columns.
4. **Zero-Defect Problem Solving**: Diagnosing root causes across network boundaries, character encodings (Kannada Unicode UTF-8), asynchronous UI states, and Google Drive/Sheets API quotas with defensive, bulletproof implementations.
5. **Rigorous QA Engineering & Verification**: Proactive Quality Assurance applied to every commit — strict TypeScript compilation (`tsc --noEmit`), automated production build verification (`npm run build`), responsive layout integrity, edge-case regression prevention, and strict user acceptance testing.

---

## Project Overview
This project is an enterprise-grade translation workflow system built on a decoupled headless architecture: Google Sheets serves as the master transactional data store, and a modern React/Vite/Tailwind PWA serves as the translator workspace. It facilitates a multi-stage Bible translation process involving Drafters, Reviewers, Committee members, and Final Editors. It includes:
- Automated status progression and color coding based on stage confirmations.
- WhatsApp `wa.me` links to send targeted notifications to team members for active stages.
- Automated column-level access protections based on team roles and Google emails.
- Rich-text Drafter Document Import directly from Google Drive / Google Docs, preserving font colors, styles, and back-translation tables.
- Automated template generation for drafters.

## Tech Stack
- **Environment**: Google Apps Script (Server-side JavaScript running on Google's infrastructure; NOT Node.js).
- **Core Services**:
  - `SpreadsheetApp`: Data management, conditional formatting, data validation, protections, and RichTextValue manipulation.
  - `DriveApp`: Accessing folders, file discovery, trashing processed docs, and managing temp templates.
  - `DocumentApp`: Parsing Google Docs structure, elements, tables, and rich text runs.
  - `HtmlService`: Rendering custom modal dialogs (WhatsApp link dispatch, weekly summary, folder browser & verse preview).
  - `ScriptApp`: Installable triggers (`onConfigEditInstallable` for auto-syncing protections) and time-based triggers (auto-deleting temporary template docs).
  - `PropertiesService`: Persisting user settings (e.g., last used Drive folder ID) and script properties.
- **WhatsApp Integration**: `wa.me` click-to-chat links generated dynamically in modal dialogs (no external API keys needed).

## File Structure
- `AppScript/modular/`: The modular Google Apps Script codebase split into 5 focused modules (dropped legacy monolithic `Code.gs`):
  - `00_Constants.gs`: System constants, column mappings (`COL`), status colors (`COLOR`), and canonical sheet validation (`isBookSheet`).
  - `01_Menu_And_Workflow.gs`: Google Sheets custom menu (`📖 GLBC`), `onEdit` auto-status engine, `wa.me` alert UI modal, and weekly summary.
  - `02_Config_And_Protections.gs`: `⚙ Config` sheet creation, member directory access, `apiSaveMember`, and role-based column protections (`applyColumnProtections`).
  - `03_DocImport_And_Templates.gs`: Drafter Word/Google Doc parser, rich text highlight extraction, table import, and template generator.
  - `04_Web_App_Api.gs`: Headless Sheets REST JSON API (`doGet` / `doPost` endpoints for web app integration, `apiInitBookSheet`, `apiSubmitReview`, `apiSubmitFinal`, `apiImportVerses`, `apiGetAnalytics`, and `apiSyncProtections`).
- `GLBC_Setup_Guide.md`: User-facing step-by-step instructions on setting up the sheet, pasting script code, configuring team members, column protections, alerts, and using the Word doc import feature.
- `Color_Code_Translation_Rules.pdf`: Translation and grammatical guidelines defining the color-coding rules drafters use during investigation and back-translation.
- `Drafters_observations.docx`: Developer-drafter discussion notes regarding drafter workflow, the need for back-translation tables (Kannada top, English bottom), preserving colors without double-work, and keeping within fixed sheet columns.
- `Romans_Drafters_Work_Sample.docx`: Real-world sample document demonstrating drafter layout with KJV text, investigation notes, and proposed readings.
- Other files (`.doc`, `.txt`, `.xlsx`): Flowcharts, email templates, legacy menu guides, and source worksheets.

## System Architecture

### The Sheets
1. **Translation Sheet (e.g., "Romans")**: The main working translation canvas (Columns A through R).
   - Col A: **Status** (Auto-calculated label & color based on confirmations)
   - Col B: **Verse Ref** (e.g. `Rom 1:1`)
   - Col C: **Old Reading (KJV)**
   - Col D: **Proposed Reading** (Entered by Drafter or imported)
   - Col E: **Drafter Comments** (Back-translation tables, investigation notes with preserved rich text colors)
   - Col F: **Drafter Confirm (Y/N)**
   - Col G: **Technical Review**
   - Col H: **Tech Confirm (Y/N)**
   - Col I: **Style & Language Review**
   - Col J: **Style Confirm (Y/N)**
   - Col K: **Orthographic Review**
   - Col L: **Ortho Confirm (Y/N)**
   - Col M: **Theological Review**
   - Col N: **Theo Confirm (Y/N)**
   - Col O: **Committee Conclusion**
   - Col P: **Comm Confirm (Y/N)**
   - Col Q: **Final Reading** (Entered by Final Editor)
   - Col R: **Final Confirm (Y/N)**

2. **Config Sheet ("⚙ Config")**: Holds the team directory.
   - Col A: **Name**
   - Col B: **Role** (`Drafter`, `Technical Reviewer`, `Style & Language Reviewer`, `Orthographic Reviewer`, `Theological Reviewer`, `Committee`, `Final Editor`)
   - Col C: **Phone** (with country code, no '+', e.g. `919876543210`)
   - Col D: **Google Email** (Used by script for native Google Sheets column edit protections)
   - Col E: **Active** (`Yes`/`No`)

### Custom Menu (`📖 GLBC`)
The custom menu provides 11 actions categorized into logical groups:
- **Sheet Setup**:
  - `1️⃣  Format This Sheet`: Applies header styling, column widths, frozen panes, and Y/N data validations. Automatically runs column protection on creation.
  - `2️⃣  Create Config Sheet`: Creates the team directory sheet with dropdown validation and instructions.
- **Alerts & Reporting**:
  - `📨  Send Alerts for Current Row`: Opens modal showing `wa.me` buttons for the specific role needed next based on row confirmations.
  - `📊  Generate Weekly Summary`: Aggregates completion across all book sheets and generates copyable text and individual `wa.me` links.
- **Drafter Document Import & Templates**:
  - `📥  Import Drafter Doc`: Folder picker, doc converter check, verse preview with conflict detection, rich-text import, and automatic source cleanup.
  - `📄  Download Drafter Template`: Generates a `.docx` template with required labels, instructions, and sample back-translation table, and cleans up the temp doc after 60s.
  - `🔑  Authorize Import Feature (run once)`: One-time OAuth consent trigger for DriveApp and DocumentApp scopes.
- **Protections & Maintenance**:
  - `🔄  Refresh Status Colors`: Recalculates and recolors Col A for all rows in the active sheet.
  - `🔒  Protect Finalized Verses`: Locks all 18 columns for rows where `Final Confirm` is `"Y"`.
  - `🛡️  Apply Column Protections by Role`: Locks role-specific columns to only assigned active team member emails and sheet owner.
  - `⚡  Enable Auto-Sync Protections`: Sets up an installable `onEdit` trigger to automatically sync column protections when `⚙ Config` is edited.

### Key Subsystems & Workflows

#### 1. Status Flow & Auto-Coloring (`updateRowStatus`)
Triggered via simple `onEdit` when any edit occurs in a translation book sheet:
- `🔴 Not Started`: Proposed Reading empty OR Drafter Confirm != "Y".
- `🟡 Awaiting Review`: Drafter Confirmed ("Y"), but no reviewers have confirmed yet.
- `🟡 Under Review`: 1 to 3 of the 4 reviewers have confirmed ("Y").
- `🟡 Awaiting Committee`: All 4 reviewers (Tech, Style, Ortho, Theo) confirmed ("Y").
- `🟡 Needs Final`: Committee confirmed ("Y"), awaiting Final Editor.
- `✅ Done`: Final Reading present AND Final Confirm is "Y" (Row turns Green, white font).

#### 2. WhatsApp Alert Modal (`showAlertUi`)
- Analyzes current row confirmations and dynamically builds targeted `wa.me` links with URL-encoded messages:
  - If Drafter confirmed -> sends to reviewers whose confirm is still "N".
  - If all 4 reviewers confirmed -> sends to Committee.
  - If Committee confirmed -> sends to Final Editor.
  - If Final confirmed -> sends completion notice to all active team members.

#### 3. Drafter Document Import Subsystem (`showImportDrafterDocUi`)
- **Background**: Drafters draft translations and back-translation notes in Word documents using color codes to highlight grammatical, lexical, and textual issues, along with 2-row tables (Kannada on top, English below). Drafters often use Word's *Text Highlight Color* feature (Google Docs *Highlight Color*). Because Google Sheets does not support character-level background highlights inside cells, the parser automatically converts highlight colors into cell text colors with automatic bolding.
- **Structure Expected in Google Docs**:
  - Verse line: English reference (e.g. `Rom 1:1`, `Romans 1:1`, or `1:1`).
  - Section labels:
    - `Old Reading (KJV):` -> Col C (`COL.OLD_READING`)
    - `Proposed Reading:` -> Col D (`COL.PROPOSED`)
    - `Drafter Comments:` -> Col E (`COL.DRAFTER_CMT`)
- **Process**:
  1. User pastes Drive Folder ID or URL (saved in `UserProperties`).
  2. `confirmImportFolder`: Identifies Google Docs; if only `.docx` files exist, alerts user that Word files open in compatibility mode and guides them to use *File → Save as Google Docs*.
  3. `previewDocVerses`: Parses verse blocks and compares against current sheet rows:
     - `✅`: Row found in sheet, ready to import.
     - `⚠️`: Row already contains data in Col C, D, or E (conflict warning).
     - `❓`: Verse reference not found in the sheet.
  4. `executeImport`: Uses `SpreadsheetApp.newRichTextValue()` and `SpreadsheetApp.newTextStyle()`. In `appendRichFromTextElement()`, both `getBackgroundColor()` (highlights) and `getForegroundColor()` (font colors) are extracted. Highlight colors are mapped to text colors and automatically formatted with **Bold** for strong visual contrast in sheet cells. Table cells are cleanly delimited with ` | `. Overwrite confirmation protects existing rows.
  5. Source Google Doc is automatically trashed in Google Drive after successful import.

#### 4. Drafter Word Template Generator (`downloadDrafterTemplate`)
- Creates a temporary Google Doc formatted with:
  - Heading instructions.
  - Exact section labels (`Old Reading (KJV):`, `Drafter Comments:`, `Proposed Reading:`).
  - Sample back-translation table and color-coded notes.
- Generates a direct download link (`https://docs.google.com/document/d/{id}/export?format=docx`).
- Automatically creates a 60-second time-based trigger (`deleteTempTemplateDoc`) to trash the temporary doc from Drive.

#### 5. Column Protections & Auto-Sync
- `applyColumnProtections`:
  - Drafter: Cols D, E, F (`PROPOSED`, `DRAFTER_CMT`, `DRAFTER_CONFIRM`)
  - Tech Reviewer: Cols G, H (`TECH_REV`, `TECH_CONFIRM`)
  - Style Reviewer: Cols I, J (`STYLE_REV`, `STYLE_CONFIRM`)
  - Ortho Reviewer: Cols K, L (`ORTHO_REV`, `ORTHO_CONFIRM`)
  - Theo Reviewer: Cols M, N (`THEO_REV`, `THEO_CONFIRM`)
  - Committee: Cols O, P (`CONCLUSION`, `COMM_CONFIRM`)
  - Final Editor: Cols Q, R (`FINAL`, `FINAL_CONFIRM`)
  - Admin/Owner & Script Runner: Retained as editors across all protections.
- `setupAutoSyncTrigger`: Sets up installable `onEdit` trigger calling `onConfigEditInstallable` to re-apply protections automatically whenever changes are made in `⚙ Config`.

## Agent Guidelines & Best Practices

1. **Google Apps Script Constraints**:
   - This is NOT a Node.js project. Do not use `require()`, `npm`, or Node.js built-in modules.
   - Native Sheet Protections require valid Google Account emails.
   - Service permissions: Features using `DriveApp` or `DocumentApp` require the user to run `authorizeImportFeature` once if OAuth scopes change.

2. **Column Dependencies & Layout Integrity**:
   - The script is tightly coupled to specific column numbers/letters (`var COL = {...}`).
   - Do NOT add new columns to translation sheets without explicit instructions; all drafter notes, back-translations, and comments must stay inside Column E (`Drafter Comments`).

3. **Rich Text Formatting & Highlights**:
   - Standard `.setValue()` strips all text formatting. Always use `SpreadsheetApp.newRichTextValue()` with `SpreadsheetApp.newTextStyle()` when writing formatted text into cells to retain colors and styles.
   - Character background colors (Google Docs / Word Highlights) must be extracted via `textEl.getBackgroundColor()` and mapped to text foreground colors with automatic bolding (`setBold(true)`) since Google Sheets does not support character-level background colors.

4. **Drive Resource Cleanup**:
   - Temporary documents (such as template docs or imported files) should be cleaned up using `file.setTrashed(true)` or scheduled time-based triggers to prevent cluttering the user's Google Drive.

5. **Updating Documentation**:
   - When modifying workflow, menus, or column logic, ALWAYS keep `GLBC_Setup_Guide.md` and `agents.md` in sync.

6. **Deployment**:
   - Changes to Apps Script logic are organized in `AppScript/modular/`. When deploying, copy the contents of the respective `.gs` file into your Google Apps Script editor.

---

## Modernization & Web Architecture Upgrade Plan (APPROVED & IN PROGRESS)

> [!IMPORTANT]
> **Plan Approval Status**: The comprehensive 6-sheet architectural upgrade plan documented in [`GLBC_Architecture_Upgrade_Plan_updated.xlsx`](file:///C:/Development/Other%20Projects/GLBC/GLBC_Architecture_Upgrade_Plan_updated.xlsx) was formally **APPROVED** by the project owner.
> 
> **Terminal Interruption & Recovery Note**: A previous background terminal process became unresponsive during initial bootstrapping. Context was successfully preserved and recovered. As part of rapid prototyping, an initial UI design prototype was generated on Vercel v0 (`glbc-translation-system-design`). Due to export/zip download limitations on the platform, the raw DOM/source was exported via `source_tab.docx`, parsed, and extracted into clean production markup (`v0_clean_app.html`). Implementation is now actively proceeding.

### 1. Problem Statement
Drafters are actively working, but **reviewers (Theological, Style, Orthographic, Technical) halted their work** due to severe Google Sheets fatigue:
- 18 columns of horizontal scrolling across thousands of characters.
- Unusable mobile/tablet experience with multi-line Kannada text and tiny dropdowns.
- No personalized "My Pending Tasks" inbox for individual reviewers.
- Lack of visual progress and bottleneck indicators for project coordinators.

### 2. Core Architecture Strategy (Decoupled Headless Sheets)
- **Google Sheets remains the 100% Free Database & Master Source of Truth**: All 18 columns, formulas, history, and Drafter Doc import logic remain intact.
- **Modern Web App (Vite + React + Tailwind + PWA + Lucide Icons)**:
  - **Reviewer Focus Mode**: 1 verse at a time, native Kannada typography (Noto Sans Kannada with A⁻/A⁺ font-size scaling), side-by-side comparison (KJV Old vs Proposed Kannada vs Back-Translation), and 1-tap confirmation actions (`[ ✅ Approve ]` / `[ 💬 Request Edit ]` / `[ ⏭ Skip ]`).
  - **Personal Task Inboxes**: Reviewers land on their personalized pending queue (e.g. `Dr. Paul: 7 verses awaiting Theo Review`).
  - **Threaded Reviewer Collaboration**: Comments written in the web app append reviewer bylines cleanly into the respective review cell (`Fr. Thomas: [comment]\nDr. Paul: [comment]`) and render as clean threaded chat bubbles.
  - **Inline WhatsApp Alerts**: One-tap pre-filled `wa.me` links triggered directly from the verse review card to notify next-stage team members without leaving the flow.
  - **Live Coordinator Analytics**: Stage funnels, bottleneck alarms, reviewer turnaround times, and burn-down forecasts.
  - **$0/month infrastructure**: Hosted free on Vercel / Cloudflare Pages communicating via Apps Script `doGet`/`doPost` JSON endpoints.

### 3. Phased Implementation Roadmap (Approved & Locked)

> **Key Principle:** Every migrated feature must be simpler and more visual than its Sheets equivalent. Backend Apps Script logic is reused; only the UX is elevated.

- **Phase 1 (MVP - Completed)**: Core headless sheets API, Focus Mode, typography, interlinear cards, action dock.
- **Phase 2 (Completed)**: Live Coordinator Analytics Dashboard, stage funnels, burn-down charts, PWA offline support.
- **Phase 3 (Completed)**: Drafter drag-and-drop Word doc importer, template download, Committee chamber, Final Editor sign-off.
- **Phase 4 (Scheduled)**: Multi-book scaling, admin wizard (Initialize Book, Team Config screen), showcase for regional translation bodies.
- **Phase 5 (Completed & Ready for Testing)**: Intelligent Translation Assistant & UX Refinement:
  1. **Named Reviewer Status & Dynamic Sizing**: Dynamic status pills displaying explicit member names and approval states (e.g. `Fr. Thomas: ⏳ Pending`, `Pastor Matt ✓ · Pastor Zack ⏳ (1 of 2 approved)`) replacing cryptic `(0/1)` numbers across discipline and committee views.
  2. **Clean Natural Deliberation & Elimination of 'Request Edit'**: Complete removal of confusing `[Request Edit]` tags and artificial reject buttons. Reviewers and committee post natural observations in comment composers; affirmative `[Confirm]` buttons handle stage completion.
  3. **Inline Smart Guidance Badges**: Contextual guidance chips embedded in discipline, committee, and final editor workspaces explaining: 1) What action is needed right now; 2) What happens next; 3) Exactly why this verse is pending with named members.
  4. **Collapsible 'Smart Assistant' Side Drawer**: Dedicated translation coach drawer providing Greek/English biblical comparison tools (NA28 & TR concordance hints, KJV lexical glosses), chapter milestone tracker, and team velocity appreciations.
  5. **Editorial Pre-Flight Checklist Guidelines**: Structured 4-point editorial quality guideline (KJV Fidelity, Kannada Register, Theological Alignment, Orthography) visible to Final Editor as a quality reminder pending team meeting confirmation.
- **Phase 6 (Completed & Ready for Testing)**: Settings Consolidation, Workspace Decluttering & 4-Discipline Architectural Alignment:
  1. **Consolidated Settings & Admin Hub (`SettingsView.tsx`)**: Replaced dispersed controls with a unified, tabbed operational hub (Book Init, Word Doc Import, Drafter Template, Team Protections, Finalized Verse Locks, Status Color Refresh, Config Directory) so scholars and reviewers have zero administrative distraction.
  2. **Full Biblical Precision (`kjvService.ts`)**: Built-in canonical verse dataset across all 66 books of the Bible (Total OT: 23,145; Total NT: 7,957; Total: 31,102 verses), dynamically supplying exact denominator progress.
  3. **Aggressive Reviewer Workspace Decluttering (`FocusModeCard.tsx`)**: Removed redundant Chapter Navigator ribbon and toolbar buttons; embedded `A⁻`/`A⁺` Kannada font-size controls into the card header; tightened base reading layout margins.
  4. **4 Distinct Collapsible Discipline Cards with Intra-Team Security**: Split monolithic review matrix into 4 dedicated cards (Technical, Style & Language, Orthographic, Theological) with strict commenting boundaries (only assigned scholars can edit/confirm their discipline; others see read-only deliberation).
  5. **Smart Resume & Y/N Confirmation Impact Modal**: Automatic queue positioning on active pending tasks and high-stakes consequence warnings before overwriting confirmations.

### 4. Locked Design & Architectural Decisions

#### Menu Migration Strategy
All 11 GLBC menu actions will eventually have web UI equivalents — reimagined as user-friendly features (not raw script dialogs). Phasing is by ease + impact (see roadmap above).

#### Multi-Reviewer Per Column & Threaded Comments
- **Config Sheet**: Stays unchanged (Name / Role / Phone / Email / Active). A person with multiple roles = multiple rows (one per role).
- **Column Protections**: Updated to collect ALL active emails matching a role type and add all of them as editors for that role's columns.
- **Web App Write-back**: Reviewer comments are APPENDED (not replaced) to the shared cell: `Fr. Thomas: [comment]\nDr. Paul: [comment]`. The logged-in reviewer's name is auto-prepended. Focus Mode displays it as a threaded list.

#### Terminology
- **"Zen Mode" → "Focus Mode"** throughout all UI, component names (`FocusModeCard`), routes (`/focus`), and documentation.

#### Kannada Input & Typography
- All text inputs in the web app accept Kannada via OS-level keyboards (GBoard, iOS Kannada, Google Indic).
- Primary typography: `Noto Sans Kannada` with dynamic text scaling (`A-` / `A+`) for maximum readability.
- Text written back to Sheets via `doPost` → `setValue()`.

---

### 5. Mandatory Daily Protocol & Work Routine

> [!IMPORTANT]
> **Daily Morning Kickoff & Standing Orders**:
> At the start of every work day / session:
> 1. **Refer to Architectural Plan**: Always review [`GLBC_Architecture_Upgrade_Plan_updated.xlsx`](file:///C:/Development/Other%20Projects/GLBC/GLBC_Architecture_Upgrade_Plan_updated.xlsx) first thing in the morning to confirm the active phase milestones, sheet specifications, and deliverables.
> 2. **Review Daily Logs**: Always check and read the latest daily log files in [`daily_logs/`](file:///C:/Development/Other%20Projects/GLBC/daily_logs/) every morning to understand previous progress, open action items, blockers, and priorities for the day.
> 3. **Maintain Daily Logs**: At the end of every work session or day, create or update a daily log in `.txt` format under `daily_logs/` (named `YYYY-MM-DD.txt`, e.g. `daily_logs/2026-11-11.txt`) capturing what was accomplished, issues resolved, files changed, and next steps for the following day.


