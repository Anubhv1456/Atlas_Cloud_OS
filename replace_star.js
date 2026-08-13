const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `<div \n                  className={cn(\n                    "rounded-full transition-all duration-1000",\n                    globalHealth >= 90 ? "bg-amber-100 shadow-[0_0_40px_15px_rgba(252,211,77,0.4)]" : "bg-sky-100 shadow-[0_0_30px_10px_rgba(224,242,254,0.3)]"\n                  )}\n                  style={{\n                    width: \`\${10 + (globalHealth / 100) * 8}px\`,\n                    height: \`\${10 + (globalHealth / 100) * 8}px\`,\n                  }} \n                 />`;

code = code.replace(target, '<AtlasNorthStar globalHealth={globalHealth} />');
fs.writeFileSync(file, code);
