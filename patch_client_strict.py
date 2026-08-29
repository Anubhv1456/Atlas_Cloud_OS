import sys
import re

path = 'artifacts/study-tracker/src/lib/ai/geminiClient.ts'
with open(path, 'r') as f:
    content = f.read()

# Replace activeModel block
pattern = r"  let activeModel: SupportedGeminiModel;\s*if \(isRoutine\) \{\s*activeModel = 'gemini-3\.1-flash-lite';\s*\} else if \(cognitiveLoad === 'analytical'\) \{\s*activeModel = 'gemini-3\.1-pro-preview';\s*\} else \{\s*activeModel = 'gemini-3\.7-flash';\s*\}"
replacement = """  const settings = getAISettings();
  if (!settings.preferredModel) {
    throw new Error("No AI model selected. Please visit Settings to select an active model.");
  }
  let activeModel: any = settings.preferredModel;"""
content = re.sub(pattern, replacement, content)

# Remove the duplicated settings definition that happens later (at line ~260)
pattern2 = r"  const settings = getAISettings\(\);\s*const apiKey = settings\.geminiApiKey"
replacement2 = """  const apiKey = settings.geminiApiKey"""
content = re.sub(pattern2, replacement2, content)

content = content.replace("const fallbackModel: SupportedGeminiModel = 'gemini-3.1-flash-lite';", "const fallbackModel: any = 'gemini-flash';")

with open(path, 'w') as f:
    f.write(content)
print("done strict patching geminiClient")
