import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, PlusSquare, ExternalLink, Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState, useEffect } from 'react';

export function PWAInstallPrompt() {
  const { 
    platform, 
    isWebView, 
    promptInstall, 
    dismissPrompt 
  } = usePWAInstall();

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleShow = () => setIsVisible(true);
    window.addEventListener('show-pwa-install-modal', handleShow);
    return () => window.removeEventListener('show-pwa-install-modal', handleShow);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    dismissPrompt();
  };

  const handleInstallClick = () => {
    setIsVisible(false);
    promptInstall();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`relative w-full max-w-sm bg-zinc-900 border border-white/[0.06] rounded-2xl shadow-2xl p-6 overflow-hidden ${
            platform === 'ipados' ? 'absolute top-16 right-6 m-0' : 
            platform === 'ios' ? 'absolute bottom-4 inset-x-4 m-auto' : ''
          }`}
        >
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100 bg-white/5 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {isWebView ? (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                <ExternalLink className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-100">Open in System Browser</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                You're viewing Atlas inside an in-app browser. Tap the menu icon (•••) and select <strong>'Open in Safari'</strong> or <strong>'Open in Chrome'</strong> to install Atlas offline.
              </p>
              <button 
                onClick={handleClose}
                className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          ) : (platform === 'ios' || platform === 'ipados') ? (
            <div className="space-y-5">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
                <Download className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-100">Install Atlas OS</h3>
              <p className="text-sm text-zinc-400">
                Add Atlas to your home screen for full offline access and zero browser distraction.
              </p>
              
              <div className="space-y-3 mt-6 bg-black/20 p-4 rounded-xl border border-white/[0.04]">
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <div className="bg-white/10 p-1.5 rounded-lg"><Share2 className="w-4 h-4" /></div>
                  <span>1. Tap the <strong>Share</strong> icon in Safari</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <div className="bg-white/10 p-1.5 rounded-lg"><PlusSquare className="w-4 h-4" /></div>
                  <span>2. Select <strong>Add to Home Screen</strong></span>
                </div>
              </div>

              {platform === 'ios' && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-900 border-b border-r border-white/[0.06] rotate-45" />
              )}
              {platform === 'ipados' && (
                <div className="absolute -top-2 right-12 w-4 h-4 bg-zinc-900 border-t border-l border-white/[0.06] rotate-45" />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-100">Install Atlas OS</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Add Atlas to your home screen for full offline access, instant card flips, and zero browser distraction.
              </p>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={handleClose}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-medium transition-colors"
                >
                  Maybe Later
                </button>
                <button 
                  onClick={handleInstallClick}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                >
                  Install Now
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
