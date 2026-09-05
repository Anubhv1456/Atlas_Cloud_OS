import { SupportedGeminiModel } from './aiSettingsStorage';
import { ParsedAtlasAction } from './types';
import { executeCognitiveCompiler } from './geminiClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  proposedAction?: ParsedAtlasAction | null;
  actionStatus?: 'pending' | 'committed' | 'declined';
  actionError?: string;
  isVoiceInput?: boolean;
  source?: 'LOCAL_TOKENIZER' | 'GEMINI_CLOUD' | 'HYBRID';
  latencyMs?: number;
  attachedImageBase64?: string;
}

/**
 * Sends conversation thread to the Atlas Cognitive Compiler.
 * Routes through Tier A (<5ms local pattern matcher) and Tier B (resilient Gemini cloud compiler).
 */
export async function sendChatMessageToGemini(
  conversationHistory: ChatMessage[],
  newMessage: string,
  isVoice: boolean = false,
  attachedImageBase64?: string
): Promise<{
  replyMessage: string;
  proposedAction?: ParsedAtlasAction | null;
  modelUsed: SupportedGeminiModel | 'LOCAL_TOKENIZER';
  source?: 'LOCAL_TOKENIZER' | 'GEMINI_CLOUD' | 'HYBRID';
  latencyMs?: number;
  preferenceShift?: string;
}> {
  const result = await executeCognitiveCompiler(
    newMessage,
    conversationHistory.map((m) => ({ role: m.role, content: m.content })),
    { bypassLocalTokenizer: !!attachedImageBase64, cognitiveLoad: 'routine', attachedImageBase64 }
  );

  return {
    replyMessage: result.delta.executiveSummary || 'I have compiled your request into your Atlas study state.',
    proposedAction: result.action || null,
    modelUsed: result.modelUsed,
    source: result.source,
    latencyMs: result.latencyMs,
    preferenceShift: result.delta.detectedPreferenceShift,
  };
}
