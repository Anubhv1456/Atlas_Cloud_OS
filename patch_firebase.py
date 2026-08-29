import sys

path = 'artifacts/study-tracker/src/lib/firebase.ts'
with open(path, 'r') as f:
    content = f.read()

import re

# Remove the import of firebase-applet-config.json
content = re.sub(r'import firebaseConfig from "\.\./firebase-applet-config\.json";', '', content)

config_code = """const firebaseConfig = {
  apiKey: "AIzaSyB23xBbSVe1eehDAiyUSz_HOvKyPdfxytM",
  authDomain: "atlas-cloud-6f1c6.firebaseapp.com",
  projectId: "atlas-cloud-6f1c6",
  storageBucket: "atlas-cloud-6f1c6.firebasestorage.app",
  messagingSenderId: "661277140008",
  appId: "1:661277140008:web:467285c718de2c8674011d",
  measurementId: "G-FN3VXL0XEH"
};
"""

# Insert the new config code before `// Silence verbose...`
target = "// Silence verbose internal connection retry and offline warning logs"
content = content.replace(target, config_code + "\n" + target)

with open(path, 'w') as f:
    f.write(content)

print("done patching firebase.ts")
