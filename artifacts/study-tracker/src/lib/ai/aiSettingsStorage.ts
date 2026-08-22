import { useState, useEffect, useCallback } from 'react';

export type SupportedGeminiModel = 'gemini-2.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-2.5-flash-lite';

export interface ModelOption {
  id: SupportedGeminiModel;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  rpm: number;
  rpd: number;
}

export const AVAILABLE_GEMINI_MODELS: ModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Recommended',
    tagline: 'Standard Fast & Intelligent',
    description: 'High accuracy for medical taxonomy, structured clinical action extraction, and diagnostic feedback.',
    rpm: 10,
    rpd: 250,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    badge: 'High Speed',
    tagline: 'Ultra-low Latency & Quota',
    description: 'Instant response times for rapid voice logging, active recall drills, and high daily request limits.',
    rpm: 15,
    rpd: 1000,
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    badge: 'High Quota',
    tagline: 'High Daily Request Capacity',
    description: 'Lightweight model with maximum daily request headroom on Google AI Studio Free Tier.',
    rpm: 15,
    rpd: 1000,
  },
];

export type AIValidationStatus = 'unconfigured' | 'valid' | 'invalid' | 'rate_limited' | 'error';

export interface AISettings {
  isAiEnabled: boolean;
  geminiApiKey: string;
  selectedModel: SupportedGeminiModel;
  lastValidatedAt: number | null;
  validationStatus: AIValidationStatus;
  validationMessage: string;
}

const STORAGE_KEY_AI_ENABLED = 'atlas_ai_enabled';
const STORAGE_KEY_API_KEY = 'atlas_gemini_api_key';
const STORAGE_KEY_MODEL = 'atlas_ai_selected_model';
const STORAGE_KEY_LAST_VALIDATED = 'atlas_ai_last_validated';
const STORAGE_KEY_STATUS = 'atlas_ai_validation_status';
const STORAGE_KEY_MESSAGE = 'atlas_ai_validation_message';

export const DEFAULT_AI_SETTINGS: AISettings = {
  isAiEnabled: true,
  geminiApiKey: '',
  selectedModel: 'gemini-2.5-flash',
  lastValidatedAt: null,
  validationStatus: 'unconfigured',
  validationMessage: '',
};

const AI_SETTINGS_CHANGE_EVENT = 'atlas_ai_settings_changed';

export function getAISettings(): AISettings {
  if (typeof window === 'undefined') return DEFAULT_AI_SETTINGS;

  try {
    const storedEnabled = localStorage.getItem(STORAGE_KEY_AI_ENABLED);
    const isAiEnabled = storedEnabled !== null ? storedEnabled === 'true' : true;
    const geminiApiKey = localStorage.getItem(STORAGE_KEY_API_KEY) || '';
    const storedModel = localStorage.getItem(STORAGE_KEY_MODEL) as SupportedGeminiModel;
    const selectedModel = (['gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite'].includes(storedModel))
      ? storedModel
      : 'gemini-2.5-flash';

    const lastValidatedAtStr = localStorage.getItem(STORAGE_KEY_LAST_VALIDATED);
    const lastValidatedAt = lastValidatedAtStr ? parseInt(lastValidatedAtStr, 10) : null;
    const validationStatus = (localStorage.getItem(STORAGE_KEY_STATUS) as AIValidationStatus) || (geminiApiKey ? 'valid' : 'unconfigured');
    const validationMessage = localStorage.getItem(STORAGE_KEY_MESSAGE) || '';

    return {
      isAiEnabled,
      geminiApiKey,
      selectedModel,
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
    localStorage.setItem(STORAGE_KEY_MODEL, updated.selectedModel || 'gemini-2.5-flash');

    if (updated.lastValidatedAt !== null) {
      localStorage.setItem(STORAGE_KEY_LAST_VALIDATED, updated.lastValidatedAt.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY_LAST_VALIDATED);
    }

    localStorage.setItem(STORAGE_KEY_STATUS, updated.validationStatus);
    localStorage.setItem(STORAGE_KEY_MESSAGE, updated.validationMessage || '');

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
    localStorage.removeItem(STORAGE_KEY_MODEL);
    localStorage.removeItem(STORAGE_KEY_LAST_VALIDATED);
    localStorage.removeItem(STORAGE_KEY_STATUS);
    localStorage.removeItem(STORAGE_KEY_MESSAGE);

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
  model: SupportedGeminiModel = 'gemini-2.5-flash'
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
        message: `Model "${model}" endpoint unavailable or retired. Try Gemini 2.0 Flash.`,
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
    return updated;
  }, []);

  const testKey = useCallback(async (keyOverride?: string, modelOverride?: SupportedGeminiModel) => {
    const keyToTest = keyOverride !== undefined ? keyOverride : settings.geminiApiKey;
    const modelToTest = modelOverride !== undefined ? modelOverride : settings.selectedModel;

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
  }, [settings.geminiApiKey, settings.selectedModel]);

  return {
    settings,
    updateSettings,
    testKey,
    isValidating,
    isReady: settings.isAiEnabled && settings.validationStatus === 'valid' && !!settings.geminiApiKey,
  };
}
