<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import AcademicYearField from '$lib/form/AcademicYear.svelte';
  import { MAX_INT, MAX_SMALLINT } from '$lib/form/Numeric.svelte';
  import { sendForm } from '$lib/form/submit';
  import LoadingButton from '$lib/LoadingButton.svelte';
  import Modal from '$lib/Modal.svelte';
  import { type LocalizedString, m } from '$lib/paraglide/messages';
  import type { StudentView } from '$lib/server/user.js';
  import Switch from '$lib/Switch.svelte';
  import Choice, { ChoiceFilter } from '$lib/table/ChoiceFilter.svelte';
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
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import TitleBar from '../TitleBar.svelte';
  import type { PageProps } from './$types';
  import AddEditStudentModal from './AddEditStudentModal.svelte';
  import Settings from './Settings.svelte';

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
      if (!row.enrollmentYear && this.bound) return false;
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
      numeric: true,
      sortable: true,
      searchable: true,
    },
    {
      key: 'accepted',
      label: m.students_accepted(),
      numeric: false,
      sortable: false,
      searchable: false,
    },
  ] as const;

  let selected = $state(new SvelteSet<number>());
  let editing: StudentView | null = $state(null);
  let addModalOpen = $state(false);
  let deleteModalOpen = $state(false);
  let exportModalOpen = $state(false);
  let filtersModalOpen = $state(false);
  let importModalOpen = $state(false);
  let settingsModalOpen = $state(false);

  let validationData: {
    existsByEmail: Record<string, boolean>;
    existsByNumber: Record<number, boolean>;
  } | null = null;
  const acceptedLoading = new SvelteSet<number>();

  class AcceptedFilter extends ChoiceFilter<StudentView> {
    isSatisfied(row: StudentView): boolean {
      if (this.isActive) {
        return this.selected === m.students_filters_accepted_true()
          ? row.accepted === true
          : row.accepted === false;
      }
      return true;
    }
  }

  const acceptedFilter = new AcceptedFilter(
    () => [m.students_filters_accepted_true(), m.students_filters_accepted_false()],
  );

  let acceptSelectedLoading = $state(false);
</script>

<Settings {data} bind:open={settingsModalOpen} />

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
      required: key !== 'name' && key !== 'surname' && key !== 'enrollmentYear' && key != 'accepted',
    }]),
  ) as Record<
    keyof StudentView,
    { label: LocalizedString; numeric: boolean; required: boolean }
  >}
  title={m.table_import_modal({ entities: m.students({ count: 2 }) })}
  preValidate={async (rows) => {
    await sendForm('?/studentsExist', {
      students: JSON.stringify((rows as StudentView[]).map((row) => {
        return { email: row.email, number: row.number };
      })),
    }).then((data) => validationData = data as typeof validationData)
      .catch(() => error(m.error()));
  }}
  validators={{
    number: (v) => {
      const error = isRequiredNumber(0, MAX_INT)(v);
      if (error != null) return error;
      if (validationData?.existsByNumber[Number(v)] === true) {
        return m.import_students_duplicate_number();
      }
      return null;
    },
    email: (v) => {
      const error = isEmail('required')(v);
      if (error != null) return error;
      if (validationData?.existsByEmail[v as string] === true) {
        return m.import_students_duplicate_email();
      }
      return null;
    },
    enrollmentYear: isOptionalNumber(0, MAX_SMALLINT),
  }}
  onImport={async (rows: StudentView[]) => {
    await sendForm('?/import', { rows: JSON.stringify(rows) })
      .then(async (data) => {
        success(m.students_imported({ count: data.inserted as number }));
        importModalOpen = false;
        await invalidateAll();
      })
      .catch(() => error(m.error()));
  }}
/>

<Modal
  bind:open={filtersModalOpen}
  title={m.table_filters()}
  onDismiss={() => {
    acceptedFilter.selectedField = undefined;
    yearFilter.boundField.resetTo();
    yearFilter.orderEqField = 'lt';
  }}
  actions={[
    { label: m.modal_dismiss(), onClick: () => (filtersModalOpen = false), role: 'secondary' },
    {
      label: m.modal_apply(),
      disabled: !(yearFilter.hasChanged && yearFilter.isValid)
        && !acceptedFilter.hasChanged,
      onClick: () => {
        yearFilter.apply();
        acceptedFilter.apply();
        filtersModalOpen = false;
      },
    },
  ]}
>
  <div class="row-spaced row-filter">
    <span style="width: 30%">{m.students_year()}</span>

    <div class="control">
      <OrderEqSelector bind:orderEq={yearFilter.orderEqField} />
      <AcademicYearField
        field={yearFilter.boundField}
        maxWidth={200}
        value={yearFilter.bound}
      />
    </div>

    <button
      class="secondary icon-host"
      onclick={() => yearFilter.clear()}
      disabled={!yearFilter.isActive}
      {@attach (node) => tooltip({ content: m.table_filter_turn_off(), appendTo: () => node })(node)}
    >
      <BrushCleaning />
    </button>
  </div>

  <hr>

  <Choice
    maxWidth="100%"
    textWidth="30%"
    label={m.column_filter({ column: m.students_accepted() })}
    filter={acceptedFilter}
  />
</Modal>

{#snippet actionsOnSelected()}
  <LoadingButton
    class="secondary"
    loading={acceptSelectedLoading}
    grow={false}
    onclick={async () => {
      acceptSelectedLoading = true;
      await sendForm('?/acceptSelection', { ids: JSON.stringify([...selected]) })
        .then(async (data) => {
          selected.clear();
          await invalidateAll();
          success(m.students_accept_selected_success({ count: data.updated as number }));
        })
        .catch(() => error(m.error()))
        .finally(() => acceptSelectedLoading = false);
    }}
  >{m.students_accept_selected()}</LoadingButton>
{/snippet}

{#snippet body(row: StudentView & { idx?: number })}
  <td class="numeric">{row.number}</td>
  <td class="truncate20">{row.name}</td>
  <td class="truncate20">{row.surname}</td>
  <td class="truncate50">{row.email}</td>
  <td class="numeric">
    {#if row.enrollmentYear}{row.enrollmentYear}/{row.enrollmentYear + 1}{/if}
  </td>
  <td class="action">
    <div>
      <Switch
        name="{row.id}-accepted"
        loading={acceptedLoading.has(row.id)}
        checked={row.accepted === true}
        height="28px"
        width="3.2rem"
        onchange={async (e) => {
          const el = e.target as HTMLInputElement;
          if (el == null) return;
          acceptedLoading.add(row.id);
          await sendForm('?/toggleAccepted', { id: String(row.id), val: String(el.checked) })
            .then(() => data.students[row.idx!].accepted = el.checked)
            .catch(() => error(m.error()))
            .finally(() => acceptedLoading.delete(row.id));
        }}
      />
    </div>
  </td>
{/snippet}

<section class="container">
  <TitleBar title={m.students_title()} />

  <Table
    data={data.students}
    {columns}
    {body}
    filters={[yearFilter, acceptedFilter]}
    bind:selected
    bind:editing
    bind:addModalOpen
    bind:deleteModalOpen
    bind:filtersModalOpen
    bind:exportModalOpen
    bind:importModalOpen
    bind:settingsModalOpen
    getRowInfo={(row: StudentView) => [row.name, row.surname].filter(Boolean).join('  ')}
    label={m.students}
    uniqKey="stu-tab-int"
    {actionsOnSelected}
  />
</section>
