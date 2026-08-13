const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/ScoreLogModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace interfaces
content = content.replace("initialType?: 'revision' | 'pyq';", "initialType?: 'revision' | 'pyq' | 'gt';");
content = content.replace("const [type, setType] = useState<'revision' | 'pyq'>(initialType);", "const [type, setType] = useState<'revision' | 'pyq' | 'gt'>(initialType);");

// Update Subject requirement
content = content.replace(
`    if (!subjectId) {
      toast({
        title: 'Subject Required',
        description: 'Please select a subject for this score entry.',
        variant: 'destructive',
      });
      return;
    }`,
`    if (!subjectId && type !== 'gt') {
      toast({
        title: 'Subject Required',
        description: 'Please select a subject for this score entry.',
        variant: 'destructive',
      });
      return;
    }`
);

// Auto-generate title
content = content.replace(
`        if (type === 'revision') {
          logTitle = selectedSys ? \`\${selectedSys.name} Revision\` : \`\${selectedSub?.name} Revision\`;
        } else {
          logTitle = selectedPyq ? \`\${selectedSub?.name} \${selectedPyq.year} PYQ\` : \`\${selectedSub?.name} PYQ\`;
        }`,
`        if (type === 'revision') {
          logTitle = selectedSys ? \`\${selectedSys.name} Revision\` : \`\${selectedSub?.name} Revision\`;
        } else if (type === 'pyq') {
          logTitle = selectedPyq ? \`\${selectedSub?.name} \${selectedPyq.year} PYQ\` : \`\${selectedSub?.name} PYQ\`;
        } else {
          logTitle = 'Grand Test';
        }`
);

// Also add GT option in the dialog UI
const typeSelectorFind = `            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={type === 'revision' ? 'default' : 'outline'}
                onClick={() => setType('revision')}
                className={\`rounded-xl h-11 \${type === 'revision' ? 'shadow-sm' : ''}\`}
              >
                <Award className="w-4 h-4 mr-2" /> Topic Revision
              </Button>
              <Button
                type="button"
                variant={type === 'pyq' ? 'default' : 'outline'}
                onClick={() => setType('pyq')}
                className={\`rounded-xl h-11 \${type === 'pyq' ? 'shadow-sm' : ''}\`}
              >
                <TriangleAlert className="w-4 h-4 mr-2" /> PYQ Test
              </Button>
            </div>`;

const typeSelectorReplace = `            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={type === 'revision' ? 'default' : 'outline'}
                onClick={() => setType('revision')}
                className={\`rounded-xl h-11 px-2 \${type === 'revision' ? 'shadow-sm' : ''}\`}
              >
                <Award className="w-4 h-4 mr-1 md:mr-2" /> Topic
              </Button>
              <Button
                type="button"
                variant={type === 'pyq' ? 'default' : 'outline'}
                onClick={() => setType('pyq')}
                className={\`rounded-xl h-11 px-2 \${type === 'pyq' ? 'shadow-sm' : ''}\`}
              >
                <TriangleAlert className="w-4 h-4 mr-1 md:mr-2" /> PYQ
              </Button>
              <Button
                type="button"
                variant={type === 'gt' ? 'default' : 'outline'}
                onClick={() => setType('gt')}
                className={\`rounded-xl h-11 px-2 \${type === 'gt' ? 'shadow-sm' : ''}\`}
              >
                <Trophy className="w-4 h-4 mr-1 md:mr-2" /> GT
              </Button>
            </div>`;

content = content.replace(typeSelectorFind, typeSelectorReplace);

// Hide subject/system fields if type === 'gt'
const subjectFind = `            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Subject <span className="text-rose-500">*</span></Label>`;
const subjectReplace = `            {type !== 'gt' && (<div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Subject <span className="text-rose-500">*</span></Label>`;

content = content.replace(subjectFind, subjectReplace);

// Need to close the {type !== 'gt' && ( ... )} block. Where does it end? Let's check the code.
fs.writeFileSync(path, content);
