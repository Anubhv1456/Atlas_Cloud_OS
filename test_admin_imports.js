const fs = require('fs');

const run = () => {
  const tsNode = require('ts-node');
  tsNode.register({ transpileOnly: true });
  
  try {
    const admin = require('./artifacts/study-tracker/src/features/admin/AdminDashboard.tsx');
    console.log('AdminDashboard loaded successfully');
  } catch (e) {
    console.log('Error loading AdminDashboard:', e.message);
  }
}
run();
