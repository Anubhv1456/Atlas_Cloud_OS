import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Marker, MarkerType, getMarkersForSystem, interactWithMarker } from '@/lib/markers';
import { Compass, Sparkles, AlertTriangle, Lightbulb, Video, Stethoscope, ChevronRight, Bookmark, ArrowUpCircle, BookmarkPlus, Flag, ThumbsDown } from 'lucide-react';
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
  onLeaveMarker?: () => void;
}

const typeIcons: Record<MarkerType, React.ReactNode> = {
  high_yield: <Sparkles className="w-4 h-4 text-amber-500" />,
  pitfall: <AlertTriangle className="w-4 h-4 text-red-500" />,
  clinical_pearl: <Stethoscope className="w-4 h-4 text-emerald-500" />,
  resource: <Video className="w-4 h-4 text-blue-500" />,
  mnemonic: <Lightbulb className="w-4 h-4 text-purple-500" />,
  memory_trick: <Lightbulb className="w-4 h-4 text-indigo-500" />,
};

const typeLabels: Record<MarkerType, string> = {
  high_yield: 'High Yield',
  pitfall: 'Common Pitfall',
  clinical_pearl: 'Clinical Pearl',
  resource: 'Resource',
  mnemonic: 'Mnemonic',
  memory_trick: 'Memory Tricks',
};

