import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Repository } from '../../db/repository';
import { Account } from '../../types';
import { calculateAccountBalance, formatCurrency } from '../../services/financeMath';
import { AccountModal } from './AccountModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Landmark,
  Wallet,
  Coins,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Archive,
  ArchiveRestore,
  AlertCircle,
} from 'lucide-react';

export const AccountsView: React.FC = () => {
  const { accounts, transactions, refreshData, showToast } = useApp();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState<Account | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Group balances by currency
  const currencyTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const acc of accounts) {
      if (acc.isArchived) continue;
      const bal = calculateAccountBalance(acc, transactions);
      const current = totals.get(acc.currency) || 0;
      totals.set(acc.currency, current + bal);
    }
    return Array.from(totals.entries()).map(([currency, total]) => ({
      currency,
      total,
    }));
  }, [accounts, transactions]);

  const handleEdit = (acc: Account) => {
    setAccountToEdit(acc);
    setModalOpen(true);
  };

  const handleToggleArchive = async (acc: Account) => {
    await Repository.updateAccount({
      ...acc,
      isArchived: !acc.isArchived,
    });
    await refreshData();
    showToast(
      acc.isArchived
        ? `Account "${acc.name}" unarchived.`
        : `Account "${acc.name}" archived.`,
      'info'
    );
  };

  const handleDeletePrompt = (acc: Account) => {
    setDeleteErrorMessage(null);
    setConfirmDeleteAccount(acc);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteAccount) return;
    const res = await Repository.deleteAccount(confirmDeleteAccount.id);
    if (!res.success) {
      setDeleteErrorMessage(res.error || 'Failed to delete account.');
      return;
    }
    await refreshData();
    showToast(`Account "${confirmDeleteAccount.name}" deleted.`, 'success');
    setConfirmDeleteAccount(null);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return Coins;
      case 'wallet':
        return Wallet;
      case 'bank':
        return Landmark;
      default:
        return CreditCard;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
            Accounts & Wallets
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your physical cash, bank deposits, and digital wallets
          </p>
        </div>

        <button
          onClick={() => {
            setAccountToEdit(null);
            setModalOpen(true);
          }}
          className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Currency Balances Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {currencyTotals.map(({ currency, total }) => (
          <div
            key={currency}
            className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {currency} Net Balance
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-navy-800 dark:text-slate-300">
                {currency}
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-navy-900 dark:text-white font-mono">
              {formatCurrency(total, currency)}
            </div>
          </div>
        ))}
      </div>

      {/* Accounts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => {
          const Icon = getAccountIcon(acc.type);
          const currentBalance = calculateAccountBalance(acc, transactions);
          const txCount = transactions.filter(
            t => t.accountId === acc.id || t.toAccountId === acc.id
          ).length;

          return (
            <div
              key={acc.id}
              className={`rounded-2xl bg-white p-5 shadow-sm border transition-all ${
                acc.isArchived
                  ? 'border-slate-200 bg-slate-50/50 opacity-60 dark:border-navy-800 dark:bg-navy-950/40'
                  : 'border-slate-200/80 hover:shadow-md dark:border-navy-800 dark:bg-navy-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm"
                    style={{ backgroundColor: acc.color || '#3b82f6' }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                        {acc.name}
                      </h3>
                      {acc.isArchived && (
                        <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[9px] font-semibold text-slate-700 dark:bg-navy-800 dark:text-slate-300">
                          Archived
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {acc.type} • {acc.currency}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleToggleArchive(acc)}
                    className="rounded p-1 text-slate-400 hover:text-navy-900 dark:hover:text-white"
                    title={acc.isArchived ? 'Unarchive' : 'Archive'}
                  >
                    {acc.isArchived ? (
                      <ArchiveRestore className="h-3.5 w-3.5" />
                    ) : (
                      <Archive className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(acc)}
                    className="rounded p-1 text-slate-400 hover:text-navy-900 dark:hover:text-white"
                    title="Edit Account"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePrompt(acc)}
                    className="rounded p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                    title="Delete Account"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Balance */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Current Balance
                  </span>
                  <div
                    className={`text-xl font-black font-mono mt-0.5 ${
                      currentBalance < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-navy-900 dark:text-white'
                    }`}
                  >
                    {formatCurrency(currentBalance, acc.currency)}
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400">
                  {txCount} {txCount === 1 ? 'record' : 'records'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Modal */}
      <AccountModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setAccountToEdit(null);
        }}
        accountToEdit={accountToEdit}
      />

      {/* Delete / Cannot Delete Dialog */}
      {confirmDeleteAccount && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Account"
          message={
            deleteErrorMessage
              ? deleteErrorMessage
              : `Are you sure you want to delete "${confirmDeleteAccount.name}"? If it contains any transactions, deletion will be blocked to safeguard your balance history.`
          }
          confirmLabel={deleteErrorMessage ? 'OK' : 'Delete'}
          onConfirm={deleteErrorMessage ? () => setConfirmDeleteAccount(null) : handleConfirmDelete}
          onCancel={() => setConfirmDeleteAccount(null)}
        />
      )}
    </div>
  );
};
