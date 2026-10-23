import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Repository } from '../../db/repository';
import { Transaction, TransactionType } from '../../types';
import { formatCurrency } from '../../services/financeMath';
import { TransactionModal } from './TransactionModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const { transactions, accounts, categories, settings, refreshData, showToast } = useApp();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Sorting & Pagination
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Modals & Dialogs
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [lastDeletedTx, setLastDeletedTx] = useState<Transaction | null>(null);

  const currency = settings.defaultCurrency || 'PKR';

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = categories.find(c => c.id === tx.categoryId);
        const acc = accounts.find(a => a.id === tx.accountId);
        const matchesPayee = tx.payee?.toLowerCase().includes(q);
        const matchesNote = tx.note?.toLowerCase().includes(q);
        const matchesCat = cat?.name.toLowerCase().includes(q);
        const matchesAcc = acc?.name.toLowerCase().includes(q);
        const matchesTags = tx.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesPayee && !matchesNote && !matchesCat && !matchesAcc && !matchesTags) {
          return false;
        }
      }

      // Type
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }

      // Account
      if (selectedAccountId !== 'all') {
        if (tx.accountId !== selectedAccountId && tx.toAccountId !== selectedAccountId) {
          return false;
        }
      }

      // Category
      if (selectedCategoryId !== 'all' && tx.categoryId !== selectedCategoryId) {
        return false;
      }

      // Date Range
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      return true;
    }).sort((a, b) => {
      if (sortField === 'date') {
        const cmp = a.date.localeCompare(b.date);
        return sortOrder === 'desc' ? -cmp : cmp;
      } else {
        const cmp = a.amount - b.amount;
        return sortOrder === 'desc' ? -cmp : cmp;
      }
    });
  }, [
    transactions,
    searchQuery,
    selectedType,
    selectedAccountId,
    selectedCategoryId,
    startDate,
    endDate,
    sortField,
    sortOrder,
    categories,
    accounts,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (tx: Transaction) => {
    setTxToEdit(tx);
    setModalOpen(true);
  };

  const handleDeletePrompt = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    const toDelete = transactions.find(t => t.id === confirmDeleteId);
    if (toDelete) {
      await Repository.deleteTransaction(toDelete.id);
      setLastDeletedTx(toDelete);
      await refreshData();
      showToast('Transaction deleted. You can undo this action below.', 'info');
    }
    setConfirmDeleteId(null);
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedTx) return;
    await Repository.addTransaction({
      type: lastDeletedTx.type,
      amount: lastDeletedTx.amount,
      currency: lastDeletedTx.currency,
      date: lastDeletedTx.date,
      accountId: lastDeletedTx.accountId,
      toAccountId: lastDeletedTx.toAccountId,
      categoryId: lastDeletedTx.categoryId,
      payee: lastDeletedTx.payee,
      note: lastDeletedTx.note,
      tags: lastDeletedTx.tags,
      recurringId: lastDeletedTx.recurringId,
    });
    setLastDeletedTx(null);
    await refreshData();
    showToast('Transaction restored successfully!', 'success');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
            Transactions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View, search, and manage all your income, expenses, and account transfers
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {lastDeletedTx && (
            <button
              onClick={handleUndoDelete}
              className="flex items-center space-x-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Undo Delete</span>
            </button>
          )}

          <button
            onClick={() => {
              setTxToEdit(null);
              setModalOpen(true);
            }}
            className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900 space-y-3">
        {/* Top search & type chips */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by payee, note, tag, or category..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          {/* Type filters */}
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-navy-950 shrink-0">
            {['all', 'expense', 'income', 'transfer'].map(t => (
              <button
                key={t}
                onClick={() => {
                  setSelectedType(t);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  selectedType === t
                    ? 'bg-white text-navy-900 shadow-sm dark:bg-emerald-600 dark:text-white'
                    : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-navy-800 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Account
            </label>
            <select
              value={selectedAccountId}
              onChange={e => {
                setSelectedAccountId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-800 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="all">All Accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Category
            </label>
            <select
              value={selectedCategoryId}
              onChange={e => {
                setSelectedCategoryId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-800 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-800 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-800 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="No matching transactions"
            description="Try modifying your filters, search keyword, or record a new transaction."
            actionLabel="Add Transaction"
            onAction={() => {
              setTxToEdit(null);
              setModalOpen(true);
            }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-950 border-b border-slate-100 dark:border-navy-800 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3 cursor-pointer hover:text-slate-600 dark:hover:text-white" onClick={() => {
                      if (sortField === 'date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortField('date'); setSortOrder('desc'); }
                    }}>
                      Date {sortField === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="px-4 py-3">Payee / Description</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Account</th>
                    <th className="px-4 py-3 text-right cursor-pointer hover:text-slate-600 dark:hover:text-white" onClick={() => {
                      if (sortField === 'amount') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortField('amount'); setSortOrder('desc'); }
                    }}>
                      Amount {sortField === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {paginatedTransactions.map(tx => {
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    const cat = categories.find(c => c.id === tx.categoryId);
                    const sourceAcc = accounts.find(a => a.id === tx.accountId);
                    const destAcc = tx.toAccountId ? accounts.find(a => a.id === tx.toAccountId) : null;

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-navy-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono">
                          {tx.date}
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate">
                          <div className="font-semibold text-navy-900 dark:text-white truncate">
                            {tx.payee || (isTransfer ? 'Account Transfer' : cat?.name || 'Transaction')}
                          </div>
                          {tx.note && (
                            <div className="text-[11px] text-slate-400 truncate">{tx.note}</div>
                          )}
                          {tx.tags && tx.tags.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                              {tx.tags.map(t => (
                                <span
                                  key={t}
                                  className="rounded bg-slate-100 px-1 py-0.2 text-[9px] text-slate-600 dark:bg-navy-800 dark:text-slate-300"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isTransfer ? (
                            <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-semibold text-navy-800 dark:bg-navy-800 dark:text-slate-300">
                              Transfer
                            </span>
                          ) : (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{
                                backgroundColor: `${cat?.color || '#94a3b8'}20`,
                                color: cat?.color || '#94a3b8',
                              }}
                            >
                              {cat?.name || 'Uncategorized'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {isTransfer ? (
                            <div className="flex items-center space-x-1">
                              <span>{sourceAcc?.name}</span>
                              <ArrowRightLeft className="h-3 w-3 text-slate-400" />
                              <span>{destAcc?.name}</span>
                            </div>
                          ) : (
                            sourceAcc?.name || 'Default'
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold">
                          <span
                            className={
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isTransfer
                                ? 'text-navy-700 dark:text-slate-300'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {isIncome ? '+' : isTransfer ? '' : '-'}
                            {formatCurrency(tx.amount, tx.currency)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleEdit(tx)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
                              title="Edit Transaction"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePrompt(tx.id)}
                              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                              title="Delete Transaction"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-navy-800 text-xs text-slate-500">
              <div>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{' '}
                {filteredTransactions.length} records
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-navy-700 dark:hover:bg-navy-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-semibold text-navy-900 dark:text-white">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-navy-700 dark:hover:bg-navy-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit / New Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setTxToEdit(null);
        }}
        transactionToEdit={txToEdit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction record? This will immediately recalculate your account balance and budget figures."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
