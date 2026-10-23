import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Repository } from '../../db/repository';
import { Category } from '../../types';
import { CategoryModal } from './CategoryModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Tags, Plus, Edit2, Trash2 } from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const { categories, transactions, refreshData, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<Category | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const filteredCategories = categories.filter(c => c.type === activeTab);

  const handleEdit = (cat: Category) => {
    setCategoryToEdit(cat);
    setModalOpen(true);
  };

  const handleDeletePrompt = (cat: Category) => {
    setDeleteErrorMessage(null);
    setConfirmDeleteCat(cat);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteCat) return;
    const res = await Repository.deleteCategory(confirmDeleteCat.id);
    if (!res.success) {
      setDeleteErrorMessage(res.error || 'Failed to delete category.');
      return;
    }
    await refreshData();
    showToast(`Category "${confirmDeleteCat.name}" deleted.`, 'success');
    setConfirmDeleteCat(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
            Categories
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure custom income streams and expense classifications
          </p>
        </div>

        <button
          onClick={() => {
            setCategoryToEdit(null);
            setModalOpen(true);
          }}
          className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-navy-900 w-fit border border-slate-200/60 dark:border-navy-800">
        <button
          onClick={() => setActiveTab('expense')}
          className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'expense'
              ? 'bg-white text-navy-900 shadow-sm dark:bg-rose-600 dark:text-white'
              : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Expense Categories ({categories.filter(c => c.type === 'expense').length})
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'income'
              ? 'bg-white text-navy-900 shadow-sm dark:bg-emerald-600 dark:text-white'
              : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Income Categories ({categories.filter(c => c.type === 'income').length})
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {filteredCategories.map(cat => {
          const count = transactions.filter(t => t.categoryId === cat.id).length;

          return (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900"
            >
              <div className="flex items-center space-x-3 truncate">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                  style={{ backgroundColor: cat.color || '#64748b' }}
                >
                  <Tags className="h-5 w-5" />
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-bold text-navy-900 dark:text-white truncate">
                    {cat.name}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {count} {count === 1 ? 'transaction' : 'transactions'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0 ml-2">
                <button
                  onClick={() => handleEdit(cat)}
                  className="rounded p-1 text-slate-400 hover:text-navy-900 dark:hover:text-white"
                  title="Edit Category"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeletePrompt(cat)}
                  className="rounded p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                  title="Delete Category"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
      />

      {/* Delete / In-Use Alert */}
      {confirmDeleteCat && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Category"
          message={
            deleteErrorMessage
              ? deleteErrorMessage
              : `Are you sure you want to delete category "${confirmDeleteCat.name}"? If any transactions are currently linked to it, deletion is prevented to protect your history.`
          }
          confirmLabel={deleteErrorMessage ? 'OK' : 'Delete'}
          onConfirm={deleteErrorMessage ? () => setConfirmDeleteCat(null) : handleConfirmDelete}
          onCancel={() => setConfirmDeleteCat(null)}
        />
      )}
    </div>
  );
};
