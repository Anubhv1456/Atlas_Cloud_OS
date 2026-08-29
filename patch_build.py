import sys

path = 'build.mjs'
with open(path, 'r') as f:
    content = f.read()

target = """const serverSrc = path.join(__dirname, 'artifacts/api-server/dist/index.mjs');
const serverDest = path.join(__dirname, 'dist/server.mjs');
if (fs.existsSync(serverSrc)) {
  fs.copyFileSync(serverSrc, serverDest);
  console.log(`[Atlas Build] Copied server bundle to ${serverDest}`);
}"""

replacement = """const apiServerDist = path.join(__dirname, 'artifacts/api-server/dist');
if (fs.existsSync(apiServerDist)) {
  const distFiles = fs.readdirSync(apiServerDist);
  for (const file of distFiles) {
    if (file.endsWith('.mjs')) {
      const src = path.join(apiServerDist, file);
      // Rename index.mjs to server.mjs for the main bundle
      const destName = file === 'index.mjs' ? 'server.mjs' : file;
      const dest = path.join(__dirname, 'dist', destName);
      fs.copyFileSync(src, dest);
      console.log(`[Atlas Build] Copied ${file} to ${dest}`);
    }
  }
}"""

content = content.replace(target, replacement)

with open(path, 'w') as f:
    f.write(content)
print("done patching build.mjs")
