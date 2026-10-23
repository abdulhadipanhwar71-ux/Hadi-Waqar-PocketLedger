import { describe, it, expect } from 'vitest';
import { generateTransactionsCsv } from '../services/csvExport';
import { Transaction, Account, Category } from '../types';

describe('CSV Export Engine', () => {
  it('correctly formats and escapes fields containing commas, quotes, and line breaks', () => {
    const accounts: Account[] = [
      { id: 'acc_1', name: 'Main Account', type: 'bank', currency: 'PKR', openingBalance: 0, color: '', isArchived: false, createdAt: 1, updatedAt: 1 },
    ];
    const categories: Category[] = [
      { id: 'cat_1', name: 'Groceries, Supermarket', type: 'expense', icon: '', color: '' },
    ];
    const transactions: Transaction[] = [
      {
        id: 'tx_1',
        type: 'expense',
        amount: 5425, // 54.25
        currency: 'PKR',
        date: '2026-10-23',
        accountId: 'acc_1',
        categoryId: 'cat_1',
        payee: 'Store "Mega" Mart',
        note: 'Milk, bread\nand eggs',
        tags: ['weekly', 'food'],
        createdAt: 1,
        updatedAt: 1,
      },
    ];

    const csv = generateTransactionsCsv(transactions, accounts, categories);

    // Verify headers
    expect(csv).toContain('Date,Type,Amount,Currency,Source Account,Destination Account,Category,Payee,Note,Tags');

    // Verify properly escaped quotes in payee
    expect(csv).toContain('"Store ""Mega"" Mart"');

    // Verify escaped comma in category
    expect(csv).toContain('"Groceries, Supermarket"');

    // Verify decimal formatted amount
    expect(csv).toContain('54.25');
  });
});
