const fs = require('fs');
const file = './artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /<SelectItem value="pyq">PYQ Tests<\/SelectItem>/g,
  '<SelectItem value="pyq">PYQ Tests</SelectItem>\n                <SelectItem value="set">Study Blocks</SelectItem>'
);

fs.writeFileSync(file, code);
