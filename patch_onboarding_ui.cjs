const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/pages/Onboarding.tsx', 'utf8');

// Use replacement to target everything from the return statement down.
const startIndex = code.indexOf('  return (');
if (startIndex !== -1) {
    code = code.substring(0, startIndex);
}

const uiCode = `  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950 to-zinc-950 pointer-events-none" />
      
      <div className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-md mx-auto p-6 sm:p-10 rounded-[2rem] bg-zinc-900/40 border border-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden flex flex-col">
          
          <div className="mb-8 flex justify-center shrink-0">
             <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shadow-inner">
                <AtlasEmblem className="animate-fade-in opacity-90 scale-75" />
             </div>
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: WELCOME & EXAM */}
            {step === 'welcome_exam' && (
              <motion.div
                key="welcome_exam"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-8"
              >
                <div className="text-center space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
                    Welcome. Let's tailor Atlas to your journey.
                  </h2>
                  <p className="text-sm text-zinc-400 font-medium">What are you studying for?</p>
                </div>

                <div className="space-y-3 w-full">
                  {EXAMS.map(exam => (
                    <button
                      key={exam.id}
                      onClick={() => handleExamSelect(exam.id)}
                      className="w-full p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 hover:scale-[0.98] active:scale-[0.96] transition-all duration-300 text-left flex flex-col gap-1.5 cursor-pointer group"
                    >
                      <span className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors">{exam.label}</span>
                      <span className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">{exam.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: ACADEMIC YEAR */}
            {step === 'year' && (
              <motion.div
                key="year"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-8"
              >
                <div className="text-center space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
                    Where are you in your medical journey?
                  </h2>
                  <p className="text-sm text-zinc-400 font-medium">Select your current academic stage.</p>
                </div>

                <div className="space-y-3 w-full max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                  {YEARS.map(year => (
                    <button
                      key={year.id}
                      onClick={() => handleYearSelect(year.id)}
                      className="w-full p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 hover:scale-[0.98] active:scale-[0.96] transition-all duration-300 text-left flex flex-col gap-1.5 cursor-pointer group"
                    >
                      <span className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors">{year.label}</span>
                      <span className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">{year.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: PATHWAY */}
            {step === 'pathway' && (
              <motion.div
                key="pathway"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-8"
              >
                <div className="text-center space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
                    How would you like to begin?
                  </h2>
                  <p className="text-sm text-zinc-400 font-medium">Choose your starting pace.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col gap-3 relative overflow-hidden group">
                    <div className="flex items-center gap-2 text-zinc-100 font-semibold">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span>Jump Right In</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed flex-1">
                      10-second setup. Start with high-yield fundamentals. Atlas learns as you go.
                    </p>
                    <button
                      onClick={handleStartFast}
                      className="mt-2 w-full h-11 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 font-semibold text-sm transition-all cursor-pointer active:scale-[0.98]"
                    >
                      Start Fast
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl border border-teal-500/20 bg-teal-500/[0.02] flex flex-col gap-3 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="flex items-center gap-2 text-zinc-100 font-semibold">
                      <Brain className="w-4 h-4 text-teal-400" />
                      <span>Personalize Schedule</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed flex-1">
                      3-minute diagnostic. Let's map your exact strengths and weaknesses.
                    </p>
                    <button
                      onClick={handleStartPersonalize}
                      className="mt-2 w-full h-11 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-sm transition-colors cursor-pointer shadow-[0_0_16px_rgba(20,184,166,0.2)] active:scale-[0.98]"
                    >
                      Start Calibration
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: GLOBAL BASELINE */}
            {step === 'baseline' && (
              <motion.div
                key="baseline"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-10"
              >
                <div className="text-center space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
                    How are you scoring lately?
                  </h2>
                  <p className="text-sm text-zinc-400 font-medium">Be honest. This sets your initial pace.</p>
                </div>

                <div className="space-y-6 pt-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={baselineScore}
                    onChange={(e) => setBaselineScore(parseInt(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-xs font-medium text-zinc-500">
                    <span className={cn(baselineScore < 33 && "text-teal-400 transition-colors")}>Just starting out</span>
                    <span className={cn(baselineScore >= 33 && baselineScore <= 66 && "text-teal-400 transition-colors")}>Getting there</span>
                    <span className={cn(baselineScore > 66 && "text-teal-400 transition-colors")}>Scoring high</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep('syllabus')}
                  className="w-full h-12 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* STEP 5: SYLLABUS TRIAGE */}
            {step === 'syllabus' && (
              <motion.div
                key="syllabus"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-8 flex flex-col max-h-[65vh]"
              >
                <div className="text-center space-y-3 shrink-0">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
                    Syllabus Review
                  </h2>
                  <p className="text-sm text-zinc-400 font-medium">Tap to quickly categorize your foundation.</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                  {subjects.map(sub => {
                    const currentStatus = syllabusStatus[sub.id];
                    return (
                      <div key={sub.id} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col gap-3">
                        <span className="text-sm font-semibold text-zinc-200">{sub.name}</span>
                        
                        <div className="flex bg-zinc-900/80 rounded-xl p-1 border border-white/5 w-full">
                          <button
                            onClick={() => setStatus(sub.id, 'untouched')}
                            className={cn(
                              "flex-1 px-2 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                              currentStatus === 'untouched' ? "bg-zinc-700 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            Untouched
                          </button>
                          <button
                            onClick={() => setStatus(sub.id, 'familiar')}
                            className={cn(
                              "flex-1 px-2 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                              currentStatus === 'familiar' ? "bg-teal-500/20 text-teal-300 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            Solid
                          </button>
                          <button
                            onClick={() => setStatus(sub.id, 'weak')}
                            className={cn(
                              "flex-1 px-2 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                              currentStatus === 'weak' ? "bg-amber-500/20 text-amber-300 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            Weak
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 shrink-0">
                  <button
                    onClick={handleBuildRoadmap}
                    className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(20,184,166,0.3)] cursor-pointer active:scale-[0.98]"
                  >
                    <span>Build My Roadmap</span>
                    <Brain className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 6: COMPUTING ANIMATION */}
            {step === 'computing' && (
              <motion.div
                key="computing"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="py-12 flex flex-col items-center justify-center text-center space-y-10"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-teal-950/30 border border-teal-500/30 flex items-center justify-center animate-pulse shadow-inner">
                    <Brain className="w-10 h-10 text-teal-400" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl border-2 border-teal-500/50 border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="w-full max-w-sm space-y-4 text-left px-4">
                  {[
                    'Reviewing your syllabus progress...',
                    'Finding your highest-yield study gaps...',
                    'Drafting your personalized Day 1 schedule...'
                  ].map((msg, idx) => (
                    <div
                      key={msg}
                      className={cn(
                        "flex items-center gap-3 text-sm font-medium transition-all duration-700",
                        computingStep >= idx ? "text-zinc-200" : "text-zinc-700 opacity-0 transform translate-y-4"
                      )}
                      style={{ opacity: computingStep >= idx ? 1 : 0 }}
                    >
                      {computingStep > idx ? (
                        <Check className="w-4 h-4 text-teal-400 shrink-0" />
                      ) : computingStep === idx ? (
                        <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-zinc-800 shrink-0" />
                      )}
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('artifacts/study-tracker/src/pages/Onboarding.tsx', code + uiCode);
