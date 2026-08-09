const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/subjects/SystemCard.hooks.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace handleNotesChange logic with local state and debounced save
const oldLogic = "const handleNotesChange  = (e: React.ChangeEvent<HTMLTextAreaElement>) => updateSystem(system.id!, { weakAreas: e.target.value });";

const newLogic = `const [localNotes, setLocalNotes] = useState(system.weakAreas || '');
  useEffect(() => {
    if (system.weakAreas !== localNotes && !localNotes) {
      setLocalNotes(system.weakAreas || '');
    }
  }, [system.weakAreas]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localNotes !== (system.weakAreas || '')) {
        updateSystem(system.id!, { weakAreas: localNotes });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [localNotes, system.id, system.weakAreas]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalNotes(e.target.value);
  };`;

content = content.replace(oldLogic, newLogic);

// Add localNotes to exports
content = content.replace(
  "handleStatusChange, handleNotesChange, handleDelete, handleDeleteConfirm,",
  "localNotes, handleStatusChange, handleNotesChange, handleDelete, handleDeleteConfirm,"
);

fs.writeFileSync(file, content);
console.log('SystemCard.hooks.tsx patched');
