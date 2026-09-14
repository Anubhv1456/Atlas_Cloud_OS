const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/pages/Onboarding.tsx', 'utf8');

// Fix 1: YEARS is an array of strings, but mapped as objects
const oldYearMap = `                  {YEARS.map(year => (
                    <button
                      key={year.id}
                      onClick={() => handleYearSelect(year.id)}
                      className="w-full p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 hover:scale-[0.98] active:scale-[0.96] transition-all duration-300 text-left flex flex-col gap-1.5 cursor-pointer group"
                    >
                      <span className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors">{year.label}</span>
                      <span className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">{year.desc}</span>
                    </button>
                  ))}`;

const newYearMap = `                  {YEARS.map(year => (
                    <button
                      key={year}
                      onClick={() => handleYearSelect(year)}
                      className="w-full p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 hover:scale-[0.98] active:scale-[0.96] transition-all duration-300 text-left flex flex-col gap-1.5 cursor-pointer group"
                    >
                      <span className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors">{year}</span>
                    </button>
                  ))}`;

code = code.replace(oldYearMap, newYearMap);

// Fix 2: 'pathway' should be 'fork'
code = code.replace(/\{step === 'pathway' && \(/g, "{step === 'fork' && (");

// Fix 3: 'handleStartFast' should be 'handleJumpRightIn'
code = code.replace(/onClick=\{handleStartFast\}/g, "onClick={handleJumpRightIn}");

fs.writeFileSync('artifacts/study-tracker/src/pages/Onboarding.tsx', code);
