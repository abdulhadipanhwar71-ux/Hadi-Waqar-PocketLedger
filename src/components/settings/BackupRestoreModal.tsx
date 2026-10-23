import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Repository } from '../../db/repository';
import {
  encryptBackupData,
  decryptBackupData,
  validateBackupStructure,
} from '../../services/cryptoBackup';
import { downloadFile } from '../../services/csvExport';
import { BackupData, EncryptedBackupPayload } from '../../types';
import {
  Upload,
  Download,
  Lock,
  FileCheck,
  AlertTriangle,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ isOpen, onClose }) => {
  const { refreshData, showToast } = useApp();

  // Mode: 'export' | 'import'
  const [tab, setTab] = useState<'export' | 'import'>('export');

  // Export state
  const [useEncryption, setUseEncryption] = useState<boolean>(false);
  const [exportPassphrase, setExportPassphrase] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Import state
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [importPassphrase, setImportPassphrase] = useState<string>('');
  const [isEncryptedFile, setIsEncryptedFile] = useState<boolean>(false);
  const [parsedBackup, setParsedBackup] = useState<BackupData | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [rawFileContent, setRawFileContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleExport = async () => {
    setError('');
    if (useEncryption && !exportPassphrase.trim()) {
      setError('Please enter a passphrase to encrypt your backup.');
      return;
    }

    setIsExporting(true);
    try {
      const data = await Repository.exportAllData();
      const dateStr = new Date().toISOString().split('T')[0];

      if (useEncryption) {
        const encrypted = await encryptBackupData(data, exportPassphrase.trim());
        const filename = `PocketLedger_Backup_${dateStr}_encrypted.json`;
        downloadFile(JSON.stringify(encrypted, null, 2), filename, 'application/json');
        showToast('Encrypted backup exported successfully. Do not lose your passphrase!', 'success');
      } else {
        const filename = `PocketLedger_Backup_${dateStr}.json`;
        downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
        showToast('Plain JSON backup exported successfully.', 'success');
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to export backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setParsedBackup(null);
    setIsEncryptedFile(false);

    const file = e.target.files?.[0];
    if (!file) return;

    setImportedFile(file);
    try {
      const text = await file.text();
      setRawFileContent(text);
      const parsed = JSON.parse(text);

      if (parsed.isEncrypted) {
        setIsEncryptedFile(true);
      } else {
        validateBackupStructure(parsed);
        setParsedBackup(parsed);
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid JSON file. Please ensure this is a PocketLedger backup.');
    }
  };

  const handleDecryptAndPreview = async () => {
    setError('');
    if (!importPassphrase.trim()) {
      setError('Please provide the encryption passphrase.');
      return;
    }

    setIsProcessing(true);
    try {
      const payload = JSON.parse(rawFileContent) as EncryptedBackupPayload;
      const decrypted = await decryptBackupData(payload, importPassphrase.trim());
      setParsedBackup(decrypted);
      setIsEncryptedFile(false);
      showToast('Backup decrypted successfully.', 'success');
    } catch (err: any) {
      setError(err?.message || 'Decryption failed. Incorrect passphrase.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!parsedBackup) return;
    setIsProcessing(true);
    try {
      await Repository.restoreBackupData(parsedBackup, restoreMode);
      await refreshData();
      showToast(
        restoreMode === 'replace'
          ? 'Database replaced with backup data.'
          : 'Backup data merged with existing records.',
        'success'
      );
      onClose();
    } catch (err: any) {
      setError('Restore failed: ' + err?.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Data Backup & Restore"
      subtitle="Safeguard and transfer your local financial records"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-navy-950">
          <button
            onClick={() => {
              setTab('export');
              setError('');
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              tab === 'export'
                ? 'bg-white text-navy-900 shadow-sm dark:bg-emerald-600 dark:text-white'
                : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Create Backup (Export)
          </button>
          <button
            onClick={() => {
              setTab('import');
              setError('');
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              tab === 'import'
                ? 'bg-white text-navy-900 shadow-sm dark:bg-emerald-600 dark:text-white'
                : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Restore Backup (Import)
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 p-2.5 text-xs font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Export tab */}
        {tab === 'export' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Download all your accounts, transactions, categories, budgets, and recurring rules into a portable JSON backup file.
            </p>

            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/50">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useEncryption}
                  onChange={e => setUseEncryption(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-navy-900 dark:text-white flex items-center space-x-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Encrypt with AES-GCM Passphrase</span>
                </span>
              </label>

              {useEncryption && (
                <div className="mt-3 space-y-2">
                  <input
                    type="password"
                    value={exportPassphrase}
                    onChange={e => setExportPassphrase(e.target.value)}
                    placeholder="Create a strong backup passphrase..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                  />
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    ⚠️ <strong>Warning:</strong> Passphrase is never saved or transmitted. If you forget it, the backup file cannot be decrypted by anyone.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Generating Backup...' : 'Download JSON Backup'}</span>
            </button>
          </div>
        )}

        {/* Import tab */}
        {tab === 'import' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select PocketLedger Backup File (.json)
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-700 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-200"
              />
            </div>

            {/* If encrypted, prompt for passphrase */}
            {isEncryptedFile && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/30 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <KeyRound className="h-4 w-4 text-amber-600" />
                  <span>This backup is encrypted with AES-GCM</span>
                </div>
                <input
                  type="password"
                  value={importPassphrase}
                  onChange={e => setImportPassphrase(e.target.value)}
                  placeholder="Enter backup decryption passphrase..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
                <button
                  onClick={handleDecryptAndPreview}
                  disabled={isProcessing}
                  className="w-full rounded-xl bg-amber-600 py-2 text-xs font-bold text-white shadow hover:bg-amber-500 transition-all"
                >
                  {isProcessing ? 'Decrypting...' : 'Decrypt & Inspect Contents'}
                </button>
              </div>
            )}

            {/* Backup Preview */}
            {parsedBackup && (
              <div className="rounded-xl border border-slate-200 p-3.5 dark:border-navy-800 bg-slate-50 dark:bg-navy-950/50 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-navy-900 dark:text-white">
                  <span className="flex items-center space-x-1.5">
                    <FileCheck className="h-4 w-4 text-emerald-500" />
                    <span>Backup Preview Verified</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Exported: {parsedBackup.exportedAt ? new Date(parsedBackup.exportedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-white p-2 dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
                    <div className="font-bold text-navy-900 dark:text-white">{parsedBackup.accounts.length}</div>
                    <div className="text-[10px] text-slate-400">Accounts</div>
                  </div>
                  <div className="rounded-lg bg-white p-2 dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
                    <div className="font-bold text-navy-900 dark:text-white">{parsedBackup.transactions.length}</div>
                    <div className="text-[10px] text-slate-400">Transactions</div>
                  </div>
                  <div className="rounded-lg bg-white p-2 dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
                    <div className="font-bold text-navy-900 dark:text-white">{parsedBackup.budgets.length}</div>
                    <div className="text-[10px] text-slate-400">Budgets</div>
                  </div>
                </div>

                {/* Merge vs Replace selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Restoration Mode:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer ${
                      restoreMode === 'merge' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : 'border-slate-200 dark:border-navy-800'
                    }`}>
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="text-emerald-600"
                      />
                      <span><strong>Merge</strong> (Keep existing data)</span>
                    </label>

                    <label className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer ${
                      restoreMode === 'replace' ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-navy-800'
                    }`}>
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'replace'}
                        onChange={() => setRestoreMode('replace')}
                        className="text-rose-600"
                      />
                      <span><strong>Replace</strong> (Wipe & load backup)</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleConfirmRestore}
                  disabled={isProcessing}
                  className={`w-full rounded-xl py-2.5 text-xs font-bold text-white shadow transition-all ${
                    restoreMode === 'replace'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {isProcessing ? 'Restoring Records...' : `Confirm & ${restoreMode === 'replace' ? 'Replace Everything' : 'Merge Records'}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
