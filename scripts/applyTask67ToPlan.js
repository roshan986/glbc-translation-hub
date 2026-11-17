const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'regenerate_full_plan_excel.js');
let code = fs.readFileSync(srcPath, 'utf8');

// 1. In ws6: Update Task 6.2 to Completed and Add Task 6.7
const oldTask62 = `    [
      'Phase 6',
      '6.2',
      'Universal Discussion Visibility for Drafters & Team',
      'Ensure drafters and all roles have 100% full read visibility into reviewer notes across all 4 disciplines, committee consensus deliberations, and final editor notes directly inside Focus Mode.',
      'Frontend (React)',
      '⏳ In Progress',
      'Immediate',
      'In Progress. User requirement: Drafters must see reviewer and committee discussion threads to understand editorial guidance and refine future translation chapters.'
    ],`;

const newTask62And67 = `    [
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
    ],`;

if (code.includes(oldTask62)) {
  code = code.replace(oldTask62, newTask62And67);
  console.log('1. ws6 Task 6.2 updated to Completed & Task 6.7 added.');
}

// 2. Update KPI block: 30 / 38 (78.9% Done)
const oldKpi = `'Overall Progress: 29 / 37 (78.4% Done)'`;
const newKpi = `'Overall Progress: 31 / 38 (81.6% Done)'`;
const oldP6Kpi = `'Phase 6 (Governance & Open Deliberation): 0 / 6 In Progress 🎯'`;
const newP6Kpi = `'Phase 6 (Governance & Deliberation): 2 / 7 Completed (28.6% ✅)'`;

if (code.includes(oldKpi)) {
  code = code.replace(oldKpi, newKpi);
  console.log('2. ws6 KPI overall progress updated.');
}
if (code.includes(oldP6Kpi)) {
  code = code.replace(oldP6Kpi, newP6Kpi);
  console.log('3. ws6 KPI Phase 6 progress updated.');
}

// 3. In ws7: Add Decision 32
const oldDecision31End = `      'Phase 6',
      'Locked & Agreed'
    ]
  ];`;

const newDecision32 = `      'Phase 6',
      'Locked & Agreed'
    ],
    [
      '32',
      'Chat-Bubble Deliberation Stream, Contextual Role Tagging & Pop-Out Modal (testing.docx Batch 7 & Image 1)',
      'DECISION LOCKED:\\n1. Chat-Style Alignment: Messages sent by current user align to the right with speech tail and "You (Role)" badge matching the active tab (e.g. "You (Committee)" or "You (Final Editor)"). Messages from peer scholars align to the left with their name, role, and smart initials avatar.\\n2. Space Optimization: Scrollable container capped at max-height 280px with smooth auto-scroll to bottom. Card header features collapsible toggle (Expand/Collapse) to save vertical space.\\n3. Pop-Out Modal: Dedicated [⤢ Pop Out] button opens DiscussionPopoutModal with full-screen conversation view, keyword search, and integrated quick composer.\\n4. Backend Safety: Comment write-back directly targets designated sheet columns (Col O for Committee, Col G/I/K/M for Reviewers) without schema changes.',
      'Phase 6',
      'Locked & Agreed'
    ]
  ];`;

if (code.includes(oldDecision31End) && !code.includes('Chat-Bubble Deliberation Stream, Contextual Role Tagging & Pop-Out Modal')) {
  code = code.replace(oldDecision31End, newDecision32);
  console.log('4. ws7 Decision 32 added.');
}

// 4. In ws9: Add Issue 33
const oldIssue32End = `      'web/src/components/AnalyticsView.tsx\\nweb/src/services/api.ts',
      'Verified ✅ Fixed'
    ]
  ];`;

const newIssue33 = `      'web/src/components/AnalyticsView.tsx\\nweb/src/services/api.ts',
      'Verified ✅ Fixed'
    ],
    [
      '33',
      'Committee & Reviewer Deliberation / Chat Ergonomics',
      'Full-width flat cards without distinction between sender and peers; discussion container expanded without bound (testing.docx Batch 7 & Image 1):\\nUser observed committee notes were stacked on the left, lacked conversational feel, took up excessive vertical space, and could not be expanded or popped out for reading.',
      'Discussion threads lacked conversational chat-bubble geometry, sender-aware alignment ("You" on right, peers on left), and height constraints.',
      '1. Implemented chat-bubble layout (You on right, Peers on left) with role-aware bylines.\\n2. Constrained scrollable height to 280px with smooth auto-scroll to newest message.\\n3. Added [▾ Collapse / ▸ Expand] header toggle to save vertical space.\\n4. Built DiscussionPopoutModal.tsx with full-screen conversation view, keyword search, and live composer.',
      'web/src/components/FocusModeCard.tsx\\nweb/src/components/DiscussionPopoutModal.tsx\\nweb/src/index.css\\nweb/src/utils/userUtils.ts',
      'Verified ✅ Fixed'
    ]
  ];`;

if (code.includes(oldIssue32End) && !code.includes('Committee & Reviewer Deliberation / Chat Ergonomics')) {
  code = code.replace(oldIssue32End, newIssue33);
  console.log('5. ws9 Issue 33 added.');
}

fs.writeFileSync(srcPath, code, 'utf8');
console.log('Successfully updated regenerate_full_plan_excel.js with Task 6.7 and Decision 32!');
