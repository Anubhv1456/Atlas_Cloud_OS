import { UNIVERSAL_ONTOLOGY } from './artifacts/study-tracker/src/data/ontology';

UNIVERSAL_ONTOLOGY.forEach(sub => {
  let topics = 0;
  sub.systems.forEach(sys => topics += sys.topics.length);
  console.log(`${sub.name}: ${sub.systems.length} systems, ${topics} topics`);
});
