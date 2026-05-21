import type { InferSelectModel } from 'drizzle-orm';
import type { structures } from './db/schema';

export type StructureView = Omit<InferSelectModel<typeof structures>, 'siteId'> & {
  site: string;
  capacity: number | null;
};
