const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/pages/Landing.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `      {/* Navbar */}
      <header className="w-full px-6 py-4 flex justify-between items-center z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">Atlas</span>
        </div>
        <Button variant="ghost" onClick={handleSignIn} disabled={loading}>
          Log in
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center z-10 px-4 pt-20 pb-16 w-full max-w-5xl mx-auto text-center">`;

const replacement = `      {/* Navbar */}
      <header className="absolute top-0 left-0 right-0 z-50 w-full px-6 md:px-12 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-primary" />
          <span className="font-extrabold text-2xl tracking-tighter">Atlas</span>
        </div>
        <Button variant="ghost" className="rounded-full px-6 font-semibold" onClick={handleSignIn} disabled={loading}>
          Log in
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center z-10 px-4 pt-32 pb-16 w-full max-w-5xl mx-auto text-center">`;

if (content.includes('Navbar')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Replaced');
} else {
  console.log('Not found');
}
