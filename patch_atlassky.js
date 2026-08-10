const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/AtlasSkyPreview.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /return \(\s*<>\s*<div\s*onClick=\{\(\) => setModalOpen\(true\)\}[\s\S]*?<\/div>\s*<AtlasSkyModal/m,
  `return (
    <>
      <button 
        onClick={() => setModalOpen(true)}
        className="text-muted-foreground hover:text-foreground rounded-full w-10 h-10 flex items-center justify-center transition-colors relative group"
        title="Atlas Sky"
      >
        <Sparkles className="w-5 h-5 group-hover:text-amber-300 transition-colors" />
        {masteredCount > 0 && (
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
        )}
      </button>
      <AtlasSkyModal`
);

fs.writeFileSync(file, content);
