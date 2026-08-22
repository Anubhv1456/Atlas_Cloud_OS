import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Key, 
  Cpu, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Mic, 
  Zap,
  Info,
  Check,
  ChevronDown
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  useAISettings, 
  AVAILABLE_GEMINI_MODELS, 
  SupportedGeminiModel 
} from '@/lib/ai/aiSettingsStorage';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function AIAssistantSection() {
  const { settings, updateSettings, testKey, isValidating } = useAISettings();
  const [showKey, setShowKey] = useState(false);
  const [localKey, setLocalKey] = useState<string>(settings.geminiApiKey || '');
  const [hasUnsavedKey, setHasUnsavedKey] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!settings.geminiApiKey);

  // Synchronize local input state with saved settings
  useEffect(() => {
    if (!hasUnsavedKey) {
      setLocalKey(settings.geminiApiKey || '');
    }
  }, [settings.geminiApiKey, hasUnsavedKey]);

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalKey(val);
    setHasUnsavedKey(val.trim() !== (settings.geminiApiKey || '').trim());
  };

  const handleSaveKey = () => {
    const trimmed = (localKey || '').trim();
    updateSettings({ 
      geminiApiKey: trimmed,
      validationStatus: trimmed ? 'unconfigured' : 'unconfigured',
      validationMessage: trimmed ? 'Key saved. Tap "Test Connection" to verify.' : ''
    });
    setHasUnsavedKey(false);
    toast.success('Gemini API key saved locally');
  };

  const handleTestConnection = async () => {
    const keyToTest = (localKey || '').trim() || (settings.geminiApiKey || '').trim();
    if (!keyToTest) {
      toast.error('Please enter a Google Gemini API key first');
      return;
    }

    if (hasUnsavedKey) {
      updateSettings({ geminiApiKey: keyToTest });
      setHasUnsavedKey(false);
    }

    try {
      const result = await testKey(keyToTest, settings.selectedModel);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to connect to Google AI Studio.');
    }
  };

  const handleToggleEnable = async (enabled: boolean) => {
    if (enabled && !settings.geminiApiKey && !localKey.trim()) {
      toast.info('Please enter your Google Gemini API key to activate AI features');
    }
    updateSettings({ isAiEnabled: enabled });
    if (enabled) {
      toast.success('Clinical AI & Voice Assistant enabled');
    } else {
      toast.info('Clinical AI & Voice Assistant disabled');
    }
  };

  const handleModelSelect = (modelId: SupportedGeminiModel) => {
    updateSettings({ selectedModel: modelId });
    toast.success(`Active model set to ${modelId}`);
    if (settings.geminiApiKey) {
      testKey(settings.geminiApiKey, modelId);
    }
  };

  const isConnected = settings.validationStatus === 'valid';
  const isInvalid = settings.validationStatus === 'invalid' || settings.validationStatus === 'error';
  const isRateLimited = settings.validationStatus === 'rate_limited';

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header with Master Toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "p-2 rounded-xl border transition-colors",
            settings.isAiEnabled 
              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30" 
              : "bg-muted text-muted-foreground border-border"
          )}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                Clinical AI & Voice Assistant
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Free BYOK
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hands-free voice logging, 1-tap mistake extraction & smart exam pacing
            </p>
          </div>
        </div>

        <Switch 
          checked={settings.isAiEnabled} 
          onCheckedChange={handleToggleEnable}
        />
      </div>

      {/* Main Settings Body */}
      {settings.isAiEnabled && (
        <div className="space-y-4 pt-1">
          {/* Dropdown / Accordion Trigger Bar */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/60 transition-colors text-xs font-semibold text-foreground cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-purple-500" />
              <span>API Key & Model Configuration</span>
              {!settings.geminiApiKey && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Key required
                </span>
              )}
            </div>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
          </button>

          {isExpanded && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-200">
              {/* Status Indicator Banner */}
              <div className={cn(
                "p-3 rounded-xl border flex items-start gap-3 transition-all",
                isConnected 
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : isInvalid 
                  ? "bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-300"
                  : isRateLimited 
                  ? "bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300"
                  : "bg-muted/40 border-border text-muted-foreground"
              )}>
                {isConnected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : isInvalid ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                ) : isRateLimited ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                )}

                <div className="flex-1 text-xs">
                  <p className="font-semibold">
                    {isConnected
                      ? `Active • Connected to ${settings.selectedModel}`
                      : isInvalid
                      ? 'Connection Issue • Key Verification Failed'
                      : isRateLimited
                      ? 'Quota Limit Reached'
                      : !settings.geminiApiKey
                      ? 'Configuration Required'
                      : 'Ready to Verify'}
                  </p>
                  <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                    {settings.validationMessage || (
                      !settings.geminiApiKey
                        ? 'Paste your free Google AI Studio key below to activate voice logging and 1-tap extraction.'
                        : 'Tap "Test Connection" to verify your key against Google AI Studio.'
                    )}
                  </p>
                </div>

                {settings.geminiApiKey && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={isValidating}
                    className="h-7 px-2.5 text-[11px] font-medium shrink-0 bg-background/50 hover:bg-background"
                  >
                    {isValidating ? (
                      <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    Test Key
                  </Button>
                )}
              </div>

              {/* API Key Vault Input Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-muted-foreground" />
                    Google Gemini API Key
                  </label>

                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 group"
                  >
                    Get Free Key (Google AI Studio)
                    <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={localKey}
                      onChange={handleKeyChange}
                      placeholder="AIzaSy..."
                      className="pr-10 font-mono text-xs h-9 bg-muted/20 border-border/70 focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                      title={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {hasUnsavedKey && (
                    <Button
                      size="sm"
                      onClick={handleSaveKey}
                      className="h-9 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Save Key
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Free tier includes up to 1,500 daily requests. Zero credit card or payment required.
                </p>
              </div>

              {/* Model Selection Block */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                  Active Gemini Model
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {AVAILABLE_GEMINI_MODELS.map((model) => {
                    const isSelected = settings.selectedModel === model.id;
                    return (
                      <div
                        key={model.id}
                        onClick={() => handleModelSelect(model.id)}
                        className={cn(
                          "p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-2 relative group",
                          isSelected
                            ? "bg-purple-500/10 border-purple-500/40 text-foreground ring-1 ring-purple-500/30"
                            : "bg-muted/20 border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-foreground">{model.name}</span>
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                              isSelected
                                ? "bg-purple-500 text-white"
                                : "bg-muted border border-border text-muted-foreground"
                            )}>
                              {model.badge}
                            </span>
                          </div>
                          <p className="text-[10px] leading-tight line-clamp-2">{model.description}</p>
                        </div>

                        <div className="text-[10px] font-medium opacity-75 pt-1 border-t border-border/30 flex items-center justify-between">
                          <span>{model.rpd} req/day</span>
                          <span>{model.rpm} req/min</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Privacy & Zero-Cost Security Callout */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">
                    Privacy & Zero-Cost Guarantee
                  </p>
                  <p>
                    Your API key and study data remain <strong className="text-foreground font-medium">100% on your device</strong> in encrypted local storage and are never sent to Atlas servers. API requests stream directly from your browser to Google AI Studio's Free Tier.
                  </p>
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40 flex items-start gap-2">
                  <Mic className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Voice-to-Action</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Speak to log hours, 20th Notebook rules, or GT test scores.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40 flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Doctor-in-the-Loop</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Every AI draft requires your 1-tap review & edit before saving.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40 flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">₹0 Platform Cost</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Operates exclusively on Google AI Studio's free tier quotas.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
