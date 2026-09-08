const fs = require('fs');
const path = './artifacts/study-tracker/src/features/admin/views/UsersView.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add "Filter by Affiliate"
const affiliateFilterUI = `
          {/* Affiliate Filter */}
          <div className="relative min-w-[140px]">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Users className="w-3.5 h-3.5 text-muted-foreground/70" />
            </div>
            <select
              value={affiliateFilter}
              onChange={(e) => setAffiliateFilter(e.target.value)}
              className="w-full bg-background/50 border border-border/50 text-foreground text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500/50 appearance-none font-semibold transition-all hover:bg-muted/30"
            >
              <option value="all">All Affiliates</option>
              {users.filter(u => u.isAffiliate).map(a => (
                <option key={a.id} value={a.affiliateCode}>{a.displayName || a.email} ({a.affiliateCode})</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <ChevronDown className="w-3 h-3 text-muted-foreground/70" />
            </div>
          </div>
`;

code = code.replace(
  '{/* Exam Filter */}',
  affiliateFilterUI + '\n          {/* Exam Filter */}'
);

// 2. Add "Upgrade to Affiliate" and "Impersonate" to Action Menu (in inspectingUser modal)
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
  '{/* Grant Modal Launcher */}',
  affiliateActionsUI + '\n                {/* Grant Modal Launcher */}'
);

// 3. Add attribution dropdown in Email Batch Unlock modal
const batchAffiliateUI = `
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-teal-500" />
                Attribution (Assign to Affiliate)
              </label>
              <select
                value={selectedBatchAffiliate}
                onChange={(e) => setSelectedBatchAffiliate(e.target.value)}
                className="w-full bg-background border border-border/50 text-foreground text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500/50 appearance-none font-medium transition-all"
              >
                <option value="none">No Affiliate (Direct)</option>
                {users.filter(u => u.isAffiliate).map(a => (
                  <option key={a.id} value={a.affiliateCode}>{a.displayName || a.email} ({a.affiliateCode})</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5">
                Tagging these users to an affiliate will track them in the Cohort Telemetry Ledger for commission calculation.
              </p>
            </div>
`;

code = code.replace(
  'A batch unlock will bypass all payment walls and grant full Permanent Access.',
  'A batch unlock will bypass all payment walls and grant full Permanent Access.\n              </p>\n            </div>\n\n' + batchAffiliateUI
);

// 4. Update the actual UI of the User Row if they are an Affiliate
const affiliateBadgeUI = `
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        {user.displayName || 'Unnamed Candidate'}
                        {user.isAffiliate && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 bg-indigo-500/10 text-indigo-400 border-indigo-500/30 font-mono tracking-wider ml-1">
                            AFFILIATE
                          </Badge>
                        )}
                      </span>
`;
code = code.replace(
  '<span className="font-bold text-sm text-foreground flex items-center gap-1.5">\n                        {user.displayName || \'Unnamed Candidate\'}\n                      </span>',
  affiliateBadgeUI
);


fs.writeFileSync(path, code);
