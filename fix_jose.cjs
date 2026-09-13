const fs = require('fs');

const path1 = '/app/applet/package.json';
const path2 = '/app/applet/artifacts/study-tracker/package.json';

[path1, path2].forEach(p => {
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    
    // Clean up overrides/resolutions
    if (data.overrides) delete data.overrides;
    if (data.resolutions) delete data.resolutions;
    
    // Force jose 4.15.5 in dependencies
    if (!data.dependencies) data.dependencies = {};
    data.dependencies["jose"] = "4.15.5";
    
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${p}`);
  } catch (e) {
    console.error(`Failed to update ${p}:`, e);
  }
});
