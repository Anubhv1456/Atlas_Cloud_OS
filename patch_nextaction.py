import sys

path = 'artifacts/study-tracker/src/components/dashboard/NextActionCard.tsx'
with open(path, 'r') as f:
    content = f.read()

# 1. Update toast text to remove "SDSR Engine"
content = content.replace('SDSR Engine curated your high-friction topics.', 'Your personalized study session is ready.')
content = content.replace('toast.success("Ephemeral Study Playlist Generated", {', 'toast.success("Study Session Generated", {')
content = content.replace('toast.info("No friction detected. Enjoy your rest.");', 'toast.info("No tasks pending. Enjoy your rest.");')
content = content.replace('Synthesizing...', 'Preparing...')

# 2. Fix the badge logic that failed to match earlier
import re

badge_pattern = r'<Badge variant="outline" className={cn\(\s*"text-\[9px\] uppercase tracking-wider font-bold shrink-0",\s*pulse\.urgency === \'CRITICAL\' \? \'bg-destructive/10 text-destructive border-destructive/20\' :\s*pulse\.urgency === \'ELEVATED\' \? \'bg-amber-500/10 text-amber-600 border-amber-500/20\' :\s*\'bg-primary/10 text-primary border-primary/20\'\s*\)}>\s*\{pulse\.urgency\}\s*</Badge>'
new_badge = """{pulse.urgency === 'CRITICAL' || pulse.urgency === 'ELEVATED' ? (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] uppercase tracking-wider font-bold shrink-0">
                        Needs Review
                      </Badge>
                    ) : pulse.urgency === 'FRESH' ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] uppercase tracking-wider font-bold shrink-0">
                        New
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px] uppercase tracking-wider font-bold shrink-0">
                        Mastered
                      </Badge>
                    )}"""

content = re.sub(badge_pattern, new_badge, content)

# 3. Fix the arrow logic that failed to match earlier
arrow_pattern = r'<div className="mt-4 flex items-center justify-end text-\[10px\] font-semibold text-muted-foreground group-hover:text-primary transition-colors">\s*<ArrowRight className="w-3\.5 h-3\.5" />\s*</div>'
new_arrow = """<div className="mt-4 flex items-center justify-end">
                  <div className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-full transition-colors",
                    pulse.urgency === 'FRESH' ? 'bg-primary text-primary-foreground' : 
                    pulse.urgency === 'MASTERED' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 
                    'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                  )}>
                    {pulse.ctaText || (pulse.urgency === 'FRESH' ? 'Begin' : pulse.urgency === 'MASTERED' ? 'Practice' : 'Review')}
                  </div>
                </div>"""

content = re.sub(arrow_pattern, new_arrow, content)

with open(path, 'w') as f:
    f.write(content)
print("done patching NextActionCard again")
