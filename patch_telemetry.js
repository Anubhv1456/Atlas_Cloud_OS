const fs = require('fs');
const path = './artifacts/study-tracker/src/features/admin/views/CohortTelemetryView.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add import for getAllUsersForAdmin
code = code.replace(
  'import { fetchCohortTelemetryLogs, KnowledgeGapItem } from \'@/lib/telemetry\';',
  'import { fetchCohortTelemetryLogs, KnowledgeGapItem } from \'@/lib/telemetry\';\nimport { getAllUsersForAdmin } from \'@/lib/admin\';\nimport { Users, Award } from \'lucide-react\';'
);

// Add users state
code = code.replace(
  'const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());',
  'const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());\n  const [users, setUsers] = useState<any[]>([]);'
);

// Fetch users
code = code.replace(
  'const res = await fetchCohortTelemetryLogs();\n      setData(res);',
  'const [res, u] = await Promise.all([\n        fetchCohortTelemetryLogs(),\n        getAllUsersForAdmin()\n      ]);\n      setData(res);\n      setUsers(u);'
);

// Calculate affiliate ledger
const ledgerLogic = `
  // Affiliate Ledger Calculation
  const affiliates = users.filter(u => u.isAffiliate);
  const affiliateLedger = affiliates.map(aff => {
    const clients = users.filter(u => u.referredBy === aff.affiliateCode && !u.isAdmin && u.id !== aff.id);
    const activeClients = clients.filter(c => {
      if (!c.betaAccess) return false;
      if (!c.betaAccessExpiresAt) return true;
      const expiresAt = typeof c.betaAccessExpiresAt === 'number' ? c.betaAccessExpiresAt : c.betaAccessExpiresAt.toMillis?.();
      return expiresAt && expiresAt > Date.now();
    });
    
    // Simple commission estimation (e.g. $50 per active client)
    const commissionOwed = activeClients.length * 50;
    
    return {
      id: aff.id,
      name: aff.displayName || aff.email,
      code: aff.affiliateCode,
      totalSold: clients.length,
      activeSeats: activeClients.length,
      commissionOwed
    };
  }).sort((a, b) => b.activeSeats - a.activeSeats);
`;
code = code.replace(
  'const totalErrorsCount = Object.values(errorTaxonomy).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);',
  'const totalErrorsCount = Object.values(errorTaxonomy).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);\n' + ledgerLogic
);

// Insert Affiliate Ledger UI
const ledgerUI = `
      {/* Affiliate Performance Ledger */}
      {affiliateLedger.length > 0 && (
        <div className="bg-card/40 border border-border/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Award className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Affiliate & Reseller Ledger</h2>
              <p className="text-xs text-muted-foreground">Realtime attribution and commission tracking for B2B partners.</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Affiliate Partner</th>
                  <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Referral Code</th>
                  <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Total Seats Provisioned</th>
                  <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Active Seats</th>
                  <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Est. Commission ($50/seat)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {affiliateLedger.map((partner) => (
                  <tr key={partner.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-sm text-foreground">{partner.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{partner.id.slice(0, 8)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="outline" className="bg-background text-teal-400 font-mono text-[10px] uppercase border-teal-500/30">
                        {partner.code}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-foreground">
                      {partner.totalSold}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-teal-500/10 text-teal-400 rounded-md text-xs font-bold border border-teal-500/20">
                        <Users className="w-3 h-3" />
                        {partner.activeSeats}
                      </div>
                    </td>
                    <td className="py-3.5 pl-4 text-right font-bold text-emerald-400">
                      \${partner.commissionOwed.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
`;

code = code.replace(
  '{/* Header Bar */}',
  ledgerUI + '\n      {/* Header Bar */}'
);

fs.writeFileSync(path, code);
