import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  calculateFinancialSummary,
  calculateCategorySpending,
  calculateBudgetPerformance,
  filterTransactionsByDateRange,
  getDateRangeForPreset,
  formatCurrency,
} from '../../services/financeMath';
import { CashflowChart } from './CashflowChart';
import { CategoryDonutChart } from './CategoryDonutChart';
import { QuickActionModal } from './QuickActionModal';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  Plus,
  ArrowRightLeft,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from 'lucide-react';
import { TransactionType } from '../../types';

export const DashboardView: React.FC = () => {
  const { accounts, transactions, categories, budgets, settings, setActiveTab } = useApp();

  const [datePreset, setDatePreset] = useState<'this_month' | 'last_month' | 'this_year' | 'custom'>('this_month');
  const [customStart, setCustomStart] = useState<string>(getDateRangeForPreset('this_month').startDate);
  const [customEnd, setCustomEnd] = useState<string>(getDateRangeForPreset('this_month').endDate);

  const [quickModalOpen, setQuickModalOpen] = useState<boolean>(false);
  const [quickModalType, setQuickModalType] = useState<TransactionType>('expense');

  // Compute active date range
  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return { startDate: customStart, endDate: customEnd };
    }
    return getDateRangeForPreset(datePreset);
  }, [datePreset, customStart, customEnd]);

  // Filter transactions for period
  const periodTransactions = useMemo(() => {
    return filterTransactionsByDateRange(transactions, dateRange.startDate, dateRange.endDate);
  }, [transactions, dateRange]);

  const currency = settings.defaultCurrency || 'PKR';

  // Summaries
  const summary = useMemo(() => {
    return calculateFinancialSummary(accounts, periodTransactions, currency);
  }, [accounts, periodTransactions, currency]);

  // Category spending
  const categorySpending = useMemo(() => {
    return calculateCategorySpending(periodTransactions, categories, currency);
  }, [periodTransactions, categories, currency]);

  // Budget performance
  const budgetPerformances = useMemo(() => {
    return calculateBudgetPerformance(budgets, periodTransactions, categories, currency);
  }, [budgets, periodTransactions, categories, currency]);

  const recentTransactions = transactions.slice(0, 6);

  const handleOpenAction = (type: TransactionType) => {
    setQuickModalType(type);
    setQuickModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Quick Download Android APK Card */}
      <div className="rounded-2xl bg-gradient-to-r from-navy-900 via-navy-800 to-emerald-950 p-4 text-white shadow-lg border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Download className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>Install PocketLedger App on Mobile</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 font-medium">New APK</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Click below to download and install the native Android APK directly on your phone.
            </p>
          </div>
        </div>
        <a
          href="/PocketLedger.apk"
          download="PocketLedger.apk"
          className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-navy-950 hover:bg-emerald-400 shadow-md transition-all active:scale-95"
        >
          <Download className="h-4 w-4" />
          <span>Download & Install APK (4.2 MB)</span>
        </a>
      </div>

      {/* Top Header & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Overview of your financial performance & cash flows
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-navy-900 border border-slate-200/60 dark:border-navy-800">
            <button
              onClick={() => setDatePreset('this_month')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                datePreset === 'this_month'
                  ? 'bg-white text-navy-900 shadow-sm dark:bg-emerald-600 dark:text-white'
                  : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDatePreset('last_month')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                datePreset === 'last_month'
                  ? 'bg-white text-navy-900 shadow-sm dark:bg-emerald-600 dark:text-white'
                  : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setDatePreset('this_year')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                datePreset === 'this_year'
                  ? 'bg-white text-navy-900 shadow-sm dark:bg-emerald-600 dark:text-white'
                  : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              This Year
            </button>
            <button
              onClick={() => setDatePreset('custom')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                datePreset === 'custom'
                  ? 'bg-white text-navy-900 shadow-sm dark:bg-emerald-600 dark:text-white'
                  : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Custom
            </button>
          </div>

          {datePreset === 'custom' && (
            <div className="flex items-center space-x-1 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-navy-700 dark:bg-navy-900 dark:text-white"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-navy-700 dark:bg-navy-900 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Balance */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Balance
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-navy-50 text-navy-800 dark:bg-navy-800 dark:text-emerald-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-navy-900 dark:text-white">
            {formatCurrency(summary.totalBalance, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Across active accounts</div>
        </div>

        {/* Total Income */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Income
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totalIncome, currency)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center">
            <ArrowUpRight className="h-3 w-3 mr-0.5" /> For period
          </div>
        </div>

        {/* Total Expenses */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Expenses
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(summary.totalExpense, currency)}
          </div>
          <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center">
            <ArrowDownRight className="h-3 w-3 mr-0.5" /> For period
          </div>
        </div>

        {/* Net Savings */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Savings
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-navy-50 text-navy-800 dark:bg-navy-800 dark:text-gold-400">
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <div
            className={`mt-2 text-xl sm:text-2xl font-black ${
              summary.netSavings >= 0
                ? 'text-navy-900 dark:text-white'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(summary.netSavings, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Income minus expenses</div>
        </div>

        {/* Savings Rate */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Savings Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-50 text-gold-600 dark:bg-gold-950/60 dark:text-gold-400">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-navy-900 dark:text-white">
            {summary.savingsRate}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Of total income</div>
        </div>
      </div>

      {/* Quick Action Buttons Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => handleOpenAction('expense')}
          className="flex items-center space-x-2 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Expense</span>
        </button>
        <button
          onClick={() => handleOpenAction('income')}
          className="flex items-center space-x-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Income</span>
        </button>
        <button
          onClick={() => handleOpenAction('transfer')}
          className="flex items-center space-x-2 rounded-xl bg-navy-50 px-4 py-2.5 text-xs font-bold text-navy-800 hover:bg-navy-100 dark:bg-navy-900 dark:text-slate-300 dark:hover:bg-navy-800 border border-navy-200 dark:border-navy-700 transition-all"
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Transfer Funds</span>
        </button>
      </div>

      {/* Budget Alerts Banner if any are in warning or over budget */}
      {budgetPerformances.some(b => b.isWarning || b.isOverBudget) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="w-full">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Budget Warnings for this Period
              </h4>
              <div className="mt-2 space-y-1.5">
                {budgetPerformances
                  .filter(b => b.isWarning || b.isOverBudget)
                  .map(b => (
                    <div key={b.budget.id} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-amber-950 dark:text-amber-300">
                        {b.categoryName}:{' '}
                        <span className="font-semibold">
                          {b.percentageUsed}% used ({formatCurrency(b.actualSpent, currency)} /{' '}
                          {formatCurrency(b.budget.amount, currency)})
                        </span>
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          b.isOverBudget
                            ? 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                            : 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                        }`}
                      >
                        {b.isOverBudget ? 'Exceeded' : 'Warning (75%+)'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                Income vs Expenses (Past 6 Months)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Monthly trend of earnings vs outlays
              </p>
            </div>
          </div>
          <CashflowChart transactions={transactions} currency={currency} />
        </div>

        {/* Expense Breakdown Donut */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                Spending Breakdown
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                By category for current period
              </p>
            </div>
          </div>
          <CategoryDonutChart categories={categorySpending} currency={currency} />
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">
              Recent Transactions
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Latest activity recorded in your offline ledger
            </p>
          </div>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          >
            View All ({transactions.length})
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No transactions recorded yet. Click "Add Transaction" to begin.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-navy-800">
            {recentTransactions.map(tx => {
              const cat = categories.find(c => c.id === tx.categoryId);
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3 truncate">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${
                        isIncome
                          ? 'bg-emerald-500'
                          : isTransfer
                          ? 'bg-navy-700'
                          : 'bg-rose-500'
                      }`}
                    >
                      {isIncome ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : isTransfer ? (
                        <ArrowRightLeft className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-navy-900 dark:text-white truncate">
                        {tx.payee || cat?.name || (isTransfer ? 'Transfer' : 'Transaction')}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>{tx.date}</span>
                        {tx.note && <span>• {tx.note}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs font-mono font-bold ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isTransfer
                          ? 'text-navy-700 dark:text-slate-300'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '' : '-'}
                      {formatCurrency(tx.amount, tx.currency)}
                    </p>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      {tx.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Action Modal */}
      <QuickActionModal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        defaultType={quickModalType}
      />
    </div>
  );
};
