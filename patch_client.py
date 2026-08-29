import sys

path = 'artifacts/study-tracker/src/lib/ai/geminiClient.ts'
with open(path, 'r') as f:
    content = f.read()

# Fix activeModel setting
import re

target1 = """  let activeModel: SupportedGeminiModel;
    
  if (isRoutine) {
    activeModel = 'gemini-3.1-flash-lite';
  } else if (cognitiveLoad === 'analytical') {
    activeModel = 'gemini-3.1-pro-preview';
  } else {
    activeModel = 'gemini-3.7-flash';
  }"""
replacement1 = """  const settings = getAISettings();
  
  if (!settings.preferredModel) {
    throw new Error("No AI model selected. Please visit Settings to select an active model.");
  }
  let activeModel: any = settings.preferredModel;"""

content = content.replace(target1, replacement1)
content = content.replace("  const settings = getAISettings();\n  const apiKey", "  const apiKey")

content = content.replace("const fallbackModel: SupportedGeminiModel = 'gemini-3.1-flash-lite';", "const fallbackModel: any = 'gemini-flash';")

with open(path, 'w') as f:
    f.write(content)
print("done patching geminiClient")
