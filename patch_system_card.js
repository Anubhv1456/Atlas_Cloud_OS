const fs = require('fs');
const file = './artifacts/study-tracker/src/features/subjects/SystemCard.tsx';
let content = fs.readFileSync(file, 'utf8');

// import Star
content = content.replace(
    /import \{ ([^}]+) \} from 'lucide-react';/,
    (match, p1) => {
        if (!p1.includes('Star')) {
            return `import { ${p1}, Star } from 'lucide-react';`;
        }
        return match;
    }
);

const h4Html = `<h4 className="font-semibold text-lg leading-tight text-foreground truncate min-w-0">{system.name}</h4>`;
const newHtml = `
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateSystem(system.id!, { isHighYield: !system.isHighYield });
                  }}
                  className={cn(
                    "shrink-0 transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none cursor-pointer flex items-center justify-center -ml-1 p-1 rounded-full",
                    system.isHighYield 
                      ? "text-amber-500 bg-amber-500/10" 
                      : "text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted"
                  )}
                  title={system.isHighYield ? "High Yield Topic (Click to unmark)" : "Mark as High Yield Topic"}
                >
                  <Star className={cn("w-[18px] h-[18px] transition-all", system.isHighYield ? "fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" : "fill-transparent")} />
                </button>
                <h4 className="font-semibold text-lg leading-tight text-foreground truncate min-w-0">{system.name}</h4>`;

content = content.replace(
    /<h4 className="font-semibold text-lg leading-tight text-foreground truncate min-w-0">\{system\.name\}<\/h4>/,
    newHtml
);

fs.writeFileSync(file, content);
console.log('patched system card');
