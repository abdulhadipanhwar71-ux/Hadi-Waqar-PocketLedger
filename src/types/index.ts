export type TransactionType = 'income' | 'expense' | 'transfer';

export type AccountType = 'cash' | 'bank' | 'wallet' | 'custom';

export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: number; // Stored in minor units (e.g., paisas/cents)
  color: string;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // Stored in minor units (e.g. 1000 = 10.00)
  currency: string;
  date: string; // ISO date 'YYYY-MM-DD'
  accountId: string; // Source account (or only account for income/expense)
  toAccountId?: string; // Target account for transfer
  categoryId: string;
  note?: string;
  payee?: string;
  tags?: string[];
  recurringId?: string; // Reference to recurring transaction if auto-generated
  createdAt: number;
  updatedAt: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number; // Minor units
  currency: string;
  period: 'monthly' | 'custom';
  startDate?: string;
  endDate?: string;
  warningThresholdPercent: number; // Default 75
}

export interface RecurringTransaction {
  id: string;
  title: string;
  type: TransactionType;
  amount: number; // Minor units
  currency: string;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // Optional end date
  nextDueDate: string; // YYYY-MM-DD
  lastProcessedDate?: string;
  accountId: string;
  toAccountId?: string;
  categoryId: string;
  note?: string;
  payee?: string;
  isPaused: boolean;
  createdAt: number;
}

export interface AppSettings {
  id: string; // 'settings'
  defaultCurrency: string;
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  theme: 'light' | 'dark' | 'system';
  budgetWarningThreshold: number; // Default 75%
  isAppLockEnabled: boolean;
  appLockPinHash?: string; // Salted PBKDF2 hash
  appLockSalt?: string;
  autoLockMinutes: number;
  language: 'en' | 'ur';
}

export interface BackupData {
  version: number;
  exportedAt: string;
  appName: 'PocketLedger';
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  recurring: RecurringTransaction[];
  settings: AppSettings;
}

export interface EncryptedBackupPayload {
  version: number;
  isEncrypted: true;
  appName: 'PocketLedger';
  salt: string; // Hex/base64 salt for PBKDF2
  iv: string; // Hex/base64 IV for AES-GCM
  ciphertext: string; // Base64 encrypted JSON
}
