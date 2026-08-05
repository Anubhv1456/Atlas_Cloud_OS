const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/index.css';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('.bg-meridian')) {
  content += `\n
@layer utilities {
  .bg-meridian {
    background-image: 
      linear-gradient(to right, hsl(var(--foreground)/0.03) 1px, transparent 1px),
      linear-gradient(to bottom, hsl(var(--foreground)/0.03) 1px, transparent 1px),
      radial-gradient(circle at 50% 50%, hsl(var(--foreground)/0.02) 1px, transparent 2px);
    background-size: 64px 64px, 64px 64px, 32px 32px;
    background-position: center center;
    mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
    -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
  }

  .meridian-ring {
    border: 1px solid hsl(var(--foreground)/0.05);
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
}
`;
  fs.writeFileSync(file, content);
}
