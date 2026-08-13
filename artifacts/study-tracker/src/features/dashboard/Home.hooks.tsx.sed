s/import { isSystemComplete } from '@\/features\/dashboard\/homeUtils';/import { isSystemComplete } from '@\/lib\/progress';/g
s/!(isSystemComplete(s.id!))/!(isSystemComplete(s, ALL_SUBJECTS.find(sub => sub.id === s.subjectId)?.name || '', curriculumSets))/g
s/!(isSystemComplete(primaryFocus.id!))/!(isSystemComplete(primaryFocus, ALL_SUBJECTS.find(sub => sub.id === primaryFocus.subjectId)?.name || '', curriculumSets))/g
