s/onClick={() => togglePhase(rs.id!, 'content', rs.contentCompleted)}//g
s/rs.contentCompleted ? "bg-primary\/10 border-primary\/30 text-primary" : "bg-transparent border-border text-muted-foreground hover:border-primary\/50 hover:bg-primary\/5"//g
s/{rs.contentCompleted ? <CheckCircle2 className="w-3.5 h-3.5" \/> : <Circle className="w-3.5 h-3.5" \/>}//g
s/Content//g
s/onClick={() => togglePhase(rs.id!, 'qbank', rs.qbankCompleted)}//g
s/rs.qbankCompleted ? "bg-primary\/10 border-primary\/30 text-primary" : "bg-transparent border-border text-muted-foreground hover:border-primary\/50 hover:bg-primary\/5"//g
s/{rs.qbankCompleted ? <CheckCircle2 className="w-3.5 h-3.5" \/> : <Circle className="w-3.5 h-3.5" \/>}//g
s/QBank//g
