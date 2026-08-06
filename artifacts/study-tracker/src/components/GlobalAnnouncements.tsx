import React, { useEffect, useState } from 'react';
import { getAnnouncements, Announcement } from '@/lib/admin';
import { Info, AlertTriangle, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

export function GlobalAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [location] = useLocation();

  useEffect(() => {
    // Hide announcements in admin panel or login
    if (location.startsWith('/admin') || location === '/login') {
      return;
    }
    
    let isMounted = true;
    getAnnouncements().then(data => {
      if (isMounted) {
        setAnnouncements(data.filter(a => a.active));
      }
    }).catch(console.error);
    
    return () => { isMounted = false; };
  }, [location]);

  if (location.startsWith('/admin') || location === '/login') {
    return null;
  }

  const visibleAnnouncements = announcements.filter(a => !dismissed.has(a.id));

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none mt-2 px-4 gap-2">
      <AnimatePresence>
        {visibleAnnouncements.map(announcement => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`pointer-events-auto max-w-lg w-full p-4 rounded-2xl shadow-lg border backdrop-blur-md flex items-start gap-3 relative ${
              announcement.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-100 dark:text-blue-50' :
              announcement.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100 dark:text-emerald-50' :
              announcement.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-100 dark:text-amber-50' :
              'bg-red-500/10 border-red-500/20 text-red-100 dark:text-red-50'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {announcement.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
              {announcement.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {announcement.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {announcement.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            </div>
            <div className="flex-1 pr-6">
              <h4 className={`font-semibold text-sm mb-0.5 ${
                announcement.type === 'info' ? 'text-blue-600 dark:text-blue-400' :
                announcement.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' :
                announcement.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                'text-red-600 dark:text-red-400'
              }`}>{announcement.title}</h4>
              <p className="text-sm opacity-90 text-foreground">{announcement.message}</p>
            </div>
            <button
              onClick={() => setDismissed(prev => new Set(prev).add(announcement.id))}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 opacity-70" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
