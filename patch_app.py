import sys

path = 'artifacts/api-server/src/app.ts'
with open(path, 'r') as f:
    content = f.read()

import re

# Add fs import
content = content.replace('import path from "path";', 'import path from "path";\nimport fs from "fs";')

target = """const distPath = path.resolve(__dirname, "../../..", "dist");"""
replacement = """let distPath = path.resolve(__dirname, "../../..", "dist");
if (fs.existsSync(path.resolve(__dirname, "index.html"))) {
  distPath = __dirname;
}"""

content = content.replace(target, replacement)

with open(path, 'w') as f:
    f.write(content)
print("done patching app.ts")
