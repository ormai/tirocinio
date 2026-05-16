<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import TitleBar from '../TitleBar.svelte';
  import '$lib/assets/table.css';
  import AcademicYearField, { YearField } from '$lib/form/AcademicYear.svelte';
  import Modal from '$lib/Modal.svelte';
  import type { StudentView } from '$lib/server/user.js';
  import { tooltip } from '$lib/tooltip.svelte.js';
  import {
    ArrowDown01,
    ArrowDownAZ,
    ArrowDownUp,
    ArrowUp01,
    ArrowUpAZ,
    ChevronFirst,
    ChevronLast,
    ChevronLeft,
    ChevronRight,
    Download,
    Funnel,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    Trash,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { fade } from 'svelte/transition';
  import type { PageProps } from './$types';
  import AddEditStudentModal from './AddEditStudentModal.svelte';

  // TODO: form to add one student
  // TODO: action to edit each student
  // TODO: export selected students
  // TODO: delete selected students
  // TODO: import students from spreadsheet (?)
  // TODO: store table state locally for the client, maybe in session state.
  // TODO: make table reusable

  const columns = [
    { key: 'number', label: m.students_number(), style: 'numeric' },
    { key: 'name', label: m.students_name(), style: 'truncate20' },
    { key: 'surname', label: m.students_surname(), style: 'truncate20' },
    { key: 'email', label: m.students_email(), style: 'truncate50' },
    { key: 'enrollmentYear', label: m.students_year(), style: 'numeric' },
  ] as const;

  type Key = typeof columns[number]['key'];

  interface Sort {
    key?: Key;
    direction: 1 | -1;
  }

  let { data, form }: PageProps = $props();

  console.time('mount');
  onMount(() => console.timeEnd('mount'));

  let search = $state('');
  let sort: Sort = $state({ key: undefined, direction: 1 });
  const selected = new SvelteSet<number>();
  let students = $derived(filterAndSort(data.students));
  let allSelected: boolean = $derived(selected.size > 0 && selected.size === students.length);
  let deleteModalOpen = $state(false);
  let filtersModalOpen = $state(false);

  // The 'select all' checkbox won't be updated just by reactive properties
  let selectAllCheckbox = $state<HTMLInputElement>();
  $effect(() => {
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = selected.size > 0 && selected.size === students.length;
    }
  });

  // Table must not shrink.
  let tableWidth = $state(0);
  let minTableWidth = $derived(0);
  $effect(() => {
    minTableWidth = Math.max(tableWidth, minTableWidth);
  });

  function toggleSort(key: Key) {
    if (sort.key === key) {
      sort.direction = sort.direction === 1 ? -1 : 1;
    } else {
      sort = { key, direction: 1 };
    }
  }

  type Tone = 'lt' | 'le' | 'gt' | 'ge' | 'eq';
  let yearTone: Tone = $state('lt');
  let yearFilter: { num?: number; tone: Tone } = $state({ num: undefined, tone: 'lt' });
  const yearFilterField = new YearField();
  function yearFilterSatisfied(year: number | null): boolean {
    const { tone, num } = yearFilter;
    if (year && num) {
      switch (tone) {
        case 'lt':
          return year < num;
        case 'le':
          return year <= num;
        case 'gt':
          return year > num;
        case 'ge':
          return year >= num;
        case 'eq':
          return year === num;
      }
    }
    return true;
  }

  function isDirty(): boolean {
    return sort.key !== undefined || search.length > 0 || selected.size > 0
      || yearFilter.num !== undefined;
  }

  function clear() {
    sort.key = undefined;
    search = '';
    selected.clear();
    yearFilter.num = undefined;
  }

  $effect(() => {
    const visibleIds = new Set(students.map((s) => s.id));
    for (const id of selected) {
      if (!visibleIds.has(id)) selected.delete(id);
    }
  });

  function filterAndSort(students: ReadonlyArray<StudentView>): Array<StudentView> {
    let rows = students.filter((s) =>
      (!search
        || [s.number, s.name, s.surname, s.email, s.enrollmentYear].some((v) =>
          String(v ?? '').toLowerCase().includes(search.toLowerCase())
        )) && yearFilterSatisfied(s.enrollmentYear)
    );

    if (sort.key) {
      rows.sort((a, b) => {
        const av = a[sort.key!] ?? '';
        const bv = b[sort.key!] ?? '';
        return av < bv ? -sort.direction : av > bv ? sort.direction : 0;
      });
    }
    return rows;
  }

  function toggleSelectAll() {
    if (selected.size > 0) {
      selected.clear();
    } else {
      for (const { id } of students) {
        selected.add(id);
      }
    }
  }

  function toggleSelected(id: number) {
    if (!selected.delete(id)) {
      selected.add(id);
    }
  }

  let selectAllTooltip = $derived(
    selected.size > 0 ? m.table_deselect_all() : m.table_select_all(),
  );

  const pageSize = 18;
  let page = $state(0);
  $effect(() => {
    void students;
    page = 0;
  });
  let pageCount = $derived(Math.ceil(students.length / pageSize));
  let paginated = $derived(students.slice(page * pageSize, (page + 1) * pageSize));

  let editing: StudentView | null = $state(null);
  let addModalOpen: boolean = $state(false);
