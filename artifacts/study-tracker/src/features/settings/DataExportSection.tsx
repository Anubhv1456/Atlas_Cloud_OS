import { useState } from 'react';
import { Download } from 'lucide-react';
import { db } from '@/db/schema';
import { toast } from 'sonner';
import { SettingsRow } from './SettingsLayout';
import { OntologySubject } from '@/data/ontology';

export function DataExportSection() {
  const [loading, setLoading] = useState(false);

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      
      const subjects = await db.subjects.toArray();
      const systems = await db.systems.toArray();
      
      let csvContent = "Subject,System,Status,Order,Next Revision Date\n";
      
      systems.forEach(sys => {
        const sub = subjects.find(s => s.id === sys.subjectId);
        const subName = sub ? sub.name : 'Unknown';
        let sysNextRev = 'None';
        // Note: revisions are tracked in CurriculumSets now, so this export field is deprecated for sys
        csvContent += `"${subName}","${sys.name}","${sys.status || 'Not Started'}","${sys.order || 0}","${sysNextRev}"\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atlas-progress-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Progress exported as CSV successfully.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export CSV data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SettingsRow
        icon={Download}
        label={loading ? "Exporting..." : "Export Progress (CSV)"}
        onClick={handleExportCSV}
      />
    </>
  );
}
