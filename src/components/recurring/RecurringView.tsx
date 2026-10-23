import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Repository } from '../../db/repository';
import { RecurringTransaction } from '../../types';
import { formatCurrency } from '../../services/financeMath';
import { RecurringModal } from './RecurringModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import {
  CalendarSync,
  Plus,
  Play,
  Pause,
  Edit2,
  Trash2,
  Info,
  Calendar,
  Clock,
  ArrowRightLeft,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export const RecurringView: React.FC = () => {
  const { recurring, accounts, categories, refreshData, showToast } = useApp();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [recurringToEdit, setRecurringToEdit] = useState<RecurringTransaction | null>(null);
  const [confirmDeleteRec, setConfirmDeleteRec] = useState<RecurringTransaction | null>(null);

  const handleEdit = (rec: RecurringTransaction) => {
    setRecurringToEdit(rec);
    setModalOpen(true);
  };

  const handleTogglePause = async (rec: RecurringTransaction) => {
    await Repository.updateRecurring({
      ...rec,
      isPaused: !rec.isPaused,
    });
    await refreshData();
    showToast(
      rec.isPaused
        ? `Schedule "${rec.title}" resumed.`
        : `Schedule "${rec.title}" paused.`,
      'info'
    );
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteRec) return;
    await Repository.deleteRecurring(confirmDeleteRec.id);
    await refreshData();
    showToast(`Schedule "${confirmDeleteRec.title}" deleted.`, 'info');
    setConfirmDeleteRec(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
            Recurring Schedules
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set up periodic recurring bills, rents, salaries, and auto-transfers
          </p>
        </div>

        <button
          onClick={() => {
            setRecurringToEdit(null);
            setModalOpen(true);
          }}
          className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Schedule</span>
        </button>
      </div>

      {/* Information Notice */}
      <div className="rounded-2xl border border-navy-100 bg-navy-50/50 p-4 dark:border-navy-800 dark:bg-navy-900/50">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong>Local Processing Notice:</strong> Because PocketLedger runs entirely offline inside your browser without any external cloud server or background daemon, recurring transactions are processed safely and posted as new records whenever you open the app on or after their due date.
          </p>
        </div>
      </div>

      {/* Schedules List */}
      {recurring.length === 0 ? (
        <EmptyState
          icon={CalendarSync}
          title="No Recurring Schedules"
          description="Automate repetitive expenses like rent, gym memberships, subscriptions, or salaries."
          actionLabel="Add Schedule"
          onAction={() => {
            setRecurringToEdit(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurring.map(rec => {
            const cat = categories.find(c => c.id === rec.categoryId);
            const sourceAcc = accounts.find(a => a.id === rec.accountId);
            const destAcc = rec.toAccountId ? accounts.find(a => a.id === rec.toAccountId) : null;
            const isIncome = rec.type === 'income';
            const isTransfer = rec.type === 'transfer';

            return (
              <div
                key={rec.id}
                className={`rounded-2xl bg-white p-5 shadow-sm border transition-all dark:bg-navy-900 ${
                  rec.isPaused
                    ? 'border-slate-200 bg-slate-50/50 opacity-60 dark:border-navy-800 dark:bg-navy-950/40'
                    : 'border-slate-200/80 hover:shadow-md dark:border-navy-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm ${
                        isIncome
                          ? 'bg-emerald-500'
                          : isTransfer
                          ? 'bg-navy-700'
                          : 'bg-rose-500'
                      }`}
                    >
                      {isIncome ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : isTransfer ? (
                        <ArrowRightLeft className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                        {rec.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {rec.frequency} • {rec.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleTogglePause(rec)}
                      className="rounded p-1 text-slate-400 hover:text-navy-900 dark:hover:text-white"
                      title={rec.isPaused ? 'Resume Schedule' : 'Pause Schedule'}
                    >
                      {rec.isPaused ? (
                        <Play className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Pause className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(rec)}
                      className="rounded p-1 text-slate-400 hover:text-navy-900 dark:hover:text-white"
                      title="Edit Schedule"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteRec(rec)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                      title="Delete Schedule"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800">
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-black font-mono text-navy-900 dark:text-white">
                      {formatCurrency(rec.amount, rec.currency)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {cat?.name || 'Category'}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Next due: <strong className="text-slate-800 dark:text-slate-200">{rec.nextDueDate}</strong></span>
                    </div>
                    {rec.lastProcessedDate && (
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>Last processed: {rec.lastProcessedDate}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400">
                      Account: {sourceAcc?.name}
                      {destAcc && ` → ${destAcc.name}`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <RecurringModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setRecurringToEdit(null);
        }}
        recurringToEdit={recurringToEdit}
      />

      {/* Delete Confirmation */}
      {confirmDeleteRec && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Schedule"
          message={`Are you sure you want to delete the schedule "${confirmDeleteRec.title}"? Previously generated transactions will not be deleted.`}
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteRec(null)}
        />
      )}
    </div>
  );
};
