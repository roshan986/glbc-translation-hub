const fs = require('fs');
const content = fs.readFileSync('web/src/components/SettingsView.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (/backgroundColor:\s*['"]#(f|e)[0-9a-f]{5}['"]/i.test(l) || /style=.*backgroundColor/i.test(l)) {
    console.log(`${idx+1}: ${l.trim().substring(0, 120)}`);
  }
});
