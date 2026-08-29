import sys

path = 'artifacts/study-tracker/src/lib/ankiExport.ts'
with open(path, 'r') as f:
    content = f.read()

target = """let cachedOptimalModel = "";

async function getOptimalModel(apiKey: string): Promise<string> {
  if (cachedOptimalModel) return cachedOptimalModel;
  
  // Start with the generic unversioned alias which auto-routes to the best flash
  let modelToTry = "gemini-flash";
  
  try {
    // If we want to be absolutely sure, we could just use gemini-flash, but
    // to fulfill the "dynamic discovery engine" requirement, we'll implement a fallback
    // inside the actual API call loop if it fails.
    cachedOptimalModel = modelToTry;
    return modelToTry;
  } catch (e) {
    return "gemini-1.5-flash"; // Ultimate fallback
  }
}

async function discoverModels(apiKey: string): Promise<string> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
    if (res.ok) {
      const data = await res.json();
      const models = data.models || [];
      // Filter for flash models that support generateContent
      const flashModels = models
        .filter((m: any) => m.name.includes("flash") && m.supportedGenerationMethods.includes("generateContent"))
        .map((m: any) => m.name.replace("models/", ""));
      
      if (flashModels.length > 0) {
        // Sort descending to get the newest (e.g., 2.0 or 1.5)
        flashModels.sort().reverse();
        return flashModels[0];
      }
    }
  } catch (e) {
    console.warn("Model discovery failed, using fallback", e);
  }
  return "gemini-flash";
}"""

replacement = """function getPreferredModel(): string {
  try {
    const raw = localStorage.getItem('atlas_ai_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.preferredModel) return parsed.preferredModel;
    }
  } catch (e) {}
  throw new Error("No AI model selected. Please visit Settings to select an active model.");
}"""

content = content.replace(target, replacement)

target2 = """  let activeModel = cachedOptimalModel || "gemini-flash";"""
replacement2 = """  let activeModel = getPreferredModel();"""
content = content.replace(target2, replacement2)

target3 = """        // If the model is not found or no longer available, trigger discovery
        if (response.status === 404 || errMsg.includes("no longer available") || errMsg.includes("is not found")) {
            console.warn(`Model ${activeModel} failed. Discovering new model...`);
            activeModel = await discoverModels(cleanKey);
            cachedOptimalModel = activeModel;
            throw new Error(`Model unavailable. Retrying with ${activeModel}...`);
        }"""
content = content.replace(target3, "")

with open(path, 'w') as f:
    f.write(content)
print("done patching ankiExport2")
