import type { InferSelectModel } from 'drizzle-orm';
import type { preferenceCollectionIntervals, preferences } from './db/schema';

export type Collection = InferSelectModel<typeof preferenceCollectionIntervals>;

export type Preference = InferSelectModel<typeof preferences>;

/**
 * Lays out the preferences incoming as SQL table rows into a 2D array, where the `month` is the
 * the row index, `weight` is the column index, and `siteId` is the content of the cell.
 */
export function rearrange(prefs: Pick<Preference, 'siteId' | 'month' | 'weight'>[]) {
  const matrix: number[][] = [];
  for (const pref of prefs) {
    if (pref.siteId) {
      if (!matrix[pref.month]) {
        matrix[pref.month] = [];
      }
      matrix[pref.month][pref.weight] = pref.siteId;
    }
  }
  for (const month of matrix) {
    month.reverse();
  }
  return matrix;
}
