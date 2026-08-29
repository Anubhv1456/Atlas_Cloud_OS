// Headless hook for Atlas AI Session
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';
import { useClinicalFrictionEngine } from '@/lib/ai/frictionEngine';
import { useAmbientVoiceSession } from '@/lib/ai/useAmbientVoiceSession';
import { convertDeltaToAction } from '@/lib/ai/geminiClient';
import { getLiveAtlasContext, LiveAtlasContext } from '@/lib/ai/contextPackager';
import { ChatMessage, sendChatMessageToGemini } from '@/lib/ai/conversationalEngine';
import { ParsedAtlasAction } from '@/lib/ai/types';
import { toast } from 'sonner';
import { useVoiceInput } from '@/hooks/useVoiceInput';

export function useAtlasSession(open: boolean, initialMode: 'text' | 'voice' = 'text') {
  // Logic placeholder, extracted from ChatAssistantDrawer
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [activeVoiceAction, setActiveVoiceAction] = useState<ParsedAtlasAction | null>(null);
  
  return {
    messages,
    setMessages,
    isVoiceActive,
    setIsVoiceActive,
    activeVoiceAction,
    setActiveVoiceAction
  };
}
