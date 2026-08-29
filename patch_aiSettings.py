import sys

path = 'artifacts/study-tracker/src/lib/ai/aiSettingsStorage.ts'
with open(path, 'r') as f:
    content = f.read()

# Add preferredModel to AISettings interface
content = content.replace("  geminiApiKey: string;", "  geminiApiKey: string;\n  preferredModel?: string;")

# Add to DEFAULT_AI_SETTINGS
content = content.replace("  geminiApiKey: '',", "  geminiApiKey: '',\n  preferredModel: '',")

# Add fetchAvailableModels function
new_function = """
export interface DynamicModelInfo {
  name: string;
  displayName: string;
  description: string;
  category: 'Fast' | 'Balanced' | 'Reasoning';
}

export async function fetchAvailableModels(apiKey: string): Promise<DynamicModelInfo[]> {
  if (!apiKey) return [];
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
    if (!res.ok) throw new Error("Failed to fetch models");
    const data = await res.json();
    const models = data.models || [];
    
    // Filter for models that support generateContent
    const validModels = models.filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"));
    
    return validModels.map((m: any) => {
      const rawName = m.name.replace("models/", "");
      const lowerName = rawName.toLowerCase();
      
      let category: 'Fast' | 'Balanced' | 'Reasoning' = 'Balanced';
      if (lowerName.includes('flash') || lowerName.includes('lite')) {
        category = 'Fast';
      } else if (lowerName.includes('thinking') || lowerName.includes('ultra') || lowerName.includes('omni')) {
        category = 'Reasoning';
      } else if (lowerName.includes('pro')) {
        category = 'Balanced';
      }
      
      return {
        name: rawName,
        displayName: m.displayName || rawName,
        description: m.description || "",
        category
      };
    }).sort((a, b) => b.name.localeCompare(a.name));
  } catch (err) {
    console.error("Model fetch error:", err);
    return [];
  }
}
"""

content += new_function

with open(path, 'w') as f:
    f.write(content)
print("done patching aiSettingsStorage")
