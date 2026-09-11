const fs = require('fs');
const p = 'artifacts/study-tracker/src/hooks/useBetaAccess.ts';
let c = fs.readFileSync(p, 'utf8');

let startIndex = c.indexOf("  activeUnsubscribe = onSnapshot(");
if (startIndex !== -1) {
  let endIndex = c.indexOf("  );", startIndex) + 4;
  let oldBlock = c.substring(startIndex, endIndex);

  let newBlock = `  // Execute one-shot fetch
  forceFetchEntitlements(uid, userObj);`;
  c = c.replace(oldBlock, newBlock);
  fs.writeFileSync(p, c);
  console.log("Fixed useBetaAccess");
} else {
  console.log("Could not find activeUnsubscribe in useBetaAccess");
}
