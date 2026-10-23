export interface CalendarDay {
  dateString: string; // 'YYYY-MM-DD'
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, month: number): number {
  // month is 1-12
  const daysMap = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysMap[month - 1] || 31;
}

/**
 * Validates whether year, month, day represent a real calendar date.
 * Strictly rejects impossible dates like 31 February or 31 April.
 */
export function isValidDateParts(year: number, month: number, day: number): boolean {
  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  const maxDays = getDaysInMonth(year, month);
  if (day < 1 || day > maxDays) return false;
  return true;
}

/**
 * Parses user input string (either 'YYYY-MM-DD' or 'DD/MM/YYYY') into a valid 'YYYY-MM-DD' string.
 * Returns null if input is invalid or impossible.
 */
export function parseDateInput(input: string): string | null {
  if (!input || !input.trim()) return null;
  const clean = input.trim();

  // Try ISO format: YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (isValidDateParts(y, m, d)) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return null;
  }

  // Try UK/Pak/Euro format: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    if (isValidDateParts(y, m, d)) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return null;
  }

  return null;
}

export function formatToDisplay(isoString: string): string {
  if (!isoString) return '';
  const [y, m, d] = isoString.split('-');
  if (!y || !m || !d) return isoString;
  return `${d}/${m}/${y}`; // DD/MM/YYYY for friendly reading
}

export function generateMonthDays(
  viewYear: number,
  viewMonth: number, // 1 - 12
  selectedIsoDate: string
): CalendarDay[] {
  const todayIso = new Date().toISOString().split('T')[0];
  const days: CalendarDay[] = [];

  const daysInCurrent = getDaysInMonth(viewYear, viewMonth);
  // Get weekday of 1st day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();

  // Previous month padding
  const prevMonth = viewMonth === 1 ? 12 : viewMonth - 1;
  const prevYear = viewMonth === 1 ? viewYear - 1 : viewYear;
  const daysInPrev = getDaysInMonth(prevYear, prevMonth);

  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const dayNum = daysInPrev - i;
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    days.push({
      dateString: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayIso,
      isSelected: dateStr === selectedIsoDate,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrent; d++) {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dateString: dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayIso,
      isSelected: dateStr === selectedIsoDate,
    });
  }

  // Next month padding to fill standard 35 or 42 grid cells
  const remainingCells = 42 - days.length;
  if (remainingCells > 0 && remainingCells < 14) {
    const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1;
    const nextYear = viewMonth === 12 ? viewYear + 1 : viewYear;
    for (let d = 1; d <= remainingCells; d++) {
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateString: dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayIso,
        isSelected: dateStr === selectedIsoDate,
      });
    }
  }

  return days;
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
