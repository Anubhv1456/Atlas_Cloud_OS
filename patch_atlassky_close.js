const fs = require('fs');
let content = fs.readFileSync('./artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx', 'utf8');

content = content.replace(
  '"!max-w-none !w-screen !h-screen !max-h-none !m-0 !p-0 !rounded-none !border-none overflow-hidden flex flex-col",',
  '"!max-w-none !w-screen !h-screen !max-h-none !m-0 !p-0 !rounded-none !border-none overflow-hidden flex flex-col [&>button]:hidden",'
);

content = content.replace(
  'className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"',
  'className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50 w-12 h-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"'
);

fs.writeFileSync('./artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx', content);
