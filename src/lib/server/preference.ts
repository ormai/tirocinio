import type { InferSelectModel } from 'drizzle-orm';
import type { preferenceCollectionIntervals, preferences } from './db/schema';
import { getDurationFirstYear, getDurationSecondYear, getDurationThirdYear } from './settings';
import { getYearOfCourse } from './user';

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

/**
 * The duration in months of the internship is determined by the student's current year of course.
 */
export async function getMonths(enrollmentYear: number | null): Promise<number> {
  const yearOfCourse = getYearOfCourse(enrollmentYear ?? 0);
  if (yearOfCourse === 1) {
    return await getDurationFirstYear();
  } else if (yearOfCourse === 2) {
    return await getDurationSecondYear();
  }
  return await getDurationThirdYear();
}
