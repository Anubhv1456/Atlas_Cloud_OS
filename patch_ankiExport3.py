import sys

path = 'artifacts/study-tracker/src/lib/ankiExport.ts'
with open(path, 'r') as f:
    content = f.read()

target = """function getPreferredModel(): string {
  try {
    const raw = localStorage.getItem('atlas_ai_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.preferredModel) return parsed.preferredModel;
    }
  } catch (e) {}
  throw new Error("No AI model selected. Please visit Settings to select an active model.");
}"""

replacement = """function getPreferredModel(): string {
  const preferredModel = localStorage.getItem('atlas_ai_preferred_model');
  if (preferredModel) return preferredModel;
  throw new Error("No AI model selected. Please visit Settings to select an active model.");
}"""

content = content.replace(target, replacement)

with open(path, 'w') as f:
    f.write(content)
print("done patching ankiExport3")
