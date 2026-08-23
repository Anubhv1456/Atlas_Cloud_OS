import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Key, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  CheckCircle2, 
  RefreshCw, 
  ClipboardPaste,
  Check
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function AIAssistantSection() {
  const { settings, updateSettings, testKey, isValidating } = useAISettings();
  const [showKey, setShowKey] = useState(false);
  const [localKey, setLocalKey] = useState<string>(settings.geminiApiKey || '');
  const [hasUnsavedKey, setHasUnsavedKey] = useState(false);

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

  const handleSaveKey = (keyOverride?: string) => {
    const keyToSave = (keyOverride !== undefined ? keyOverride : localKey || '').trim();
    updateSettings({ 
      geminiApiKey: keyToSave,
      validationStatus: keyToSave ? 'unconfigured' : 'unconfigured',
      validationMessage: keyToSave ? 'Key saved. Tap test to verify.' : ''
    });
    setLocalKey(keyToSave);
    setHasUnsavedKey(false);
    toast.success('API key saved locally');
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 10) {
        handleSaveKey(text.trim());
      } else {
        toast.error('No valid API key found in clipboard');
      }
    } catch {
      toast.info('Please paste your key manually into the text field');
    }
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
      const result = await testKey(keyToTest);
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
      toast.info('Enter a free Google AI Studio key to activate AI features');
    }
    updateSettings({ isAiEnabled: enabled });
    if (enabled) {
      toast.success('Intelligence & Voice enabled');
    } else {
      toast.info('Intelligence & Voice disabled');
    }
  };

  const isConnected = settings.validationStatus === 'valid';

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Group Header with Master Switch */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-xl border flex items-center justify-center transition-colors shrink-0",
            settings.isAiEnabled 
              ? "bg-purple-500/10 text-purple-400 border-purple-500/30" 
              : "bg-muted text-muted-foreground border-border"
          )}>
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight">
              Intelligence & Voice
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Voice commands, mistake triage, and revision drills
            </p>
          </div>
        </div>

        <Switch 
          checked={settings.isAiEnabled} 
          onCheckedChange={handleToggleEnable}
        />
      </div>

      {/* Main Apple-Style Configuration List */}
      {settings.isAiEnabled && (
        <div className="space-y-4 pt-0.5 animate-in fade-in duration-200">
          
          {/* Inset Group: API Key Configuration */}
          <div className="bg-muted/20 border border-border/60 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-muted-foreground" />
                API Key
              </label>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1"
              >
                <span>Get a free key from Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={localKey}
                  onChange={handleKeyChange}
                  placeholder="AIzaSy••••••••••••••••••••••••••••"
                  className="pr-16 font-mono text-xs h-9 bg-background/80 border-border/70 focus:border-purple-500 rounded-lg"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors cursor-pointer"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  {!localKey && (
                    <button
                      type="button"
                      onClick={handlePasteKey}
                      className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                      title="Paste key from clipboard"
                    >
                      <ClipboardPaste className="w-3 h-3" />
                      <span>Paste</span>
                    </button>
                  )}
                </div>
              </div>

              {hasUnsavedKey ? (
                <Button
                  size="sm"
                  onClick={() => handleSaveKey()}
                  className="h-9 px-3 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shrink-0 rounded-lg cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Save
                </Button>
              ) : settings.geminiApiKey ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isValidating}
                  className="h-9 px-3 text-xs font-semibold shrink-0 bg-background/80 hover:bg-background border-border/70 rounded-lg cursor-pointer"
                >
                  {isValidating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1 text-purple-400" />
                  ) : isConnected ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                  )}
                  {isConnected ? 'Verified' : 'Test'}
                </Button>
              ) : null}
            </div>
          </div>

          {/* Quiet Apple-Style Security Footnote */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground px-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Keys are stored privately on this device and connect directly to Google AI Studio.</span>
          </div>

        </div>
      )}
    </div>
  );
}
