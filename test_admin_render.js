const fs = require('fs');

async function test() {
  const tsNode = require('ts-node');
  tsNode.register({ transpileOnly: true });

  const React = require('react');
  const ReactDOMServer = require('react-dom/server');

  // Need to mock standard things if they are missing?
  // Let's just try to load the module first.
  const AdminDashboard = require('./artifacts/study-tracker/src/features/admin/AdminDashboard.tsx').default;
  console.log(AdminDashboard);
}
test().catch(e => console.error(e));
