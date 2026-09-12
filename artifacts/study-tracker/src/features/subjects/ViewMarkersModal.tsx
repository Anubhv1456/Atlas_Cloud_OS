import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Marker, MarkerType, getMarkersForSystem, getMarkersForTopic, interactWithMarker, deleteMarker, updateOwnMarker } from '@/lib/markers';
import { Compass, Sparkles, TriangleAlert, Lightbulb, Video, Stethoscope, Bookmark, Check, BookmarkPlus, Flag, ShieldCheck, MoreHorizontal, Trash2, Edit3, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  clinical_pearl: <Stethoscope className="w-4 h-4 text-emerald-400" />,
  mnemonic: <Lightbulb className="w-4 h-4 text-amber-400" />,
  pitfall: <TriangleAlert className="w-4 h-4 text-rose-500" />,
  resource: <Video className="w-4 h-4 text-zinc-300" />,
  high_yield: <Sparkles className="w-4 h-4 text-emerald-400" />,
  memory_trick: <Lightbulb className="w-4 h-4 text-amber-400" />,
};

const typeLabels: Record<string, string> = {
  clinical_pearl: 'Clinical Pearl',
  mnemonic: 'Mnemonic & Trick',
  pitfall: 'Exam Pitfall',
  resource: 'High-Yield Resource',
  high_yield: 'Clinical Pearl',
  memory_trick: 'Mnemonic & Trick',
};

type FilterTab = 'all' | 'saved' | 'mine' | MarkerType;

