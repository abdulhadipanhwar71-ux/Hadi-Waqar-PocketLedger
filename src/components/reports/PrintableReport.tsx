import React from 'react';
import { Account, Transaction, Category, Budget } from '../../types';
import {
  calculateFinancialSummary,
  calculateCategorySpending,
  calculateAccountBalance,
  formatCurrency,
  toMajorUnits,
} from '../../services/financeMath';

interface PrintableReportProps {
  startDate: string;
  endDate: string;
  currency: string;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
}

export const PrintableReport: React.FC<PrintableReportProps> = ({
  startDate,
  endDate,
  currency,
  accounts,
  transactions,
  categories,
}) => {
  const periodTxs = transactions.filter(t => t.date >= startDate && t.date <= endDate);
  const summary = calculateFinancialSummary(accounts, periodTxs, currency);
  const categorySpending = calculateCategorySpending(periodTxs, categories, currency);

  return (
    <div id="printable-report" className="hidden print:block p-8 bg-white text-black font-sans">
      <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">PocketLedger Financial Statement</h1>
          <p className="text-xs text-gray-600 mt-1">
            Generated on {new Date().toLocaleDateString()} • Offline Client-side Report
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase text-gray-500">Report Period</p>
          <p className="text-sm font-semibold">{startDate} to {endDate}</p>
          <p className="text-xs text-gray-600">Currency: {currency}</p>
        </div>
      </div>

      {/* Summary Matrix */}
      <div className="grid grid-cols-4 gap-4 mb-8 border border-gray-300 p-4 rounded">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Income</p>
          <p className="text-lg font-bold text-green-700 font-mono mt-1">
            {formatCurrency(summary.totalIncome, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Expenses</p>
          <p className="text-lg font-bold text-red-700 font-mono mt-1">
            {formatCurrency(summary.totalExpense, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase">Net Savings</p>
          <p className="text-lg font-bold font-mono mt-1">
            {formatCurrency(summary.netSavings, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase">Savings Rate</p>
          <p className="text-lg font-bold font-mono mt-1">{summary.savingsRate}%</p>
        </div>
      </div>

      {/* Accounts Balances Table */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-3">
          Account Balances
        </h2>
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-gray-300 font-semibold text-gray-600">
              <th className="py-2">Account Name</th>
              <th className="py-2">Type</th>
              <th className="py-2">Currency</th>
              <th className="py-2 text-right">Current Balance</th>
            </tr>
          </thead>
          <tbody>
            {accounts.filter(a => !a.isArchived).map(acc => (
              <tr key={acc.id} className="border-b border-gray-100">
                <td className="py-2 font-medium">{acc.name}</td>
                <td className="py-2 capitalize">{acc.type}</td>
                <td className="py-2">{acc.currency}</td>
                <td className="py-2 text-right font-mono font-bold">
                  {formatCurrency(calculateAccountBalance(acc, transactions), acc.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category Expenses Breakdown */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-3">
          Category Expenses Breakdown
        </h2>
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-gray-300 font-semibold text-gray-600">
              <th className="py-2">Category</th>
              <th className="py-2 text-right">Amount</th>
              <th className="py-2 text-right">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {categorySpending.map(cat => (
              <tr key={cat.categoryId} className="border-b border-gray-100">
                <td className="py-2 font-medium">{cat.categoryName}</td>
                <td className="py-2 text-right font-mono">
                  {formatCurrency(cat.amount, currency)}
                </td>
                <td className="py-2 text-right font-mono">{cat.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Period Transactions */}
      <div>
        <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-3">
          Transactions in this Period ({periodTxs.length})
        </h2>
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-gray-300 font-semibold text-gray-600">
              <th className="py-1.5">Date</th>
              <th className="py-1.5">Type</th>
              <th className="py-1.5">Description</th>
              <th className="py-1.5">Category</th>
              <th className="py-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {periodTxs.slice(0, 50).map(tx => {
              const cat = categories.find(c => c.id === tx.categoryId);
              return (
                <tr key={tx.id} className="border-b border-gray-100">
                  <td className="py-1.5 font-mono">{tx.date}</td>
                  <td className="py-1.5 uppercase font-semibold">{tx.type}</td>
                  <td className="py-1.5">{tx.payee || tx.note || '-'}</td>
                  <td className="py-1.5">{cat?.name || 'Category'}</td>
                  <td className="py-1.5 text-right font-mono font-bold">
                    {formatCurrency(tx.amount, tx.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-[10px] text-gray-500">
        PocketLedger Offline Personal Finance Statement • No Remote Server Involved
      </div>
    </div>
  );
};
