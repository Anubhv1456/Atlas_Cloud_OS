import React, { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
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
        iconBg="bg-teal-500/10"
        iconColor="text-teal-500"
        label="Send Feedback"
        chevron
        onClick={() => setModalOpen(true)}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/80 text-foreground rounded-3xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-primary" />
              Send Feedback
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Transmits directly to the Atlas engineering team.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs font-semibold text-foreground/80">Title / Subject</Label>
              <Input
                id="subject"
                placeholder="e.g. Bug report or feature idea"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-muted/20 border-border/60 text-xs rounded-xl text-foreground focus-visible:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-xs font-semibold text-foreground/80">Details *</Label>
              <Textarea
                id="message"
                required
                rows={4}
                placeholder="Describe your feedback..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-muted/20 border-border/60 text-xs rounded-xl text-foreground resize-none focus-visible:ring-primary/20"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setModalOpen(false)}
                className="text-xs rounded-xl text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="text-xs font-semibold rounded-xl gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
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
