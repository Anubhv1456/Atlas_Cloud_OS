import React, { useState } from 'react';
import { Bug, Lightbulb, Send, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { sendContactMessage } from '@/lib/admin';
import { useAuth } from '@/hooks/useAuth';

export function FeedbackSection() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState<'Bug Report' | 'Feature Request'>('Bug Report');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openFeedbackModal = (type: 'Bug Report' | 'Feature Request') => {
    setCategory(type);
    setSubject('');
    setMessage('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter a message.');
      return;
    }

    setSubmitting(true);
    try {
      await sendContactMessage({
        name: user?.displayName || 'Beta Member',
        email: user?.email || '',
        category,
        subject: subject.trim() || category,
        message: message.trim(),
        userId: user?.uid,
      });
      toast.success(`${category} submitted directly to the Atlas team!`);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MessageSquareText className="w-3.5 h-3.5 text-teal-400" />
          Feedback & Support
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Report a Bug */}
        <div 
          onClick={() => openFeedbackModal('Bug Report')}
          className="bg-card rounded-2xl border border-border/60 hover:border-rose-500/30 p-4 cursor-pointer transition-all hover:bg-rose-500/5 group space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Bug className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground group-hover:text-rose-300 transition-colors">
                Report a Bug
              </div>
              <p className="text-[11px] text-muted-foreground">
                Found something broken? Send report directly to Founder.
              </p>
            </div>
          </div>
        </div>

        {/* Request a Feature */}
        <div 
          onClick={() => openFeedbackModal('Feature Request')}
          className="bg-card rounded-2xl border border-border/60 hover:border-amber-500/30 p-4 cursor-pointer transition-all hover:bg-amber-500/5 group space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground group-hover:text-amber-300 transition-colors">
                Request a Feature
              </div>
              <p className="text-[11px] text-muted-foreground">
                Have an idea? Influence upcoming Beta releases.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Feedback Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-zinc-800 text-zinc-100 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {category === 'Bug Report' ? (
                <>
                  <Bug className="w-4.5 h-4.5 text-rose-400" />
                  Report a Bug
                </>
              ) : (
                <>
                  <Lightbulb className="w-4.5 h-4.5 text-amber-400" />
                  Request a Feature
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Transmits directly to the Atlas team's Founder Console.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs font-semibold text-zinc-300">Title / Subject</Label>
              <Input
                id="subject"
                placeholder={category === 'Bug Report' ? 'e.g. Question bank progress not updating' : 'e.g. Custom tag filters'}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs rounded-xl text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-xs font-semibold text-zinc-300">Details *</Label>
              <Textarea
                id="message"
                required
                rows={4}
                placeholder={category === 'Bug Report' ? 'Describe what happened and steps to reproduce...' : 'Describe how this feature would help your study workflow...'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs rounded-xl text-zinc-100 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setModalOpen(false)}
                className="text-xs rounded-xl text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className={`text-xs font-semibold rounded-xl gap-2 ${
                  category === 'Bug Report' 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Submit {category}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
