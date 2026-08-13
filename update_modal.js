const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/ScoreLogModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<div className="grid grid-cols-2 gap-2 bg-muted\/50 p-1 rounded-lg border border-border">([\s\S]*?)<\/div>/;

const newContent = `<div className="grid grid-cols-3 gap-2 bg-muted/50 p-1 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => { setType('revision'); setPyqYearId(undefined); }}
              className={\`py-1.5 text-xs font-semibold rounded-md transition-all \${
                type === 'revision'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }\`}
            >
              Topic Revision
            </button>
            <button
              type="button"
              onClick={() => { setType('pyq'); setSystemId(undefined); }}
              className={\`py-1.5 text-xs font-semibold rounded-md transition-all \${
                type === 'pyq'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }\`}
            >
              PYQ / Test
            </button>
            <button
              type="button"
              onClick={() => { setType('gt'); setSystemId(undefined); setPyqYearId(undefined); }}
              className={\`py-1.5 text-xs font-semibold rounded-md transition-all \${
                type === 'gt'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }\`}
            >
              Grand Test (GT)
            </button>
          </div>`;

content = content.replace(regex, newContent);
fs.writeFileSync(path, content);
