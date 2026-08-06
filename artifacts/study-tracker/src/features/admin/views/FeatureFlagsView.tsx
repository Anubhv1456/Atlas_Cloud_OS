import React, { useEffect, useState } from 'react';
import { getFeatureFlags, setFeatureFlags, FeatureFlags } from '@/lib/admin';
import { ToggleLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export function FeatureFlagsView() {
  const [flags, setFlags] = useState<FeatureFlags>({
    communityMarkers: true,
    markerSubmission: true,
    markerVisibility: true,
    payments: false,
    aiInsights: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getFeatureFlags().then(f => {
      setFlags(f);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setFeatureFlags(flags);
      toast.success('Feature flags updated successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update feature flags');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const toggleFlag = (key: keyof FeatureFlags) => {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
          <p className="text-muted-foreground text-lg">Toggle platform capabilities in real-time.</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium disabled:opacity-50 transition-opacity"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-2 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => toggleFlag('communityMarkers')}
            className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
          >
            <div>
              <div className="font-medium">Community Markers</div>
              <div className="text-sm text-muted-foreground">Enable the core community markers feature globally.</div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${flags.communityMarkers ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${flags.communityMarkers ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>
          
          <div 
            onClick={() => toggleFlag('markerSubmission')}
            className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
          >
            <div>
              <div className="font-medium">Marker Submission</div>
              <div className="text-sm text-muted-foreground">Allow users to submit new markers.</div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${flags.markerSubmission ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${flags.markerSubmission ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>
          
          <div 
            onClick={() => toggleFlag('markerVisibility')}
            className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
          >
            <div>
              <div className="font-medium">Marker Visibility</div>
              <div className="text-sm text-muted-foreground">Show markers to students (turn off to collect silently).</div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${flags.markerVisibility ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${flags.markerVisibility ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          <div 
            onClick={() => toggleFlag('payments')}
            className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
          >
            <div>
              <div className="font-medium">Payments Gateway</div>
              <div className="text-sm text-muted-foreground">Enable subscription payments (Closed Beta).</div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${flags.payments ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${flags.payments ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          <div 
            onClick={() => toggleFlag('aiInsights')}
            className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
          >
            <div>
              <div className="font-medium">AI Intelligence Engine</div>
              <div className="text-sm text-muted-foreground">Enable AI-powered personalized insights and recommendations.</div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${flags.aiInsights ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${flags.aiInsights ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
