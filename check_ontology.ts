import { UNIVERSAL_ONTOLOGY } from './artifacts/study-tracker/src/data/ontology';

let totalTopics = 0;
UNIVERSAL_ONTOLOGY.forEach(subject => {
    subject.systems.forEach(system => {
        if (!system.topics || system.topics.length === 0) {
            console.log(`0 topics: ${system.name}`);
        }
        totalTopics += system.topics ? system.topics.length : 0;
    });
});
console.log(`Total topics across all: ${totalTopics}`);
