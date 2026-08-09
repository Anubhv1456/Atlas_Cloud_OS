const fs = require('fs');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('artifacts/study-tracker/src');
files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('AlertTriangle')) {
        // check if imported
        if (!content.match(/import\s+[\s\S]*?AlertTriangle[\s\S]*?from\s+['"]lucide-react['"]/)) {
            console.log("Missing import in:", f);
        }
    }
});
