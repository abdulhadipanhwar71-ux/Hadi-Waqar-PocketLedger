import { getDatabase, DEFAULT_SETTINGS } from './database';
import {
  Account,
  Category,
  Transaction,
  Budget,
  RecurringTransaction,
  AppSettings,
  BackupData,
} from '../types';

export const Repository = {
  // --- Accounts ---
  async getAllAccounts(): Promise<Account[]> {
    const db = await getDatabase();
    return db.getAll('accounts');
  },

  async getAccountById(id: string): Promise<Account | undefined> {
    const db = await getDatabase();
    return db.get('accounts', id);
  },

  async addAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    const db = await getDatabase();
    const now = Date.now();
    const newAccount: Account = {
      ...account,
      id: 'acc_' + Math.random().toString(36).substring(2, 9),
      createdAt: now,
      updatedAt: now,
    };
    await db.put('accounts', newAccount);
    return newAccount;
  },

  async updateAccount(account: Account): Promise<void> {
    const db = await getDatabase();
    await db.put('accounts', { ...account, updatedAt: Date.now() });
  },

  async deleteAccount(id: string): Promise<{ success: boolean; error?: string }> {
    const db = await getDatabase();
    const allTx = await db.getAll('transactions');
    const hasTransactions = allTx.some(tx => tx.accountId === id || tx.toAccountId === id);
    if (hasTransactions) {
      return {
        success: false,
        error: 'Cannot delete account because it contains transactions. Reassign or delete the transactions first, or archive this account instead.',
      };
    }
    await db.delete('accounts', id);
    return { success: true };
  },

  // --- Categories ---
  async getAllCategories(): Promise<Category[]> {
    const db = await getDatabase();
    return db.getAll('categories');
  },

  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const db = await getDatabase();
    const newCategory: Category = {
      ...category,
      id: 'cat_' + Math.random().toString(36).substring(2, 9),
    };
    await db.put('categories', newCategory);
    return newCategory;
  },

  async updateCategory(category: Category): Promise<void> {
    const db = await getDatabase();
    await db.put('categories', category);
  },

  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    const db = await getDatabase();
    const allTx = await db.getAll('transactions');
    const inUse = allTx.some(tx => tx.categoryId === id);
    if (inUse) {
      return {
        success: false,
        error: 'Cannot delete category while transactions are assigned to it.',
      };
    }
    await db.delete('categories', id);
    return { success: true };
  },

  // --- Transactions ---
  async getAllTransactions(): Promise<Transaction[]> {
    const db = await getDatabase();
    const txs = await db.getAll('transactions');
    return txs.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  },

  async addTransaction(txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const db = await getDatabase();
    const now = Date.now();
    const newTx: Transaction = {
      ...txData,
      id: 'tx_' + Math.random().toString(36).substring(2, 11),
      createdAt: now,
      updatedAt: now,
    };
    await db.put('transactions', newTx);
    return newTx;
  },

  async updateTransaction(tx: Transaction): Promise<void> {
    const db = await getDatabase();
    await db.put('transactions', { ...tx, updatedAt: Date.now() });
  },

  async deleteTransaction(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('transactions', id);
  },

  // --- Budgets ---
  async getAllBudgets(): Promise<Budget[]> {
    const db = await getDatabase();
    return db.getAll('budgets');
  },

  async addBudget(budget: Omit<Budget, 'id'>): Promise<Budget> {
    const db = await getDatabase();
    const newBudget: Budget = {
      ...budget,
      id: 'bgt_' + Math.random().toString(36).substring(2, 9),
    };
    await db.put('budgets', newBudget);
    return newBudget;
  },

  async updateBudget(budget: Budget): Promise<void> {
    const db = await getDatabase();
    await db.put('budgets', budget);
  },

  async deleteBudget(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('budgets', id);
  },

  // --- Recurring Transactions ---
  async getAllRecurring(): Promise<RecurringTransaction[]> {
    const db = await getDatabase();
    return db.getAll('recurring');
  },

  async addRecurring(rec: Omit<RecurringTransaction, 'id' | 'createdAt'>): Promise<RecurringTransaction> {
    const db = await getDatabase();
    const newRec: RecurringTransaction = {
      ...rec,
      id: 'rec_' + Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
    };
    await db.put('recurring', newRec);
    return newRec;
  },

  async updateRecurring(rec: RecurringTransaction): Promise<void> {
    const db = await getDatabase();
    await db.put('recurring', rec);
  },

  async deleteRecurring(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('recurring', id);
  },

  // --- Settings ---
  async getSettings(): Promise<AppSettings> {
    const db = await getDatabase();
    const settings = await db.get('settings', 'settings');
    return settings || DEFAULT_SETTINGS;
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const db = await getDatabase();
    const current = await this.getSettings();
    const updated: AppSettings = { ...current, ...settings, id: 'settings' };
    await db.put('settings', updated);
    return updated;
  },

  // --- Export & Backup ---
  async exportAllData(): Promise<BackupData> {
    const [accounts, transactions, categories, budgets, recurring, settings] = await Promise.all([
      this.getAllAccounts(),
      this.getAllTransactions(),
      this.getAllCategories(),
      this.getAllBudgets(),
      this.getAllRecurring(),
      this.getSettings(),
    ]);

    return {
      version: 1,
      appName: 'PocketLedger',
      exportedAt: new Date().toISOString(),
      accounts,
      transactions,
      categories,
      budgets,
      recurring,
      settings,
    };
  },

  async restoreBackupData(backup: BackupData, mode: 'replace' | 'merge'): Promise<void> {
    const db = await getDatabase();

    if (mode === 'replace') {
      const clearTx = db.transaction(
        ['accounts', 'transactions', 'categories', 'budgets', 'recurring', 'settings'],
        'readwrite'
      );
      await Promise.all([
        clearTx.objectStore('accounts').clear(),
        clearTx.objectStore('transactions').clear(),
        clearTx.objectStore('categories').clear(),
        clearTx.objectStore('budgets').clear(),
        clearTx.objectStore('recurring').clear(),
      ]);
      await clearTx.done;
    }

    // Insert accounts
    const accTx = db.transaction('accounts', 'readwrite');
    for (const acc of backup.accounts || []) {
      await accTx.store.put(acc);
    }
    await accTx.done;

    // Insert categories
    const catTx = db.transaction('categories', 'readwrite');
    for (const cat of backup.categories || []) {
      await catTx.store.put(cat);
    }
    await catTx.done;

    // Insert transactions
    const trTx = db.transaction('transactions', 'readwrite');
    for (const tx of backup.transactions || []) {
      await trTx.store.put(tx);
    }
    await trTx.done;

    // Insert budgets
    const bgTx = db.transaction('budgets', 'readwrite');
    for (const bg of backup.budgets || []) {
      await bgTx.store.put(bg);
    }
    await bgTx.done;

    // Insert recurring
    const rcTx = db.transaction('recurring', 'readwrite');
    for (const rc of backup.recurring || []) {
      await rcTx.store.put(rc);
    }
    await rcTx.done;

    // Settings
    if (backup.settings) {
      await db.put('settings', { ...backup.settings, id: 'settings' });
    }
  },

  async clearAllData(): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(
      ['accounts', 'transactions', 'categories', 'budgets', 'recurring'],
      'readwrite'
    );
    await Promise.all([
      tx.objectStore('accounts').clear(),
      tx.objectStore('transactions').clear(),
      tx.objectStore('categories').clear(),
      tx.objectStore('budgets').clear(),
      tx.objectStore('recurring').clear(),
    ]);
    await tx.done;
  },
};
