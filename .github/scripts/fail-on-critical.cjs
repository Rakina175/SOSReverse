const fs = require('fs');

const files = process.argv.slice(2);
let found = false;
const keywords = ['"critical"', 'CRITICAL', '"severity": "critical"', '"severity":"CRITICAL"', 'CRITICAL:'];

for (const f of files) {
  if (!f) continue;
  if (!fs.existsSync(f)) continue;
  try {
    const content = fs.readFileSync(f, 'utf8').toLowerCase();
    if (content.indexOf('critical') !== -1) {
      console.log(`Critical keyword found in ${f}`);
      found = true;
    }
  } catch (e) {
    // ignore
  }
}

if (found) {
  console.error('One or more critical findings detected.');
  process.exit(1);
}
console.log('No critical findings detected.');
process.exit(0);
