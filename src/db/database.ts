import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Account, Category, Transaction, Budget, RecurringTransaction, AppSettings } from '../types';

export interface PocketLedgerDBSchema extends DBSchema {
  accounts: {
    key: string;
    value: Account;
    indexes: { 'by-name': string; 'by-currency': string };
  };
  categories: {
    key: string;
    value: Category;
    indexes: { 'by-type': string };
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-date': string;
      'by-account': string;
      'by-category': string;
      'by-type': string;
    };
  };
  budgets: {
    key: string;
    value: Budget;
    indexes: { 'by-category': string };
  };
  recurring: {
    key: string;
    value: RecurringTransaction;
    indexes: { 'by-next-due': string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'PocketLedgerDB';
const DB_VERSION = 1;

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  // Income
  { name: 'Salary', type: 'income', icon: 'Briefcase', color: '#10b981', isDefault: true },
  { name: 'Freelance & Business', type: 'income', icon: 'Laptop', color: '#06b6d4', isDefault: true },
  { name: 'Investments & Profit', type: 'income', icon: 'TrendingUp', color: '#8b5cf6', isDefault: true },
  { name: 'Gifts & Grants', type: 'income', icon: 'Gift', color: '#f59e0b', isDefault: true },
  { name: 'Other Income', type: 'income', icon: 'PlusCircle', color: '#64748b', isDefault: true },

  // Expenses
  { name: 'Groceries & Market', type: 'expense', icon: 'ShoppingCart', color: '#10b981', isDefault: true },
  { name: 'Food & Dining Out', type: 'expense', icon: 'Utensils', color: '#f97316', isDefault: true },
  { name: 'Housing & Rent', type: 'expense', icon: 'Home', color: '#3b82f6', isDefault: true },
  { name: 'Bills & Utilities', type: 'expense', icon: 'Zap', color: '#eab308', isDefault: true },
  { name: 'Transportation & Fuel', type: 'expense', icon: 'Car', color: '#6366f1', isDefault: true },
  { name: 'Healthcare & Medical', type: 'expense', icon: 'HeartPulse', color: '#ec4899', isDefault: true },
  { name: 'Shopping & Clothes', type: 'expense', icon: 'ShoppingBag', color: '#a855f7', isDefault: true },
  { name: 'Education & Learning', type: 'expense', icon: 'BookOpen', color: '#0ea5e9', isDefault: true },
  { name: 'Entertainment & Leisure', type: 'expense', icon: 'Film', color: '#14b8a6', isDefault: true },
  { name: 'Personal Care', type: 'expense', icon: 'Smile', color: '#f43f5e', isDefault: true },
  { name: 'Other Expense', type: 'expense', icon: 'HelpCircle', color: '#64748b', isDefault: true },
];

export const DEFAULT_ACCOUNTS: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Cash in Hand', type: 'cash', currency: 'PKR', openingBalance: 0, color: '#10b981', isArchived: false },
  { name: 'Bank Account', type: 'bank', currency: 'PKR', openingBalance: 0, color: '#3b82f6', isArchived: false },
  { name: 'Mobile Wallet', type: 'wallet', currency: 'PKR', openingBalance: 0, color: '#f59e0b', isArchived: false },
];

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'settings',
  defaultCurrency: 'PKR',
  dateFormat: 'YYYY-MM-DD',
  theme: 'system',
  budgetWarningThreshold: 75,
  isAppLockEnabled: false,
  autoLockMinutes: 5,
  language: 'en',
};

let dbPromise: Promise<IDBPDatabase<PocketLedgerDBSchema>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<PocketLedgerDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<PocketLedgerDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          // Accounts store
          const accountStore = db.createObjectStore('accounts', { keyPath: 'id' });
          accountStore.createIndex('by-name', 'name');
          accountStore.createIndex('by-currency', 'currency');

          // Categories store
          const catStore = db.createObjectStore('categories', { keyPath: 'id' });
          catStore.createIndex('by-type', 'type');

          // Transactions store
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-date', 'date');
          txStore.createIndex('by-account', 'accountId');
          txStore.createIndex('by-category', 'categoryId');
          txStore.createIndex('by-type', 'type');

          // Budgets store
          const budgetStore = db.createObjectStore('budgets', { keyPath: 'id' });
          budgetStore.createIndex('by-category', 'categoryId');

          // Recurring store
          const recurStore = db.createObjectStore('recurring', { keyPath: 'id' });
          recurStore.createIndex('by-next-due', 'nextDueDate');

          // Settings store
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function initializeDatabaseSeeds(): Promise<void> {
  const db = await getDatabase();

  // Seed settings if not exists
  const existingSettings = await db.get('settings', 'settings');
  if (!existingSettings) {
    await db.put('settings', DEFAULT_SETTINGS);
  }

  // Seed categories if empty
  const catCount = await db.count('categories');
  if (catCount === 0) {
    const tx = db.transaction('categories', 'readwrite');
    for (const cat of DEFAULT_CATEGORIES) {
      const id = 'cat_' + Math.random().toString(36).substring(2, 9);
      await tx.store.add({ ...cat, id });
    }
    await tx.done;
  }

  // Seed default accounts if empty
  const accCount = await db.count('accounts');
  if (accCount === 0) {
    const now = Date.now();
    const tx = db.transaction('accounts', 'readwrite');
    for (const acc of DEFAULT_ACCOUNTS) {
      const id = 'acc_' + Math.random().toString(36).substring(2, 9);
      await tx.store.add({ ...acc, id, createdAt: now, updatedAt: now });
    }
    await tx.done;
  }
}
