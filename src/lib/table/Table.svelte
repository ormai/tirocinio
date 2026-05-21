<!-- @component A generic, interactive table with a toolbar that allows filtering,
                sorting, selection, and CRUD operations on the data. -->

<script lang="ts" module>
  /**
   * The entity represented by the table in every row.
   */
  export interface Row extends Record<string, unknown> {
    /** A unique identifier for the row/entity. Usually comes directly from the database. */
    id: number;
  }

  /**
   * A custom table filter, applied on each row.
   * Internal state should be made reactive using Svelte's rune (`$state()`, `$derived()`), so that
   * get accessors and internal methods that rely on such state updated automatically, reflecting
   * updates immediately to the table.
   */
  export interface Filter<T extends Row> {
    /** @returns `true` if the {@link row} should be kept, or `false` if it should be excluded. */
    isSatisfied(row: T): boolean;

    /** @returns `true` if the filter has a new value, not yet applied. */
    get hasChanged(): boolean;

    /** @returns `true` if new value for the filter is valid. */
    get isValid(): boolean;

    /** Whether the filter is currently active. */
    get isActive(): boolean;

    /** Resets the internal state of the filter. */
    clear(): void;

    /** Applies the filter, only if {@link canApply} is `true`. */
    apply(): void;
  }
</script>

