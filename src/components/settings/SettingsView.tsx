import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Repository } from '../../db/repository';
import { hashPin } from '../../services/authService';
import { BackupRestoreModal } from './BackupRestoreModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Settings,
  Lock,
  Database,
  Moon,
  Sun,
  Palette,
  Shield,
  Trash2,
  AlertTriangle,
  FileCode,
  Globe,
  BellRing,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, refreshData, showToast } = useApp();

  const [backupModalOpen, setBackupModalOpen] = useState<boolean>(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);

  // App Lock PIN setup state
  const [pinInput, setPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [showPinSetup, setShowPinSetup] = useState<boolean>(false);

  const handleCurrencyChange = (curr: string) => {
    updateSettings({ defaultCurrency: curr });
  };

  const handleDateFormatChange = (df: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY') => {
    updateSettings({ dateFormat: df });
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
  };

  const handleLanguageChange = (lang: 'en' | 'ur') => {
    updateSettings({ language: lang });
    if (lang === 'ur') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  const handleToggleAppLock = async () => {
    if (settings.isAppLockEnabled) {
      // Disable lock
      await updateSettings({
        isAppLockEnabled: false,
        appLockPinHash: undefined,
        appLockSalt: undefined,
      });
      showToast('Application passcode lock disabled.', 'info');
    } else {
      setShowPinSetup(true);
      setPinInput('');
      setConfirmPinInput('');
      setPinError('');
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (pinInput.length < 4) {
      setPinError('Passcode must be at least 4 digits.');
      return;
    }

    if (pinInput !== confirmPinInput) {
      setPinError('Passcodes do not match. Please verify.');
      return;
    }

    const { hash, salt } = await hashPin(pinInput);
    await updateSettings({
      isAppLockEnabled: true,
      appLockPinHash: hash,
      appLockSalt: salt,
    });

    setShowPinSetup(false);
    showToast('Application passcode lock enabled.', 'success');
  };

  const handleClearAllData = async () => {
    await Repository.clearAllData();
    await refreshData();
    setConfirmClearOpen(false);
    showToast('All local accounts and transactions have been reset.', 'info');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
          Settings & Local Data
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Preferences, offline security controls, and local database management
        </p>
      </div>

      {/* Persistence & Privacy Advisory Card */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
            <strong>Important Local Storage Notice:</strong> PocketLedger stores 100% of your records locally inside your browser's IndexedDB database. If you clear browser cache/cookies or reset your device, local data may be purged. Please export regular JSON backups to keep your data safe.
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900 space-y-4">
        <h3 className="text-sm font-bold text-navy-900 dark:text-white border-b border-slate-100 dark:border-navy-800 pb-2">
          Display & Regional Preferences
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Primary Currency
            </label>
            <select
              value={settings.defaultCurrency}
              onChange={e => handleCurrencyChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-navy-900 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="PKR">Pakistani Rupee (PKR - Rs.)</option>
              <option value="USD">US Dollar (USD - $)</option>
              <option value="EUR">Euro (EUR - €)</option>
              <option value="GBP">British Pound (GBP - £)</option>
              <option value="AED">UAE Dirham (AED)</option>
              <option value="SAR">Saudi Riyal (SAR)</option>
              <option value="INR">Indian Rupee (INR - ₹)</option>
            </select>
          </div>

          {/* Date Format */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date Format
            </label>
            <select
              value={settings.dateFormat}
              onChange={e => handleDateFormatChange(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-navy-900 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="YYYY-MM-DD">ISO Standard (YYYY-MM-DD)</option>
              <option value="DD/MM/YYYY">UK / Pak Style (DD/MM/YYYY)</option>
              <option value="MM/DD/YYYY">US Style (MM/DD/YYYY)</option>
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Color Theme
            </label>
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
              {(['light', 'dark', 'system'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize transition-all ${
                    settings.theme === t
                      ? 'bg-white text-navy-900 shadow-sm dark:bg-emerald-600 dark:text-white'
                      : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Language / RTL support */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Language (RTL Ready)
            </label>
            <select
              value={settings.language || 'en'}
              onChange={e => handleLanguageChange(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-navy-900 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="en">English (Default)</option>
              <option value="ur">اردو (Urdu - RTL Layout)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security & App Passcode */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-2">
          <div>
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">
              Application Passcode Lock
            </h3>
            <p className="text-[11px] text-slate-400">
              Optional lock screen with PBKDF2 hash verification
            </p>
          </div>

          <button
            onClick={handleToggleAppLock}
            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
              settings.isAppLockEnabled
                ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {settings.isAppLockEnabled ? 'Disable Passcode' : 'Enable Passcode'}
          </button>
        </div>

        {/* Pin setup form if user clicked enable */}
        {showPinSetup && (
          <form onSubmit={handleSavePin} className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20 space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              Create New Security Passcode
            </h4>
            {pinError && (
              <p className="text-xs font-semibold text-rose-600">{pinError}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Enter Passcode (4-8 digits)
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-mono tracking-widest text-slate-800 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Confirm Passcode
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={confirmPinInput}
                  onChange={e => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-mono tracking-widest text-slate-800 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPinSetup(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 dark:border-navy-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500"
              >
                Save & Lock App
              </button>
            </div>
          </form>
        )}

        <p className="text-[11px] text-slate-400 leading-relaxed">
          * Note: An application passcode prevents unauthorized viewing on shared devices. It is not equivalent to full-disk operating system encryption.
        </p>
      </div>

      {/* Backup & Restore Section */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-2">
          <div>
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">
              Data Backup & Portability
            </h3>
            <p className="text-[11px] text-slate-400">
              Export encrypted or plaintext JSON backups, or restore previous files
            </p>
          </div>

          <button
            onClick={() => setBackupModalOpen(true)}
            className="flex items-center space-x-1.5 rounded-xl bg-navy-900 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-navy-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all"
          >
            <Database className="h-4 w-4" />
            <span>Backup / Restore</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          You can easily move all your financial history to a new smartphone, laptop, or browser by downloading a backup and restoring it in seconds.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 dark:border-rose-900/60 dark:bg-rose-950/20 space-y-3">
        <div className="flex items-center space-x-2 text-sm font-bold text-rose-700 dark:text-rose-400">
          <AlertTriangle className="h-4 w-4" />
          <span>Danger Zone: Reset Database</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Permanently delete all accounts, transactions, budgets, and recurring rules from this browser. This action cannot be reversed unless you have an exported backup.
        </p>
        <button
          onClick={() => setConfirmClearOpen(true)}
          className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-500 transition-all flex items-center space-x-1.5"
        >
          <Trash2 className="h-4 w-4" />
          <span>Erase All Local Records</span>
        </button>
      </div>

      {/* Backup / Restore Modal */}
      <BackupRestoreModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmClearOpen}
        title="Permanently Delete Local Data?"
        message="This will completely clear your local financial records and reset your ledger. Are you sure you want to proceed?"
        confirmLabel="Erase Everything"
        isDestructive={true}
        onConfirm={handleClearAllData}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
};
