const fs = require('fs');
const path = './artifacts/study-tracker/src/features/admin/views/UsersView.tsx';
let code = fs.readFileSync(path, 'utf8');

const affiliateActionsUI = `
              {/* Affiliate & Impersonation Commands */}
              <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
                  B2B Reseller & Support Commands
                </div>
                {!inspectingUser.isAffiliate ? (
                  <button
                    onClick={() => handleToggleAffiliate(inspectingUser, true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 rounded-xl text-xs font-semibold transition-colors border border-indigo-500/20"
                  >
                    <Award className="w-4 h-4" />
                    Upgrade to Affiliate (Generate Code)
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleAffiliate(inspectingUser, false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl text-xs font-semibold transition-colors border border-rose-500/20"
                  >
                    <Shield className="w-4 h-4" />
                    Revoke Affiliate Status
                  </button>
                )}
                
                <button
                  onClick={() => handleImpersonate(inspectingUser)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 hover:text-teal-300 rounded-xl text-xs font-semibold transition-colors border border-teal-500/20"
                >
                  <Eye className="w-4 h-4" />
                  Impersonate User (View as Candidate)
                </button>
              </div>
`;

code = code.replace(
  '<div className="flex justify-end gap-2 pt-2 border-t border-border/40 mt-2">',
  affiliateActionsUI + '\\n              <div className="flex justify-end gap-2 pt-2 border-t border-border/40 mt-2">'
);

fs.writeFileSync(path, code);
