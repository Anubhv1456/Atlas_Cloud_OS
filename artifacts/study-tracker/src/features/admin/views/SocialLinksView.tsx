import React, { useEffect, useState } from 'react';
import { getSocialLinks, setSocialLinks, SocialLinks } from '@/lib/admin';
import { 
  Share2, 
  Save, 
  RefreshCw, 
  Twitter, 
  Github, 
  Linkedin, 
  Send, 
  Youtube, 
  Instagram, 
  MessageSquare, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { RedditIcon } from '@/components/RedditIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export function SocialLinksView() {
  const [links, setLinks] = useState<SocialLinks>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const data = await getSocialLinks();
      setLinks(data);
    } catch (err) {
      toast.error('Failed to load social links.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setSocialLinks(links);
      toast.success('Social media handles and links updated successfully!');
    } catch (err) {
      toast.error('Failed to save social links.');
    } finally {
      setSaving(false);
    }
  };

  const platforms = [
    { key: 'twitter' as const, label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/your_handle' },
    { key: 'reddit' as const, label: 'Subreddit / Reddit Community', icon: RedditIcon, placeholder: 'https://reddit.com/r/your_subreddit' },
    { key: 'discord' as const, label: 'Discord Community', icon: MessageSquare, placeholder: 'https://discord.gg/your_invite' },
    { key: 'github' as const, label: 'GitHub Repository', icon: Github, placeholder: 'https://github.com/your_org' },
    { key: 'linkedin' as const, label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/your_profile' },
    { key: 'telegram' as const, label: 'Telegram Channel', icon: Send, placeholder: 'https://t.me/your_channel' },
    { key: 'youtube' as const, label: 'YouTube Channel', icon: Youtube, placeholder: 'https://youtube.com/@your_channel' },
    { key: 'instagram' as const, label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/your_handle' },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Social Media Handles</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Customize the social media channels displayed on the Contact page and platform footers.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchLinks} 
          disabled={loading}
          className="gap-2 rounded-xl text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reset Form
        </Button>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Loading social media configuration...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {platforms.map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key} className="space-y-2 border border-border/60 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-xs font-semibold flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    {label}
                  </Label>
                  <Switch
                    checked={links[key]?.enabled ?? false}
                    onCheckedChange={(checked) => setLinks({ 
                      ...links, 
                      [key]: { ...links[key], enabled: checked, url: links[key]?.url || '' } 
                    })}
                  />
                </div>
                <div className="relative pt-1">
                  <Input
                    id={key}
                    value={links[key]?.url || ''}
                    onChange={e => setLinks({ 
                      ...links, 
                      [key]: { ...links[key], url: e.target.value, enabled: links[key]?.enabled ?? false } 
                    })}
                    placeholder={placeholder}
                    className="rounded-xl text-xs pr-8"
                    disabled={!(links[key]?.enabled ?? false)}
                  />
                  {links[key]?.url && (
                    <a
                      href={links[key]?.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`absolute right-2.5 top-[calc(50%+2px)] -translate-y-1/2 transition-colors ${links[key]?.enabled ? 'text-muted-foreground hover:text-primary' : 'text-muted-foreground/40 pointer-events-none'}`}
                      title="Test URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Changes apply instantly to the Contact page upon saving.</span>
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl text-xs font-semibold gap-2 py-5 px-6"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Handles
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
