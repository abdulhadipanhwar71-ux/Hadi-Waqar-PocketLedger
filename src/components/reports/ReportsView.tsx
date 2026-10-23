import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  calculateFinancialSummary,
  calculateCategorySpending,
  calculateBudgetPerformance,
  calculateAccountBalance,
  filterTransactionsByDateRange,
  getDateRangeForPreset,
  formatCurrency,
  toMajorUnits,
} from '../../services/financeMath';
import { generateTransactionsCsv, downloadFile } from '../../services/csvExport';
import { PrintableReport } from './PrintableReport';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  FileSpreadsheet,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { accounts, transactions, categories, budgets, settings, showToast } = useApp();

  const [datePreset, setDatePreset] = useState<'this_month' | 'last_month' | 'this_year' | 'all' | 'custom'>('this_month');
  const [customStart, setCustomStart] = useState<string>(getDateRangeForPreset('this_month').startDate);
  const [customEnd, setCustomEnd] = useState<string>(getDateRangeForPreset('this_month').endDate);

  const currency = settings.defaultCurrency || 'PKR';

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return { startDate: customStart, endDate: customEnd };
    }
    return getDateRangeForPreset(datePreset);
  }, [datePreset, customStart, customEnd]);

  const periodTransactions = useMemo(() => {
    return filterTransactionsByDateRange(transactions, dateRange.startDate, dateRange.endDate);
  }, [transactions, dateRange]);

  const summary = useMemo(() => {
    return calculateFinancialSummary(accounts, periodTransactions, currency);
  }, [accounts, periodTransactions, currency]);

  const categorySpending = useMemo(() => {
    return calculateCategorySpending(periodTransactions, categories, currency);
  }, [periodTransactions, categories, currency]);

  const budgetPerformances = useMemo(() => {
    return calculateBudgetPerformance(budgets, periodTransactions, categories, currency);
  }, [budgets, periodTransactions, categories, currency]);

  const handleExportCsv = () => {
    if (periodTransactions.length === 0) {
      showToast('No transactions found for the selected period to export.', 'error');
      return;
    }
    const csvData = generateTransactionsCsv(periodTransactions, accounts, categories);
    const filename = `PocketLedger_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
    downloadFile(csvData, filename);
    showToast(`Exported ${periodTransactions.length} records to ${filename}`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Screen view hidden during print */}
      <div className="print:hidden space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
              Financial Reports & Analytics
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit cash flow performance, budget tracking, and account sheets
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200 dark:hover:bg-navy-800 transition-all"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 rounded-xl bg-navy-900 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-navy-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Date Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span>Select Report Window:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-navy-950 border border-slate-200/60 dark:border-navy-800">
              {(['this_month', 'last_month', 'this_year', 'all', 'custom'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setDatePreset(p)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all ${
                    datePreset === p
                      ? 'bg-white text-navy-900 shadow-sm dark:bg-emerald-600 dark:text-white'
                      : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {p.replace('_', ' ')}
                </button>
              ))}
            </div>

            {datePreset === 'custom' && (
              <div className="flex items-center space-x-1.5 text-xs">
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Inflows
            </span>
            <div className="mt-1.5 text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(summary.totalIncome, currency)}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Outflows
            </span>
            <div className="mt-1.5 text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {formatCurrency(summary.totalExpense, currency)}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Net Surplus / Deficit
            </span>
            <div
              className={`mt-1.5 text-xl font-black font-mono ${
                summary.netSavings >= 0 ? 'text-navy-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(summary.netSavings, currency)}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Effective Savings Rate
            </span>
            <div className="mt-1.5 text-xl font-black text-navy-900 dark:text-white font-mono">
              {summary.savingsRate}%
            </div>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-1">
            Category Spending Distribution
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">
            Total expenses categorized for this window
          </p>

          {categorySpending.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              No expenses recorded in the selected period.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-navy-800 text-xs">
              {categorySpending.map(cat => (
                <div key={cat.categoryId} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-semibold text-navy-900 dark:text-white">
                      {cat.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-28 h-2 rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden hidden sm:block">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: cat.color,
                          width: `${cat.percentage}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(cat.amount, currency)}
                    </span>
                    <span className="w-10 text-right font-mono text-slate-400 text-[11px]">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Account Balances Sheet */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-1">
            Current Account Balance Sheet
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">
            Reconciled balances across physical cash, bank deposits, and mobile wallets
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950 border-b border-slate-100 dark:border-navy-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Account</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Currency</th>
                  <th className="px-4 py-2.5 text-right">Current Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {accounts.filter(a => !a.isArchived).map(acc => {
                  const balance = calculateAccountBalance(acc, transactions);
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                      <td className="px-4 py-2.5 font-semibold text-navy-900 dark:text-white">
                        {acc.name}
                      </td>
                      <td className="px-4 py-2.5 capitalize text-slate-500">{acc.type}</td>
                      <td className="px-4 py-2.5 text-slate-500">{acc.currency}</td>
                      <td
                        className={`px-4 py-2.5 text-right font-mono font-bold ${
                          balance < 0 ? 'text-rose-600' : 'text-navy-900 dark:text-white'
                        }`}
                      >
                        {formatCurrency(balance, acc.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Printable Report Component for window.print() */}
      <PrintableReport
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        currency={currency}
        accounts={accounts}
        transactions={transactions}
        categories={categories}
        budgets={budgets}
      />
    </div>
  );
};
