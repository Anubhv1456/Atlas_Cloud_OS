import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Marker, MarkerType, getMarkersForSystem, getMarkersForTopic, interactWithMarker } from '@/lib/markers';
import { Compass, Sparkles, TriangleAlert, Lightbulb, Video, Stethoscope, Bookmark, Check, BookmarkPlus, Flag, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface ViewMarkersModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemId: number | string;
  systemName: string;
  topicId?: string;
  topicName?: string;
  onLeaveMarker?: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  clinical_pearl: <Stethoscope className="w-4 h-4 text-emerald-500" />,
  mnemonic: <Lightbulb className="w-4 h-4 text-amber-500" />,
  pitfall: <TriangleAlert className="w-4 h-4 text-rose-500" />,
  resource: <Video className="w-4 h-4 text-blue-500" />,
  high_yield: <Sparkles className="w-4 h-4 text-emerald-500" />,
  memory_trick: <Lightbulb className="w-4 h-4 text-amber-500" />,
};

const typeLabels: Record<string, string> = {
  clinical_pearl: 'Clinical Pearl',
  mnemonic: 'Mnemonic & Trick',
  pitfall: 'Exam Pitfall',
  resource: 'High-Yield Resource',
  high_yield: 'Clinical Pearl',
  memory_trick: 'Mnemonic & Trick',
};

