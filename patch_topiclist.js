const fs = require('fs');

const p = './artifacts/study-tracker/src/features/subjects/TopicList.tsx';
let content = fs.readFileSync(p, 'utf-8');

const oldStr = `                <div className="flex-1 min-w-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-left w-full focus:outline-none flex items-center justify-between group-hover:text-primary transition-colors">
                        <div className="flex-1">
                          {editingTopicId === topic.id ? (
                            <Input
                              autoFocus
                              value={editingName}
                              onChange={e => setEditingName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (editingName.trim()) {
                                    onRenameTopic?.(topic.id, editingName.trim());
                                    setEditingTopicId(null);
                                  }
                                } else if (e.key === 'Escape') {
                                  setEditingTopicId(null);
                                }
                              }}
                              onBlur={() => {
                                if (editingName.trim() && editingName !== topic.name) {
                                  onRenameTopic?.(topic.id, editingName.trim());
                                }
                                setEditingTopicId(null);
                              }}
                              className="h-7 text-sm py-0 px-2 my-0.5"
                              onClick={e => e.stopPropagation()}
                            />
                          ) : (
                            <div className="flex items-center gap-2">`;

const newStr = `                <div className="flex-1 min-w-0">
                  {editingTopicId === topic.id ? (
                    <div className="flex-1 px-2">
                      <Input
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => {
                          e.stopPropagation();
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (editingName.trim()) {
                              onRenameTopic?.(topic.id, editingName.trim());
                              setEditingTopicId(null);
                            }
                          } else if (e.key === 'Escape') {
                            setEditingTopicId(null);
                          }
                        }}
                        onBlur={() => {
                          if (editingName.trim() && editingName !== topic.name) {
                            onRenameTopic?.(topic.id, editingName.trim());
                          }
                          setEditingTopicId(null);
                        }}
                        className="h-7 text-sm py-0 px-2 my-0.5"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-left w-full focus:outline-none flex items-center justify-between group-hover:text-primary transition-colors">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">`;

const oldStr2 = `                            </div>
                          )}
                        {(() => {`;

const newStr2 = `                            </div>
                        {(() => {`;

const oldStr3 = `                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>`;

const newStr3 = `                    </DropdownMenuContent>
                  </DropdownMenu>
                  )}
                </div>`;

content = content.replace(oldStr, newStr).replace(oldStr2, newStr2).replace(oldStr3, newStr3);
fs.writeFileSync(p, content);
console.log('patched');
