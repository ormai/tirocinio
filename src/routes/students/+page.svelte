<script lang="ts">
  import { page } from '$app/state';
  import AcademicYearField from '$lib/form/AcademicYear.svelte';
  import Modal from '$lib/Modal.svelte';
  import { m } from '$lib/paraglide/messages';
  import { deLocalizeHref } from '$lib/paraglide/runtime';
  import type { StudentView } from '$lib/server/user.js';
  import DeleteSelectedModal from '$lib/table/DeleteSelectedModal.svelte';
  import ExportModal from '$lib/table/ExportModal.svelte';
  import { NumericFilter } from '$lib/table/NumericFilter.svelte';
  import OrderEqSelector, { compareOrderEq } from '$lib/table/OrderEqSelector.svelte';
  import Table from '$lib/table/Table.svelte';
  import { tooltip } from '$lib/tooltip.svelte.js';
  import { BrushCleaning } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import TitleBar from '../TitleBar.svelte';
  import type { PageProps } from './$types';
  import AddEditStudentModal from './AddEditStudentModal.svelte';

  // TODO: import students from spreadsheet (?)

  const persistenceKey = `${deLocalizeHref(page.url.pathname)}-table`;

  onMount(() => {
    const saved = localStorage.getItem(persistenceKey);
    if (saved) {
      const stored = JSON.parse(saved);
      // sort = stored.sort;
      // search = stored.search;
      // page = stored.page;
      yearFilter.bound = stored.yearFilterBound;
      yearFilter.orderEq = stored.yearFilterTone;
    }
  });

  $effect(() => {
    localStorage.setItem(
      persistenceKey,
      JSON.stringify({
        // sort,
        // search,
        // page,
        yearFilterBound: yearFilter.bound,
        yearFilterTone: yearFilter.orderEq,
      }),
    );
  });

  let { data, form }: PageProps = $props();

  class YearFilter extends NumericFilter<StudentView> {
    isSatisfied(row: StudentView): boolean {
      if (row.enrollmentYear && this.bound) {
        return compareOrderEq(this.orderEq, row.enrollmentYear, this.bound);
      }
      return true;
    }
  }

  const yearFilter = new YearFilter();

  const columns = [
    { key: 'number', label: m.students_number(), numeric: true, sortable: true, searchable: true },
    { key: 'name', label: m.students_name(), numeric: false, sortable: true, searchable: true },
    {
      key: 'surname',
      label: m.students_surname(),
      numeric: false,
      sortable: true,
      searchable: true,
    },
    { key: 'email', label: m.students_email(), numeric: false, sortable: true, searchable: true },
    {
      key: 'enrollmentYear',
      label: m.students_year(),
      numeric: false,
      sortable: true,
      searchable: true,
    },
  ] as const;

  let selected = $state(new SvelteSet<number>());
  let editing: StudentView | null = $state(null);
  let addModalOpen = $state(false);
  let deleteModalOpen = $state(false);
  let exportModalOpen = $state(false);
  let filtersModalOpen = $state(false);
</script>

<ExportModal
  title={m.table_export_modal({ count: selected.size, entity: m.students({ count: selected.size }) })}
  data={() => data.students.filter((s) => selected.has(s.id))}
  bind:open={exportModalOpen}
  headers={Object.fromEntries(columns.map(({ key, label }) => [key, label]))}
  filename={m.students_export_filename()}
/>

<AddEditStudentModal bind:editing bind:open={addModalOpen} {form} />

<DeleteSelectedModal
  bind:open={deleteModalOpen}
  ids={selected}
  label={m.students}
  confirmMessage={m.students_deleted_confirm}
/>

<Modal
  bind:open={filtersModalOpen}
  title={m.table_filters()}
  actions={[
    { label: m.modal_dismiss(), onClick: () => (filtersModalOpen = false), role: 'secondary' },
    {
      label: m.modal_apply(),
      disabled: !yearFilter.hasChanged || !yearFilter.isValid,
      onClick: () => {
        yearFilter.apply();
        filtersModalOpen = false;
      },
    },
  ]}
>
  <div class="row-spaced filter">
    {m.students_year()}
    <OrderEqSelector bind:orderEq={yearFilter.orderEqField} />
    <AcademicYearField
      field={yearFilter.boundField}
      maxWidth={200}
      initialValue={yearFilter.bound}
    />
    <button
      class="secondary icon-host"
      onclick={() => yearFilter.clear()}
      disabled={!yearFilter.isActive}
      {@attach (node) => tooltip({content: m.table_filter_turn_off(), appendTo: () => node})(node)}
    >
      <BrushCleaning />
    </button>
  </div>
</Modal>

{#snippet body(row: StudentView)}
  <td class="numeric">{row.number}</td>
  <td class="truncate20">{row.name}</td>
  <td class="truncate20">{row.surname}</td>
  <td class="truncate50">{row.email}</td>
  <td class="numeric">
    {#if row.enrollmentYear}{row.enrollmentYear}/{row.enrollmentYear + 1}{/if}
  </td>
{/snippet}

<section class="container">
  <TitleBar title={m.students_title()} />

  <Table
    data={data.students}
    {columns}
    {body}
    filters={[yearFilter]}
    bind:selected
    bind:editing
    bind:addModalOpen
    bind:deleteModalOpen
    bind:filtersModalOpen
    bind:exportModalOpen
    getRowInfo={(row: StudentView) => `${row.name} ${row.surname}`}
    label={m.students}
  />
</section>

<style>
  .row-spaced.filter {
    text-align: center;
  }
</style>
