const fs = require('fs');
let file = fs.readFileSync('artifacts/study-tracker/src/lib/ai/geminiClient.ts', 'utf8');

file = file.replace(
  "const finalParts: any[] = [];\n  if (input) {\n    finalParts.push({ text: input });\n  } else if (options.attachedImageBase64) {\n    finalParts.push({ text: 'Analyze this image and extract all high-yield clinical facts into atomic pearls.' });\n  }",
  "const finalParts: any[] = [{ text: input }];"
);
file = file.replace(
  "'gemini-1.5-flash'",
  "'gemini-flash'"
);
file = file.replace(
  "'gemini-1.5-flash'",
  "'gemini-flash'"
);

fs.writeFileSync('artifacts/study-tracker/src/lib/ai/geminiClient.ts', file);
