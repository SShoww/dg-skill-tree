// scripts/count-courses.cjs
const fs = require('fs');
const path = require('path');

const coursesTs = fs.readFileSync(path.join(__dirname, '../src/data/courses.ts'), 'utf8');
const codeRe = /"code":\s*"([^"]+)"/g;
const codes = new Set();
let m;
while ((m = codeRe.exec(coursesTs)) !== null) {
  const code = m[1];
  if (!code.includes('-EL-') && code.length >= 6 && /^\d/.test(code)) {
    codes.add(code);
  }
}

console.log('Unique course codes count:', codes.size);
console.log('First 20 codes:', Array.from(codes).slice(0, 20));
