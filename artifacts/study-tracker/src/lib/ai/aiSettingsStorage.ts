import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAISettingsFromFirebase, saveAISettingsToFirebase } from '@/lib/user';

export type SupportedGeminiModel = 'gemini-3.7-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';

export type AIValidationStatus = 'unconfigured' | 'valid' | 'invalid' | 'rate_limited' | 'error';

export type MentorshipStyle = 'socratic' | 'direct';
export type ClinicalDepth = 'high-yield' | 'comprehensive';

export interface AISettings {
  mentorshipStyle: MentorshipStyle;
  clinicalDepth: ClinicalDepth;
  hasCompletedAIPersonalization: boolean;
  hasRejectedHighYieldMode: boolean;
  lastPreferenceToastShownAt: number | null;
  isAiEnabled: boolean;
  geminiApiKey: string;
  preferredModel?: string;
  lastValidatedAt: number | null;
  validationStatus: AIValidationStatus;
  validationMessage: string;
}

const STORAGE_KEY_AI_ENABLED = 'atlas_ai_enabled';
const STORAGE_KEY_API_KEY = 'atlas_gemini_api_key';
const STORAGE_KEY_LAST_VALIDATED = 'atlas_ai_last_validated';
const STORAGE_KEY_STATUS = 'atlas_ai_validation_status';
const STORAGE_KEY_MESSAGE = 'atlas_ai_validation_message';
const STORAGE_KEY_MENTORSHIP = 'atlas_ai_mentorship_style';
const STORAGE_KEY_CLINICAL_DEPTH = 'atlas_ai_clinical_depth';
const STORAGE_KEY_PERSONALIZATION_DONE = 'atlas_ai_personalization_done';
const STORAGE_KEY_REJECTED_HY = 'atlas_ai_rejected_high_yield';
const STORAGE_KEY_LAST_TOAST = 'atlas_ai_last_toast_time';
const STORAGE_KEY_PREFERRED_MODEL = 'atlas_ai_preferred_model';

export const DEFAULT_AI_SETTINGS: AISettings = {
  isAiEnabled: true,
  geminiApiKey: '',
  preferredModel: '',
  lastValidatedAt: null,
  validationStatus: 'unconfigured',
  validationMessage: '',
  mentorshipStyle: 'socratic',
  clinicalDepth: 'high-yield',
  hasCompletedAIPersonalization: false,
  hasRejectedHighYieldMode: false,
  lastPreferenceToastShownAt: null,
};

const AI_SETTINGS_CHANGE_EVENT = 'atlas_ai_settings_changed';

