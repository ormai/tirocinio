<script lang="ts" module>
  import { m } from '$lib/paraglide/messages';
  import { tooltip } from '$lib/tooltip.svelte';
  import { BrushCleaning } from '@lucide/svelte';
  import type { Filter, Row } from './Table.svelte';

  /**
   * A filter that allows a choice among a set of options.
   */
  export abstract class ChoiceFilter<T extends Row> implements Filter<T> {
    selected = $state<string>();
    selectedField = $state<string>();
    #values: () => Iterable<string> | null | undefined;

    constructor(values: () => Iterable<string> | null | undefined) {
      this.#values = values;
    }

    get options(): Set<string> {
      return new Set(this.#values() ?? []);
    }

    abstract isSatisfied(row: T): boolean;

    get hasChanged(): boolean {
      return this.selectedField !== undefined && this.selectedField.length > 0
        && this.selected !== this.selectedField;
    }

    get isValid(): boolean {
      return true;
    }

    get isActive(): boolean {
      return this.selected != undefined && this.selected.length > 0;
    }

    clear(): void {
      this.selected = undefined;
      this.selectedField = undefined;
    }

    apply(): void {
      if (this.hasChanged && this.isValid) {
        this.selected = this.selectedField;
      }
    }
  }
</script>

<script lang="ts">
  interface Props {
    filter: Filter<Row> & { selected?: string; selectedField?: string; options: Set<string> };
    label: string;
  }

  let { filter, label }: Props = $props();
</script>

<div class="row-spaced">
  <span>{label}</span>

  <select
    bind:value={filter.selectedField}
    {@attach () => {
      if (!filter.selectedField && filter.selected) {
        filter.selectedField = filter.selected;
      }
    }}
  >
    <option disabled value={undefined}>{m.filter_choose()}</option>
    {#each filter.options as opt (opt)}
      <option value={opt}>{opt}</option>
    {/each}
  </select>

  <button
    class="secondary icon-host"
    disabled={!filter.isActive}
    onclick={() => filter.clear()}
    {@attach (button) => tooltip({ content: m.table_filter_turn_off(), appendTo: () => button })(button)}
  >
    <BrushCleaning />
  </button>
</div>

<style>
  .row-spaced {
    gap: 1rem;
    max-width: 380px;
    margin: auto;
  }

  select {
    width: 50%;
  }

  span {
    width: 20%;
  }
</style>
