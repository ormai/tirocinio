import { type InferSelectModel, sql } from 'drizzle-orm';
import { db, type TransactionOrDatabase } from './db';
import { capacities, sites, structures } from './db/schema';
import { getSetting } from './settings';

export type StructureView = Omit<InferSelectModel<typeof structures>, 'siteId'> & {
  site: string;
  capacity: number | null;
};

export type ImportCapacity = Pick<StructureView, 'name' | 'capacity'>;

export type Capacity = InferSelectModel<typeof capacities>;

export type Site = InferSelectModel<typeof sites>;

/** Updates the capacity of a structure for a year, or creates a new record if it doesn't already exist. */
export async function updateCapacity(
  structureId: number,
  year: number,
  capacity: number,
  tx: TransactionOrDatabase = db,
) {
  await tx.insert(capacities)
    .values({ structureId, capacity, year })
    .onConflictDoUpdate({
      target: [capacities.structureId, capacities.year],
      set: { capacity },
    });
  console.debug(`Update capacity structureId=${structureId}, year=${year}, capacity=${capacity}`);
}

/** Retrieves the app-wide setting for the current year to which all capacities are contextually associated */
export async function getYear(tx: TransactionOrDatabase = db): Promise<number> {
  const yearCapacities = await getSetting('yearCapacities', tx);
  return yearCapacities ? Number(yearCapacities) : new Date().getFullYear();
}

/** Retrieves a site by its name, or inserts it if doesn't already exist. */
export async function getSite(siteName: string, tx: TransactionOrDatabase = db): Promise<number> {
  const [{ id }] = await tx.insert(sites)
    .values({ name: siteName })
    .onConflictDoUpdate({
      target: sites.name,
      set: { name: sql`excluded.name` },
    })
    .returning({ id: sites.id });
  return id;
}
