const fs = require('fs');
const file = './artifacts/study-tracker/src/lib/recommendation-engine.ts';
let content = fs.readFileSync(file, 'utf8');

const replacement = `    if (sys.isHighYield) {
      score += 150; // Give a massive boost to high yield systems
      reasons.unshift('🔥 Marked as High Yield');
    }
    
    if (systemSets.length > 0) {`;

content = content.replace(
    /if \(systemSets\.length > 0\) \{/,
    replacement
);

const fallbackReplacement = `      // Fallback
      let score = weightage.weight * yearMult;
      const reasons: string[] = [];
      if (sys.isHighYield) {
        score += 150;
        reasons.unshift('🔥 Marked as High Yield');
      }`;

content = content.replace(
    /\/\/ Fallback\s*let score = weightage\.weight \* yearMult;\s*const reasons: string\[\] = \[\];/,
    fallbackReplacement
);

fs.writeFileSync(file, content);
console.log('patched rec engine');
