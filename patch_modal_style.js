const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetSvgStart = '<svg className="absolute inset-0 w-full h-full" style={{ filter: \'drop-shadow(0 0 10px rgba(16, 185, 129, 0.2))\' }}>';

const replacementSvgStart = `<style>
          {\`
            @keyframes drawLine {
              from { stroke-dasharray: 2000; stroke-dashoffset: 2000; }
              to { stroke-dasharray: 2000; stroke-dashoffset: 0; }
            }
          \`}
        </style>
        <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.2))' }}>`;

content = content.replace(targetSvgStart, replacementSvgStart);

content = content.replace(
  `style={{ animation: \`dash 2s ease-out forwards\` }}`,
  `style={{ animation: \`drawLine 2s ease-out forwards\` }}`
);

fs.writeFileSync(file, content);
