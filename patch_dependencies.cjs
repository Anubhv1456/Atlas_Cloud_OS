const fs = require('fs');
const path1 = 'package.json';
let content1 = fs.readFileSync(path1, 'utf8');
const json1 = JSON.parse(content1);
json1.dependencies["jose"] = "4.15.5";
fs.writeFileSync(path1, JSON.stringify(json1, null, 2), 'utf8');

const path2 = 'artifacts/study-tracker/package.json';
let content2 = fs.readFileSync(path2, 'utf8');
const json2 = JSON.parse(content2);
json2.dependencies["jose"] = "4.15.5";
fs.writeFileSync(path2, JSON.stringify(json2, null, 2), 'utf8');
