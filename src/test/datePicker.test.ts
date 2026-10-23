import { describe, it, expect } from 'vitest';
import {
  parseDateInput,
  isValidDateParts,
  isLeapYear,
  getDaysInMonth,
  generateMonthDays,
} from '../services/dateUtils';

describe('DatePicker & Keyboard Input Validation Engine', () => {
  it('correctly validates leap years', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2020)).toBe(true);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
  });

  it('correctly calculates max days in any month', () => {
    expect(getDaysInMonth(2026, 1)).toBe(31); // Jan
    expect(getDaysInMonth(2026, 2)).toBe(28); // Feb non-leap
    expect(getDaysInMonth(2024, 2)).toBe(29); // Feb leap
    expect(getDaysInMonth(2026, 4)).toBe(30); // Apr
    expect(getDaysInMonth(2026, 12)).toBe(31); // Dec
  });

  it('strictly rejects impossible dates like 31 February or 31 April', () => {
    expect(isValidDateParts(2026, 2, 31)).toBe(false);
    expect(isValidDateParts(2026, 2, 29)).toBe(false); // 2026 is not leap
    expect(isValidDateParts(2024, 2, 29)).toBe(true);  // 2024 is leap
    expect(isValidDateParts(2026, 4, 31)).toBe(false); // April has 30 days
    expect(isValidDateParts(2026, 6, 31)).toBe(false); // June has 30 days
    expect(isValidDateParts(2026, 13, 1)).toBe(false); // Month 13 impossible
  });

  it('parses valid ISO and DD/MM/YYYY keyboard text inputs to standard ISO strings', () => {
    // ISO format
    expect(parseDateInput('2026-10-23')).toBe('2026-10-23');
    expect(parseDateInput('2026/10/23')).toBe('2026-10-23');

    // DD/MM/YYYY format
    expect(parseDateInput('23/10/2026')).toBe('2026-10-23');
    expect(parseDateInput('23-10-2026')).toBe('2026-10-23');
    expect(parseDateInput('5/8/2026')).toBe('2026-08-05');
  });

  it('rejects invalid keyboard strings gracefully by returning null', () => {
    expect(parseDateInput('31/02/2026')).toBeNull();
    expect(parseDateInput('31/04/2026')).toBeNull();
    expect(parseDateInput('29/02/2025')).toBeNull();
    expect(parseDateInput('99/99/9999')).toBeNull();
    expect(parseDateInput('hello')).toBeNull();
    expect(parseDateInput('')).toBeNull();
  });

  it('generates a full calendar grid with proper month navigation days', () => {
    // October 2026: Oct 1 is Thursday (weekday 4)
    const days = generateMonthDays(2026, 10, '2026-10-23');
    expect(days.length).toBeGreaterThanOrEqual(35);

    // Verify day 23 is selected
    const selectedDay = days.find(d => d.dateString === '2026-10-23');
    expect(selectedDay).toBeDefined();
    expect(selectedDay?.isSelected).toBe(true);
    expect(selectedDay?.isCurrentMonth).toBe(true);

    // Verify navigation across months: September 2026 has 30 days
    const septDays = generateMonthDays(2026, 9, '2026-09-15');
    const septCurrentDays = septDays.filter(d => d.isCurrentMonth);
    expect(septCurrentDays.length).toBe(30);
  });
});