</script>

<AddEditStudentModal bind:editing bind:addModalOpen {form} />

<Modal
  title={m.students_delete({ count: selected.size })}
  bind:open={deleteModalOpen}
  actions={[
    { label: m.modal_cancel(), onClick: () => (deleteModalOpen = false), role: 'secondary' },
    { label: m.modal_delete(), onClick: () => {}, role: 'danger' },
  ]}
/>

<Modal
  bind:open={filtersModalOpen}
  title={m.table_filters()}
  actions={[{ label: m.modal_dismiss(), onClick: () => (filtersModalOpen = false), role: 'secondary' }, {
    label: m.modal_apply(),
    onClick: () => {
      if (yearFilterField?.valid) {
        const num = Number.parseInt(yearFilterField.value);
        if (Number.isFinite(num)) {
          yearFilter.num = num;
          yearFilter.tone = yearTone;
          filtersModalOpen = false;
        }
      }
    },
  }]}
>
  <div class="row filter">
    {m.students_year()}
    <select bind:value={yearTone}>
      <option value="lt">&lt;</option>
      <option value="le">&le;</option>
      <option value="gt">&gt;</option>
      <option value="ge">&ge;</option>
      <option value="eq">=</option>
    </select>
    <AcademicYearField field={yearFilterField} maxWidth={200} initialValue={yearFilter.num} />
    {#if yearFilter.num}
      <button
        class="secondary icon-host"
        onclick={() => (yearFilter.num = undefined)}
        transition:fade
        {@attach tooltip(m.table_filter_turn_off())}
      >
        <RotateCcw />
      </button>
    {/if}
  </div>
</Modal>

<section class="container">
  <TitleBar title={m.students_title()} />

  <div class="toolbar">
    <div class="row">
      <div class="input-icon">
        <div class="icon-box icon-host"><Search /></div>
        <input type="search" placeholder={m.table_search_placeholder()} bind:value={search} />
      </div>
      <button
        class="secondary icon-host"
        {@attach tooltip(m.table_filters())}
        onclick={() => (filtersModalOpen = true)}
      >
        <Funnel />
      </button>
    </div>

    <div class="row" style="justify-content: space-between;">
      <div id="selection-controls" class="row">
        {#if selected.size > 0}
          <div transition:fade class="row">
            <button
              class="secondary icon-host"
              onclick={() => {}}
              {@attach tooltip(m.table_export())}
            >
              <Download />
            </button>
            <button
              class="danger icon-host"
              onclick={() => (deleteModalOpen = true)}
              {@attach tooltip(m.modal_delete())}
            >
              <Trash />
            </button>
            <span class="numeric">{m.students_selected({ selected: selected.size })}</span>
          </div>
        {/if}
        {#if isDirty()}
          <button
            class="secondary icon-host"
            onclick={clear}
            {@attach tooltip(m.table_clear_filters())}
            transition:fade
          >
            <RotateCcw />
          </button>
        {/if}
      </div>

      <div class="row">
        <span class="numeric" style="text-align: end">
          {
            m.students_count({
              visible: data.students.length === students.length
                ? data.students.length
                : `${students.length}/${data.students.length}`,
            })
          }
        </span>
        <button
          class="secondary icon-host"
          {@attach tooltip(m.students_add())}
          onclick={() => (addModalOpen = true)}
        >
          <Plus />
        </button>
      </div>
    </div>
  </div>

  <div class="scroller" tabindex="-1">
    <table bind:clientWidth={tableWidth} style:min-width={`${minTableWidth}px`}>
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              bind:this={selectAllCheckbox}
              indeterminate={!allSelected && selected.size > 0}
              aria-label={selectAllTooltip}
              onclick={toggleSelectAll}
              {@attach tooltip(selectAllTooltip)}
            />
          </th>
          <th></th>
          {#each columns as { key, label, style } (key)}
            <th
              onclick={() => toggleSort(key)}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleSort(key);
                }
              }}
              aria-sort={sort.key === key ? (sort.direction === 1 ? 'ascending' : 'descending') : 'none'}
              tabindex="0"
              class="sortable"
              {@attach tooltip(
                m.table_sort_by({
                  key: label,
                  direction: sort.direction === 1 && sort.key === key ? m.table_sort_asc() : m.table_sort_desc(),
                }),
              )}
            >
              <div class="row">
                <span>{label}</span>
                <span style:min-width="24px">
                  {#if sort.key === key}
                    {#if sort.direction === 1}
                      {#if style?.at(0) === 'n'}<ArrowDown01 />{:else}<ArrowDownAZ />{/if}
                    {:else}
                      {#if style?.at(0) === 'n'}<ArrowUp01 />{:else}<ArrowUpAZ />{/if}
                    {/if}
                  {:else}
                    <ArrowDownUp />
                  {/if}
                </span>
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each paginated as { id, number, name, surname, email, enrollmentYear }, i (id)}
          {@const rowInfo = `${name} ${surname}`}
          {@const selectTooltip = selected.has(id)
          ? m.table_deselect_row({ rowInfo })
          : m.table_select_row({ rowInfo })}
          <tr>
            <td>
              <input
                type="checkbox"
                checked={selected.has(id)}
                aria-label={selectTooltip}
                onclick={() => toggleSelected(id)}
                {@attach tooltip(selectTooltip)}
              />
            </td>
            <td class="action">
              <button
                class="tertiary"
                style="min-width: calc(16px + 2 * var(--spacing))"
                {@attach tooltip(m.table_edit_row({ rowInfo }))}
                onclick={() => {
                  editing = paginated[i];
                }}
              >
                <Pencil size={16} />
              </button>
            </td>
            <td class="numeric">{number}</td>
            <td class="truncate20">{name}</td>
            <td class="truncate20">{surname}</td>
            <td class="truncate50">{email}</td>
            <td class="numeric">{#if enrollmentYear}{enrollmentYear}/{enrollmentYear + 1}{/if}</td>
          </tr>
        {:else}
          <tr>
            <td colspan={columns.length + 1} class="notice">
              {#if data.students.length > 0}
                {m.students_all_filtered_out()}
              {:else}
                {m.students_empty()}
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if pageCount > 1}
    <div class="pagination row" style="margin-top: 1rem">
      <button
        class="secondary icon-host"
        disabled={page === 0}
        onclick={() => page = 0}
        {@attach tooltip(m.table_page_first())}
      >
        <ChevronFirst />
      </button>
      <button
        class="secondary icon-host"
        disabled={page === 0}
        onclick={() => page--}
        {@attach tooltip(m.table_page_prev())}
      >
        <ChevronLeft />
      </button>
      <span class="numeric">{page + 1} / {pageCount}</span>
      <button
        class="secondary icon-host"
        disabled={page === pageCount - 1}
        onclick={() => page++}
        {@attach tooltip(m.table_page_next())}
      >
        <ChevronRight />
      </button>
      <button
        class="secondary icon-host"
        disabled={page === pageCount - 1}
        onclick={() => page = pageCount - 1}
        {@attach tooltip(m.table_page_last())}
      >
        <ChevronLast />
      </button>
    </div>
  {/if}
</section>

<style>
  @media (max-width: 800px) {
    .toolbar {
      flex-direction: column;

      #selection-controls {
        flex-direction: row-reverse;
      }

      >div {
        width: 100%;
      }

      >div:first-child {
        flex: 1 1 100%;
        .input-icon {
          flex: 1;
          input {
            flex: 1;
            max-width: none;
            min-width: 0;
          }
        }
      }
    }
  }

  .row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
  }

  .row.filter {
    text-align: center;
  }

  span {
    letter-spacing: -0.6px;
    font-size: 0.9rem;
    line-height: 1.1rem;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    gap: 0.5rem;

    .input-icon {
      display: flex;
      .icon-box {
        display: flex;
        align-items: center;
        border: 1px solid var(--border);
        border-right: none;
        border-top-left-radius: var(--radius);
        border-bottom-left-radius: var(--radius);
      }
      input {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        max-width: 200px;
      }
    }
  }

  .icon-host {
    padding: var(--spacing);
    min-width: calc(24px + var(--spacing) * 2 + 2px);
  }

  .notice {
    text-align: center;
    color: var(--body-light);
    font-style: italic;
  }
</style>
