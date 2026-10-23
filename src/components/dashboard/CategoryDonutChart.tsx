import React from 'react';
import { CategorySpending } from '../../services/financeMath';
import { formatCurrency } from '../../services/financeMath';

interface CategoryDonutChartProps {
  categories: CategorySpending[];
  currency: string;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  categories,
  currency,
}) => {
  if (categories.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-xs text-slate-400">
        No expense data recorded for this period
      </div>
    );
  }

  const total = categories.reduce((sum, c) => sum + c.amount, 0);
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* SVG Donut */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-100 dark:text-navy-800"
          />
          {categories.slice(0, 6).map((cat, idx) => {
            const fraction = cat.amount / total;
            const strokeDasharray = `${fraction * circumference} ${circumference}`;
            const strokeDashoffset = -currentOffset;
            currentOffset += fraction * circumference;

            return (
              <circle
                key={cat.categoryId || idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={cat.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                fill="transparent"
                className="transition-all duration-300 hover:opacity-80"
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Total Spent
          </span>
          <span className="text-sm font-extrabold text-navy-900 dark:text-white">
            {formatCurrency(total, currency, false)}
          </span>
        </div>
      </div>

      {/* Top Categories List */}
      <div className="w-full space-y-2">
        {categories.slice(0, 5).map(cat => (
          <div key={cat.categoryId} className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 truncate">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="truncate text-slate-700 dark:text-slate-200 font-medium">
                {cat.categoryName}
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {formatCurrency(cat.amount, currency, false)}
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-navy-800 dark:text-slate-300">
                {cat.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
