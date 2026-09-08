const fs = require('fs');
let code = fs.readFileSync('./src/features/admin/views/OpsQueueView.tsx', 'utf8');

// Fix the dangling `)}` at line 291
code = code.replace(/<div className="space-y-4">\s*\)\}/, '<div className="space-y-4">');

fs.writeFileSync('./src/features/admin/views/OpsQueueView.tsx', code);
