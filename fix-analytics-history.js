const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetBadge = `<Badge
                          variant="outline"
                          className={\`text-[10px] capitalize \${
                            log.type === 'revision' ? 'border-blue-500/30 text-blue-500 bg-blue-500/5' : log.type === 'set' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' : 'border-purple-500/30 text-purple-500 bg-purple-500/5'
                          }\`}
                        >
                          {log.type}
                        </Badge>`;

const replaceBadge = `<Badge
                          variant="outline"
                          className={\`text-[10px] \${
                            log.type === 'gt' ? 'border-primary/50 text-primary bg-primary/10' : log.type === 'revision' ? 'border-blue-500/30 text-blue-500 bg-blue-500/5' : log.type === 'set' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' : 'border-purple-500/30 text-purple-500 bg-purple-500/5'
                          }\`}
                        >
                          {log.type === 'gt' ? 'GT' : log.type === 'pyq' ? 'PYQ' : log.type === 'set' ? 'Set' : 'Revision'}
                        </Badge>`;

content = content.replace(targetBadge, replaceBadge);

fs.writeFileSync(path, content);
