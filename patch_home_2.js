const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/features/dashboard/Home.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  '<NextActionCard />',
  '<div className="mb-12">\n              <NextActionCard />\n            </div>'
);

fs.writeFileSync(file, data);
