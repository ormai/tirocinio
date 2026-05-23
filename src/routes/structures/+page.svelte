<script lang="ts">
  import { deserialize } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { MAX_INT } from '$lib/form/Numeric.svelte';
  import { type LocalizedString, m } from '$lib/paraglide/messages';
  import type { StructureView } from '$lib/server/structure';
  import DeleteSelectedModal from '$lib/table/DeleteSelectedModal.svelte';
  import ExportModal from '$lib/table/ExportModal.svelte';
  import ImportModal, { isOptionalNumber } from '$lib/table/ImportModal.svelte';
  import Table, { type Filter } from '$lib/table/Table.svelte';
  import { error, success } from '$lib/toast/Toaster.svelte';
  import { type ActionResult } from '@sveltejs/kit';
  import { SvelteSet } from 'svelte/reactivity';
  import TitleBar from '../TitleBar.svelte';
  import type { PageProps } from './$types';
  import AddEditStructureModal from './AddEditStructureModal.svelte';
  import FiltersModal from './FiltersModal.svelte';

  let { data, form }: PageProps = $props();

  // TODO: how to manage the tuples (capacity, year) in the UI?

  const columns = [
    { key: 'name', label: m.structures_name(), numeric: false, sortable: true, searchable: true },
    { key: 'ward', label: m.structures_ward(), numeric: false, sortable: true, searchable: true },
    { key: 'area', label: m.structures_area(), numeric: false, sortable: true, searchable: true },
    { key: 'kind', label: m.structures_kind(), numeric: false, sortable: true, searchable: true },
    { key: 'site', label: m.structures_site(), numeric: false, sortable: true, searchable: true },
    {
      key: 'capacity',
      label: m.structures_capacity(),
      numeric: true,
      sortable: true,
      searchable: false,
    },
  ] as const;

  let selected = $state(new SvelteSet<number>());
  let editing: StructureView | null = $state(null);
  let addModalOpen = $state(false);
  let deleteModalOpen = $state(false);
  let exportModalOpen = $state(false);
  let importModalOpen = $state(false);
  let filtersModalOpen = $state(false);
  let filters: ReadonlyArray<Filter<StructureView>> = $state([]);
</script>

<DeleteSelectedModal
  ids={selected}
  bind:open={deleteModalOpen}
  label={m.structures}
  confirmMessage={m.structures_deleted_confirm}
/>

<AddEditStructureModal bind:editing bind:open={addModalOpen} {form} />

<ExportModal
  bind:open={exportModalOpen}
  title={m.table_export_modal({ count: selected.size, entity: m.structures({ count: selected.size }) })}
  data={() => data.structures.filter((s) => selected.has(s.id))}
  headers={Object.fromEntries(columns.map(({ key, label }) => [key, label]))}
  filename={m.structures_export_filename()}
/>

<ImportModal
  bind:open={importModalOpen}
  headers={Object.fromEntries(
    columns.map((
      { key, label, numeric },
    ) => [key, {
      label,
      numeric,
      required: key !== 'kind' && key !== 'capacity',
    }]),
  ) as Record<
    keyof StructureView,
    { label: LocalizedString; numeric: boolean; required: boolean }
  >}
  title={m.table_import_modal({ entities: m.structures({ count: 2 }) })}
  validators={{ capacity: isOptionalNumber(0, MAX_INT) }}
  onImport={async (rows: StructureView[]) => {
    const data = new FormData();
    data.append('rows', JSON.stringify(rows));
    data.append('year', '2026');
    const res = await fetch('?/import', { method: 'POST', body: data });
    const result = deserialize(await res.text()) as ActionResult;
    if (res.ok && result.type === 'success') {
      importModalOpen = false;
      success(m.structures_imported({ count: result.data?.inserted }));
      await invalidateAll();
    } else {
      error(m.error());
    }
  }}
/>

<FiltersModal
  bind:open={filtersModalOpen}
  bind:filters
  data={data.structures as ReadonlyArray<StructureView>}
/>

{#snippet body(row: StructureView)}
  <td class="truncate20">{row.name}</td>
  <td class="truncate20">{row.ward}</td>
  <td class="truncate20">{row.area}</td>
  <td class="truncate20">{row.kind}</td>
  <td class="truncate50">{row.site}</td>
  <td class="numeric">{row.capacity}</td>
{/snippet}

{#snippet settings()}
  TODO: manage capacities here.
{/snippet}

<section class="container">
  <TitleBar title={m.sidebar_structures()} />

  <Table
    data={data.structures as StructureView[]}
    {columns}
    {body}
    {filters}
    bind:editing
    bind:selected
    bind:addModalOpen
    bind:deleteModalOpen
    bind:exportModalOpen
    bind:filtersModalOpen
    bind:importModalOpen
    getRowInfo={(row: StructureView) => row.name ?? `${row.area}-${row.site}-${row.kind}`}
    label={m.structures}
    allFilteredOutMessage={m.structures_all_filtered_out()}
    uniqKey="str-tab-int"
    {settings}
  />
</section>
