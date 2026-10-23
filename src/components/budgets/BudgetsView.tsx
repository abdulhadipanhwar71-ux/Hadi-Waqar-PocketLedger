import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Repository } from '../../db/repository';
import { Budget } from '../../types';
import {
  calculateBudgetPerformance,
  formatCurrency,
  getDateRangeForPreset,
  filterTransactionsByDateRange,
} from '../../services/financeMath';
import { BudgetModal } from './BudgetModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import {
  PiggyBank,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export const BudgetsView: React.FC = () => {
  const { budgets, transactions, categories, settings, refreshData, showToast } = useApp();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [confirmDeleteBudget, setConfirmDeleteBudget] = useState<Budget | null>(null);

  const currency = settings.defaultCurrency || 'PKR';

  // Filter transactions for this month for standard monthly budgets
  const thisMonthRange = getDateRangeForPreset('this_month');
  const thisMonthTransactions = useMemo(() => {
    return filterTransactionsByDateRange(transactions, thisMonthRange.startDate, thisMonthRange.endDate);
  }, [transactions, thisMonthRange]);

  const budgetPerformances = useMemo(() => {
    return calculateBudgetPerformance(budgets, thisMonthTransactions, categories, currency);
  }, [budgets, thisMonthTransactions, categories, currency]);

  // Overall totals
  const overallSummary = useMemo(() => {
    const totalBudget = budgetPerformances.reduce((sum, b) => sum + b.budget.amount, 0);
    const totalSpent = budgetPerformances.reduce((sum, b) => sum + b.actualSpent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    return { totalBudget, totalSpent, totalRemaining, overallPct };
  }, [budgetPerformances]);

  const handleEdit = (b: Budget) => {
    setBudgetToEdit(b);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteBudget) return;
    await Repository.deleteBudget(confirmDeleteBudget.id);
    await refreshData();
    showToast('Budget deleted successfully.', 'info');
    setConfirmDeleteBudget(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
            Budgets & Spending Limits
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Keep your category expenses within control for this calendar month
          </p>
        </div>

        <button
          onClick={() => {
            setBudgetToEdit(null);
            setModalOpen(true);
          }}
          className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Set Budget</span>
        </button>
      </div>

      {/* Overall Summary Card */}
      {budgets.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:border-navy-800 dark:bg-navy-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Monthly Budget
              </span>
              <div className="mt-1 flex items-baseline space-x-3">
                <span className="text-2xl font-black text-navy-900 dark:text-white font-mono">
                  {formatCurrency(overallSummary.totalSpent, currency)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  of {formatCurrency(overallSummary.totalBudget, currency)} limit
                </span>
              </div>
            </div>

            <div className="text-right sm:self-center">
              <span className={`text-sm font-extrabold font-mono ${
                overallSummary.overallPct >= 100
                  ? 'text-rose-600 dark:text-rose-400'
                  : overallSummary.overallPct >= 75
                  ? 'text-amber-500'
                  : 'text-emerald-500'
              }`}>
                {overallSummary.overallPct}% utilized
              </span>
              <p className="text-xs text-slate-400">
                {overallSummary.totalRemaining >= 0
                  ? `${formatCurrency(overallSummary.totalRemaining, currency)} remaining`
                  : `${formatCurrency(Math.abs(overallSummary.totalRemaining), currency)} over budget`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-3 w-full rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallSummary.overallPct >= 100
                  ? 'bg-rose-500'
                  : overallSummary.overallPct >= 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallSummary.overallPct)}%` }}
            />
          </div>
        </div>
      )}

      {/* Budget List Grid */}
      {budgetPerformances.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No Budgets Defined"
          description="Create budgets for your frequent expense categories to get real-time warnings before overspending."
          actionLabel="Create Budget"
          onAction={() => {
            setBudgetToEdit(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetPerformances.map(bp => {
            return (
              <div
                key={bp.budget.id}
                className={`rounded-2xl bg-white p-5 shadow-sm border transition-all dark:bg-navy-900 ${
                  bp.isOverBudget
                    ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20'
                    : bp.isWarning
                    ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/20'
                    : 'border-slate-200/80 dark:border-navy-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ backgroundColor: bp.categoryColor }}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                        {bp.categoryName}
                      </h3>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {bp.budget.period} limit
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(bp.budget)}
                      className="rounded p-1 text-slate-400 hover:text-navy-900 dark:hover:text-white"
                      title="Edit Budget"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteBudget(bp.budget)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                      title="Delete Budget"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Numbers */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div className="text-base font-black text-navy-900 dark:text-white font-mono">
                    {formatCurrency(bp.actualSpent, bp.budget.currency)}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    of {formatCurrency(bp.budget.amount, bp.budget.currency)}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      bp.isOverBudget
                        ? 'bg-rose-500'
                        : bp.isWarning
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, bp.percentageUsed)}%` }}
                  />
                </div>

                {/* Status indicator badge */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                    {bp.percentageUsed}% used
                  </span>

                  {bp.isOverBudget ? (
                    <span className="flex items-center space-x-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Over budget by {formatCurrency(Math.abs(bp.remaining), bp.budget.currency)}</span>
                    </span>
                  ) : bp.isWarning ? (
                    <span className="flex items-center space-x-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{formatCurrency(bp.remaining, bp.budget.currency)} left</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>{formatCurrency(bp.remaining, bp.budget.currency)} left</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / New Modal */}
      <BudgetModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setBudgetToEdit(null);
        }}
        budgetToEdit={budgetToEdit}
      />

      {/* Delete Confirmation */}
      {confirmDeleteBudget && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Budget"
          message="Are you sure you want to delete this budget limit? Your transactions will remain safe."
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteBudget(null)}
        />
      )}
    </div>
  );
};
