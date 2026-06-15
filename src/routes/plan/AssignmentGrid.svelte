<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import SearchBox from '$lib/SearchBox.svelte';
  import Pagination from '$lib/table/Pagination.svelte';
  import { tooltip } from '$lib/tooltip.svelte';
  import { ArrowDown01, ArrowDownUp, ArrowUp01 } from '@lucide/svelte';
  import type { Assignment } from './+page.svelte';

  interface Props {
    structures: { id: number; name: string }[];
    loading?: boolean;
    assignments: Assignment[];
    viewOnly?: boolean;
    /** Mapping of months to the ids of the structures that exceed their capacity in that month */
    structuresExceedingCapacity?: Map<number, Set<number>>;
  }

  let {
    structures,
    loading = $bindable(false),
    assignments = $bindable(),
    viewOnly = false,
    structuresExceedingCapacity,
  }: Props = $props();

  $inspect(structuresExceedingCapacity);

  let search = $state('');
  let sortByYear: -1 | 0 | 1 = $state(0);

  let processed = $derived.by(() => {
    const searchCaseInsensitive = search ? search.toLowerCase() : '';
    const filtered = assignments.filter((student) =>
      !search
      || [student.name, student.surname, student.number, student.email].some((val) =>
        String(val ?? '').toLowerCase().includes(searchCaseInsensitive)
      )
    );

    if (sortByYear !== 0) {
      filtered.sort((a, b) => {
        const ay = a.year ?? 0;
        const by = b.year ?? 0;
        return ay < by ? -sortByYear : ay > by ? sortByYear : 0;
      });
    }

    return filtered;
  });

  function cycleSort() {
    if (sortByYear === 0) {
      sortByYear = 1;
    } else if (sortByYear === 1) {
      sortByYear = -1;
    } else {
      sortByYear = 0;
    }
  }

  let structuresMap = $derived(new Map(structures.map(({ id, name }) => [id, name])));

  let page = $state(0);
  const pageSize = 11;
  let paginated = $derived(processed.slice(page * pageSize, (page + 1) * pageSize));

  const months = $derived(Math.max(...paginated.map((a) => a.structureIds.length)));
</script>

{#if assignments.length > 0}
  <section class="container" style="padding-top: 0">
    <div class="row-spaced" style="margin-top: 1rem">
      <SearchBox bind:value={search} style="flex: 1" />

      <button
        class="sort {sortByYear === 0 ? 'secondary' : 'primary'}"
        onclick={cycleSort}
        {@attach tooltip(m.plan_sort_by_year())}
      >
        <div>
          {#if sortByYear === 0}
            <ArrowDownUp />
          {:else if sortByYear === -1}
            <ArrowUp01 />
          {:else}
            <ArrowDown01 />
          {/if}
        </div><span>{m.plan_sort_by_year()}</span>
      </button>
    </div>
  </section>
{/if}

<div style="padding: 0 1rem">
  <div
    class="assignments"
    style:grid-template-columns="repeat({months+1}, max-content)"
  >
    {#each { length: months }, c (c)}
      <span class="numeric" style:grid-area="1 / {c + 2}">{
        m.preferences_month_head({ n: c + 1 })
      }</span>
    {/each}
    {#each paginated as { id, email, number, name, surname, structureIds, year }, r (id)}
      <span style="grid-area: {r + 2} / 1">
        {#if number != null}<span class="numeric" style="margin-right: 0.7rem">{
            number
          }</span>{/if}<span class="truncate20">{name} {
            surname
          }</span>{#if [number, name, surname].filter(Boolean).length < 2}<span class="truncate30">{
            email
          }</span>{/if}{#if year != null}<span
            style="margin-left: 0.7rem"
            class="numeric"
          >{year}/{year + 1}</span>{/if}
      </span>
      {#each { length: structureIds.length }, c (c)}
        <select
          bind:value={structureIds[c]}
          style="grid-area: {r + 2} / {c + 2}"
          disabled={loading || viewOnly}
          class:warn={!viewOnly && structureIds[c] != null && structuresExceedingCapacity?.get(c)?.has(structureIds[c])}
        >
          <option value={null}>{m.plan_empty_assignment()}</option>
          {#if viewOnly}
            {#if structureIds[c] != null}
              <option value={structureIds[c]}>{structuresMap.get(structureIds[c])}</option>
            {/if}
          {:else}
            {#each structures as { id, name } (id)}
              <option value={id}>{name}</option>
            {/each}
          {/if}
        </select>
      {/each}
    {:else}
      <span class="notice">{#if assignments.length === 0}
          {m.plan_empty()}
        {:else}
          {m.plan_filtered_out()}
        {/if}</span>
    {/each}
  </div>
</div>

<section class="container" style="padding-top: 0">
  <Pagination bind:page {pageSize} itemsLength={assignments.length} />
</section>

<style>
  .assignments {
    display: grid;
    gap: 0.7rem;
    align-items: center;
    padding: 1rem;
    background: hsl(from var(--body-light-bg) h s l / 0.6);
    border-radius: var(--radius);
    max-width: min-content;
    margin-inline: auto;
    border: var(--border-thickness) solid var(--border);
    overflow-x: auto;

    select {
      max-width: 300px;
    }
  }

  @media (max-width: 530px) {
    .row-spaced .sort {
      span {
        display: none;
      }

      padding: var(--spacing);
    }
  }

  .notice {
    margin: 0;
  }

  .sort {
    flex: 0 !important;
    min-width: fit-content;
  }

  select.warn {
    border-color: var(--warning-border);
    background: hsl(from var(--warning-bg) h s l / 0.3) !important;
  }
</style>
