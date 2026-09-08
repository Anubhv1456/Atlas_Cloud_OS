const fs = require('fs');
const path = './artifacts/study-tracker/src/features/admin/views/UsersView.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add updateAffiliateStatus import
code = code.replace(
  'updateUserBetaAccess, bulkUpdateUserBetaAccess, deleteUserAsAdmin } from \'@/lib/admin\';',
  'updateUserBetaAccess, bulkUpdateUserBetaAccess, deleteUserAsAdmin, updateAffiliateStatus } from \'@/lib/admin\';'
);

// Add state for affiliateFilter and selectedBatchAffiliate
code = code.replace(
  'const [examFilter, setExamFilter] = useState<ExamFilter>(\'all\');',
  'const [examFilter, setExamFilter] = useState<ExamFilter>(\'all\');\n  const [affiliateFilter, setAffiliateFilter] = useState<string>(\'all\');\n  const [selectedBatchAffiliate, setSelectedBatchAffiliate] = useState<string>(\'none\');'
);

// Add handleUpdateAffiliate function inside UsersView component
const handleAffiliateCode = `
  const handleToggleAffiliate = async (user: any, isAffiliate: boolean) => {
    try {
      await updateAffiliateStatus(user.id, isAffiliate);
      setUsers(users.map(u => u.id === user.id ? { ...u, isAffiliate, affiliateCode: isAffiliate ? \`affiliate_\${user.id.slice(0, 6)}\` : undefined } : u));
      toast.success(\`Affiliate status \${isAffiliate ? 'granted' : 'revoked'} for \${user.displayName || user.email}\`);
      if (inspectingUser?.id === user.id) setInspectingUser(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update affiliate status');
    }
  };

  const handleImpersonate = (user: any) => {
    toast.success(\`Impersonation mode engaged for \${user.displayName || user.email}\`);
    if (inspectingUser?.id === user.id) setInspectingUser(null);
  };
`;
code = code.replace(
  'const handleClearVaultFlag = async (targetUser: any) => {',
  handleAffiliateCode + '\n  const handleClearVaultFlag = async (targetUser: any) => {'
);

// Update handleEmailBatchUnlock to use selectedBatchAffiliate
code = code.replace(
  'await bulkUpdateUserBetaAccess(targetIds, true, null, false);',
  'await bulkUpdateUserBetaAccess(targetIds, true, null, false, selectedBatchAffiliate !== "none" ? selectedBatchAffiliate : undefined);'
);
code = code.replace(
  'betaAccessExpiresAt: null',
  'betaAccessExpiresAt: null,\n            ...(selectedBatchAffiliate !== "none" ? { referredBy: selectedBatchAffiliate } : {})'
);

// Reset selectedBatchAffiliate
code = code.replace(
  'setBatchEmails(\'\');\n      setSelectedUserIds([]);',
  'setBatchEmails(\'\');\n      setSelectedUserIds([]);\n      setSelectedBatchAffiliate(\'none\');'
);

// Filter logic: Add matchesAffiliate
code = code.replace(
  'return matchesTab && matchesExam && matchesSearch;',
  'const matchesAffiliate = affiliateFilter === \'all\' ? true : user.referredBy === affiliateFilter;\n    return matchesTab && matchesExam && matchesSearch && matchesAffiliate;'
);

fs.writeFileSync(path, code);
