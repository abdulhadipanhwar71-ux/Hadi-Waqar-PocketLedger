import { describe, it, expect } from 'vitest';
import {
  encryptBackupData,
  decryptBackupData,
  validateBackupStructure,
} from '../services/cryptoBackup';
import { BackupData } from '../types';

describe('Crypto Backup & Validation Engine', () => {
  const dummyBackup: BackupData = {
    version: 1,
    exportedAt: '2026-10-23T12:00:00Z',
    appName: 'PocketLedger',
    accounts: [
      { id: 'acc_1', name: 'Wallet', type: 'cash', currency: 'PKR', openingBalance: 1000, color: '#10b981', isArchived: false, createdAt: 1, updatedAt: 1 }
    ],
    transactions: [
      { id: 'tx_1', type: 'income', amount: 5000, currency: 'PKR', date: '2026-10-23', accountId: 'acc_1', categoryId: 'cat_1', createdAt: 1, updatedAt: 1 }
    ],
    categories: [
      { id: 'cat_1', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#10b981' }
    ],
    budgets: [],
    recurring: [],
    settings: {
      id: 'settings',
      defaultCurrency: 'PKR',
      dateFormat: 'YYYY-MM-DD',
      theme: 'system',
      budgetWarningThreshold: 75,
      isAppLockEnabled: false,
      autoLockMinutes: 5,
      language: 'en',
    },
  };

  it('validates a correct backup structure and rejects invalid formats', () => {
    expect(() => validateBackupStructure(dummyBackup)).not.toThrow();
    expect(() => validateBackupStructure({ appName: 'WrongApp' })).toThrow();
    expect(() => validateBackupStructure(null)).toThrow();
  });

  it('encrypts and decrypts backup payload using AES-GCM and PBKDF2', async () => {
    const passphrase = 'MySuperSecretPassphrase123!';
    const encrypted = await encryptBackupData(dummyBackup, passphrase);

    expect(encrypted.isEncrypted).toBe(true);
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.salt).toBeDefined();
    expect(encrypted.iv).toBeDefined();

    // Decrypt with correct passphrase
    const decrypted = await decryptBackupData(encrypted, passphrase);
    expect(decrypted.appName).toBe('PocketLedger');
    expect(decrypted.accounts.length).toBe(1);
    expect(decrypted.transactions[0].amount).toBe(5000);

    // Decrypt with wrong passphrase should fail safely
    await expect(decryptBackupData(encrypted, 'WrongPassphrase!')).rejects.toThrow();
  });
});
