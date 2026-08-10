const fs = require('fs');

let content = fs.readFileSync('./artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx', 'utf8');

const replacement = `
  const { mappedStars, globalHealth } = useMemo(() => {
    // Fallback aliases if DB names differ slightly
    const aliasMap: Record<string, string> = {
      'General Medicine': 'Medicine',
      'Surgery': 'General Surgery',
      'OBGY': 'Obstetrics & Gynaecology'
    };

    const mapped = FIXED_SUBJECTS.map(fixed => {
      // Find matching subject in DB
      let dbSubject = subjects.find(s => s.name === fixed.name || aliasMap[s.name] === fixed.name);
      
      let state: 'not_started' | 'in_progress' | 'revising' | 'strong' | 'completed' = 'not_started';
      let completionTime = 0;
      let progress = 0;

      if (dbSubject) {
        const subSets = curriculumSets.filter(c => c.subjectId === dbSubject!.id);
        const totalTasks = subSets.length * 2;
        let completedTasks = 0;
        subSets.forEach(s => {
          if (s.contentCompleted) completedTasks++;
          if (s.qbankCompleted) completedTasks++;
        });

        progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const isCompleted = progress === 100 && totalTasks > 0;

        const subSystems = systems.filter(s => s.subjectId === dbSubject!.id);
        const isRevising = subSystems.some(s => s.revisionState === 'in_progress');
        const isStrong = subSystems.some(s => s.status === 'Strong') && !subSystems.some(s => s.status === 'Weak');

        if (isCompleted) {
          state = 'completed';
          completionTime = Math.max(...subSystems.map(s => s.completionDate ? new Date(s.completionDate).getTime() : 0));
        } else if (isRevising) {
          state = 'revising';
        } else if (progress > 0) {
          state = isStrong ? 'strong' : 'in_progress';
        }
      }

      return {
        ...fixed,
        state,
        completionTime,
        progress
      };
    });

    // Calculate global health score
    const totalSyllabusTasks = curriculumSets.length * 2;
    let completedSyllabusTasks = 0;
    let totalQbankScore = 0;
    let qbankCount = 0;
    
    curriculumSets.forEach(s => {
      if (s.contentCompleted) completedSyllabusTasks++;
      if (s.qbankCompleted) completedSyllabusTasks++;
      if (s.averageScore) {
        totalQbankScore += s.averageScore;
        qbankCount++;
      }
    });

    const syllabusHealth = totalSyllabusTasks > 0 ? (completedSyllabusTasks / totalSyllabusTasks) * 100 : 0;
    const qbankHealth = qbankCount > 0 ? (totalQbankScore / qbankCount) : 0;
    
    const totalSystems = systems.length;
    let weakSystems = 0;
    let strongSystems = 0;
    systems.forEach(s => {
       if (s.status === 'Weak') weakSystems++;
       if (s.status === 'Strong') strongSystems++;
    });
    
    const statusHealth = totalSystems > 0 ? ((strongSystems + (totalSystems - weakSystems - strongSystems) * 0.5) / totalSystems) * 100 : 0;
    
    // Weighted health score (0-100)
    let health = 0;
    if (totalSyllabusTasks === 0) {
      health = 0;
    } else {
      health = (syllabusHealth * 0.5) + (qbankHealth * 0.3) + (statusHealth * 0.2);
    }

    return { mappedStars: mapped, globalHealth: health };
  }, [subjects, systems, curriculumSets]);
`;

content = content.replace(
  /const mappedStars = useMemo\(\(\) => \{[\s\S]*?\}\, \[subjects, systems, curriculumSets\]\);/,
  replacement.trim()
);

fs.writeFileSync('./artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx', content);
