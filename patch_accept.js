const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/pages/AcceptInvitation.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `{/* Content Card */}
        <div className="w-full bg-[#0a0a0a]/70 backdrop-blur-2xl border border-white/[0.06] rounded-[32px] p-8 sm:p-10 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] flex flex-col items-center text-center">
          
          <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-zinc-100 mb-3">`;

const replacement = `{/* Content Card */}
        <div className="w-full bg-[#0a0a0a]/70 backdrop-blur-2xl border border-white/[0.06] rounded-[32px] p-8 sm:p-10 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] flex flex-col items-center text-center">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            50 Closed Beta Seats
          </div>
          
          <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-zinc-100 mb-3">`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
}
