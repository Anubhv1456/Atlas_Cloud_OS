const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/subjects/SystemCard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Insert progress line
const target = `            <div className="flex items-center gap-3 w-full">
              <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </div>`;

const newCode = `            <div className="flex items-center gap-3 w-full">
              <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </div>
        
        {/* Header Progress Line */}
        {!expanded && (
          <div className="h-[2px] bg-primary/10 w-full">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: \`\${progress}%\` }} />
          </div>
        )}`;

content = content.replace(target, newCode);

fs.writeFileSync(file, content);
console.log('Progress line added to SystemCard.tsx');
