const fs = require('fs');
const buffer = fs.readFileSync('artifacts/study-tracker/public/favicon.ico');
console.log(buffer.slice(0, 8).toString('hex'));
