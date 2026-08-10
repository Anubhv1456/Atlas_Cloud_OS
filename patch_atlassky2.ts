import fs from 'fs';

let content = fs.readFileSync('./artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx', 'utf8');

content = content.replace(
  '</DialogContent>',
  `  <div className="absolute bottom-10 left-0 w-full flex justify-center pointer-events-none z-30 opacity-70">
            <div className="text-center px-6 max-w-sm">
              <p className="text-xs sm:text-sm font-medium text-teal-100/60 italic">"The art of medicine consists of amusing the patient while nature cures the disease."</p>
              <p className="text-[10px] text-teal-100/40 uppercase tracking-[0.2em] mt-3 border-t border-white/10 pt-2 inline-block">Your Atlas OS Journey</p>
            </div>
          </div>
        </DialogContent>`
);

fs.writeFileSync('./artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx', content);
