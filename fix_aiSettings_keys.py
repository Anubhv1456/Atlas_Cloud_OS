import sys

path = 'artifacts/study-tracker/src/lib/ai/aiSettingsStorage.ts'
with open(path, 'r') as f:
    content = f.read()

# Add STORAGE_KEY_PREFERRED_MODEL
content = content.replace("const STORAGE_KEY_LAST_TOAST = 'atlas_ai_last_toast_time';", "const STORAGE_KEY_LAST_TOAST = 'atlas_ai_last_toast_time';\nconst STORAGE_KEY_PREFERRED_MODEL = 'atlas_ai_preferred_model';")

# Read it
target_read = """const lastToastStr = localStorage.getItem(STORAGE_KEY_LAST_TOAST);
    const lastPreferenceToastShownAt = lastToastStr ? parseInt(lastToastStr, 10) : null;"""
replacement_read = """const lastToastStr = localStorage.getItem(STORAGE_KEY_LAST_TOAST);
    const lastPreferenceToastShownAt = lastToastStr ? parseInt(lastToastStr, 10) : null;
    const preferredModel = localStorage.getItem(STORAGE_KEY_PREFERRED_MODEL) || '';"""
content = content.replace(target_read, replacement_read)

target_return = """hasCompletedAIPersonalization,
      hasRejectedHighYieldMode,
      lastPreferenceToastShownAt,"""
replacement_return = """hasCompletedAIPersonalization,
      hasRejectedHighYieldMode,
      lastPreferenceToastShownAt,
      preferredModel,"""
content = content.replace(target_return, replacement_return)

target_save = """localStorage.setItem(STORAGE_KEY_REJECTED_HY, updated.hasRejectedHighYieldMode ? 'true' : 'false');"""
replacement_save = """localStorage.setItem(STORAGE_KEY_REJECTED_HY, updated.hasRejectedHighYieldMode ? 'true' : 'false');
    localStorage.setItem(STORAGE_KEY_PREFERRED_MODEL, updated.preferredModel || '');"""
content = content.replace(target_save, replacement_save)

target_remove = """localStorage.removeItem(STORAGE_KEY_LAST_TOAST);"""
replacement_remove = """localStorage.removeItem(STORAGE_KEY_LAST_TOAST);
    localStorage.removeItem(STORAGE_KEY_PREFERRED_MODEL);"""
content = content.replace(target_remove, replacement_remove)

with open(path, 'w') as f:
    f.write(content)
print("done fixing aiSettings keys")
