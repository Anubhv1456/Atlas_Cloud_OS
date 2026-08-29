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
  SlidersHorizontal,
  ChevronRight,
  Check
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';
import { SettingsRow } from './SettingsLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function AIAssistantSection() {
  const { settings, updateSettings, testKey, isValidating } = useAISettings();
  const [showKey, setShowKey] = useState(false);
  const [localKey, setLocalKey] = useState<string>(settings.geminiApiKey || '');
  const [hasUnsavedKey, setHasUnsavedKey] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);

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

  const handleToggleEnable = (enabled: boolean) => {
    if (enabled && !settings.geminiApiKey && !localKey.trim()) {
      toast.info('Enter a free Google AI Studio key to activate AI features');
    }
    updateSettings({ isAiEnabled: enabled });
  };

  const isConnected = settings.validationStatus === 'valid';

  const getModelLabel = () => {
    switch (settings.preferredModel) {
      case 'gemini-3.1-flash-lite': return 'Flash Lite (Fast)';
      case 'gemini-3.1-pro-preview': return 'Pro (Reasoning)';
      case 'gemini-3.7-flash':
      default: return 'Flash 3.7 (Balanced)';
    }
  };

  return (
    <>
      <SettingsRow
        icon={Sparkles}
        iconBg={settings.isAiEnabled ? "bg-purple-500/10" : "bg-muted"}
        iconColor={settings.isAiEnabled ? "text-purple-500" : "text-muted-foreground"}
        label="Clinical AI & Voice"
        sublabel="Voice triage, mistake drills & case analysis"
        control={
          <Switch 
            checked={settings.isAiEnabled} 
            onCheckedChange={handleToggleEnable}
          />
        }
      />

      {settings.isAiEnabled && (
        <>
          <SettingsRow
            icon={Key}
            iconBg={isConnected ? "bg-emerald-500/10" : "bg-amber-500/10"}
            iconColor={isConnected ? "text-emerald-500" : "text-amber-500"}
            label="Google AI Studio Key"
            sublabel={isConnected ? 'Connected & Verified' : 'Free BYOK required'}
            value={isConnected ? 'Active' : 'Configure'}
            chevron
            onClick={() => setConfigModalOpen(true)}
          />

          <SettingsRow
            icon={SlidersHorizontal}
            iconBg="bg-primary/10"
            iconColor="text-primary"
            label="Model & Mentorship"
            sublabel={`${getModelLabel()} • ${settings.mentorshipStyle === 'direct' ? 'Direct' : 'Socratic'}`}
            chevron
            onClick={() => setConfigModalOpen(true)}
          />
        </>
      )}

      {/* AI Assistant Configuration Dialog Sheet */}
      <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border/80 text-foreground rounded-3xl p-6 shadow-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-purple-500" />
              Clinical AI Settings
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure your private Google AI Studio key and response preferences.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Key Field */}
            <div className="bg-card border border-border/70 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-muted-foreground" />
                  Gemini API Key
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  <span>Get Free Key</span>
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
                    className="pr-16 font-mono text-xs h-9 bg-muted/20 border-border/70 rounded-xl"
                  />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors cursor-pointer"
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {!localKey && (
                      <button
                        type="button"
                        onClick={handlePasteKey}
                        className="text-[11px] font-semibold text-primary hover:bg-primary/10 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
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
                    className="h-9 px-3 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Save
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={isValidating || !localKey}
                    className="h-9 px-3 text-xs font-semibold shrink-0 rounded-xl cursor-pointer"
                  >
                    {isValidating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1 text-primary" />
                    ) : isConnected ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                    )}
                    {isConnected ? 'Verified' : 'Verify'}
                  </Button>
                )}
              </div>
            </div>

            {/* Model Architecture */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground px-1">Cognitive Engine Model</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'gemini-3.1-flash-lite', title: 'Flash Lite', tag: 'Fast' },
                  { id: 'gemini-3.7-flash', title: 'Flash 3.7', tag: 'Standard' },
                  { id: 'gemini-3.1-pro-preview', title: 'Pro', tag: 'Reasoning' }
                ].map((m) => {
                  const active = (settings.preferredModel || 'gemini-3.7-flash') === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => updateSettings({ preferredModel: m.id as any })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border/60 bg-card hover:bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-primary block">{m.tag}</span>
                      <span className="text-xs font-bold text-foreground block mt-0.5">{m.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mentorship Style & Depth */}
            <div className="bg-card border border-border/70 rounded-2xl divide-y divide-border/30 overflow-hidden">
              <div className="flex items-center justify-between p-3.5">
                <div>
                  <p className="text-[13px] font-medium text-foreground">Mentorship Style</p>
                  <p className="text-[11px] text-muted-foreground">Guidance technique</p>
                </div>
                <Select 
                  value={settings.mentorshipStyle || 'socratic'} 
                  onValueChange={(val: any) => updateSettings({ mentorshipStyle: val })}
                >
                  <SelectTrigger className="w-[130px] h-8 text-xs rounded-xl border-border/60">
                    <SelectValue placeholder="Style" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="socratic">Socratic</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <div>
                  <p className="text-[13px] font-medium text-foreground">Clinical Depth</p>
                  <p className="text-[11px] text-muted-foreground">Explanation verbosity</p>
                </div>
                <Select 
                  value={settings.clinicalDepth || 'high-yield'} 
                  onValueChange={(val: any) => updateSettings({ clinicalDepth: val })}
                >
                  <SelectTrigger className="w-[130px] h-8 text-xs rounded-xl border-border/60">
                    <SelectValue placeholder="Depth" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="high-yield">High-Yield</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground px-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Keys remain locally on device and connect directly to Google servers.</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