<script lang="ts" generics="T extends Row">
  import { m } from '$lib/paraglide/messages';
  import { tooltip } from '$lib/tooltip.svelte';
  import type { LocalizedString } from '@inlang/paraglide-js';
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
  import type { Snippet } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { fade } from 'svelte/transition';
  import '$lib/assets/table.css';

  type Key = keyof T;

  interface Column {
    key: Key;
    label: LocalizedString;
    numeric: boolean;
    sortable: boolean;
    searchable: boolean;
  }

  interface Sort {
    key?: Key;
    direction: 1 | -1;
  }

  interface Props {
    data: ReadonlyArray<T>;
    columns: ReadonlyArray<Column>;
    selected: SvelteSet<Row['id']>;
    editing: T | null;
    filters: ReadonlyArray<Filter<T>>;
    body: Snippet<[T]>;
    filtersModalOpen: boolean;
    exportModalOpen: boolean;
    deleteModalOpen: boolean;
    addModalOpen: boolean;
    getRowInfo: (row: T) => string;
    label: ({ count }: { count: number }) => LocalizedString;
    allFilteredOutMessage?: LocalizedString;
  }

  /* eslint-disable no-useless-assignment */
  let {
    data,
    columns,
    body,
    filters,
    selected = $bindable(new SvelteSet()),
    editing = $bindable(null),
    filtersModalOpen = $bindable(false),
    exportModalOpen = $bindable(false),
    deleteModalOpen = $bindable(false),
    addModalOpen = $bindable(false),
    getRowInfo,
    label,
    allFilteredOutMessage = m.table_all_filtered_out({ entity: label({ count: 1 }) }),
  }: Props = $props();
  /* eslint-enable no-useless-assignment */

  function filterAndSort(data: ReadonlyArray<T>): Array<T> {
    let rows = data.filter((row) =>
      (!search
        || columns.filter((col) => col.searchable).map((col) => row[col.key]).some((val) =>
          String(val ?? '').toLowerCase().includes(search.toLowerCase())
        )) && filters.every((filter) => filter.isSatisfied(row))
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

  let search = $state('');
  let sort: Sort = $state({ key: undefined, direction: 1 });
  let filtered = $derived(filterAndSort(data));

  // The 'select all' checkbox won't be updated just by reactive properties
  let selectAllCheckbox = $state<HTMLInputElement>();
  $effect(() => {
    if (selectAllCheckbox) {
      selectAllCheckbox.indeterminate = selected.size > 0 && selected.size !== filtered.length;
      selectAllCheckbox.checked = selected.size > 0 && selected.size === filtered.length;
    }
  });

  function toggleSort(key: Key) {
    if (sort.key === key) {
      sort.direction = sort.direction === 1 ? -1 : 1;
    } else {
      sort = { key, direction: 1 };
    }
  }

  function clear() {
    sort.key = undefined;
    search = '';
    selected.clear();
    for (const filter of filters) {
      filter.clear();
    }
  }

  function toggleSelectAll() {
    if (selected.size > 0) {
      selected.clear();
    } else {
      for (const { id } of filtered) {
        selected.add(id);
      }
    }
  }

  function toggleSelected(id: number) {
    if (!selected.delete(id)) {
      selected.add(id);
    }
  }

  let skipOnMountFlag = true;
  const pageSize = 18;
  let page = $state(0);
  $effect(() => {
    void filtered;
    if (skipOnMountFlag) {
      skipOnMountFlag = false;
    } else {
      page = 0;
    }
  });
  let pageCount = $derived(Math.ceil(filtered.length / pageSize));
  let paginated = $derived(filtered.slice(page * pageSize, (page + 1) * pageSize));

  // Prevents the table from ever shrinking.
  let tableWidth = $state(0);
  let minTableWidth = $state(0);
  $effect(() => {
    minTableWidth = Math.max(tableWidth, minTableWidth);
  });

  $effect(() => {
    const visibleIds = new Set(filtered.map((s) => s.id));
    for (const id of selected) {
      if (!visibleIds.has(id)) selected.delete(id);
    }
  });
</script>

<div class="toolbar">
  <div class="row">
    <div class="input-icon">
      <div class="icon-box icon-host"><Search /></div>
      <input type="search" placeholder={m.table_search_placeholder()} bind:value={search} />
    </div>
    <button
      class="icon-host"
      class:secondary={filters.every((f) => !f.isActive)}
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
            onclick={() => (exportModalOpen = true)}
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
          <span class="numeric">{m.table_selected({ selected: selected.size })}</span>
        </div>
      {/if}
      {#if sort.key !== undefined || search.length > 0 || selected.size > 0 || filters.some((f) => f.isActive)}
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
          `${data.length === filtered.length ? data.length : `${filtered.length}/${data.length}`} ${
            label({ count: filtered.length })
          }`
        }
      </span>
      <button
        class="secondary icon-host"
        {@attach tooltip(m.table_add({ entity: label({ count: 1 }) }))}
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
        <th class="action">
          <input
            type="checkbox"
            bind:this={selectAllCheckbox}
            onclick={toggleSelectAll}
            {@attach tooltip(selected.size > 0 ? m.table_deselect_all() : m.table_select_all())}
          />
        </th>
        <th></th>
        {#each columns as { key, label, numeric, sortable } (key)}
          <th
            onclick={() => sortable && toggleSort(key)}
            onkeydown={(e) => {
              if (sortable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                toggleSort(key);
              }
            }}
            aria-sort={sortable
            ? sort.key === key ? (sort.direction === 1 ? 'ascending' : 'descending') : 'none'
            : undefined}
            tabindex={sortable ? 0 : undefined}
            class:sortable
            {@attach sortable && tooltip(
              m.table_sort_by({
                key: label,
                direction: sort.direction === 1 && sort.key === key ? m.table_sort_asc() : m.table_sort_desc(),
              }),
            )}
          >
            <div class="row">
              <span>{label}</span>
              {#if sortable}
                <span style:min-width="24px">
                  {#if sort.key === key}
                    {#if sort.direction === 1}
                      {#if numeric}<ArrowDown01 />{:else}<ArrowDownAZ />{/if}
                    {:else}
                      {#if numeric}<ArrowUp01 />{:else}<ArrowUpAZ />{/if}
                    {/if}
                  {:else}
                    <ArrowDownUp />
                  {/if}
                </span>
              {/if}
            </div>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each paginated as row (row.id)}
        {@const rowInfo = getRowInfo(row)}
        <tr>
          <td>
            <input
              type="checkbox"
              checked={selected.has(row.id)}
              onclick={() => toggleSelected(row.id)}
              {@attach tooltip(selected.has(row.id) ? m.table_deselect_row({ rowInfo }) : m.table_select_row({ rowInfo }))}
            />
          </td>
          <td class="action">
            <button
              class="tertiary"
              style="min-width: calc(16px + 2 * var(--spacing))"
              {@attach tooltip(m.table_edit_row({ rowInfo }))}
              onclick={() => (editing = row)}
            >
              <Pencil size={16} />
            </button>
          </td>
          {@render body(row)}
        </tr>
      {:else}
        <tr>
          <td colspan={columns.length + 2} class="notice">
            {#if data.length > 0}
              {allFilteredOutMessage}
            {:else}
              {m.table_empty({ entities: label({ count: 2 }) })}
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
            max-width: initial;
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

  .notice {
    text-align: center;
    color: var(--body-light);
    font-style: italic;
  }
</style>
