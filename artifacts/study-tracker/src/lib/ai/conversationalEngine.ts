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
}

/**
 * Sends conversation thread to the Atlas Cognitive Compiler.
 * Routes through Tier A (<5ms local pattern matcher) and Tier B (resilient Gemini cloud compiler).
 */
export async function sendChatMessageToGemini(
  conversationHistory: ChatMessage[],
  newMessage: string,
  isVoice: boolean = false
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
    { bypassLocalTokenizer: false, cognitiveLoad: 'routine' }
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
