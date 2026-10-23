import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed recently
      const dismissed = localStorage.getItem('pocketledger_pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pocketledger_pwa_dismissed', 'true');
  };

  return (
    <>
      {showBanner && (
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-emerald-950 text-white px-4 py-2.5 shadow-md flex items-center justify-between border-b border-emerald-500/30">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold">Install PocketLedger as an App</p>
              <p className="text-[11px] text-slate-300">
                Run offline anytime with native standalone experience on Windows, Android & iOS
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstallClick}
              className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-navy-950 hover:bg-emerald-400 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
              <h3 className="font-bold text-navy-900 dark:text-white">How to Install PocketLedger</h3>
              <button onClick={() => setShowGuideModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-navy-800/60">
                <Monitor className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-0.5">Windows / Chrome / Edge Desktop:</h4>
                  <p>Click the <strong>Install</strong> icon in the right side of the address bar, or open browser menu (⋮) &gt; <em>"Install PocketLedger..."</em>.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-navy-800/60">
                <Smartphone className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-0.5">Android (Chrome):</h4>
                  <p>Tap the 3 dots menu (⋮) in Chrome &gt; select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-navy-800/60">
                <Smartphone className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-0.5">iPhone / iPad (Safari):</h4>
                  <p>Tap the <strong>Share</strong> button at bottom (box with arrow pointing up) &gt; scroll down and tap <strong>"Add to Home Screen"</strong>.</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Note: PWAs require a secure context (HTTPS or localhost) to register the service worker for full offline caching.
              </p>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full rounded-xl bg-navy-900 py-2.5 text-xs font-semibold text-white dark:bg-emerald-600 hover:opacity-90"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
