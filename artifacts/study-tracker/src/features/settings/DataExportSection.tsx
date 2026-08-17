import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { db } from '@/db/schema';
import { toast } from 'sonner';
import { SettingsRow } from './SettingsLayout';

export function DataExportSection() {
  const [loading, setLoading] = useState(false);

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      
      const subjects = await db.subjects.toArray();
      const systems = await db.systems.toArray();
      const sets = await db.curriculumSets.toArray();
      
      let csvContent = "Subject,System,Study Block,Status,Order,Next Revision Date,Revision Count\n";
      
      systems.forEach(sys => {
        const sub = subjects.find(s => s.id === sys.subjectId);
        const subName = sub ? sub.name : 'General';
        const matchingSets = sets.filter(s => s.systemId === sys.id && !s.deletedAt);

        if (matchingSets.length > 0) {
          matchingSets.forEach(set => {
            const nextDateStr = set.nextRevisionDate ? new Date(set.nextRevisionDate).toISOString().slice(0, 10) : 'None';
            csvContent += `"${subName}","${sys.name}","${set.name}","${sys.status || 'Average'}","${sys.order || 0}","${nextDateStr}","${set.revisionCount || 0}"\n`;
          });
        } else {
          const nextDateStr = sys.nextRevisionDate ? new Date(sys.nextRevisionDate).toISOString().slice(0, 10) : 'None';
          csvContent += `"${subName}","${sys.name}","Core System","${sys.status || 'Average'}","${sys.order || 0}","${nextDateStr}","${sys.revisionCount || 0}"\n`;
        }
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atlas-curriculum-progress-${new Date().toISOString().slice(0, 10)}.csv`;
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
