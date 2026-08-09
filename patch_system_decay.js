const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/subjects/SystemCard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = "Calibrate memory decay speed for <span className=\"font-semibold text-foreground\">{system.name}</span> based on topic complexity or volatile facts.";
const replacement = "Calibrate memory decay speed for <span className=\"font-semibold text-foreground\">{system.name}</span>. (e.g. 1.5x = 33% faster reviews, 0.8x = 20% slower).";

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('Decay explanation updated.');
