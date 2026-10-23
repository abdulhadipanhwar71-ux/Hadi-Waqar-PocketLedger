import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  PiggyBank,
  Settings,
} from 'lucide-react';

interface MobileNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onTabChange }) => {
  const items = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'transactions', label: 'Records', icon: ArrowLeftRight },
    { id: 'accounts', label: 'Accounts', icon: Landmark },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden items-center justify-around border-t border-slate-200 bg-white/95 py-2 backdrop-blur dark:border-navy-800 dark:bg-navy-950/95 safe-area-pb">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center py-1 px-3 text-xs font-medium transition-colors ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Icon className={`h-5 w-5 mb-0.5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
