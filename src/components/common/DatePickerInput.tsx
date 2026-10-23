import React, { useState, useEffect, useRef } from 'react';
import {
  parseDateInput,
  generateMonthDays,
  MONTH_NAMES,
  getDaysInMonth,
} from '../../services/dateUtils';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerInputProps {
  value: string; // ISO format 'YYYY-MM-DD'
  onChange: (isoDate: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  onChange,
  label = 'Date *',
  required = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [textValue, setTextValue] = useState<string>(value || '');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Calendar navigation state (year & month 1-12)
  const initialYear = value ? parseInt(value.split('-')[0], 10) : new Date().getFullYear();
  const initialMonth = value ? parseInt(value.split('-')[1], 10) : new Date().getMonth() + 1;

  const [viewYear, setViewYear] = useState<number>(initialYear || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialMonth || new Date().getMonth() + 1);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal text if external value changes
  useEffect(() => {
    setTextValue(value || '');
    if (value) {
      const [y, m] = value.split('-').map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m);
      }
    }
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTextValue(raw);
    setErrorMessage('');

    // If empty and not required, clear
    if (!raw.trim()) {
      if (!required) {
        onChange('');
      } else {
        setErrorMessage('Date is required');
      }
      return;
    }

    // Try parsing
    const parsedIso = parseDateInput(raw);
    if (parsedIso) {
      onChange(parsedIso);
      setErrorMessage('');
      const [y, m] = parsedIso.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m);
    } else {
      // Don't error immediately while typing short strings, only if length is sufficient
      if (raw.length >= 8) {
        setErrorMessage('Invalid date (use YYYY-MM-DD or DD/MM/YYYY)');
      }
    }
  };

  const handleBlur = () => {
    if (!textValue.trim()) {
      if (required) setErrorMessage('Date is required');
      return;
    }
    const parsed = parseDateInput(textValue);
    if (!parsed) {
      setErrorMessage('Invalid date (e.g. 31/02 does not exist)');
    } else {
      setTextValue(parsed);
      onChange(parsed);
      setErrorMessage('');
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(y => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(y => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDay = (dateString: string) => {
    onChange(dateString);
    setTextValue(dateString);
    setErrorMessage('');
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const [y, m] = today.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m);
    handleSelectDay(today);
  };

  const days = generateMonthDays(viewYear, viewMonth, value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}

      {/* Input Field with Calendar Trigger */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onClick={() => setIsOpen(true)}
          placeholder="YYYY-MM-DD or DD/MM/YYYY"
          className={`w-full rounded-xl border bg-white px-3.5 py-2 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 dark:bg-navy-950 dark:text-white ${
            errorMessage
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
              : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 dark:border-navy-700'
          }`}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Calendar"
          className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-navy-800 dark:hover:text-emerald-400 transition-colors"
        >
          <CalendarIcon className="h-4 w-4" />
        </button>
      </div>

      {errorMessage && (
        <p className="mt-1 text-[11px] font-medium text-rose-500">{errorMessage}</p>
      )}

      {/* Floating Interactive Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 mt-1.5 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl dark:border-navy-800 dark:bg-navy-900 animate-in fade-in zoom-in-95">
          {/* Header with Navigation */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 dark:border-navy-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-navy-700 dark:text-slate-300 dark:hover:bg-navy-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="text-center">
              <span className="text-xs font-bold text-navy-900 dark:text-white">
                {MONTH_NAMES[viewMonth - 1]} {viewYear}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-navy-700 dark:text-slate-300 dark:hover:bg-navy-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const isSelected = day.dateString === value;
              return (
                <button
                  key={`${day.dateString}-${idx}`}
                  type="button"
                  onClick={() => handleSelectDay(day.dateString)}
                  className={`h-9 w-9 mx-auto flex items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20 font-bold scale-105'
                      : day.isToday
                      ? 'border border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : day.isCurrentMonth
                      ? 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-navy-800'
                      : 'text-slate-300 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-navy-800/40'
                  }`}
                >
                  {day.dayNumber}
                </button>
              );
            })}
          </div>

          {/* Bottom Bar: Today & Close */}
          <div className="mt-3 pt-2 flex items-center justify-between border-t border-slate-100 dark:border-navy-800 text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 text-[11px]"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-white text-[11px]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
