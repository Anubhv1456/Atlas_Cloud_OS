const { UNIVERSAL_ONTOLOGY } = require('./artifacts/study-tracker/src/data/ontology.js');

let totalEmptySystems = 0;
UNIVERSAL_ONTOLOGY.forEach(subject => {
    let subjectEmptySystems = 0;
    subject.systems.forEach(system => {
        if (!system.topics || system.topics.length === 0) {
            subjectEmptySystems++;
            totalEmptySystems++;
            console.log(`Empty topics in System: ${system.name} (Subject: ${subject.name})`);
        }
    });
});
console.log(`Total Empty Systems: ${totalEmptySystems}`);
