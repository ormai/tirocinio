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
import { and, desc, eq, inArray, ne } from 'drizzle-orm';
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
    yearOfCourse: structures.yearOfCourse,
  }).from(structures)
    .leftJoin(capacities, and(eq(structures.id, capacities.structureId), eq(capacities.year, year)))
    .leftJoin(sites, eq(structures.siteId, sites.id))
    .orderBy(desc(structures.id));

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

  const yearOfCourseRaw = String(data.get('year-of-course'));

  return {
    id: Number.isFinite(id) ? id : undefined,
    name: data.get('name')?.toString(),
    ward: data.get('ward')?.toString(),
    area: data.get('area')?.toString(),
    kind: data.get('kind')?.toString(),
    site: data.get('site')?.toString(),
    capacity,
    yearOfCourse: yearOfCourseRaw ? Number(yearOfCourseRaw) : null,
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
      if (await db.$count(structures, eq(structures.name, structure.name!)) > 0) {
        return fail(400, { nameTaken: true });
      }
      const [{ id }] = await tx.insert(structures).values({
        name: structure.name!,
        ward: structure.ward,
        area: structure.area,
        kind: structure.kind,
        siteId: structure.site ? await getSite(structure.site, tx) : undefined,
        yearOfCourse: structure.yearOfCourse,
      }).returning({ id: structures.id });
      if (structure.capacity != null) {
        const year = await getYear(tx);
        await updateCapacity(id, year, structure.capacity, tx);
      }
      console.debug(`Add new structure id=${id}`);
      return { added: true };
    });
  },

  edit: async ({ locals, request }) => {
    requireAdmin(locals);
    const structure = validateStructure(await request.formData());
    if (isValidationFailure(structure)) return structure;
    if (!structure.id) return fail(400, 'Structure ID is required');

    console.log(structure.yearOfCourse);

    return await db.transaction(async (tx) => {
      if (
        await db.$count(structures, and(eq(structures.name, structure.name!), ne(structures.id, structure.id!))) > 0
      ) {
        return fail(400, { nameTaken: true });
      }
      await tx.update(structures).set({
        name: structure.name,
        ward: structure.ward,
        area: structure.area,
        kind: structure.kind,
        siteId: structure.site ? await getSite(structure.site) : undefined,
        yearOfCourse: structure.yearOfCourse,
      }).where(eq(structures.id, structure.id!));
      if (structure.capacity != null) {
        const year = await getYear(tx);
        await updateCapacity(structure.id!, year, structure.capacity, tx);
      }
      console.debug(`Update structure with id=${structure.id}`);
      return { edited: true };
    });
  },

  delete: async ({ locals, request }) => {
    requireAdmin(locals);
    const ids = (await request.formData()).getAll('id').map(Number);
    await db.delete(structures).where(inArray(structures.id, ids));
    console.debug(`Delete structures ids: ${ids}`);
    return { count: ids.length };
  },

  structuresExist: async ({ locals, request }) => {
    requireAdmin(locals);

    const form = await request.formData();
    const names = form.get('names');
    if (!names) return fail(400, 'Array of structures to check is required');
    const data = JSON.parse(names as string) as string[];

    const existence: Record<string, unknown> = {};
    for (const name of data) {
      const [structure] = await db.select({ id: structures.id })
        .from(structures)
        .where(eq(structures.name, name));
      existence[name] = structure != null;
    }
    console.debug(`Check existence for ${data.length} structures`);
    return existence;
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
      console.debug(`Import ${data.length} structures`);
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
    console.debug(`Set year for capacities to ${year}`);
  },

  unsetYearCapacities: async ({ locals }) => {
    requireAdmin(locals);
    await setSetting('yearCapacities', null);
    console.debug(`unset year for capacities`);
  },

  capacitiesExist: async ({ locals, request }) => {
    requireAdmin(locals);

    const form = await request.formData();
    const names = form.get('names')?.toString();
    if (!names) return fail(400, 'An array of structure names is required');
    const data = JSON.parse(names as string) as string[];

    return await db.transaction(async (tx) => {
      const year = await getYear(tx);
      const existence: Record<string, { structuresExists?: boolean; exists?: boolean }> = {};
      for (const name of data) {
        existence[name] = {};
        const [structure] = await tx.select({ id: structures.id }).from(structures).where(eq(structures.name, name));
        if (structure) {
          const [capacity] = await tx.select().from(capacities).where(
            and(eq(capacities.structureId, structure.id), eq(capacities.year, year)),
          );
          existence[name].exists = capacity != null;
        } else {
          existence[name].structuresExists = false;
        }
      }
      console.debug(`Check for existence of ${data.length} capacities`);
      return existence;
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
      console.debug(`Import ${data.length} capacities`);
      return { inserted: data.length };
    });
  },
};
