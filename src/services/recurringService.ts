import { RecurringTransaction, Transaction, RecurringFrequency } from '../types';
import { Repository } from '../db/repository';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeNextDate(dateStr: string, frequency: RecurringFrequency): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7);
  } else if (frequency === 'monthly') {
    const targetMonth = date.getMonth() + 1;
    date.setMonth(targetMonth);
    // If month overflowed due to 31st (e.g. Feb 31 -> March), adjust to last day of intended month
    if (date.getMonth() !== targetMonth % 12) {
      date.setDate(0);
    }
  } else if (frequency === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
  }

  const resYear = date.getFullYear();
  const resMonth = String(date.getMonth() + 1).padStart(2, '0');
  const resDay = String(date.getDate()).padStart(2, '0');
  return `${resYear}-${resMonth}-${resDay}`;
}

export async function processDueRecurringTransactions(): Promise<{
  createdTransactions: Transaction[];
  processedCount: number;
}> {
  const [allRecurring, allTransactions] = await Promise.all([
    Repository.getAllRecurring(),
    Repository.getAllTransactions(),
  ]);

  const existingRecurringTags = new Set(
    allTransactions.map(t => t.recurringId).filter(Boolean)
  );

  const today = getTodayDateString();
  const created: Transaction[] = [];

  for (const rec of allRecurring) {
    if (rec.isPaused) continue;

    let currentDue = rec.nextDueDate;
    let modified = false;

    // Safety limit to avoid infinite loop if app wasn't opened for years
    let safetyCounter = 0;
    while (currentDue <= today && safetyCounter < 52) {
      safetyCounter++;

      if (rec.endDate && currentDue > rec.endDate) {
        rec.isPaused = true;
        modified = true;
        break;
      }

      const occurrenceKey = `${rec.id}_${currentDue}`;

      // Only create if not already recorded
      if (!existingRecurringTags.has(occurrenceKey)) {
        const newTx = await Repository.addTransaction({
          type: rec.type,
          amount: rec.amount,
          currency: rec.currency,
          date: currentDue,
          accountId: rec.accountId,
          toAccountId: rec.toAccountId,
          categoryId: rec.categoryId,
          note: rec.note ? `[Recurring: ${rec.title}] ${rec.note}` : `[Recurring: ${rec.title}]`,
          payee: rec.payee,
          tags: ['recurring', rec.frequency],
          recurringId: occurrenceKey,
        });

        existingRecurringTags.add(occurrenceKey);
        created.push(newTx);
      }

      rec.lastProcessedDate = currentDue;
      currentDue = computeNextDate(currentDue, rec.frequency);
      rec.nextDueDate = currentDue;
      modified = true;

      if (rec.endDate && currentDue > rec.endDate) {
        rec.isPaused = true;
        break;
      }
    }

    if (modified) {
      await Repository.updateRecurring(rec);
    }
  }

  return {
    createdTransactions: created,
    processedCount: created.length,
  };
}
