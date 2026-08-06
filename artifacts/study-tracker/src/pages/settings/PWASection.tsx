import { Smartphone, Download, Check, ExternalLink, Monitor, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { usePWA } from '@/hooks/usePWA';

export function PWASection() {
  const { 
    isStandalone, 
    canInstallPwa,
    isInIframe,
    isAndroid,
    handlePwaInstallClick, 
    showInstallGuideModal, 
    setShowInstallGuideModal,
    openInNewTab
  } = usePWA();

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          Install Atlas
        </h2>
        <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-400 font-medium bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
          Works Offline
        </Badge>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden divide-y">
        <div className="p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-foreground flex items-center gap-2">
                Install Atlas App
                {isStandalone ? (
                  <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-500 border-none">
                    App Installed
                  </Badge>
                ) : canInstallPwa ? (
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-none">
                    Ready to Install
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] bg-indigo-500/10 text-indigo-500 border-none">
                    PWA WebAPK
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {isStandalone
                  ? 'Atlas is running as an app on your device.'
                  : 'Install Atlas as a standalone native app on Android & iOS.'}
              </div>
            </div>
          </div>
          {!isStandalone && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isInIframe && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openInNewTab}
                  className="gap-1.5 text-xs font-semibold shadow-sm text-foreground border-border hover:bg-accent"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in Tab
                </Button>
              )}
              <Button
                size="sm"
                onClick={handlePwaInstallClick}
                className="gap-1.5 text-xs font-semibold shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white flex-1 sm:flex-none"
              >
                <Download className="w-3.5 h-3.5" />
                {canInstallPwa ? 'Install Now' : 'Install Guide'}
              </Button>
            </div>
          )}
        </div>

        {isInIframe && !isStandalone && (
          <div className="p-4 bg-amber-500/10 border-l-2 border-amber-500 text-xs space-y-1">
            <div className="font-medium text-amber-500 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> Open in Chrome tab for native "Install app"
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              You are currently viewing Atlas inside an embedded preview window. Android Chrome disables WebAPK installation inside preview frames and only offers "Add to Home screen" shortcut. Tap <strong>Open in Tab</strong> above to get the official <strong>Install app</strong> prompt.
            </p>
          </div>
        )}

        <div className="p-4 bg-muted/20 text-xs space-y-2">
          <div className="font-medium text-foreground flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-500" /> Saved safely on your device
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            Your study logs, revision schedules, past exam scores, and flashcard updates work completely offline. Any offline updates will sync automatically when you reconnect.
          </p>
        </div>
      </div>

      <Dialog open={showInstallGuideModal} onOpenChange={setShowInstallGuideModal}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Install Atlas App</DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-relaxed">
              Atlas is a Progressive Web App (PWA) with full WebAPK support.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {isInIframe && (
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs space-y-2">
                <div className="font-semibold text-amber-500 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Preview Window Detected
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Inside preview frames (iframes), Android Chrome hides the native "Install app" WebAPK option and defaults to "Add to Home screen".
                </p>
                <Button 
                  size="sm" 
                  onClick={openInNewTab}
                  className="w-full gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Atlas in Chrome Tab
                </Button>
              </div>
            )}

            <div className="p-4 bg-muted/40 rounded-xl border space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <Monitor className="w-4 h-4 text-indigo-500" /> On Android / Chrome
              </h4>
              <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside ml-1">
                <li>Make sure you opened Atlas in a <strong>direct Chrome tab</strong> (not inside an iframe).</li>
                <li>Tap the <strong>Menu</strong> (three dots) in the top right of Chrome.</li>
                <li>Tap <strong>Install app</strong> (if you see "Add to Home screen", ensure page finish loading and Service Worker is active).</li>
                <li>Alternatively, tap the <strong>Install Now</strong> button inside Atlas when prompted.</li>
              </ol>
            </div>

            <div className="p-4 bg-muted/40 rounded-xl border space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <Smartphone className="w-4 h-4 text-primary" /> On iOS / Safari
              </h4>
              <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside ml-1">
                <li>Tap the <strong>Share</strong> button at the bottom of Safari.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

