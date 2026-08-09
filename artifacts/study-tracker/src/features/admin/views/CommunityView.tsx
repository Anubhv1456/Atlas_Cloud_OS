import React, { useState, useEffect } from 'react';
import { Marker, MarkerStatus } from '@/lib/markers';
import { getAllMarkersForAdmin, updateMarkerStatusAdmin } from '@/lib/admin';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, Archive, TriangleAlert, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function CommunityView() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MarkerStatus | 'all' | 'reported'>('all');

  useEffect(() => {
    fetchMarkers();
  }, []);

  const fetchMarkers = async () => {
    setLoading(true);
    try {
      const data = await getAllMarkersForAdmin();
      setMarkers(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load markers');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (markerId: string, status: MarkerStatus) => {
    try {
      await updateMarkerStatusAdmin(markerId, status);
      setMarkers(prev => prev.map(m => m.id === markerId ? { ...m, status } : m));
      toast.success(`Marker updated to ${status}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status');
    }
  };

  const filteredMarkers = markers.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'reported') return (m.reportedBy || []).length > 0;
    return m.status === filter;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Community Markers</h1>
        <p className="text-muted-foreground text-lg">Review, approve, and manage community insights.</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(['all', 'pending', 'published', 'trusted', 'reported', 'low_quality', 'archived'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
              filter === f 
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border/50 hover:bg-muted"
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
            <span className="ml-2 opacity-70">
              ({f === 'all' 
                ? markers.length 
                : f === 'reported' 
                  ? markers.filter(m => (m.reportedBy || []).length > 0).length
                  : markers.filter(m => m.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredMarkers.length === 0 ? (
        <div className="text-center p-12 border border-border/50 rounded-2xl bg-card">
          <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No markers found</h3>
          <p className="text-muted-foreground">Try changing the filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMarkers.map(marker => (
            <div key={marker.id} className="p-5 rounded-2xl border border-border/50 bg-card flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                      {marker.type}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      marker.status === 'published' ? "bg-blue-500/10 text-blue-600" :
                      marker.status === 'trusted' ? "bg-emerald-500/10 text-emerald-600" :
                      marker.status === 'archived' ? "bg-amber-500/10 text-amber-600" :
                      marker.status === 'low_quality' ? "bg-red-500/10 text-red-600" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {marker.status}
                    </span>
                    {(marker.reportedBy || []).length > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-600 flex items-center gap-1">
                        <TriangleAlert className="w-3 h-3" />
                        Reported ({(marker.reportedBy || []).length})
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <span>{marker.subjectName}</span>
                    <span>→</span>
                    <span>{marker.systemName}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {marker.createdAt ? formatDistanceToNow(marker.createdAt.toDate ? marker.createdAt.toDate() : new Date(marker.createdAt), { addSuffix: true }) : 'Unknown date'}
                </div>
              </div>

              <div className="text-base font-medium whitespace-pre-wrap">
                {marker.content}
              </div>

              <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-2">
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Score</span>
                    <span className="font-mono text-foreground font-medium">{Math.round(marker.qualityScore || 50)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Helpful</span>
                    <span className="font-mono text-emerald-500 font-medium">{marker.usefulCount || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Saves</span>
                    <span className="font-mono text-amber-500 font-medium">{(marker.savedBy || []).length}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Reads</span>
                    <span className="font-mono text-foreground font-medium">{marker.readCount || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Reports</span>
                    <span className="font-mono text-red-500 font-medium">{(marker.reportedBy || []).length}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(marker.id, 'published')}
                    className="p-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors tooltip-trigger"
                    title="Publish"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(marker.id, 'trusted')}
                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors tooltip-trigger"
                    title="Mark as Trusted"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(marker.id, 'archived')}
                    className="p-2 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors tooltip-trigger"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(marker.id, 'low_quality')}
                    className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors tooltip-trigger"
                    title="Mark as Low Quality"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
