const fs = require('fs');
const file = './artifacts/study-tracker/src/lib/recommendation-engine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /if \(sys\.isHighYield\) \{\n      score \+= 150; \/\/ Give a massive boost to high yield systems\n      reasons\.unshift\('🔥 Marked as High Yield'\);\n    \}/g,
  ""
);

fs.writeFileSync(file, code);
