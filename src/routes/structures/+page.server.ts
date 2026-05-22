import { requireAdmin } from '$lib/server/api-security';
import { db } from '$lib/server/db';
import { capacities, sites, structures } from '$lib/server/db/schema';
import type { StructureView } from '$lib/server/structure';
import { fail } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';
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

async function getSite(siteName: string): Promise<number> {
  const [existing] = await db.select({ id: sites.id }).from(sites).where(eq(sites.name, siteName));
  if (existing) {
    return existing.id;
  }
  const [inserted] = await db.insert(sites).values({ name: siteName }).returning({ id: sites.id });
  return inserted.id;
}

export const actions: Actions = {
  add: async ({ locals, request }) => {
    requireAdmin(locals);

    const structure = validateStructure(await request.formData());
    await db.insert(structures).values({
      name: structure.name,
      ward: structure.ward,
      area: structure.area,
      kind: structure.kind,
      siteId: structure.site ? await getSite(structure.site) : undefined,
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
};
