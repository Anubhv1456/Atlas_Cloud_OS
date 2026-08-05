import React, { useEffect, useState } from 'react';
import { 
  getContactMessages, 
  updateContactMessageStatus, 
  deleteContactMessage, 
  ContactMessage 
} from '@/lib/admin';
import { 
  Inbox, 
  Mail, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  Sparkles, 
  Bug, 
  Lightbulb, 
  MessageSquare, 
  ExternalLink,
  Tag,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const categoryIcons: Record<string, any> = {
  'Beta Feedback': Sparkles,
  'Bug Report': Bug,
  'Feature Request': Lightbulb,
  'General': MessageSquare,
};

export function SupportMessagesView() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await getContactMessages();
      setMessages(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load support messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleStatusChange = async (id: string, newStatus: ContactMessage['status']) => {
    try {
      await updateContactMessageStatus(id, newStatus);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
      if (selectedMessage?.id === id) {
        setSelectedMessage(prev => prev ? { ...prev, status: newStatus } : null);
      }
      toast.success(`Message marked as ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update message status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message permanently?')) return;
    try {
      await deleteContactMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
      toast.success('Message deleted.');
    } catch (err) {
      toast.error('Failed to delete message.');
    }
  };

  const filteredMessages = messages.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Support Inbox</h1>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs rounded-full px-2.5 py-0.5">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Direct feedback, bug reports, and inquiries sent by beta users via the Contact page.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchMessages} 
          disabled={loading}
          className="gap-2 rounded-xl text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Inbox
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-muted-foreground font-medium">Total Messages</div>
          <div className="text-2xl font-bold mt-1">{messages.length}</div>
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-muted-foreground font-medium text-amber-500">Unread Messages</div>
          <div className="text-2xl font-bold mt-1 text-amber-500">{unreadCount}</div>
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-muted-foreground font-medium text-red-400">Bug Reports</div>
          <div className="text-2xl font-bold mt-1 text-red-400">
            {messages.filter(m => m.category === 'Bug Report').length}
          </div>
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-muted-foreground font-medium text-purple-400">Feedback & Ideas</div>
          <div className="text-2xl font-bold mt-1 text-purple-400">
            {messages.filter(m => ['Beta Feedback', 'Feature Request'].includes(m.category)).length}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, subject or keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl text-xs"
          />
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'unread', 'read', 'archived'] as const).map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="rounded-xl text-xs capitalize shrink-0 h-9"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Fetching support messages...</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="border border-dashed border-border/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto text-muted-foreground">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm">No Messages Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {messages.length === 0
              ? "No contact messages have been submitted yet. Every submission from the Contact page will appear here."
              : "No messages match your current search query or status filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map(msg => {
            const CategoryIcon = categoryIcons[msg.category] || MessageSquare;
            const isUnread = msg.status === 'unread';

            return (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedMessage(msg);
                  if (isUnread) handleStatusChange(msg.id, 'read');
                }}
                className={`bg-card border rounded-2xl p-4 transition-all cursor-pointer hover:border-primary/50 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isUnread ? 'border-primary/40 bg-primary/5' : 'border-border/80'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    msg.category === 'Bug Report' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    msg.category === 'Feature Request' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    <CategoryIcon className="w-4.5 h-4.5" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-foreground truncate">{msg.name}</span>
                      <span className="text-xs text-muted-foreground font-mono truncate">&lt;{msg.email}&gt;</span>
                      <Badge variant="outline" className="text-[10px] px-2 py-0 rounded-md font-medium">
                        {msg.category}
                      </Badge>
                      {isUnread && (
                        <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 rounded-md font-bold">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <div className="font-medium text-xs text-foreground truncate">
                      {msg.subject || '(No Subject)'}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {msg.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span className="text-[11px] text-muted-foreground font-mono mr-2">
                    {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleDateString() : 'Just now'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(msg.id, isUnread ? 'read' : 'unread');
                    }}
                    className="h-8 text-xs rounded-lg px-2 text-muted-foreground hover:text-foreground"
                  >
                    {isUnread ? 'Mark Read' : 'Mark Unread'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(msg.id);
                    }}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Message View Modal */}
      <Dialog open={!!selectedMessage} onOpenChange={open => !open && setSelectedMessage(null)}>
        {selectedMessage && (
          <DialogContent className="max-w-2xl rounded-2xl p-6">
            <DialogHeader className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 rounded-lg">
                  {selectedMessage.category}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(selectedMessage.id, selectedMessage.status === 'archived' ? 'read' : 'archived')}
                    className="h-8 text-xs rounded-xl"
                  >
                    {selectedMessage.status === 'archived' ? 'Unarchive' : 'Archive'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="h-8 text-xs rounded-xl"
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <DialogTitle className="text-lg font-bold">
                {selectedMessage.subject || 'No Subject'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                <User className="w-3.5 h-3.5 text-primary" />
                <strong className="text-foreground">{selectedMessage.name}</strong> ({selectedMessage.email})
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/30 border border-border/60 rounded-xl p-4 my-4 text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {selectedMessage.message}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground font-mono">
                Received: {selectedMessage.createdAt?.toDate ? selectedMessage.createdAt.toDate().toLocaleString() : 'N/A'}
              </span>
              <a
                href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent('Re: ' + (selectedMessage.subject || 'Atlas Support Inquiry'))}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button className="rounded-xl text-xs gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  Reply via Email
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                </Button>
              </a>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
