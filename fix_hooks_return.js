const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SystemCard.hooks.tsx', 'utf8');

code = code.replace(/    handleRenameSave, handleRevisionComplete\n  \};\n\}/, "    handleRenameSave, handleRevisionComplete,\n    handleUpdateTopic,\n    handleRenameTopic,\n    handleDeleteTopic,\n    handleAddCustomTopic,\n    finalTopics\n  };\n}");

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SystemCard.hooks.tsx', code);
