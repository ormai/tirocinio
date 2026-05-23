<script lang="ts">
  import { deserialize } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import AcademicYearField from '$lib/form/AcademicYear.svelte';
  import { MAX_INT, MAX_SMALLINT } from '$lib/form/Numeric.svelte';
  import Modal from '$lib/Modal.svelte';
  import { type LocalizedString, m } from '$lib/paraglide/messages';
  import type { StudentView } from '$lib/server/user.js';
  import DeleteSelectedModal from '$lib/table/DeleteSelectedModal.svelte';
  import ExportModal from '$lib/table/ExportModal.svelte';
  import ImportModal, {
    isEmail,
    isOptionalNumber,
    isRequiredNumber,
  } from '$lib/table/ImportModal.svelte';
  import { NumericFilter } from '$lib/table/NumericFilter.svelte';
  import OrderEqSelector, { compareOrderEq } from '$lib/table/OrderEqSelector.svelte';
  import Table from '$lib/table/Table.svelte';
  import { error, success } from '$lib/toast/Toaster.svelte';
  import { tooltip } from '$lib/tooltip.svelte.js';
  import { BrushCleaning } from '@lucide/svelte';
  import { type ActionResult } from '@sveltejs/kit';
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import TitleBar from '../TitleBar.svelte';
  import type { PageProps } from './$types';
  import AddEditStudentModal from './AddEditStudentModal.svelte';

  onMount(() => {
    const saved = window.localStorage.getItem('students-filters');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.yearBound) yearFilter.bound = data.yearBound;
      if (data.yearOrderEq) yearFilter.orderEq = data.yearOrderEq;
    }
    if (yearFilter.orderEqField !== yearFilter.orderEq) {
      yearFilter.orderEqField = yearFilter.orderEq;
    }
  });
  $effect(() => {
    window.localStorage.setItem(
      'students-filters',
      JSON.stringify({ yearBound: yearFilter.bound, yearOrderEq: yearFilter.orderEq }),
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
  let importModalOpen = $state(false);
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

<ImportModal
  bind:open={importModalOpen}
  headers={Object.fromEntries(
    columns.map((
      { key, label, numeric },
    ) => [key, {
      label,
      numeric,
      required: key !== 'name' && key !== 'surname' && key !== 'enrollmentYear',
    }]),
  ) as Record<
    keyof StudentView,
    { label: LocalizedString; numeric: boolean; required: boolean }
  >}
  title={m.table_import_modal({ entities: m.students({ count: 2 }) })}
  validators={{
    number: isRequiredNumber(0, MAX_INT),
    email: isEmail('required'),
    enrollmentYear: isOptionalNumber(0, MAX_SMALLINT),
  }}
  onImport={async (rows: StudentView[]) => {
    const data = new FormData();
    data.append('rows', JSON.stringify(rows));
    const res = await fetch('?/import', { method: 'POST', body: data });
    const result = deserialize(await res.text()) as ActionResult;
    if (res.ok && result.type === 'success') {
      success(m.students_imported({ count: result.data?.inserted }));
      importModalOpen = false;
      await invalidateAll();
    } else {
      error(m.error());
    }
  }}
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
      {@attach (node) => tooltip({ content: m.table_filter_turn_off(), appendTo: () => node })(node)}
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
    bind:importModalOpen
    getRowInfo={(row: StudentView) => `${row.name} ${row.surname}`}
    label={m.students}
    uniqKey="stu-tab-int"
  />
</section>

<style>
  .row-spaced.filter {
    text-align: center;
  }
</style>
