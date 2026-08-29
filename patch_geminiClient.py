import sys

path = 'artifacts/study-tracker/src/lib/ai/geminiClient.ts'
with open(path, 'r') as f:
    content = f.read()

target = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
replacement = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash:generateContent'

content = content.replace(target, replacement)

with open(path, 'w') as f:
    f.write(content)
print("done patching geminiClient")
