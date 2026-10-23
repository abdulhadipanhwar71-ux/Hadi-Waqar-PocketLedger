import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-navy-800 dark:bg-navy-900/30 my-4">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-navy-800 text-emerald-600 dark:text-emerald-400">
        <Icon className="h-7 w-7" />
      </div>
      <h4 className="text-base font-bold text-navy-900 dark:text-white">{title}</h4>
      <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 rounded-xl bg-navy-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-navy-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
