import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Repository } from '../../db/repository';
import { Transaction, TransactionType } from '../../types';
import { toMajorUnits, toMinorUnits } from '../../services/financeMath';
import { getTodayDateString } from '../../services/recurringService';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
}) => {
  const { accounts, categories, settings, refreshData, showToast } = useApp();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [currency, setCurrency] = useState<string>(settings.defaultCurrency || 'PKR');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [payee, setPayee] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [tagsStr, setTagsStr] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmountStr(toMajorUnits(transactionToEdit.amount).toString());
      setCurrency(transactionToEdit.currency);
      setDate(transactionToEdit.date);
      setAccountId(transactionToEdit.accountId);
      setToAccountId(transactionToEdit.toAccountId || '');
      setCategoryId(transactionToEdit.categoryId);
      setPayee(transactionToEdit.payee || '');
      setNote(transactionToEdit.note || '');
      setTagsStr((transactionToEdit.tags || []).join(', '));
    } else {
      setType('expense');
      setAmountStr('');
      setCurrency(settings.defaultCurrency || 'PKR');
      setDate(getTodayDateString());
      setAccountId(accounts[0]?.id || '');
      setToAccountId(accounts[1]?.id || '');
      const defaultExpCat = categories.find(c => c.type === 'expense');
      setCategoryId(defaultExpCat?.id || categories[0]?.id || '');
      setPayee('');
      setNote('');
      setTagsStr('');
    }
    setError('');
  }, [transactionToEdit, isOpen, accounts, categories, settings]);

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
      const minorAmount = toMinorUnits(parsedAmount);
      const tags = tagsStr
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      if (transactionToEdit) {
        await Repository.updateTransaction({
          ...transactionToEdit,
          type,
          amount: minorAmount,
          currency,
          date,
          accountId,
          toAccountId: type === 'transfer' ? toAccountId : undefined,
          categoryId: categoryId || categories[0]?.id || 'cat_default',
          payee: payee.trim() || undefined,
          note: note.trim() || undefined,
          tags,
        });
        showToast('Transaction updated successfully.', 'success');
      } else {
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
          tags,
        });
        showToast('Transaction added successfully.', 'success');
      }

      await refreshData();
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
      title={transactionToEdit ? 'Edit Transaction' : 'New Transaction'}
      subtitle="Keep records clean and accurate"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selector */}
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-navy-950">
          {(['expense', 'income', 'transfer'] as TransactionType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                setError('');
                const valid = categories.filter(c => c.type === (t === 'transfer' ? 'expense' : t));
                if (valid.length > 0) setCategoryId(valid[0].id);
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
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Date *
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
          />
        </div>

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

        {/* Payee and Tags */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payee / Payer
            </label>
            <input
              type="text"
              value={payee}
              onChange={e => setPayee(e.target.value)}
              placeholder="e.g. Shell, Office, Client"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={e => setTagsStr(e.target.value)}
              placeholder="tax, project, family"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Note (Optional)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add relevant details..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
          />
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
            {isSubmitting ? 'Saving...' : transactionToEdit ? 'Save Changes' : 'Create Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
