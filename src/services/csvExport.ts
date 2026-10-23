import { Transaction, Account, Category } from '../types';
import { toMajorUnits } from './financeMath';

function escapeCsvField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateTransactionsCsv(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[]
): string {
  const accountMap = new Map(accounts.map(a => [a.id, a.name]));
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const headers = [
    'Date',
    'Type',
    'Amount',
    'Currency',
    'Source Account',
    'Destination Account',
    'Category',
    'Payee',
    'Note',
    'Tags',
  ];

  const rows = transactions.map(tx => {
    const sourceAcc = accountMap.get(tx.accountId) || tx.accountId;
    const destAcc = tx.toAccountId ? (accountMap.get(tx.toAccountId) || tx.toAccountId) : '';
    const cat = categoryMap.get(tx.categoryId) || 'Uncategorized';
    const majorAmount = toMajorUnits(tx.amount).toFixed(2);

    return [
      escapeCsvField(tx.date),
      escapeCsvField(tx.type.toUpperCase()),
      escapeCsvField(majorAmount),
      escapeCsvField(tx.currency),
      escapeCsvField(sourceAcc),
      escapeCsvField(destAcc),
      escapeCsvField(cat),
      escapeCsvField(tx.payee || ''),
      escapeCsvField(tx.note || ''),
      escapeCsvField((tx.tags || []).join('; ')),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
