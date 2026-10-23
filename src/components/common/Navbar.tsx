import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wallet,
  Wifi,
  WifiOff,
  Lock,
  PlusCircle,
  Moon,
  Sun,
  ShieldCheck,
  Download,
} from 'lucide-react';

interface NavbarProps {
  onQuickAction: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onQuickAction }) => {
  const { isOnline, isLocked, lockApp, settings, updateSettings } = useApp();

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-navy-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-navy-800 dark:bg-navy-950/95 sm:px-6">
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-navy-900 to-emerald-600 text-white shadow-md shadow-emerald-950/20">
          <Wallet className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold tracking-tight text-navy-900 dark:text-white">
              Pocket<span className="text-emerald-500">Ledger</span>
            </span>
            <span className="hidden rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 sm:inline-block">
              Offline-First
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Local Personal Finance Manager</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Offline / Online indicator */}
        <div
          title={isOnline ? 'Online (Data remains stored locally on your device)' : 'Offline mode active (All data fully accessible)'}
          className={`flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden md:inline">Local (Online)</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-amber-500" />
              <span>Offline Ready</span>
            </>
          )}
        </div>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-navy-800 dark:text-slate-300 dark:hover:bg-navy-900"
        >
          {settings.theme === 'dark' ? (
            <Sun className="h-4 w-4 text-gold-400" />
          ) : (
            <Moon className="h-4 w-4 text-navy-800" />
          )}
        </button>

        {/* Lock button if app lock is enabled */}
        {settings.isAppLockEnabled && !isLocked && (
          <button
            onClick={lockApp}
            title="Lock application"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-navy-800 dark:text-slate-300 dark:hover:bg-navy-900"
          >
            <Lock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </button>
        )}

        {/* Install / Download APK Button */}
        <a
          href="/PocketLedger.apk"
          download="PocketLedger.apk"
          className="flex items-center space-x-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-navy-950 shadow-sm hover:bg-emerald-400 active:scale-95 transition-all"
          title="Download & Install Android APK"
        >
          <Download className="h-4 w-4" />
          <span>Install App</span>
        </a>

        {/* Quick Add Button */}
        <button
          onClick={onQuickAction}
          className="flex items-center space-x-1.5 rounded-xl bg-navy-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-navy-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-95 transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
    </header>
  );
};
