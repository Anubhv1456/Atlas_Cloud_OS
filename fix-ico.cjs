const pngToIco = require('/usr/local/lib/node_modules/png-to-ico');
const fs = require('fs');

pngToIco('artifacts/study-tracker/public/favicon-32x32.png')
  .then(buf => {
    fs.writeFileSync('artifacts/study-tracker/public/favicon.ico', buf);
    console.log('Fixed favicon.ico');
  })
  .catch(console.error);
