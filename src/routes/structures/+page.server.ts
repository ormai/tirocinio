import { requireAdmin } from '$lib/server/api-security';
import { db } from '$lib/server/db';
import { capacities, sites, structures } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import type { StructureView } from '$lib/server/structure';
import { fail } from '@sveltejs/kit';
import { eq, type ExtractTablesWithRelations, inArray } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);

  return {
    structures: await db.select({
      id: structures.id,
      name: structures.name,
      ward: structures.ward,
      area: structures.area,
      kind: structures.kind,
      site: sites.name,
      capacity: capacities.capacity,
    })
      .from(structures)
      .leftJoin(capacities, eq(structures.id, capacities.structureId))
      .leftJoin(sites, eq(structures.siteId, sites.id)),
  };
};

function validateStructure(data: FormData): Partial<StructureView> {
  const cap = Number(data.get('capacity')?.toString());
  const capacity = Number.isFinite(cap) ? cap : null;

  const idRaw = data.get('id')?.toString();
  const id = Number(idRaw);

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

async function getSite(
  siteName: string,
  tx: PgTransaction<PostgresJsQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>> | typeof db =
    db,
): Promise<number> {
  const [existing] = await tx.select({ id: sites.id }).from(sites).where(eq(sites.name, siteName));
  if (existing) {
    return existing.id;
  }
  const [inserted] = await tx.insert(sites).values({ name: siteName }).returning({ id: sites.id });
  return inserted.id;
}

export const actions: Actions = {
  add: async ({ locals, request }) => {
    requireAdmin(locals);
    const structure = validateStructure(await request.formData());
    await db.transaction(async (tx) => {
      await tx.insert(structures).values({
        name: structure.name,
        ward: structure.ward,
        area: structure.area,
        kind: structure.kind,
        siteId: structure.site ? await getSite(structure.site, tx) : undefined,
      });
    });
    return { added: true };
  },

  edit: async ({ locals, request }) => {
    requireAdmin(locals);
    const structure = validateStructure(await request.formData());
    if (!structure.id) return fail(400, 'Structure ID is required');
    await db.update(structures).set({
      name: structure.name,
      ward: structure.ward,
      area: structure.area,
      kind: structure.kind,
      siteId: structure.site ? await getSite(structure.site) : undefined,
    }).where(eq(structures.id, structure.id!));
    return { edited: true };
  },

  delete: async ({ locals, request }) => {
    requireAdmin(locals);
    const ids = (await request.formData()).getAll('id').map(Number);
    await db.delete(structures).where(inArray(structures.id, ids));
    console.debug(`Delete structures: ${ids}`);
    return { count: ids.length };
  },

  import: async ({ locals, request }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const rows = form.get('rows');
    const yearRaw = form.get('year')?.toString();
    if (!yearRaw) return fail(400, 'The year to which the capacities are linked must be specified');
    const year = Number(yearRaw);
    if (isNaN(year) || year < 0 || year > 2147483647) return fail(400, 'The year must be a number in [0, 2147483647]');

    if (!rows) return fail(400, 'An array of structures to import is required');
    const data = JSON.parse(rows as string) as StructureView[];

    await db.transaction(async (tx) => {
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
        }).filter((capacity): capacity is typeof capacity & { capacity: number } => capacity.capacity !== null),
      );
    });
  },
};
