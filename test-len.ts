import { USMLE_ONTOLOGY } from './artifacts/study-tracker/src/data/ontology.usmle';
console.log('subs:', USMLE_ONTOLOGY.length);
let sysCount = 0;
let topicCount = 0;
USMLE_ONTOLOGY.forEach(s => {
  sysCount += s.systems.length;
  s.systems.forEach(sys => {
    topicCount += sys.topics ? sys.topics.length : 0;
  });
});
console.log('sys:', sysCount, 'topics:', topicCount);
