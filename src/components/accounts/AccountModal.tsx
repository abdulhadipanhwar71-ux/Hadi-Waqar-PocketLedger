import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Repository } from '../../db/repository';
import { Account, AccountType } from '../../types';
import { toMajorUnits, toMinorUnits } from '../../services/financeMath';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: Account | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  accountToEdit,
}) => {
  const { settings, refreshData, showToast } = useApp();

  const [name, setName] = useState<string>('');
  const [type, setType] = useState<AccountType>('bank');
  const [currency, setCurrency] = useState<string>(settings.defaultCurrency || 'PKR');
  const [openingBalanceStr, setOpeningBalanceStr] = useState<string>('0');
  const [color, setColor] = useState<string>('#3b82f6');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#64748b', // slate
  ];

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      setCurrency(accountToEdit.currency);
      setOpeningBalanceStr(toMajorUnits(accountToEdit.openingBalance).toString());
      setColor(accountToEdit.color || '#3b82f6');
    } else {
      setName('');
      setType('bank');
      setCurrency(settings.defaultCurrency || 'PKR');
      setOpeningBalanceStr('0');
      setColor('#3b82f6');
    }
    setError('');
  }, [accountToEdit, isOpen, settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide an account name.');
      return;
    }

    const parsedBalance = parseFloat(openingBalanceStr);
    if (isNaN(parsedBalance) || !Number.isFinite(parsedBalance) || parsedBalance < 0) {
      setError('Opening balance must be zero or a valid positive number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const minorOpening = toMinorUnits(parsedBalance);

      if (accountToEdit) {
        await Repository.updateAccount({
          ...accountToEdit,
          name: name.trim(),
          type,
          currency,
          openingBalance: minorOpening,
          color,
        });
        showToast('Account updated successfully.', 'success');
      } else {
        await Repository.addAccount({
          name: name.trim(),
          type,
          currency,
          openingBalance: minorOpening,
          color,
          isArchived: false,
        });
        showToast('Account created successfully.', 'success');
      }

      await refreshData();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={accountToEdit ? 'Edit Account' : 'Add New Account'}
      subtitle="Organize your funds locally"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 p-2.5 text-xs font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Account Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Meezan Bank, Cash Pocket, JazzCash"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-navy-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Account Type *
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as AccountType)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-navy-900 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="bank">Bank Account</option>
              <option value="cash">Cash in Hand</option>
              <option value="wallet">Digital Wallet</option>
              <option value="custom">Custom Account</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Currency *
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-navy-900 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="PKR">PKR (Rs)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AED">AED</option>
              <option value="SAR">SAR</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Opening Balance
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={openingBalanceStr}
            onChange={e => setOpeningBalanceStr(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-navy-900 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Initial funds in this account before any recorded transactions
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Card Color Accent
          </label>
          <div className="flex items-center space-x-2">
            {colors.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${
                  color === c ? 'scale-110 border-navy-900 dark:border-white' : 'border-transparent'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex space-x-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-navy-700 dark:text-slate-300 dark:hover:bg-navy-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-500 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? 'Saving...' : accountToEdit ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
