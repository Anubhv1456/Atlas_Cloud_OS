const fs = require('fs');
const fileHooks = '/app/applet/artifacts/study-tracker/src/features/subjects/SystemCard.hooks.tsx';
let hooks = fs.readFileSync(fileHooks, 'utf8');

hooks = hooks.replace(
  "toast('Know a great mnemonic?', {",
  "toast('Know a great mnemonic?', {"
);
hooks = hooks.replace(
  "description: 'Share it with Atlas.',",
  "description: 'Leave a marker for the next Wayfinder.',"
);
hooks = hooks.replace(
  "label: 'Share',",
  "label: 'Leave Marker',"
);

fs.writeFileSync(fileHooks, hooks);

const fileCard = '/app/applet/artifacts/study-tracker/src/features/subjects/SystemCard.tsx';
let card = fs.readFileSync(fileCard, 'utf8');

card = card.replace(
  "Contribute Insight",
  "Leave a Marker"
);
card = card.replace(
  "Share an Insight",
  "Leave a Marker"
);
card = card.replace(
  "label: 'Share Insight',",
  "label: 'Leave Marker',"
);

fs.writeFileSync(fileCard, card);
