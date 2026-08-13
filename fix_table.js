const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let content = fs.readFileSync(path, 'utf8');

const startIndex = content.indexOf('function VirtualizedScoreTable({');
content = content.substring(0, startIndex);

const newFunction = `function VirtualizedScoreTable({
  displayLogs,
  subjectMap,
  handleDeleteLog,
  getPercentageColorBadge,
}: {
  displayLogs: any[];
  subjectMap: Map<number, any>;
  handleDeleteLog: (id: number) => void;
  getPercentageColorBadge: (pct: number) => string;
}) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: displayLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Slightly taller for feed items
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="max-h-[500px] overflow-auto pr-2 -mr-2">
      <div
        style={{
          height: \`\${rowVirtualizer.getTotalSize()}px\`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const log = displayLogs[virtualRow.index];
          const subName = subjectMap.get(log.subjectId)?.name;
          
          let logColor = "bg-purple-500";
          if (log.type === 'gt') logColor = "bg-primary";
          else if (log.type === 'revision') logColor = "bg-blue-500";
          else if (log.type === 'set') logColor = "bg-amber-500";

          return (
            <div
              key={log.id ?? virtualRow.index}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: \`translateY(\${virtualRow.start}px)\`,
              }}
              className="group flex items-center justify-between py-3 border-b border-border/30 hover:bg-muted/10 transition-colors pr-2"
            >
              <div className="flex items-start gap-4 overflow-hidden">
                <div className="pt-1.5 shrink-0">
                  <div className={\`w-2 h-2 rounded-full \${logColor}\`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm text-foreground truncate">{log.title}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-40 shrink-0">
                      {log.type === 'gt' ? 'GT' : log.type === 'pyq' ? 'PYQ' : log.type === 'set' ? 'SET' : 'REV'}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2 truncate">
                    <span className="font-medium">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                    {subName && (
                      <>
                        <span className="opacity-30">•</span>
                        <span className="truncate">{subName}</span>
                      </>
                    )}
                    {log.notes && (
                       <>
                        <span className="opacity-30">•</span>
                        <span className="truncate italic opacity-75">{log.notes}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 shrink-0 pl-4">
                <div className="flex flex-col items-end">
                   <span className={\`font-mono font-bold text-lg leading-none \${
                      log.percentage >= 75 ? 'text-emerald-500' : 
                      log.percentage < 60 ? 'text-rose-500' : 'text-amber-500'
                   }\`}>
                     {log.percentage}%
                   </span>
                   <span className="text-[10px] text-muted-foreground font-mono mt-1">
                     {log.score}/{log.total}
                   </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => log.id && handleDeleteLog(log.id)}
                  className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all focus:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
`;

content += newFunction;
fs.writeFileSync(path, content);