export function ViewMarkersModal({ isOpen, onClose, systemId, systemName, onLeaveMarker }: ViewMarkersModalProps) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MarkerType | 'all'>('all');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getMarkersForSystem(systemId)
        .then(setMarkers)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, systemId]);

  const handleInteraction = async (markerId: string, action: 'helpful' | 'not_helpful' | 'save' | 'report') => {
    if (!user) {
      toast.error('You need to be logged in to do that.');
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
        }).filter(m => m.status !== 'low_quality' && m.status !== 'archived')); // Hide immediately if it fell below threshold
        
        if (action === 'report') {
          toast.success('Marker reported', { description: 'This marker will be reviewed by our team.' });
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Could not complete interaction at this time.');
    }
  };

  const markersByType = markers.reduce((acc, marker) => {
    if (!acc[marker.type]) acc[marker.type] = [];
    acc[marker.type].push(marker);
    return acc;
  }, {} as Record<MarkerType, Marker[]>);

  const availableTypes = (Object.keys(markersByType) as MarkerType[]).sort((a, b) => markersByType[b].length - markersByType[a].length);
  const displayedMarkers = activeTab === 'all' ? markers : markers.filter(m => m.type === activeTab);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] rounded-2xl mx-4 w-[calc(100%-2rem)] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card/95 backdrop-blur-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            <span className="text-foreground">Markers for {systemName}</span>
          </DialogTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              <span>{markers.length} markers left by fellow Wayfinders.</span>
            </div>
            {onLeaveMarker && (
              <button 
                onClick={() => { onClose(); onLeaveMarker(); }}
                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-xs transition-colors hover:bg-primary/20"
              >
                + Leave Marker
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm">Uncovering trail markers...</p>
            </div>
          ) : markers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground px-6 text-center">
              <Compass className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-base font-medium text-foreground">No markers found yet.</p>
              <p className="text-sm">Be the first to leave a marker for future students.</p>
              {onLeaveMarker && (
                <button 
                  onClick={() => { onClose(); onLeaveMarker(); }}
                  className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all hover:bg-primary/90"
                >
                  Leave a Marker
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
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                    activeTab === 'all' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  All ({markers.length})
                </button>
                {availableTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                      activeTab === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <span>{typeIcons[type]}</span>
                    <span>{typeLabels[type]}</span>
                    <span className="opacity-70 ml-1">({markersByType[type].length})</span>
                  </button>
                ))}
              </div>

              {/* Markers List */}
              <div className="p-6 space-y-4">
                {displayedMarkers.map(marker => {
                  const isOwn = marker.userId === user?.uid;
                  const hasHelped = user?.uid ? (marker.helpfulBy || []).includes(user.uid) : false;
                  const hasNotHelped = user?.uid ? (marker.notHelpfulBy || []).includes(user.uid) : false;
                  const isSaved = user?.uid ? (marker.savedBy || []).includes(user.uid) : false;
                  
                  return (
                    <div key={marker.id} className={cn("p-4 rounded-xl border relative transition-all hover:shadow-sm", isOwn ? "border-primary/30 bg-primary/5" : "border-border/60 bg-card")}>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-1.5">
                             {typeIcons[marker.type]}
                             <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{typeLabels[marker.type]}</span>
                             {(marker.qualityScore || 50) > 70 && (
                                <span className="ml-2 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[9px] font-bold uppercase tracking-wider">Trusted</span>
                             )}
                           </div>
                           {isOwn ? (
                             <span className="text-[10px] font-bold text-primary tracking-widest uppercase mt-0.5">FROM PAST YOU</span>
                           ) : (
                             <span className="text-[10px] font-medium text-muted-foreground/70 mt-0.5">
                               Marker left by <span className="text-muted-foreground font-mono font-medium">{marker.authorAlias || 'Anonymous'}</span>
                             </span>
                           )}
                        </div>
                        <div className="flex items-center gap-2">
                          {marker.createdAt && (
                            <span className="text-xs text-muted-foreground/60 whitespace-nowrap">
                              {formatDistanceToNow(marker.createdAt.toDate ? marker.createdAt.toDate() : new Date(marker.createdAt), { addSuffix: true })}
                            </span>
                          )}
                          {!isOwn && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 -mr-2 text-muted-foreground/50 hover:text-foreground transition-colors rounded-full hover:bg-muted">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleInteraction(marker.id, 'report')} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                  <Flag className="w-4 h-4 mr-2" />
                                  Report as incorrect
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                        {marker.content}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        {marker.source ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 text-xs text-muted-foreground font-medium border border-border/50">
                            <Bookmark className="w-3 h-3" />
                            Source: {marker.source}
                          </div>
                        ) : <div />}
                        
                        {!isOwn ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleInteraction(marker.id, 'save')}
                              className={cn(
                                "p-1.5 rounded-md text-xs font-medium transition-colors border",
                                isSaved 
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30" 
                                  : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:border-border/50"
                              )}
                              title={isSaved ? "Saved" : "Save this marker"}
                            >
                              <BookmarkPlus className="w-3.5 h-3.5" />
                            </button>

                            <div className="flex items-center bg-muted/40 border border-border/50 rounded-md overflow-hidden">
                              <button
                                onClick={() => handleInteraction(marker.id, 'helpful')}
                                disabled={hasHelped}
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors border-r border-border/50",
                                  hasHelped 
                                    ? "bg-emerald-500/10 text-emerald-600" 
                                    : "text-muted-foreground hover:bg-muted"
                                )}
                              >
                                <ArrowUpCircle className="w-3.5 h-3.5" />
                                {(marker.usefulCount || 0) > 0 && (
                                  <span className="font-mono">{marker.usefulCount}</span>
                                )}
                              </button>
                              <button
                                onClick={() => handleInteraction(marker.id, 'not_helpful')}
                                disabled={hasNotHelped}
                                className={cn(
                                  "p-1.5 text-xs font-medium transition-colors",
                                  hasNotHelped 
                                    ? "bg-red-500/10 text-red-600" 
                                    : "text-muted-foreground hover:bg-muted"
                                )}
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                             {(marker.qualityScore !== undefined) && (
                               <div className="text-xs text-muted-foreground font-mono">
                                 Score: {Math.round(marker.qualityScore)}
                               </div>
                             )}
                             {(marker.usefulCount || 0) > 0 && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                                <ArrowUpCircle className="w-3.5 h-3.5" />
                                Helped {marker.usefulCount} {marker.usefulCount === 1 ? 'student' : 'students'}
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
