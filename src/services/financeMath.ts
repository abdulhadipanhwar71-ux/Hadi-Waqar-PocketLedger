import { Account, Transaction, Budget, Category } from '../types';

export const MINOR_UNIT_FACTOR = 100;

export function toMinorUnits(majorAmount: number | string): number {
  const num = typeof majorAmount === 'string' ? parseFloat(majorAmount) : majorAmount;
  if (!Number.isFinite(num) || num < 0) {
    throw new Error('Invalid amount: must be a positive finite number');
  }
  return Math.round(num * MINOR_UNIT_FACTOR);
}

export function toMajorUnits(minorAmount: number): number {
  if (!Number.isFinite(minorAmount)) return 0;
  return minorAmount / MINOR_UNIT_FACTOR;
}

export function formatCurrency(
  minorAmount: number,
  currencyCode: string = 'PKR',
  showDecimals: boolean = true
): string {
  const major = toMajorUnits(minorAmount);
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    });
    return formatter.format(major);
  } catch {
    const symbol = currencyCode === 'PKR' ? 'Rs.' : currencyCode;
    return `${symbol} ${major.toLocaleString('en-US', {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    })}`;
  }
}

export function calculateAccountBalance(account: Account, transactions: Transaction[]): number {
  let balance = account.openingBalance;
  for (const tx of transactions) {
    if (tx.accountId === account.id) {
      if (tx.type === 'expense' || tx.type === 'transfer') {
        balance -= tx.amount;
      } else if (tx.type === 'income') {
        balance += tx.amount;
      }
    } else if (tx.toAccountId === account.id && tx.type === 'transfer') {
      balance += tx.amount;
    }
  }
  return balance;
}

export interface CurrencySummary {
  currency: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number; // percentage
  totalBalance: number;
}

export function calculateFinancialSummary(
  accounts: Account[],
  transactions: Transaction[],
  targetCurrency: string
): CurrencySummary {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    if (tx.currency !== targetCurrency) continue;
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else if (tx.type === 'expense') {
      totalExpense += tx.amount;
    }
    // Note: Transfers are strictly excluded from income & expenses
  }

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  let totalBalance = 0;
  for (const acc of accounts) {
    if (acc.currency === targetCurrency && !acc.isArchived) {
      totalBalance += calculateAccountBalance(acc, transactions);
    }
  }

  return {
    currency: targetCurrency,
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    totalBalance,
  };
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export function calculateCategorySpending(
  transactions: Transaction[],
  categories: Category[],
  targetCurrency: string
): CategorySpending[] {
  const expenseMap = new Map<string, number>();
  let totalExpenses = 0;

  for (const tx of transactions) {
    if (tx.currency !== targetCurrency || tx.type !== 'expense') continue;
    const current = expenseMap.get(tx.categoryId) || 0;
    expenseMap.set(tx.categoryId, current + tx.amount);
    totalExpenses += tx.amount;
  }

  const catMap = new Map(categories.map(c => [c.id, c]));
  const result: CategorySpending[] = [];

  for (const [catId, amount] of expenseMap.entries()) {
    const cat = catMap.get(catId);
    result.push({
      categoryId: catId,
      categoryName: cat?.name || 'Uncategorized',
      color: cat?.color || '#94a3b8',
      icon: cat?.icon || 'Tag',
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    });
  }

  return result.sort((a, b) => b.amount - a.amount);
}

export interface BudgetPerformance {
  budget: Budget;
  categoryName: string;
  categoryColor: string;
  actualSpent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  isWarning: boolean;
}

export function calculateBudgetPerformance(
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
  currency: string
): BudgetPerformance[] {
  const catMap = new Map(categories.map(c => [c.id, c]));

  return budgets
    .filter(b => b.currency === currency)
    .map(budget => {
      const cat = catMap.get(budget.categoryId);
      const qualifyingExpenses = transactions.filter(
        tx =>
          tx.type === 'expense' &&
          tx.categoryId === budget.categoryId &&
          tx.currency === budget.currency
      );

      const actualSpent = qualifyingExpenses.reduce((sum, tx) => sum + tx.amount, 0);
      const remaining = budget.amount - actualSpent;
      const percentageUsed = budget.amount > 0 ? Math.round((actualSpent / budget.amount) * 100) : 0;
      const warningThreshold = budget.warningThresholdPercent || 75;

      return {
        budget,
        categoryName: cat?.name || 'Category',
        categoryColor: cat?.color || '#64748b',
        actualSpent,
        remaining,
        percentageUsed,
        isOverBudget: actualSpent > budget.amount,
        isWarning: percentageUsed >= warningThreshold && actualSpent <= budget.amount,
      };
    });
}

export function filterTransactionsByDateRange(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): Transaction[] {
  return transactions.filter(tx => tx.date >= startDate && tx.date <= endDate);
}

export function getDateRangeForPreset(preset: 'this_month' | 'last_month' | 'this_year' | 'all'): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (preset === 'this_month') {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }

  if (preset === 'last_month') {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }

  if (preset === 'this_year') {
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    };
  }

  return {
    startDate: '1970-01-01',
    endDate: '2099-12-31',
  };
}
