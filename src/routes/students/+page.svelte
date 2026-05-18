<script lang="ts">
  import { page } from '$app/state';
  import AcademicYearField, { YearField } from '$lib/form/AcademicYear.svelte';
  import Modal from '$lib/Modal.svelte';
  import { m } from '$lib/paraglide/messages';
  import { deLocalizeHref } from '$lib/paraglide/runtime';
  import type { StudentView } from '$lib/server/user.js';
  import ExportModal from '$lib/table/ExportModal.svelte';
  import type { Filter } from '$lib/table/Table.svelte';
  import Table from '$lib/table/Table.svelte';
  import { tooltip } from '$lib/tooltip.svelte.js';
  import { X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { fade } from 'svelte/transition';
  import TitleBar from '../TitleBar.svelte';
  import type { PageProps } from './$types';
  import AddEditStudentModal from './AddEditStudentModal.svelte';
  import DeleteStudentsModal from './DeleteStudentsModal.svelte';

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
      yearFilter.tone = stored.yearFilterTone;
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
        yearFilterTone: yearFilter.tone,
      }),
    );
  });

  let { data, form }: PageProps = $props();

  type Tone = 'lt' | 'le' | 'gt' | 'ge' | 'eq';

  class YearFilter implements Filter<StudentView> {
    tone: Tone = $state('lt');
    toneField: Tone = $state('lt');
    bound?: number = $state(undefined);
    boundField = new YearField();

    isSatisfied(row: StudentView): boolean {
      if (row.enrollmentYear && this.bound) {
        switch (this.tone) {
          case 'lt':
            return row.enrollmentYear < this.bound;
          case 'le':
            return row.enrollmentYear <= this.bound;
          case 'gt':
            return row.enrollmentYear > this.bound;
          case 'ge':
            return row.enrollmentYear >= this.bound;
          case 'eq':
            return row.enrollmentYear === this.bound;
        }
      }
      return true;
    }

    get canApply(): boolean {
      return (this.boundField.hasChanged(this.bound) || this.tone !== this.toneField)
        && this.boundField.hasText && this.boundField.valid;
    }

    get isActive(): boolean {
      return this.bound !== undefined;
    }

    clear(): void {
      this.bound = undefined;
      this.boundField.resetTo();
      this.tone = 'lt';
      this.toneField = 'lt';
    }

    apply(): void {
      if (this.canApply) {
        const bound = Number.parseInt(this.boundField.value);
        if (Number.isFinite(bound)) {
          this.bound = bound;
          this.tone = this.toneField;
        }
      }
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

<DeleteStudentsModal bind:open={deleteModalOpen} ids={selected} />

<Modal
  bind:open={filtersModalOpen}
  title={m.table_filters()}
  actions={[
    { label: m.modal_dismiss(), onClick: () => (filtersModalOpen = false), role: 'secondary' },
    {
      label: m.modal_apply(),
      disabled: !yearFilter.canApply,
      onClick: () => {
        yearFilter.apply();
        filtersModalOpen = false;
      },
    },
  ]}
>
  <div class="row-spaced filter">
    {m.students_year()}
    <select bind:value={yearFilter.toneField}>
      <option value="lt">&lt;</option>
      <option value="le">&le;</option>
      <option value="gt">&gt;</option>
      <option value="ge">&ge;</option>
      <option value="eq">=</option>
    </select>
    <AcademicYearField
      field={yearFilter.boundField}
      maxWidth={200}
      initialValue={yearFilter.bound}
    />
    {#if yearFilter.isActive}
      <button
        class="secondary icon-host"
        onclick={() => yearFilter.clear()}
        transition:fade
        {@attach tooltip(m.table_filter_turn_off())}
      >
        <X />
      </button>
    {/if}
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
