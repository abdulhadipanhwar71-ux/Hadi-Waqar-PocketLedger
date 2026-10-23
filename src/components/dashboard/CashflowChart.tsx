import React, { useState } from 'react';
import { Transaction } from '../../types';
import { toMajorUnits, formatCurrency } from '../../services/financeMath';

interface CashflowChartProps {
  transactions: Transaction[];
  currency: string;
}

interface MonthlyData {
  monthKey: string;
  monthLabel: string;
  income: number;
  expense: number;
}

export const CashflowChart: React.FC<CashflowChartProps> = ({ transactions, currency }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Group transactions of past 6 months
  const monthlyData: MonthlyData[] = React.useMemo(() => {
    const monthsMap = new Map<string, { income: number; expense: number; label: string }>();

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      monthsMap.set(key, { income: 0, expense: 0, label });
    }

    for (const tx of transactions) {
      if (tx.currency !== currency) continue;
      const key = tx.date.substring(0, 7);
      if (monthsMap.has(key)) {
        const item = monthsMap.get(key)!;
        if (tx.type === 'income') item.income += tx.amount;
        if (tx.type === 'expense') item.expense += tx.amount;
      }
    }

    return Array.from(monthsMap.entries()).map(([monthKey, val]) => ({
      monthKey,
      monthLabel: val.label,
      income: val.income,
      expense: val.expense,
    }));
  }, [transactions, currency]);

  const maxVal = Math.max(
    ...monthlyData.map(d => Math.max(d.income, d.expense)),
    100000 // minimum scale 1,000 minor units (10.00)
  );

  const chartHeight = 180;
  const chartWidth = 460;
  const paddingLeft = 45;
  const paddingBottom = 25;
  const paddingTop = 15;
  const usableWidth = chartWidth - paddingLeft;
  const usableHeight = chartHeight - paddingBottom - paddingTop;
  const groupWidth = usableWidth / monthlyData.length;
  const barWidth = Math.max(12, groupWidth * 0.28);

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto min-w-[340px] text-xs select-none"
      >
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = paddingTop + usableHeight * (1 - pct);
          const gridVal = maxVal * pct;
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-navy-800"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-slate-400 text-[9px]"
              >
                {toMajorUnits(gridVal) >= 1000
                  ? `${Math.round(toMajorUnits(gridVal) / 1000)}k`
                  : Math.round(toMajorUnits(gridVal))}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {monthlyData.map((d, idx) => {
          const groupCenterX = paddingLeft + idx * groupWidth + groupWidth / 2;
          const incomeBarHeight = (d.income / maxVal) * usableHeight;
          const expenseBarHeight = (d.expense / maxVal) * usableHeight;

          const incomeX = groupCenterX - barWidth - 2;
          const expenseX = groupCenterX + 2;

          const incomeY = paddingTop + (usableHeight - incomeBarHeight);
          const expenseY = paddingTop + (usableHeight - expenseBarHeight);

          const isHovered = hoveredIndex === idx;

          return (
            <g
              key={d.monthKey}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              {/* Highlight background on hover */}
              {isHovered && (
                <rect
                  x={paddingLeft + idx * groupWidth + 4}
                  y={paddingTop}
                  width={groupWidth - 8}
                  height={usableHeight}
                  className="fill-slate-100/50 dark:fill-navy-800/40 rounded-lg"
                />
              )}

              {/* Income Bar (Emerald) */}
              <rect
                x={incomeX}
                y={incomeY}
                width={barWidth}
                height={Math.max(2, incomeBarHeight)}
                rx={3}
                className="fill-emerald-500 hover:fill-emerald-400 transition-colors"
              />

              {/* Expense Bar (Navy / Rose) */}
              <rect
                x={expenseX}
                y={expenseY}
                width={barWidth}
                height={Math.max(2, expenseBarHeight)}
                rx={3}
                className="fill-rose-500 hover:fill-rose-400 transition-colors"
              />

              {/* Month label */}
              <text
                x={groupCenterX}
                y={chartHeight - 6}
                textAnchor="middle"
                className={`text-[10px] ${
                  isHovered ? 'fill-emerald-500 font-bold' : 'fill-slate-500 dark:fill-slate-400'
                }`}
              >
                {d.monthLabel}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip on hover */}
      {hoveredIndex !== null && (
        <div className="absolute top-2 right-2 rounded-xl bg-navy-900/90 p-2.5 text-xs text-white shadow-xl backdrop-blur-md border border-navy-700">
          <p className="font-semibold text-slate-200">
            {monthlyData[hoveredIndex].monthKey}
          </p>
          <div className="mt-1 flex items-center justify-between space-x-3">
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
              <span>Income:</span>
            </span>
            <span className="font-mono font-medium">
              {formatCurrency(monthlyData[hoveredIndex].income, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between space-x-3">
            <span className="flex items-center space-x-1.5 text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-400 inline-block" />
              <span>Expense:</span>
            </span>
            <span className="font-mono font-medium">
              {formatCurrency(monthlyData[hoveredIndex].expense, currency)}
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center space-x-5 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          <span>Income</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
          <span>Expense</span>
        </div>
      </div>
    </div>
  );
};
