import sys

path = 'artifacts/study-tracker/src/features/settings/AIAssistantSection.tsx'
with open(path, 'r') as f:
    content = f.read()

# Add import for fetchAvailableModels and DynamicModelInfo
content = content.replace("import { useAISettings } from '@/lib/ai/aiSettingsStorage';", "import { useAISettings, fetchAvailableModels, DynamicModelInfo } from '@/lib/ai/aiSettingsStorage';")

# Add state variables
target = """  const [hasUnsavedKey, setHasUnsavedKey] = useState(false);"""
replacement = """  const [hasUnsavedKey, setHasUnsavedKey] = useState(false);
  const [availableModels, setAvailableModels] = useState<DynamicModelInfo[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  useEffect(() => {
    if (settings.geminiApiKey && settings.validationStatus === 'valid') {
      setIsFetchingModels(true);
      fetchAvailableModels(settings.geminiApiKey).then(models => {
        setAvailableModels(models);
        setIsFetchingModels(false);
      });
    }
  }, [settings.geminiApiKey, settings.validationStatus]);
"""
content = content.replace(target, replacement)

# Add the UI snippet below API key config
target2 = """          {/* Mentorship & Clinical Depth Configuration */}"""
replacement2 = """          {/* Model Selection Configuration */}
          {isConnected && (
            <div className="bg-muted/20 border border-border/60 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                    Cognitive Engine
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Select a model manually</p>
                </div>
                <Select 
                  value={settings.preferredModel || ''} 
                  onValueChange={(val: string) => updateSettings({ preferredModel: val })}
                  disabled={isFetchingModels || availableModels.length === 0}
                >
                  <SelectTrigger className="w-[180px] h-9 text-[11px] border-border/60 bg-background/80 flex justify-between">
                    <SelectValue placeholder={isFetchingModels ? "Fetching directory..." : "Select a model..."} />
                  </SelectTrigger>
                  <SelectContent className="text-[11px] max-h-[250px]">
                    {availableModels.map(m => (
                      <SelectItem key={m.name} value={m.name}>
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="truncate">{m.name}</span>
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 flex items-center",
                            m.category === 'Fast' ? 'bg-amber-500/10 text-amber-500' :
                            m.category === 'Reasoning' ? 'bg-purple-500/10 text-purple-400' :
                            'bg-emerald-500/10 text-emerald-400'
                          )}>
                            {m.category === 'Fast' ? '⚡ Fast' : m.category === 'Reasoning' ? '🧠 Heavy' : '⚖️ Balanced'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          {/* Mentorship & Clinical Depth Configuration */}"""
content = content.replace(target2, replacement2)

with open(path, 'w') as f:
    f.write(content)

print("done patching AIAssistantSection")
