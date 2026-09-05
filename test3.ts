import { USMLE_ONTOLOGY } from './artifacts/study-tracker/src/data/ontology.usmle';

const subIds = new Set();
const sysIds = new Set();
const topicIds = new Set();
let hasDups = false;

for (const sub of USMLE_ONTOLOGY) {
  if (subIds.has(sub.id)) { console.log('Dup sub id', sub.id); hasDups = true; }
  subIds.add(sub.id);
  
  for (const sys of sub.systems) {
    if (sysIds.has(sys.id)) { console.log('Dup sys id', sys.id); hasDups = true; }
    sysIds.add(sys.id);
    
    for (const t of sys.topics || []) {
      if (topicIds.has(t.id)) { console.log('Dup topic id', t.id); hasDups = true; }
      topicIds.add(t.id);
    }
  }
}
console.log('Checked USMLE. Dups?', hasDups);
