<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import type { StructureView } from '$lib/server/structure';
  import DeleteSelectedModal from '$lib/table/DeleteSelectedModal.svelte';
  import ExportModal from '$lib/table/ExportModal.svelte';
  import Table from '$lib/table/Table.svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import TitleBar from '../TitleBar.svelte';
  import type { PageProps } from './$types';
  import AddEditStructureModal from './AddEditStructureModal.svelte';

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
  let filtersModalOpen = $state(false);
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

{#snippet body(row: StructureView)}
  <td class="truncate20">{row.name}</td>
  <td class="truncate20">{row.ward}</td>
  <td class="truncate20">{row.area}</td>
  <td class="truncate20">{row.kind}</td>
  <td class="truncate50">{row.site}</td>
  <td class="numeric">{row.capacity}</td>
{/snippet}

<section class="container">
  <TitleBar title={m.sidebar_structures()} />

  <Table
    data={data.structures as StructureView[]}
    {columns}
    {body}
    filters={[]}
    bind:editing
    bind:selected
    bind:addModalOpen
    bind:deleteModalOpen
    bind:exportModalOpen
    bind:filtersModalOpen
    getRowInfo={(row: StructureView) => row.name ?? `${row.area}-${row.site}-${row.kind}`}
    label={m.structures}
  />
</section>