export function getAISettings(): AISettings {
  if (typeof window === 'undefined') return DEFAULT_AI_SETTINGS;

  try {
    const storedEnabled = localStorage.getItem(STORAGE_KEY_AI_ENABLED);
    const isAiEnabled = storedEnabled !== null ? storedEnabled === 'true' : true;
    const geminiApiKey = localStorage.getItem(STORAGE_KEY_API_KEY) || '';

    const lastValidatedAtStr = localStorage.getItem(STORAGE_KEY_LAST_VALIDATED);
    const lastValidatedAt = lastValidatedAtStr ? parseInt(lastValidatedAtStr, 10) : null;
    const validationStatus = (localStorage.getItem(STORAGE_KEY_STATUS) as AIValidationStatus) || (geminiApiKey ? 'valid' : 'unconfigured');
    const validationMessage = localStorage.getItem(STORAGE_KEY_MESSAGE) || '';
    const mentorshipStyle = (localStorage.getItem(STORAGE_KEY_MENTORSHIP) as MentorshipStyle) || 'socratic';
    const clinicalDepth = (localStorage.getItem(STORAGE_KEY_CLINICAL_DEPTH) as ClinicalDepth) || 'high-yield';
    const hasCompletedAIPersonalization = localStorage.getItem(STORAGE_KEY_PERSONALIZATION_DONE) === 'true';
    const hasRejectedHighYieldMode = localStorage.getItem(STORAGE_KEY_REJECTED_HY) === 'true';
    const lastToastStr = localStorage.getItem(STORAGE_KEY_LAST_TOAST);
    const lastPreferenceToastShownAt = lastToastStr ? parseInt(lastToastStr, 10) : null;
    const preferredModel = localStorage.getItem(STORAGE_KEY_PREFERRED_MODEL) || '';

    return {
      mentorshipStyle,
      clinicalDepth,
      hasCompletedAIPersonalization,
      hasRejectedHighYieldMode,
      lastPreferenceToastShownAt,
      preferredModel,
      isAiEnabled,
      geminiApiKey,
      lastValidatedAt,
      validationStatus,
      validationMessage,
    };
  } catch (err) {
    console.warn('[AISettings] Error reading settings from localStorage:', err);
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveAISettings(partial: Partial<AISettings>): AISettings {
  if (typeof window === 'undefined') return DEFAULT_AI_SETTINGS;

  try {
    const current = getAISettings();
    const updated: AISettings = { ...current, ...partial };

    localStorage.setItem(STORAGE_KEY_AI_ENABLED, updated.isAiEnabled ? 'true' : 'false');
    localStorage.setItem(STORAGE_KEY_API_KEY, updated.geminiApiKey || '');

    if (updated.lastValidatedAt !== null) {
      localStorage.setItem(STORAGE_KEY_LAST_VALIDATED, updated.lastValidatedAt.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY_LAST_VALIDATED);
    }

    localStorage.setItem(STORAGE_KEY_STATUS, updated.validationStatus);
    localStorage.setItem(STORAGE_KEY_MESSAGE, updated.validationMessage || '');
    localStorage.setItem(STORAGE_KEY_MENTORSHIP, updated.mentorshipStyle);
    localStorage.setItem(STORAGE_KEY_CLINICAL_DEPTH, updated.clinicalDepth);
    localStorage.setItem(STORAGE_KEY_PERSONALIZATION_DONE, updated.hasCompletedAIPersonalization ? 'true' : 'false');
    localStorage.setItem(STORAGE_KEY_REJECTED_HY, updated.hasRejectedHighYieldMode ? 'true' : 'false');
    localStorage.setItem(STORAGE_KEY_PREFERRED_MODEL, updated.preferredModel || '');
    if (updated.lastPreferenceToastShownAt !== null) {
      localStorage.setItem(STORAGE_KEY_LAST_TOAST, updated.lastPreferenceToastShownAt.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY_LAST_TOAST);
    
    }

    window.dispatchEvent(new CustomEvent(AI_SETTINGS_CHANGE_EVENT, { detail: updated }));
    return updated;
  } catch (err) {
    console.error('[AISettings] Error saving settings to localStorage:', err);
    return getAISettings();
  }
}

export function clearAISettings(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY_AI_ENABLED);
    localStorage.removeItem(STORAGE_KEY_API_KEY);
    localStorage.removeItem(STORAGE_KEY_LAST_VALIDATED);
    localStorage.removeItem(STORAGE_KEY_STATUS);
    localStorage.removeItem(STORAGE_KEY_MESSAGE);
    localStorage.removeItem(STORAGE_KEY_MENTORSHIP);
    localStorage.removeItem(STORAGE_KEY_CLINICAL_DEPTH);
    localStorage.removeItem(STORAGE_KEY_PERSONALIZATION_DONE);
    localStorage.removeItem(STORAGE_KEY_REJECTED_HY);
    localStorage.removeItem(STORAGE_KEY_LAST_TOAST);
    localStorage.removeItem(STORAGE_KEY_PREFERRED_MODEL);
    

    window.dispatchEvent(new CustomEvent(AI_SETTINGS_CHANGE_EVENT, { detail: DEFAULT_AI_SETTINGS }));
  } catch (err) {
    console.error('[AISettings] Error clearing AI settings:', err);
  }
}

export interface KeyValidationResult {
  success: boolean;
  status: AIValidationStatus;
  message: string;
  model: SupportedGeminiModel;
}

/**
 * Validates a user-supplied Gemini API key by making a lightweight 1-token test call
 * directly to Google AI Studio's API endpoint.
 */
