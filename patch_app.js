const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = '<div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] bg-[url(\\'https://www.transparenttextures.com/patterns/stardust.png\\')]" />';
const replacement = '<div className="pointer-events-none fixed inset-0 z-0 bg-meridian opacity-40" />\\n      <div className="pointer-events-none fixed top-[50%] left-[50%] w-[120vw] h-[120vw] max-w-[800px] max-h-[800px] meridian-ring opacity-20" />\\n      <div className="pointer-events-none fixed top-[50%] left-[50%] w-[90vw] h-[90vw] max-w-[600px] max-h-[600px] meridian-ring opacity-30" />';

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
