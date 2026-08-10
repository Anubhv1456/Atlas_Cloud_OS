import fs from 'fs';

let content = fs.readFileSync('./artifacts/study-tracker/src/features/settings/LegacyDataSection.tsx', 'utf8');

// Add Download to lucide-react imports
content = content.replace(
  "import { Upload, Database } from 'lucide-react';",
  "import { Upload, Database, Download } from 'lucide-react';"
);

// Add export function
const exportCode = `
  const handleExport = async () => {
    try {
      setLoading(true);
      const data = {
        subjects: await db.subjects.toArray(),
        systems: await db.systems.toArray(),
        history: await db.history.toArray(),
        pyqYears: await db.pyqYears.toArray(),
        scoreLogs: await db.scoreLogs.toArray(),
        uiPreferences: await db.uiPreferences.toArray(),
        topicProgress: await db.topicProgress.toArray()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`atlas-backup-\${new Date().toISOString().slice(0, 10)}.json\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export data.');
    } finally {
      setLoading(false);
    }
  };
`;

content = content.replace(
  'const handleImport = async',
  exportCode + '\n  const handleImport = async'
);

// Add Export SettingsRow
content = content.replace(
  '</>',
  `<SettingsRow
        icon={Download}
        label={loading ? "Exporting..." : "Export Data (JSON)"}
        onClick={handleExport}
      />
    </>`
);

fs.writeFileSync('./artifacts/study-tracker/src/features/settings/LegacyDataSection.tsx', content);
