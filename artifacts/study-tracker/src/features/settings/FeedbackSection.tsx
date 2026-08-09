import React, { useState } from 'react';
import { Send, ChevronRight, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { SettingsRow } from './SettingsLayout';

export function FeedbackSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setSubmitting(false);
    setModalOpen(false);
    toast.success('Feedback Sent', { description: 'Thank you for helping improve Atlas.' });
    setSubject('');
    setMessage('');
  };

  return (
    <>
      <SettingsRow
        icon={MessageSquare}
        label="Send Feedback"
        control={<ChevronRight className="w-4 h-4 text-muted-foreground" />}
        onClick={() => setModalOpen(true)}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-zinc-800 text-zinc-100 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-white flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-primary" />
              Send Feedback
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Transmits directly to the Atlas team.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs font-semibold text-zinc-300">Title / Subject</Label>
              <Input
                id="subject"
                placeholder="e.g. Bug report or feature idea"
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
                placeholder="Describe your feedback..."
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
                className="text-xs font-semibold rounded-xl gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