export function ViewMarkersModal({ isOpen, onClose, systemId, systemName, topicId, topicName, onLeaveMarker }: ViewMarkersModalProps) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MarkerType | 'all'>('all');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      (topicId ? getMarkersForTopic(topicId) : getMarkersForSystem(systemId))
        .then(setMarkers)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, systemId, topicId]);

  const handleInteraction = async (markerId: string, action: 'helpful' | 'save' | 'report') => {
    if (!user) {
      toast.error('Sign in required to verify trail markers.');
      return;
    }
    try {
      const updates = await interactWithMarker(markerId, user.uid, action);
      if (updates) {
        setMarkers(prev => prev.map(m => {
          if (m.id === markerId) {
            return {
              ...m,
              ...updates
            };
          }
          return m;
        }).filter(m => m.status !== 'low_quality' && m.status !== 'archived'));
        
        if (action === 'report') {
          toast.success('Marker flagged for review', { description: 'Our medical moderation queue will verify this marker.' });
        } else if (action === 'helpful') {
          toast.success('Verified Pearl', { description: 'Your peer verification strengthens this trail for future candidates.' });
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Could not complete verification at this time.');
    }
  };

  const markersByType = markers.reduce((acc, marker) => {
    const key = marker.type || 'clinical_pearl';
    if (!acc[key]) acc[key] = [];
    acc[key].push(marker);
    return acc;
  }, {} as Record<string, Marker[]>);

  const availableTypes = (Object.keys(markersByType) as string[]).sort((a, b) => markersByType[b].length - markersByType[a].length);
  const displayedMarkers = activeTab === 'all' ? markers : markers.filter(m => m.type === activeTab);

  const activeTitle = topicName || systemName;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] rounded-2xl mx-4 w-[calc(100%-2rem)] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card/95 backdrop-blur-xl border border-border/60">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary shrink-0" />
            <span className="text-foreground truncate">Trail Markers for {activeTitle}</span>
          </DialogTitle>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <div className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5" />
              <span>{markers.length} peer-verified marker{markers.length === 1 ? '' : 's'} on this trail</span>
            </div>
            {onLeaveMarker && (
              <button 
                onClick={() => { onClose(); onLeaveMarker(); }}
                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs transition-colors hover:bg-primary/20 shrink-0 cursor-pointer"
              >
                + Leave Trail Marker
              </button>
            )}
          </div>
        </DialogHeader>

        <div 
          className="flex-1 overflow-y-auto overscroll-y-contain touch-pan-y scrollbar-thin"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-xs font-medium">Uncovering trail markers...</p>
            </div>
          ) : markers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 gap-3 text-muted-foreground px-6 text-center">
              <Compass className="w-10 h-10 text-muted-foreground/30 mb-1" />
              <p className="text-base font-semibold text-foreground">No Trail Markers Yet</p>
              <p className="text-xs text-muted-foreground max-w-sm">Be the first candidate to leave a high-yield clinical pearl, mnemonic, or exam trap for future students.</p>
              {onLeaveMarker && (
                <button 
                  onClick={() => { onClose(); onLeaveMarker(); }}
                  className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs transition-all hover:bg-primary/90 cursor-pointer shadow-sm"
                >
                  Leave Trail Marker
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Type Tabs */}
              <div className="px-6 py-3 border-b border-border/50 overflow-x-auto flex items-center gap-2 no-scrollbar shrink-0">
                <button
                  onClick={() => setActiveTab('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer",
                    activeTab === 'all' ? "bg-primary text-primary-foreground" : "bg-muted/70 text-muted-foreground hover:bg-muted"
                  )}
                >
                  All ({markers.length})
                </button>
                {availableTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer",
                      activeTab === type ? "bg-primary text-primary-foreground" : "bg-muted/70 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span>{typeIcons[type] || typeIcons['clinical_pearl']}</span>
                    <span>{typeLabels[type] || typeLabels['clinical_pearl']}</span>
                    <span className="opacity-70 ml-0.5">({markersByType[type].length})</span>
                  </button>
                ))}
              </div>

              {/* Markers List */}
              <div className="p-6 space-y-4">
                {displayedMarkers.map(marker => {
                  const isOwn = marker.userId === user?.uid;
                  const helpfulByList = Array.isArray(marker.helpfulBy) ? marker.helpfulBy : [];
                  const savedByList = Array.isArray(marker.savedBy) ? marker.savedBy : [];
                  
                  const isVerifiedByMe = user?.uid ? helpfulByList.includes(user.uid) : false;
                  const isSaved = user?.uid ? savedByList.includes(user.uid) : false;
                  const isHighYieldTrail = (marker.qualityScore || 50) >= 70 || helpfulByList.length >= 3 || marker.status === 'trusted';
                  
                  return (
                    <div key={marker.id} className={cn("p-4 rounded-xl border relative transition-all", isOwn ? "border-primary/30 bg-primary/5" : "border-border/60 bg-card")}>
                      <div className="flex items-start justify-between gap-4 mb-2.5">
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-1.5 flex-wrap">
                             {typeIcons[marker.type] || typeIcons['clinical_pearl']}
                             <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{typeLabels[marker.type] || 'Clinical Pearl'}</span>
                             {isHighYieldTrail && (
                               <span className="ml-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-emerald-500/20">
                                 <ShieldCheck className="w-3 h-3" />
                                 High-Yield Trail
                               </span>
                             )}
                           </div>
                           {isOwn ? (
                             <span className="text-[10px] font-bold text-primary tracking-wider uppercase mt-0.5">YOUR TRAIL MARKER</span>
                           ) : (
                             <span className="text-[10px] font-medium text-muted-foreground/70 mt-0.5">
                               Left by <span className="text-muted-foreground font-mono font-medium">{marker.authorAlias || 'Wayfinder'}</span>
                             </span>
                           )}
                        </div>
                        <div className="flex items-center gap-2">
                          {marker.createdAt && (
                            <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap">
                              {formatDistanceToNow(marker.createdAt.toDate ? marker.createdAt.toDate() : new Date(marker.createdAt), { addSuffix: true })}
                            </span>
                          )}
                          {!isOwn && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 -mr-2 text-muted-foreground/50 hover:text-foreground transition-colors rounded-full hover:bg-muted cursor-pointer">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                <DropdownMenuItem onClick={() => handleInteraction(marker.id, 'report')} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/20 cursor-pointer">
                                  <Flag className="w-4 h-4 mr-2" />
                                  Flag for Review
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                        {marker.content}
                      </div>

                      <div className="mt-3.5 flex items-center justify-between gap-3 pt-2 border-t border-border/40">
                        {marker.source ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted/50 text-[11px] text-muted-foreground font-medium border border-border/40 truncate max-w-[180px]">
                            <Bookmark className="w-3 h-3 shrink-0" />
                            <span className="truncate">{marker.source}</span>
                          </div>
                        ) : <div />}
                        
                        {!isOwn ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleInteraction(marker.id, 'save')}
                              className={cn(
                                "p-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer",
                                isSaved 
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30" 
                                  : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:border-border/50"
                              )}
                              title={isSaved ? "Saved" : "Save this marker"}
                            >
                              <BookmarkPlus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleInteraction(marker.id, 'helpful')}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer",
                                isVerifiedByMe 
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
                                  : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
                              )}
                            >
                              <Check className={cn("w-3.5 h-3.5", isVerifiedByMe && "text-emerald-500")} />
                              <span>{isVerifiedByMe ? 'Verified' : 'Verify Pearl'}</span>
                              {helpfulByList.length > 0 && (
                                <span className="font-mono text-[10px] opacity-80">({helpfulByList.length})</span>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {helpfulByList.length > 0 && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                <Check className="w-3.5 h-3.5" />
                                Verified by {helpfulByList.length} {helpfulByList.length === 1 ? 'candidate' : 'candidates'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
