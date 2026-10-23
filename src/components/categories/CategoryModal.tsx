import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Repository } from '../../db/repository';
import { Category } from '../../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
}) => {
  const { refreshData, showToast } = useApp();

  const [name, setName] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState<string>('#10b981');
  const [icon, setIcon] = useState<string>('Tag');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const colors = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#14b8a6', // teal
    '#64748b', // slate
  ];

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setColor(categoryToEdit.color || '#10b981');
      setIcon(categoryToEdit.icon || 'Tag');
    } else {
      setName('');
      setType('expense');
      setColor('#10b981');
      setIcon('Tag');
    }
    setError('');
  }, [categoryToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a category name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (categoryToEdit) {
        await Repository.updateCategory({
          ...categoryToEdit,
          name: name.trim(),
          type,
          color,
          icon,
        });
        showToast('Category updated successfully.', 'success');
      } else {
        await Repository.addCategory({
          name: name.trim(),
          type,
          color,
          icon,
        });
        showToast('Category added successfully.', 'success');
      }

      await refreshData();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryToEdit ? 'Edit Category' : 'New Category'}
      subtitle="Organize your financial classification"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 p-2.5 text-xs font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Type toggle */}
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-navy-950">
          {(['expense', 'income'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold capitalize transition-all ${
                type === t
                  ? t === 'expense'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Category Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Groceries, Freelancing, Utilities"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-navy-900 focus:border-emerald-500 focus:outline-none dark:border-navy-700 dark:bg-navy-950 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Category Color
          </label>
          <div className="flex flex-wrap gap-2">
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
            {isSubmitting ? 'Saving...' : categoryToEdit ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
