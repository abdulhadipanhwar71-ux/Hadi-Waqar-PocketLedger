import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  PiggyBank,
  Tags,
  CalendarSync,
  BarChart3,
  Settings,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { budgets } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'accounts', label: 'Accounts', icon: Landmark },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank, badge: budgets.length > 0 ? String(budgets.length) : undefined },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'recurring', label: 'Recurring', icon: CalendarSync },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings & Backup', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-navy-100 bg-white dark:border-navy-800 dark:bg-navy-950/80 p-4 select-none">
      <div className="space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-navy-900 text-white shadow-sm dark:bg-emerald-600 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900 dark:text-slate-300 dark:hover:bg-navy-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-400 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isActive ? 'bg-emerald-500/30 text-white' : 'bg-slate-200 text-slate-700 dark:bg-navy-800 dark:text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100 dark:border-navy-900">
        <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-navy-900/60 border border-slate-200/60 dark:border-navy-800">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span>100% Offline & Private</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            All records exist strictly inside your local browser database. No external servers or telemetry.
          </p>
        </div>
      </div>
    </aside>
  );
};