export async function validateGeminiKey(
  apiKey: string,
  model: SupportedGeminiModel = 'gemini-3.1-flash-lite'
): Promise<KeyValidationResult> {
  const cleanKey = apiKey.trim();

  if (!cleanKey) {
    return {
      success: false,
      status: 'unconfigured',
      message: 'Please provide a Google Gemini API key.',
      model,
    };
  }

  if (cleanKey.length < 5) {
    return {
      success: false,
      status: 'invalid',
      message: 'Key is too short. Please enter a valid API key or credential.',
      model,
    };
  }

  const testPayload = {
    contents: [
      {
        parts: [{ text: 'Atlas Ping Test' }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 1,
    },
  };

  const makeAttempt = async (useBearer: boolean) => {
    const endpoint = useBearer
      ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
      : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (useBearer) {
      headers['Authorization'] = `Bearer ${cleanKey}`;
    } else {
      headers['x-goog-api-key'] = cleanKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res;
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  };

  try {
    // Attempt 1: Standard API key query param + x-goog-api-key header
    let response = await makeAttempt(false);

    // If 401 or 400 and key format looks like a token or standard key failed, try Bearer header as fallback
    if (!response.ok && (response.status === 401 || response.status === 403 || response.status === 400)) {
      try {
        const bearerResponse = await makeAttempt(true);
        if (bearerResponse.ok) {
          response = bearerResponse;
        }
      } catch {
        // Continue with original response
      }
    }

    if (response.ok) {
      return {
        success: true,
        status: 'valid',
        message: `Connected • Free Tier Active (${model})`,
        model,
      };
    }

    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;

    if (response.status === 400 || response.status === 403 || response.status === 401) {
      return {
        success: false,
        status: 'invalid',
        message: `Authentication failed (${response.status}): ${errorMessage}`,
        model,
      };
    }

    if (response.status === 429) {
      return {
        success: false,
        status: 'rate_limited',
        message: 'Free tier quota temporarily reached for this key. Resets daily at midnight PT.',
        model,
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        status: 'error',
        message: `Model "${model}" endpoint unavailable or retired. Try Gemini 3.7 Flash.`,
        model,
      };
    }

    return {
      success: false,
      status: 'error',
      message: `Verification error: ${errorMessage}`,
      model,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        status: 'error',
        message: 'Connection timed out while contacting Google AI Studio. Please check your internet connection.',
        model,
      };
    }

    return {
      success: false,
      status: 'error',
      message: err?.message || 'Network request to Google AI Studio failed. Check your connection.',
      model,
    };
  }
}

/**
 * React hook to observe and update AI settings with real-time sync across components.
 */
export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(getAISettings);
  const [isValidating, setIsValidating] = useState(false);
  const { user } = useAuth();
  
  // Cross-device Firebase Hydration
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    
    getAISettingsFromFirebase(user.uid).then(cloudSettings => {
      if (isMounted && cloudSettings && cloudSettings.geminiApiKey) {
        // Only override local if local doesn't have a valid key, or cloud has been updated more recently
        const local = getAISettings();
        if (!local.geminiApiKey || (cloudSettings.lastValidatedAt && (!local.lastValidatedAt || cloudSettings.lastValidatedAt > local.lastValidatedAt))) {
           saveAISettings(cloudSettings);
        } else if (local.geminiApiKey && local.geminiApiKey !== cloudSettings.geminiApiKey) {
           // We have a local key but cloud is different, push local to cloud to ensure sync
           saveAISettingsToFirebase(user.uid, local);
        }
      } else if (isMounted && !cloudSettings && getAISettings().geminiApiKey) {
        // Push to cloud if it doesn't exist
        saveAISettingsToFirebase(user.uid, getAISettings());
      }
    });
    
    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    const handleStorageChange = () => {
      setSettings(getAISettings());
    };

    window.addEventListener(AI_SETTINGS_CHANGE_EVENT, handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(AI_SETTINGS_CHANGE_EVENT, handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateSettings = useCallback((partial: Partial<AISettings>) => {
    const updated = saveAISettings(partial);
    setSettings(updated);
    if (user) {
      saveAISettingsToFirebase(user.uid, updated);
    }
    return updated;
  }, [user]);

  const testKey = useCallback(async (keyOverride?: string, modelOverride?: SupportedGeminiModel) => {
    const keyToTest = keyOverride !== undefined ? keyOverride : settings.geminiApiKey;
    const modelToTest = modelOverride !== undefined ? modelOverride : 'gemini-3.1-flash-lite';

    setIsValidating(true);
    try {
      const result = await validateGeminiKey(keyToTest, modelToTest);

      const updated = saveAISettings({
        lastValidatedAt: Date.now(),
        validationStatus: result.status,
        validationMessage: result.message,
      });
      setSettings(updated);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [settings.geminiApiKey]);

  return {
    settings,
    updateSettings,
    testKey,
    isValidating,
    isReady: settings.isAiEnabled && settings.validationStatus === 'valid' && !!settings.geminiApiKey,
  };
}

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
