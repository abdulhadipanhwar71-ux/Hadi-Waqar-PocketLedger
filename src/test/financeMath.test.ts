import { describe, it, expect } from 'vitest';
import {
  toMinorUnits,
  toMajorUnits,
  formatCurrency,
  calculateAccountBalance,
  calculateFinancialSummary,
  calculateCategorySpending,
  calculateBudgetPerformance,
  filterTransactionsByDateRange,
  getDateRangeForPreset,
} from '../services/financeMath';
import { Account, Transaction, Category, Budget } from '../types';

describe('Financial Math & Calculation Engine', () => {
  it('correctly converts between major and minor units with zero floating point drift', () => {
    expect(toMinorUnits(150.25)).toBe(15025);
    expect(toMinorUnits('49.99')).toBe(4999);
    expect(toMajorUnits(15025)).toBe(150.25);
    expect(toMajorUnits(4999)).toBe(49.99);

    expect(() => toMinorUnits(-10)).toThrow();
    expect(() => toMinorUnits(NaN)).toThrow();
  });

  it('formats currency with locale symbols for PKR and others', () => {
    const formattedPkr = formatCurrency(150000, 'PKR');
    expect(formattedPkr).toContain('1,500.00');

    const formattedUsd = formatCurrency(25000, 'USD');
    expect(formattedUsd).toContain('250.00');
  });

  it('calculates account balance including opening balance, income, expense, and transfers', () => {
    const bankAccount: Account = {
      id: 'acc_bank',
      name: 'Bank Account',
      type: 'bank',
      currency: 'PKR',
      openingBalance: 100000, // 1000.00 PKR
      color: '#3b82f6',
      isArchived: false,
      createdAt: 1000,
      updatedAt: 1000,
    };

    const cashAccount: Account = {
      id: 'acc_cash',
      name: 'Cash Pocket',
      type: 'cash',
      currency: 'PKR',
      openingBalance: 20000, // 200.00 PKR
      color: '#10b981',
      isArchived: false,
      createdAt: 1000,
      updatedAt: 1000,
    };

    const transactions: Transaction[] = [
      // Income: +500.00 into bank
      {
        id: 'tx_1',
        type: 'income',
        amount: 50000,
        currency: 'PKR',
        date: '2026-10-01',
        accountId: 'acc_bank',
        categoryId: 'cat_salary',
        createdAt: 1001,
        updatedAt: 1001,
      },
      // Expense: -150.00 from bank
      {
        id: 'tx_2',
        type: 'expense',
        amount: 15000,
        currency: 'PKR',
        date: '2026-10-02',
        accountId: 'acc_bank',
        categoryId: 'cat_groceries',
        createdAt: 1002,
        updatedAt: 1002,
      },
      // Transfer: 300.00 from bank to cash
      {
        id: 'tx_3',
        type: 'transfer',
        amount: 30000,
        currency: 'PKR',
        date: '2026-10-03',
        accountId: 'acc_bank',
        toAccountId: 'acc_cash',
        categoryId: 'cat_transfer',
        createdAt: 1003,
        updatedAt: 1003,
      },
    ];

    // Bank: 1000 (opening) + 500 (income) - 150 (expense) - 300 (transfer out) = 1050 (105000 minor)
    expect(calculateAccountBalance(bankAccount, transactions)).toBe(105000);

    // Cash: 200 (opening) + 300 (transfer in) = 500 (50000 minor)
    expect(calculateAccountBalance(cashAccount, transactions)).toBe(50000);
  });

  it('strictly excludes transfers from income, expenses, and savings rate calculations', () => {
    const accounts: Account[] = [
      {
        id: 'acc_1',
        name: 'Account 1',
        type: 'bank',
        currency: 'PKR',
        openingBalance: 0,
        color: '#3b82f6',
        isArchived: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'acc_2',
        name: 'Account 2',
        type: 'cash',
        currency: 'PKR',
        openingBalance: 0,
        color: '#10b981',
        isArchived: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    const transactions: Transaction[] = [
      {
        id: 'tx_inc',
        type: 'income',
        amount: 100000, // 1,000.00
        currency: 'PKR',
        date: '2026-10-01',
        accountId: 'acc_1',
        categoryId: 'cat_salary',
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'tx_exp',
        type: 'expense',
        amount: 40000, // 400.00
        currency: 'PKR',
        date: '2026-10-02',
        accountId: 'acc_1',
        categoryId: 'cat_food',
        createdAt: 2,
        updatedAt: 2,
      },
      // Transfer of 500.00 must NOT inflate income or expense
      {
        id: 'tx_tr',
        type: 'transfer',
        amount: 50000,
        currency: 'PKR',
        date: '2026-10-03',
        accountId: 'acc_1',
        toAccountId: 'acc_2',
        categoryId: 'cat_tr',
        createdAt: 3,
        updatedAt: 3,
      },
    ];

    const summary = calculateFinancialSummary(accounts, transactions, 'PKR');

    expect(summary.totalIncome).toBe(100000);
    expect(summary.totalExpense).toBe(40000);
    expect(summary.netSavings).toBe(60000);
    // Savings rate: (100000 - 40000) / 100000 = 60%
    expect(summary.savingsRate).toBe(60);
  });

  it('accurately computes budget performance, warning status, and over-budget detection', () => {
    const categories: Category[] = [
      { id: 'cat_food', name: 'Food', type: 'expense', icon: 'Utensils', color: '#f97316' },
      { id: 'cat_rent', name: 'Rent', type: 'expense', icon: 'Home', color: '#3b82f6' },
    ];

    const budgets: Budget[] = [
      {
        id: 'bgt_food',
        categoryId: 'cat_food',
        amount: 10000, // 100.00
        currency: 'PKR',
        period: 'monthly',
        warningThresholdPercent: 75,
      },
    ];

    // Case 1: 80% spent -> Warning triggered
    const txsWarning: Transaction[] = [
      {
        id: 'tx_1',
        type: 'expense',
        amount: 8000, // 80.00 (80%)
        currency: 'PKR',
        date: '2026-10-05',
        accountId: 'acc_1',
        categoryId: 'cat_food',
        createdAt: 1,
        updatedAt: 1,
      },
    ];

    const perfWarning = calculateBudgetPerformance(budgets, txsWarning, categories, 'PKR')[0];
    expect(perfWarning.actualSpent).toBe(8000);
    expect(perfWarning.remaining).toBe(2000);
    expect(perfWarning.percentageUsed).toBe(80);
    expect(perfWarning.isWarning).toBe(true);
    expect(perfWarning.isOverBudget).toBe(false);

    // Case 2: 120% spent -> Over-budget triggered
    const txsOver: Transaction[] = [
      {
        id: 'tx_2',
        type: 'expense',
        amount: 12000, // 120.00 (120%)
        currency: 'PKR',
        date: '2026-10-06',
        accountId: 'acc_1',
        categoryId: 'cat_food',
        createdAt: 2,
        updatedAt: 2,
      },
    ];

    const perfOver = calculateBudgetPerformance(budgets, txsOver, categories, 'PKR')[0];
    expect(perfOver.actualSpent).toBe(12000);
    expect(perfOver.remaining).toBe(-2000);
    expect(perfOver.percentageUsed).toBe(120);
    expect(perfOver.isOverBudget).toBe(true);
  });

  it('correctly filters transactions by date range', () => {
    const transactions: Transaction[] = [
      { id: '1', date: '2026-10-01', amount: 100, currency: 'PKR', type: 'expense', accountId: 'a', categoryId: 'c', createdAt: 1, updatedAt: 1 },
      { id: '2', date: '2026-10-15', amount: 200, currency: 'PKR', type: 'expense', accountId: 'a', categoryId: 'c', createdAt: 2, updatedAt: 2 },
      { id: '3', date: '2026-11-01', amount: 300, currency: 'PKR', type: 'expense', accountId: 'a', categoryId: 'c', createdAt: 3, updatedAt: 3 },
    ];

    const filtered = filterTransactionsByDateRange(transactions, '2026-10-05', '2026-10-25');
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('2');
  });
});
