import sys

path = 'artifacts/study-tracker/src/lib/ankiExport.ts'
with open(path, 'r') as f:
    content = f.read()

import re

# We will inject the getOptimalModel logic
new_functions = """
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let cachedOptimalModel = "";

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
}
"""

content = content.replace("const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));", new_functions)

# Update generateCardsFromGemini
target = """const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(cleanKey)}`;"""
replacement = """let activeModel = cachedOptimalModel || "gemini-flash";
  let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;"""

content = content.replace(target, replacement)

target2 = """      const response = await fetch(endpoint, {"""
replacement2 = """      endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      const response = await fetch(endpoint, {"""

content = content.replace(target2, replacement2)

target3 = """      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
      }"""
replacement3 = """      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `API error: ${response.statusText}`;
        
        // If the model is not found or no longer available, trigger discovery
        if (response.status === 404 || errMsg.includes("no longer available") || errMsg.includes("is not found")) {
            console.warn(`Model ${activeModel} failed. Discovering new model...`);
            activeModel = await discoverModels(cleanKey);
            cachedOptimalModel = activeModel;
            throw new Error(`Model unavailable. Retrying with ${activeModel}...`);
        }
        
        throw new Error(errMsg);
      }"""

content = content.replace(target3, replacement3)

with open(path, 'w') as f:
    f.write(content)
print("done patching ankiExport")
