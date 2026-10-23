import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Repository } from '../../db/repository';
import { RecurringTransaction, RecurringFrequency, TransactionType } from '../../types';
import { toMajorUnits, toMinorUnits } from '../../services/financeMath';
import { getTodayDateString } from '../../services/recurringService';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringToEdit?: RecurringTransaction | null;
}

export const RecurringModal: React.FC<RecurringModalProps> = ({
  isOpen,
  onClose,
  recurringToEdit,
}) => {
  const { accounts, categories, settings, refreshData, showToast } = useApp();

  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [currency, setCurrency] = useState<string>(settings.defaultCurrency || 'PKR');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState<string>(getTodayDateString());
  const [endDate, setEndDate] = useState<string>('');
  const [nextDueDate, setNextDueDate] = useState<string>(getTodayDateString());
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [payee, setPayee] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (recurringToEdit) {
      setTitle(recurringToEdit.title);
      setType(recurringToEdit.type);
      setAmountStr(toMajorUnits(recurringToEdit.amount).toString());
      setCurrency(recurringToEdit.currency);
      setFrequency(recurringToEdit.frequency);
      setStartDate(recurringToEdit.startDate);
      setEndDate(recurringToEdit.endDate || '');
      setNextDueDate(recurringToEdit.nextDueDate);
      setAccountId(recurringToEdit.accountId);
      setToAccountId(recurringToEdit.toAccountId || '');
      setCategoryId(recurringToEdit.categoryId);
      setPayee(recurringToEdit.payee || '');
      setNote(recurringToEdit.note || '');
    } else {
      setTitle('');
      setType('expense');
      setAmountStr('');
      setCurrency(settings.defaultCurrency || 'PKR');
      setFrequency('monthly');
      const today = getTodayDateString();
      setStartDate(today);
      setEndDate('');
      setNextDueDate(today);
      setAccountId(accounts[0]?.id || '');
      setToAccountId(accounts[1]?.id || '');
      const defCat = categories.find(c => c.type === 'expense');
      setCategoryId(defCat?.id || categories[0]?.id || '');
      setPayee('');
      setNote('');
    }
    setError('');
  }, [recurringToEdit, isOpen, accounts, categories, settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a descriptive schedule title.');
      return;
    }

    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    if (!accountId) {
      setError('Please select an account.');
      return;
    }

    if (type === 'transfer' && (!toAccountId || accountId === toAccountId)) {
      setError('Transfers require two distinct accounts.');
      return;
    }

    if (type !== 'transfer' && !categoryId) {
      setError('Please select a category.');
      return;
    }

    setIsSubmitting(true);
    try {
      const minorAmount = toMinorUnits(parsedAmount);

      if (recurringToEdit) {
        await Repository.updateRecurring({
          ...recurringToEdit,
          title: title.trim(),
          type,
          amount: minorAmount,
          currency,
          frequency,
          startDate,
          endDate: endDate.trim() || undefined,
          nextDueDate,
          accountId,
          toAccountId: type === 'transfer' ? toAccountId : undefined,
          categoryId: categoryId || categories[0]?.id || 'cat_default',
          payee: payee.trim() || undefined,
          note: note.trim() || undefined,
        });
        showToast('Recurring schedule updated.', 'success');
      } else {
        await Repository.addRecurring({
          title: title.trim(),
          type,
          amount: minorAmount,
          currency,
          frequency,
          startDate,
          endDate: endDate.trim() || undefined,
          nextDueDate: startDate,
          accountId,
          toAccountId: type === 'transfer' ? toAccountId : undefined,
          categoryId: categoryId || categories[0]?.id || 'cat_default',
          payee: payee.trim() || undefined,
          note: note.trim() || undefined,
          isPaused: false,
        });
        showToast('Recurring schedule activated.', 'success');
      }

      await refreshData();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save recurring schedule.');
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
      title={recurringToEdit ? 'Edit Schedule' : 'New Recurring Transaction'}
      subtitle="Automated periodic income, expenses, or transfers"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 p-2.5 text-xs font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Schedule Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Monthly House Rent, Internet Bill, Salary"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-navy-900 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
          />
        </div>

        {/* Type selector */}
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-navy-950">
          {(['expense', 'income', 'transfer'] as TransactionType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                const valid = categories.filter(c => c.type === (t === 'transfer' ? 'expense' : t));
                if (valid.length > 0) setCategoryId(valid[0].id);
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold capitalize transition-all ${
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

        {/* Amount & Frequency */}
        <div className="grid grid-cols-3 gap-3">
          <div>
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-navy-900 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Frequency *
            </label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value as RecurringFrequency)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-navy-900 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-navy-900 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="AED">AED</option>
              <option value="SAR">SAR</option>
            </select>
          </div>
        </div>

        {/* Start Date & End Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                if (!recurringToEdit) setNextDueDate(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>
        </div>

        {/* Accounts & Category */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Account *
            </label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              {filteredCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
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
            {isSubmitting ? 'Saving...' : recurringToEdit ? 'Save Changes' : 'Create Schedule'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
