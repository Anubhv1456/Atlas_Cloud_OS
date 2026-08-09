const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SystemCard.tsx', 'utf8');

code = code.replace(/    handleRenameSave, handleRevisionComplete\n  \} = useSystemCardLogic\(props\);/, 
    "    handleRenameSave, handleRevisionComplete,\n    handleUpdateTopic, handleRenameTopic, handleDeleteTopic, handleAddCustomTopic, finalTopics\n  } = useSystemCardLogic(props);");

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SystemCard.tsx', code);
