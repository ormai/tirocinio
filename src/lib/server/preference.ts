import type { InferSelectModel } from 'drizzle-orm';
import type { preferenceCollectionIntervals } from './db/schema';

export type Collection = InferSelectModel<typeof preferenceCollectionIntervals>;
