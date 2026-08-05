import React, { useEffect, useState } from 'react';
import { getAnnouncements, createAnnouncement, setAnnouncementActive, Announcement } from '@/lib/admin';
import { Megaphone, Plus, Trash2, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<'info' | 'warning' | 'error' | 'success'>('info');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;
    
    setSubmitting(true);
    try {
      await createAnnouncement({
        title: newTitle,
        message: newMessage,
        type: newType,
        active: true
      });
      toast.success('Announcement published');
      setShowForm(false);
      setNewTitle('');
      setNewMessage('');
      setNewType('info');
      fetchAnnouncements();
    } catch (error) {
      console.error(error);
      toast.error('Failed to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      await setAnnouncementActive(id, !currentActive);
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, active: !currentActive } : a));
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground text-lg">Push messages directly to all users.</p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-lg">Draft New Announcement</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Type</label>
              <div className="flex gap-2">
                {(['info', 'success', 'warning', 'error'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewType(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border capitalize ${
                      newType === t 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border/50 bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g., Scheduled Maintenance"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Message</label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-y"
                placeholder="Details of the announcement..."
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50"
              >
                {submitting ? 'Publishing...' : 'Publish Now'}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(announcement => (
            <div 
              key={announcement.id} 
              className={`p-6 rounded-2xl border ${
                announcement.active ? 'border-primary/50 bg-card' : 'border-border/50 bg-card/50 opacity-75'
              } flex flex-col md:flex-row gap-4 items-start md:items-center justify-between`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full mt-1 shrink-0 ${
                  announcement.type === 'info' ? 'bg-blue-500/10 text-blue-500' :
                  announcement.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                  announcement.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-red-500/10 text-red-500'
                }`}>
                  {announcement.type === 'info' && <Info className="w-6 h-6" />}
                  {announcement.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                  {announcement.type === 'warning' && <AlertTriangle className="w-6 h-6" />}
                  {announcement.type === 'error' && <AlertCircle className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{announcement.title}</h3>
                    {announcement.active && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{announcement.message}</p>
                  <div className="text-xs text-muted-foreground mt-3 font-medium">
                    Published {announcement.createdAt?.toDate ? formatDistanceToNow(announcement.createdAt.toDate(), { addSuffix: true }) : 'Unknown'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button
                  onClick={() => toggleActive(announcement.id, announcement.active)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    announcement.active 
                      ? 'bg-muted text-muted-foreground hover:bg-muted/80' 
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  {announcement.active ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="text-center p-12 border border-border/50 rounded-2xl bg-card">
              <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No announcements yet</h3>
              <p className="text-muted-foreground">Create one to broadcast to all users.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
