import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Repository } from '../../db/repository';
import { Budget } from '../../types';
import { toMajorUnits, toMinorUnits } from '../../services/financeMath';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetToEdit?: Budget | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budgetToEdit,
}) => {
  const { categories, settings, refreshData, showToast } = useApp();

  const [categoryId, setCategoryId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [currency, setCurrency] = useState<string>(settings.defaultCurrency || 'PKR');
  const [warningThresholdPercent, setWarningThresholdPercent] = useState<number>(75);
  const [period, setPeriod] = useState<'monthly' | 'custom'>('monthly');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const expenseCategories = categories.filter(c => c.type === 'expense');

  useEffect(() => {
    if (budgetToEdit) {
      setCategoryId(budgetToEdit.categoryId);
      setAmountStr(toMajorUnits(budgetToEdit.amount).toString());
      setCurrency(budgetToEdit.currency);
      setWarningThresholdPercent(budgetToEdit.warningThresholdPercent || 75);
      setPeriod(budgetToEdit.period);
    } else {
      setCategoryId(expenseCategories[0]?.id || '');
      setAmountStr('');
      setCurrency(settings.defaultCurrency || 'PKR');
      setWarningThresholdPercent(75);
      setPeriod('monthly');
    }
    setError('');
  }, [budgetToEdit, isOpen, expenseCategories, settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Budget amount must be a positive number.');
      return;
    }

    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    setIsSubmitting(true);
    try {
      const minorAmount = toMinorUnits(parsedAmount);

      if (budgetToEdit) {
        await Repository.updateBudget({
          ...budgetToEdit,
          categoryId,
          amount: minorAmount,
          currency,
          period,
          warningThresholdPercent,
        });
        showToast('Budget updated successfully.', 'success');
      } else {
        await Repository.addBudget({
          categoryId,
          amount: minorAmount,
          currency,
          period,
          warningThresholdPercent,
        });
        showToast('Budget created successfully.', 'success');
      }

      await refreshData();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save budget.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budgetToEdit ? 'Edit Budget' : 'Set Category Budget'}
      subtitle="Control your spending thresholds"
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
            Category *
          </label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-navy-900 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
          >
            {expenseCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Monthly Limit *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amountStr}
              onChange={e => setAmountStr(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-navy-900 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Warning Alert Threshold ({warningThresholdPercent}%)
          </label>
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={warningThresholdPercent}
            onChange={e => setWarningThresholdPercent(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>50%</span>
            <span>75% (Standard)</span>
            <span>95%</span>
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
            {isSubmitting ? 'Saving...' : budgetToEdit ? 'Save Changes' : 'Create Budget'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