export function ViewMarkersModal({ isOpen, onClose, systemId, systemName, topicId, topicName, onLeaveMarker }: ViewMarkersModalProps) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  
  // Author management state
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editSource, setEditSource] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingMarkerId, setIsDeletingMarkerId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setEditingMarkerId(null);
      (topicId ? getMarkersForTopic(topicId) : getMarkersForSystem(systemId))
        .then(fetched => {
          setMarkers(fetched);
          if (user?.uid) {
            fetched.forEach(m => {
              interactWithMarker(m.id, user.uid, 'read').catch(() => {});
            });
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, systemId, topicId, user?.uid]);

  const handleInteraction = async (markerId: string, action: 'helpful' | 'save' | 'report') => {
    if (!user) {
      toast.error('Sign in required to verify trail markers.');
      return;
    }
    try {
      const currentMarker = markers.find(m => m.id === markerId);
      const isCurrentlyActive = action === 'helpful' 
        ? Array.isArray(currentMarker?.helpfulBy) && currentMarker.helpfulBy.includes(user.uid)
        : action === 'save'
        ? Array.isArray(currentMarker?.savedBy) && currentMarker.savedBy.includes(user.uid)
        : false;

      await interactWithMarker(markerId, user.uid, action, { isCurrentlyActive });
      
      setMarkers(prev => prev.map(m => {
        if (m.id === markerId) {
          const helpfulBy = Array.isArray(m.helpfulBy) ? [...m.helpfulBy] : [];
          const savedBy = Array.isArray(m.savedBy) ? [...m.savedBy] : [];
          const reportedBy = Array.isArray(m.reportedBy) ? [...m.reportedBy] : [];
          let usefulCount = m.usefulCount || 0;
          let qualityScore = m.qualityScore || 50;

          if (action === 'helpful') {
            if (isCurrentlyActive) {
              const idx = helpfulBy.indexOf(user.uid);
              if (idx > -1) helpfulBy.splice(idx, 1);
              usefulCount = Math.max(0, usefulCount - 1);
              qualityScore = Math.max(0, qualityScore - 5);
            } else {
              if (!helpfulBy.includes(user.uid)) helpfulBy.push(user.uid);
              usefulCount += 1;
              qualityScore = Math.min(100, qualityScore + 5);
            }
          } else if (action === 'save') {
            if (isCurrentlyActive) {
              const idx = savedBy.indexOf(user.uid);
              if (idx > -1) savedBy.splice(idx, 1);
              qualityScore = Math.max(0, qualityScore - 3);
            } else {
              if (!savedBy.includes(user.uid)) savedBy.push(user.uid);
              qualityScore = Math.min(100, qualityScore + 3);
            }
          } else if (action === 'report') {
            if (!reportedBy.includes(user.uid)) reportedBy.push(user.uid);
            qualityScore = Math.max(0, qualityScore - 10);
          }

          return {
            ...m,
            helpfulBy,
            savedBy,
            reportedBy,
            usefulCount,
            qualityScore,
          };
        }
        return m;
      }).filter(m => m.status !== 'low_quality' && m.status !== 'archived'));
      
      if (action === 'report') {
        toast.success('Marker flagged for review', { description: 'Our medical moderation queue will verify this marker.' });
      } else if (action === 'helpful') {
        toast.success('Verified Pearl', { description: 'Your peer verification strengthens this trail for future candidates.' });
      }
    } catch (e) {
      console.error(e);
      toast.error('Could not complete verification at this time.');
    }
  };

  const handleDeleteMarker = async (markerId: string) => {
    if (!user?.uid) return;
    if (!window.confirm("Are you sure you want to delete this trail marker?")) return;
    setIsDeletingMarkerId(markerId);
    try {
      await deleteMarker(markerId, user.uid);
      setMarkers(prev => prev.filter(m => m.id !== markerId));
      if (editingMarkerId === markerId) {
        setEditingMarkerId(null);
      }
      toast.success("Trail marker deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete trail marker");
    } finally {
      setIsDeletingMarkerId(null);
    }
  };

  const handleStartEdit = (marker: Marker) => {
    setEditingMarkerId(marker.id);
    setEditContent(marker.content);
    setEditSource(marker.source || '');
  };

  const handleCancelEdit = () => {
    setEditingMarkerId(null);
    setEditContent('');
    setEditSource('');
  };

  const handleSaveEdit = async (markerId: string) => {
    if (!user?.uid || !editContent.trim()) return;
    setIsSavingEdit(true);
    try {
      await updateOwnMarker(markerId, user.uid, editContent.trim(), editSource.trim());
      setMarkers(prev => prev.map(m => m.id === markerId ? { 
        ...m, 
        content: editContent.trim(), 
        source: editSource.trim() || undefined 
      } : m));
      setEditingMarkerId(null);
      toast.success("Trail marker updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update trail marker");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const savedMarkers = useMemo(() => {
    if (!user?.uid) return [];
    return markers.filter(m => Array.isArray(m.savedBy) && m.savedBy.includes(user.uid));
  }, [markers, user?.uid]);

  const myMarkers = useMemo(() => {
    if (!user?.uid) return [];
    return markers.filter(m => m.userId === user.uid);
  }, [markers, user?.uid]);

  const markersByType = useMemo(() => {
    return markers.reduce((acc, marker) => {
      const key = marker.type || 'clinical_pearl';
      if (!acc[key]) acc[key] = [];
      acc[key].push(marker);
      return acc;
    }, {} as Record<string, Marker[]>);
  }, [markers]);

  const availableTypes = useMemo(() => {
    return (Object.keys(markersByType) as string[]).sort((a, b) => (markersByType[b]?.length || 0) - (markersByType[a]?.length || 0));
  }, [markersByType]);

  const displayedMarkers = useMemo(() => {
    if (activeTab === 'all') return markers;
    if (activeTab === 'saved') return savedMarkers;
    if (activeTab === 'mine') return myMarkers;
    return markers.filter(m => m.type === activeTab);
  }, [markers, activeTab, savedMarkers, myMarkers]);

  const activeTitle = topicName || systemName;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[580px] rounded-xl mx-4 w-[calc(100%-2rem)] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card/95 backdrop-blur-xl border border-border/60 shadow-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary shrink-0" />
            <span className="text-foreground truncate">Trail Markers for {activeTitle}</span>
          </DialogTitle>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <div className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-muted-foreground/70" />
              <span>{markers.length} peer-verified marker{markers.length === 1 ? '' : 's'} on this trail</span>
            </div>
            {onLeaveMarker && (
              <button 
                onClick={() => { onClose(); onLeaveMarker(); }}
                className="px-3 py-1.5 rounded-full bg-zinc-800/40 text-primary font-bold text-xs transition-colors hover:bg-primary/20 shrink-0 cursor-pointer"
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
            <div className="flex flex-col h-full">
              {/* Fake Tabs */}
              <div className="px-6 py-3 border-b border-border/50 overflow-x-auto flex items-center gap-2 no-scrollbar shrink-0">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
              </div>
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-border/60 bg-card">
                    <div className="flex justify-between mb-3">
                      <div className="flex gap-2 items-center">
                        <Skeleton className="h-5 w-5 rounded-md" />
                        <Skeleton className="h-4 w-32 rounded-md" />
                      </div>
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                    <Skeleton className="h-16 w-full rounded-md mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-7 w-24 rounded-md" />
                      <Skeleton className="h-7 w-16 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
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
              {/* Type & Collection Tabs */}
              <div className="px-6 py-3 border-b border-border/50 overflow-x-auto flex items-center gap-2 no-scrollbar shrink-0">
                <button
                  onClick={() => setActiveTab('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer",
                    activeTab === 'all' ? "bg-primary text-primary-foreground font-semibold" : "bg-muted/70 text-muted-foreground hover:bg-muted"
                  )}
                >
                  All ({markers.length})
                </button>

                {user?.uid && (
                  <button
                    onClick={() => setActiveTab('saved')}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer",
                      activeTab === 'saved' ? "bg-primary text-primary-foreground font-semibold" : "bg-muted/70 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>Saved</span>
                    <span className="opacity-70 ml-0.5 font-mono">({savedMarkers.length})</span>
                  </button>
                )}

                {user?.uid && myMarkers.length > 0 && (
                  <button
                    onClick={() => setActiveTab('mine')}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer",
                      activeTab === 'mine' ? "bg-primary text-primary-foreground font-semibold" : "bg-muted/70 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>My Markers</span>
                    <span className="opacity-70 ml-0.5 font-mono">({myMarkers.length})</span>
                  </button>
                )}

                {availableTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer",
                      activeTab === type ? "bg-primary text-primary-foreground font-semibold" : "bg-muted/70 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span>{typeIcons[type] || typeIcons['clinical_pearl']}</span>
                    <span>{typeLabels[type] || typeLabels['clinical_pearl']}</span>
                    <span className="opacity-70 ml-0.5 font-mono">({markersByType[type]?.length || 0})</span>
                  </button>
                ))}
              </div>

              {/* Markers List / Empty State */}
              {displayedMarkers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground px-6 text-center">
                  {activeTab === 'saved' ? (
                    <>
                      <Bookmark className="w-9 h-9 text-amber-400/40 mb-1" />
                      <p className="text-base font-semibold text-foreground">No Saved Pearls Yet</p>
                      <p className="text-xs text-muted-foreground max-w-sm">Click the bookmark icon on any clinical pearl, mnemonic, or pitfall to save it for quick review.</p>
                      <button
                        onClick={() => setActiveTab('all')}
                        className="mt-2 px-3.5 py-1.5 rounded-xl bg-muted text-foreground text-xs font-medium hover:bg-muted/80 cursor-pointer"
                      >
                        View All Trail Markers
                      </button>
                    </>
                  ) : activeTab === 'mine' ? (
                    <>
                      <Compass className="w-9 h-9 text-primary/40 mb-1" />
                      <p className="text-base font-semibold text-foreground">You Haven't Left Any Markers Here</p>
                      <p className="text-xs text-muted-foreground max-w-sm">Share high-yield clinical memory tricks or exam traps to guide other candidates along this trail.</p>
                      {onLeaveMarker && (
                        <button 
                          onClick={() => { onClose(); onLeaveMarker(); }}
                          className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs transition-all hover:bg-primary/90 cursor-pointer shadow-sm"
                        >
                          + Leave Trail Marker
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <Compass className="w-9 h-9 text-muted-foreground/30 mb-1" />
                      <p className="text-base font-semibold text-foreground">No {typeLabels[activeTab] || 'Category'} Markers</p>
                      <p className="text-xs text-muted-foreground max-w-sm">Be the first candidate to place this type of marker on this trail.</p>
                      {onLeaveMarker && (
                        <button 
                          onClick={() => { onClose(); onLeaveMarker(); }}
                          className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs transition-all hover:bg-primary/90 cursor-pointer shadow-sm"
                        >
                          + Leave Trail Marker
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {displayedMarkers.map(marker => {
                    const isOwn = marker.userId === user?.uid;
                    const helpfulByList = Array.isArray(marker.helpfulBy) ? marker.helpfulBy : [];
                    const savedByList = Array.isArray(marker.savedBy) ? marker.savedBy : [];
                    const isEditing = editingMarkerId === marker.id;
                    const isDeleting = isDeletingMarkerId === marker.id;
                    
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
                                 <span className="ml-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-white/5">
                                   <ShieldCheck className="w-3 h-3" />
                                   High-Yield Trail
                                 </span>
                               )}
                             </div>
                             {isOwn ? (
                               <span className="text-xs font-bold text-primary tracking-wider uppercase mt-0.5">YOUR TRAIL MARKER</span>
                             ) : (
                               <span className="text-xs font-medium text-muted-foreground/70 mt-0.5">
                                 Left by <span className="text-muted-foreground font-mono font-medium">{marker.authorAlias || 'Wayfinder'}</span>
                               </span>
                             )}
                          </div>
                          <div className="flex items-center gap-2">
                            {marker.createdAt && (
                              <span className="text-xs text-muted-foreground/60 whitespace-nowrap">
                                {formatDistanceToNow(marker.createdAt.toDate ? marker.createdAt.toDate() : new Date(marker.createdAt), { addSuffix: true })}
                              </span>
                            )}
                            {isOwn ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button 
                                    aria-label="Manage marker"
                                    className="p-1 -mr-2 text-muted-foreground/60 hover:text-foreground transition-colors rounded-full hover:bg-muted cursor-pointer" 
                                    title="Manage your marker"
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <MoreHorizontal className="w-4 h-4" />}
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                  <DropdownMenuItem 
                                    onClick={() => handleStartEdit(marker)}
                                    className="cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                    Edit Marker
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteMarker(marker.id)} 
                                    className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/20 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                                    Delete Marker
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button 
                                    aria-label="Marker options"
                                    className="p-1 -mr-2 text-muted-foreground/50 hover:text-foreground transition-colors rounded-full hover:bg-muted cursor-pointer"
                                  >
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
                        
                        {isEditing ? (
                          <div className="space-y-3 pt-1">
                            <textarea
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              rows={3}
                              className="w-full text-xs sm:text-sm bg-background/90 border border-border/80 rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                              placeholder="Edit your clinical pearl, mnemonic, or pitfall..."
                            />
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <input
                                type="text"
                                value={editSource}
                                onChange={e => setEditSource(e.target.value)}
                                className="flex-1 text-xs bg-background/90 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Optional reference source (e.g. standard textbook, QBank)..."
                              />
                              <div className="flex items-center justify-end gap-2 shrink-0">
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={isSavingEdit}
                                  className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(marker.id)}
                                  disabled={isSavingEdit || !editContent.trim()}
                                  className="px-3.5 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                  {isSavingEdit && <Loader2 className="w-3 h-3 animate-spin" />}
                                  {isSavingEdit ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                            {marker.content}
                          </div>
                        )}

                        <div className="mt-3.5 flex items-center justify-between gap-3 pt-2 border-t border-border/40">
                          {marker.source ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted/50 text-xs text-muted-foreground font-medium border border-border/40 truncate max-w-[180px]">
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
                                    ? "bg-amber-950/20 text-amber-400 border-amber-500/30" 
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
                                    ? "bg-emerald-500/15 text-emerald-400 dark:text-emerald-400 border-emerald-500/30" 
                                    : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <Check className={cn("w-3.5 h-3.5", isVerifiedByMe && "text-emerald-400")} />
                                <span>{isVerifiedByMe ? 'Verified' : 'Verify Pearl'}</span>
                                {helpfulByList.length > 0 && (
                                  <span className="font-mono text-xs opacity-80">({helpfulByList.length})</span>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {helpfulByList.length > 0 && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/20 text-emerald-400 border border-white/5">
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
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
