const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/ScoreLogModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update Segmented Control
const segControlOld = `<div className="grid grid-cols-2 p-1 bg-muted/30 rounded-lg mb-4 border border-border/40">
            <button
              type="button"
              onClick={() => { setType('revision'); setPyqYearId(undefined); }}
              className={\`py-1.5 text-xs font-semibold rounded-md transition-all \${
                type === 'revision'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }\`}
            >
              Topic Revision
            </button>
            <button
              type="button"
              onClick={() => { setType('pyq'); setSystemId(undefined); }}
              className={\`py-1.5 text-xs font-semibold rounded-md transition-all \${
                type === 'pyq'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }\`}
            >
              PYQ / Practice Test
            </button>
          </div>`;

const segControlNew = `<div className="grid grid-cols-3 p-1 bg-muted/30 rounded-lg mb-4 border border-border/40">
            <button
              type="button"
              onClick={() => { setType('revision'); setPyqYearId(undefined); }}
              className={\`py-1.5 text-xs font-semibold rounded-md transition-all \${
                type === 'revision'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }\`}
            >
              Topic Revision
            </button>
            <button
              type="button"
              onClick={() => { setType('pyq'); setSystemId(undefined); }}
              className={\`py-1.5 text-xs font-semibold rounded-md transition-all \${
                type === 'pyq'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }\`}
            >
              PYQ / Practice Test
            </button>
            <button
              type="button"
              onClick={() => { setType('gt'); setSystemId(undefined); setPyqYearId(undefined); }}
              className={\`py-1.5 text-xs font-semibold rounded-md transition-all \${
                type === 'gt'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }\`}
            >
              Grand Test (GT)
            </button>
          </div>`;

content = content.replace(segControlOld, segControlNew);

// Hide Subject and System/PYQ Year Selectors if GT
const subjStart = `{/* Subject Selector */}`;
const subjEnd = `{/* Title / Description */}`;

// Actually let's use a regex replace for the section
const regex = /\{\/\* Subject Selector \*\/\}.*?(?=\{\/\* Title \/ Description \*\/\})/s;
const replacement = `{/* Selectors */}
          {type !== 'gt' && (
            <>
              {/* Subject Selector */}
              <div className="space-y-1.5 mb-4">
                <Label className="text-xs font-semibold text-foreground">Subject *</Label>
                <Select
                  value={subjectId ? String(subjectId) : ''}
                  onValueChange={(val) => {
                    const sId = val;
                    setSubjectId(sId);
                    setSystemId(undefined);
                    setPyqYearId(undefined);
                  }}
                >
                  <SelectTrigger className="w-full bg-background border-border text-xs">
                    <SelectValue placeholder="Select a Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((sub) => (
                      <SelectItem key={sub.id} value={String(sub.id)}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* System or PYQ Year Selector */}
              {type === 'revision' ? (
                <div className="space-y-1.5 mb-4">
                  <Label className="text-xs font-semibold text-foreground">System (Optional)</Label>
                  <Select
                    value={systemId ? String(systemId) : 'none'}
                    onValueChange={(val) => setSystemId(val === 'none' ? undefined : val)}
                  >
                    <SelectTrigger className="w-full bg-background border-border text-xs">
                      <SelectValue placeholder="All Systems / Overall Subject Revision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Overall Subject Revision</SelectItem>
                      {availableSystems.map((sys) => (
                        <SelectItem key={sys.id} value={String(sys.id)}>
                          {sys.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5 mb-4">
                  <Label className="text-xs font-semibold text-foreground">PYQ Year (Optional)</Label>
                  <Select
                    value={pyqYearId ? String(pyqYearId) : 'none'}
                    onValueChange={(val) => setPyqYearId(val === 'none' ? undefined : val)}
                  >
                    <SelectTrigger className="w-full bg-background border-border text-xs">
                      <SelectValue placeholder="Select PYQ Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General Subject PYQ</SelectItem>
                      {availablePyqs.map((pyq) => (
                        <SelectItem key={pyq.id} value={String(pyq.id)}>
                          {pyq.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
          
          `;

content = content.replace(regex, replacement);

// Wait, I need to make sure subjectId is ANY so we don't pass undefined where string is expected, but the schema update handled string | number.
// In the schema submit logData, subjectId might be undefined if it's GT.
// The DB schema for ScoreLog requires subjectId? Yes, I changed it to subjectId?: number | string. Let's make sure it's actually optional.
// I ran `sed -i "s/subjectId: number;/subjectId?: number | string;/g"` on types.ts.
// Let's verify.

fs.writeFileSync(path, content);
