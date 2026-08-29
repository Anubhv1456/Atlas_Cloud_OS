import sys

path = 'artifacts/study-tracker/src/lib/ai/frictionEngine.ts'
with open(path, 'r') as f:
    content = f.read()

target = """export function useClinicalFrictionEngine() {
  const subjects = useLiveQuery(() => db.subjects.toArray().then((s) => s.filter((x) => !x.deletedAt))) || [];
  const mistakes = useLiveQuery(() => db.mistakeLogs.toArray().then((m) => m.filter((x) => !x.deletedAt))) || [];
  const history = useLiveQuery(() => db.history.toArray(), []) || [];
  const curriculumSets = useLiveQuery(() => db.curriculumSets.toArray().then((c) => c.filter((x) => !x.deletedAt))) || [];"""

replacement = """export function useClinicalFrictionEngine() {
  const subjects = useLiveQuery(() => db.subjects.toArray().then((s) => s.filter((x) => !x.deletedAt))) || [];
  const mistakes = useLiveQuery(() => db.mistakeLogs.toArray().then((m) => m.filter((x) => !x.deletedAt))) || [];
  const history = useLiveQuery(() => db.history.toArray(), []) || [];
  const curriculumSets = useLiveQuery(() => db.curriculumSets.toArray().then((c) => c.filter((x) => !x.deletedAt))) || [];
  const operationalModes = useLiveQuery(() => db.operationalModes.toArray(), []) || [];
"""

if target in content:
    content = content.replace(target, replacement)
    
target2 = """    const calculated = subjects.map((sub) => {"""
replacement2 = """    const currentMode = operationalModes.find(m => m.id === 'current');
    const isHoliday = currentMode?.mode === 'holiday';
    const isSprint = currentMode?.mode === 'tactical_sprint';
    const sprintIds = new Set((currentMode?.targetSubjectIds || []).map(String));

    if (isHoliday) return [];

    let filteredSubjects = subjects;
    if (isSprint && sprintIds.size > 0) {
      filteredSubjects = subjects.filter(s => sprintIds.has(String(s.id)) || sprintIds.has(String(s.ontologySubjectId)));
    }

    const calculated = filteredSubjects.map((sub) => {"""
if target2 in content:
    content = content.replace(target2, replacement2)
    
target3 = """    return calculated.sort((a, b) => b.frictionScore - a.frictionScore);
  }, [subjects, mistakes, history, curriculumSets]);"""
replacement3 = """    return calculated.sort((a, b) => b.frictionScore - a.frictionScore);
  }, [subjects, mistakes, history, curriculumSets, operationalModes]);"""
if target3 in content:
    content = content.replace(target3, replacement3)

with open(path, 'w') as f:
    f.write(content)
print("done frictionEngine patch")
