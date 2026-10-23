import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { DatePickerInput } from '../common/DatePickerInput';
import { useApp } from '../../context/AppContext';
import { Repository } from '../../db/repository';
import { toMinorUnits } from '../../services/financeMath';
import { getTodayDateString } from '../../services/recurringService';
import { TransactionType } from '../../types';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense',
}) => {
  const { accounts, categories, settings, refreshData, showToast } = useApp();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [amountStr, setAmountStr] = useState<string>('');
  const [currency, setCurrency] = useState<string>(settings.defaultCurrency || 'PKR');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(accounts[1]?.id || '');
  const [categoryId, setCategoryId] = useState<string>('');
  const [payee, setPayee] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync category on type change if not matching
  React.useEffect(() => {
    const validCats = categories.filter(c => c.type === (type === 'transfer' ? 'expense' : type));
    if (validCats.length > 0 && !validCats.some(c => c.id === categoryId)) {
      setCategoryId(validCats[0].id);
    }
  }, [type, categories, categoryId]);

  // Sync default account
  React.useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
    if (!toAccountId && accounts.length > 1) {
      setToAccountId(accounts[1].id);
    }
  }, [accounts, accountId, toAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || !Number.isFinite(parsedAmount)) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!accountId) {
      setError('Please select an account.');
      return;
    }

    if (type === 'transfer') {
      if (!toAccountId) {
        setError('Please select destination account.');
        return;
      }
      if (accountId === toAccountId) {
        setError('Source and destination accounts must be different.');
        return;
      }
    }

    if (type !== 'transfer' && !categoryId) {
      setError('Please select a category.');
      return;
    }

    setIsSubmitting(true);
    try {
      const minorAmount = Math.round(parsedAmount * 100);

      await Repository.addTransaction({
        type,
        amount: minorAmount,
        currency,
        date,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        categoryId: categoryId || categories[0]?.id || 'cat_default',
        payee: payee.trim() || undefined,
        note: note.trim() || undefined,
      });

      await refreshData();
      showToast(
        `${type === 'income' ? 'Income' : type === 'expense' ? 'Expense' : 'Transfer'} recorded successfully.`,
        'success'
      );
      // Reset form
      setAmountStr('');
      setPayee('');
      setNote('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c =>
    type === 'income' ? c.type === 'income' : c.type === 'expense'
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Transaction"
      subtitle="Update your local ledger immediately"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selector Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-navy-950">
          {(['expense', 'income', 'transfer'] as TransactionType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                setError('');
              }}
              className={`flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-all ${
                type === t
                  ? t === 'expense'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : t === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-navy-800 text-white shadow-sm dark:bg-emerald-700'
                  : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 p-2.5 text-xs font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Amount & Currency */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amountStr}
              onChange={e => setAmountStr(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold text-navy-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-navy-900 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
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

        {/* Date */}
        <DatePickerInput
          value={date}
          onChange={setDate}
          label="Date *"
          required={true}
        />

        {/* Accounts */}
        {type === 'transfer' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                From Account *
              </label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                {accounts.filter(a => !a.isArchived).map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                To Account *
              </label>
              <select
                value={toAccountId}
                onChange={e => setToAccountId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                {accounts.filter(a => !a.isArchived).map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account *
              </label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                {accounts.filter(a => !a.isArchived).map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Optional Payee and Note */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payee / Source
            </label>
            <input
              type="text"
              value={payee}
              onChange={e => setPayee(e.target.value)}
              placeholder="e.g. Supermarket, Client"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Monthly groceries"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
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
            {isSubmitting ? 'Saving...' : 'Save Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
