import { requireAdmin } from '$lib/server/api-security';
import { db } from '$lib/server/db';
import { capacities, sites, structures } from '$lib/server/db/schema';
import { getSetting, setSetting } from '$lib/server/settings';
import {
  type Capacity,
  getSite,
  getYear,
  type ImportCapacity,
  type StructureView,
  updateCapacity,
} from '$lib/server/structure';
import { type ActionFailure, fail, isActionFailure } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);

  const yearCapacities = await getSetting('yearCapacities');
  const year = yearCapacities ? Number(yearCapacities) : new Date().getFullYear();

  const selectedStructures = await db.select({
    id: structures.id,
    name: structures.name,
    ward: structures.ward,
    area: structures.area,
    kind: structures.kind,
    site: sites.name,
    capacity: capacities.capacity,
  }).from(structures)
    .leftJoin(capacities, and(eq(structures.id, capacities.structureId), eq(capacities.year, year)))
    .leftJoin(sites, eq(structures.siteId, sites.id));

  return {
    structures: selectedStructures,
    yearCapacities: year,
    yearCapacitiesExplicitlySet: yearCapacities !== null,
  };
};

function validateStructure(data: FormData): Partial<StructureView> | ActionFailure<string> {
  const capacity = Number(data.get('capacity')?.toString());
  if (isNaN(capacity) || capacity < 0 || capacity > 2147483647) {
    return fail(400, '`capacity` must be a number in [0, 2147483647]');
  }

  const idRaw = data.get('id')?.toString();
  const id = Number(idRaw);

  const name = data.get('name')?.toString();
  if (!name) return fail(400, '`name` is required');

  return {
    id: Number.isFinite(id) ? id : undefined,
    name: data.get('name')?.toString(),
    ward: data.get('ward')?.toString(),
    area: data.get('area')?.toString(),
    kind: data.get('kind')?.toString(),
    site: data.get('site')?.toString(),
    capacity,
  };
}

function isValidationFailure(e: unknown): e is ActionFailure<string> {
  return isActionFailure(e);
}

export const actions: Actions = {
  add: async ({ locals, request }) => {
    requireAdmin(locals);
    const structure = validateStructure(await request.formData());
    if (isValidationFailure(structure)) return structure;
    return await db.transaction(async (tx) => {
      const [{ id }] = await tx.insert(structures).values({
        name: structure.name!,
        ward: structure.ward,
        area: structure.area,
        kind: structure.kind,
        siteId: structure.site ? await getSite(structure.site, tx) : undefined,
      }).returning({ id: structures.id });
      if (structure.capacity != null) {
        const year = await getYear(tx);
        await updateCapacity(id, year, structure.capacity, tx);
      }
      return { added: true };
    });
  },

  edit: async ({ locals, request }) => {
    requireAdmin(locals);
    const structure = validateStructure(await request.formData());
    if (isValidationFailure(structure)) return structure;
    if (!structure.id) return fail(400, 'Structure ID is required');

    return await db.transaction(async (tx) => {
      await tx.update(structures).set({
        name: structure.name,
        ward: structure.ward,
        area: structure.area,
        kind: structure.kind,
        siteId: structure.site ? await getSite(structure.site) : undefined,
      }).where(eq(structures.id, structure.id!));
      console.debug(`Update structure with id=${structure.id}`);
      if (structure.capacity != null) {
        const year = await getYear(tx);
        await updateCapacity(structure.id!, year, structure.capacity, tx);
      }
      return { edited: true };
    });
  },

  delete: async ({ locals, request }) => {
    requireAdmin(locals);
    const ids = (await request.formData()).getAll('id').map(Number);
    await db.delete(structures).where(inArray(structures.id, ids));
    console.debug(`Delete structures: ${ids}`);
    return { count: ids.length };
  },

  structureExists: async ({ locals, request }) => {
    requireAdmin(locals);

    const form = await request.formData();
    const name = form.get('name')?.toString();
    if (!name) return fail(400, 'Structure name is required');
    const [selection] = await db.select({ id: structures.id })
      .from(structures)
      .where(eq(structures.name, name));
    return { exists: selection != null };
  },

  import: async ({ locals, request }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const rows = form.get('rows');
    if (!rows) return fail(400, 'An array of structures to import is required');
    const data = JSON.parse(rows as string) as StructureView[];

    await db.transaction(async (tx) => {
      const year = await getYear(tx);

      const structs = await Promise.all(data.map(async (structure: StructureView) => {
        return {
          name: structure.name,
          ward: structure.ward,
          area: structure.area,
          kind: structure.kind,
          siteId: structure.site ? await getSite(structure.site, tx) : null,
        };
      }));
      const ids = await tx.insert(structures).values(structs).returning({ id: structures.id });

      await tx.insert(capacities).values(
        ids.map(({ id }, i) => {
          return {
            structureId: id,
            capacity: data[i].capacity,
            year,
          };
        }).filter((capacity): capacity is typeof capacity & { capacity: number } => capacity.capacity != null),
      );
    });

    return { inserted: data.length };
  },

  updateYearCapacities: async ({ locals, request }) => {
    requireAdmin(locals);
    const data = await request.formData();
    const year = data.get('year');
    if (!year) return fail(400, '`year` is required');
    const capacitiesYear = Number(year);
    if (isNaN(capacitiesYear) || capacitiesYear < 0 || capacitiesYear > 32767) {
      return fail(400, '`year` must be a number in [0, 32767]');
    }
    await setSetting('yearCapacities', String(year));
  },

  unsetYearCapacities: async ({ locals }) => {
    requireAdmin(locals);
    await setSetting('yearCapacities', null);
  },

  capacityExists: async ({ locals, request }) => {
    requireAdmin(locals);

    const data = await request.formData();
    const name = data.get('structure-name')?.toString();
    if (!name) return fail(400, 'A structure name is required');

    return await db.transaction(async (tx) => {
      const [structure] = await tx.select({ id: structures.id }).from(structures).where(eq(structures.name, name));
      if (!structure) {
        return { structuresExists: false };
      }

      const year = await getYear(tx);
      const [capacity] = await tx.select().from(capacities).where(
        and(eq(capacities.structureId, structure.id), eq(capacities.year, year)),
      );
      return { exists: capacity != null };
    });
  },

  importCapacities: async ({ locals, request }) => {
    requireAdmin(locals);

    const form = await request.formData();
    const rows = form.get('rows');
    if (!rows) return fail(400, 'An array of structures to import is required');
    const data = JSON.parse(rows as string) as ImportCapacity[];

    if (data.some(({ name }) => !name)) return fail(400, '`name` is required for each row');

    for (const { name, capacity } of data) {
      if (!name) return fail(400, '`name` is required for each row');
      if (capacity == null) return fail(400, '`capacity` is required for each row');
    }

    return await db.transaction(async (tx) => {
      const year = await getYear(tx);

      const caps = await Promise.all(data.map(async ({ name, capacity }) => {
        const [structure] = await tx.select({ id: structures.id })
          .from(structures)
          .where(eq(structures.name, name));
        if (!structure) {
          throw Error(`Structure not found for name: ${name}`);
        }
        return { structureId: structure.id, capacity, year } as Capacity;
      }));

      await tx.insert(capacities).values(caps);
      return { inserted: data.length };
    });
  },
};
