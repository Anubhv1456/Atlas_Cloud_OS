import { ALL_SYSTEMS } from './artifacts/study-tracker/src/data/ontology';

const nameCount: Record<string, number> = {};
ALL_SYSTEMS.forEach(sys => {
    nameCount[sys.name] = (nameCount[sys.name] || 0) + 1;
});
Object.entries(nameCount).filter(([k,v]) => v > 1).forEach(([k,v]) => console.log(k, v));
