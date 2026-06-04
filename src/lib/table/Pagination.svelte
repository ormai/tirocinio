<!-- @component Controls for pagination of an array of data displayed on the screen -->

<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import { tooltip } from '$lib/tooltip.svelte';
  import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from '@lucide/svelte';

  interface Props {
    page: number;
    pageSize: number;
    itemsLength: number;
  }

  let { page = $bindable(), pageSize, itemsLength }: Props = $props();

  let pageCount = $derived(Math.ceil(itemsLength / pageSize));
</script>

{#if pageCount > 1}
  <div class="pagination" style="margin-top: 1rem">
    <button
      class="secondary icon-host"
      disabled={page === 0}
      onclick={() => page = 0}
      {@attach tooltip(m.table_page_first())}
    >
      <ChevronFirst size={24} />
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
  .pagination {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
  }
</style>
