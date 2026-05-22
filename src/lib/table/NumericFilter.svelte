<script lang="ts" module>
  /**
   * A filter for those property of {@link T} that are numbers.
   */
  export abstract class NumericFilter<T extends Row> implements Filter<T> {
    orderEq: OrderEq = $state('lt');
    orderEqField: OrderEq = $state('lt');
    bound = $state<number>();
    boundField = $state(new NumericField());

    get hasChanged(): boolean {
      return this.boundField.hasChanged(this.bound)
        || this.orderEq !== this.orderEqField && this.boundField.hasText;
    }
    get isValid(): boolean {
      return this.boundField.valid;
    }

    abstract isSatisfied(row: T): boolean;

    get isActive(): boolean {
      return this.bound !== undefined;
    }

    clear(): void {
      this.bound = undefined;
      this.boundField.resetTo();
      this.orderEq = 'lt';
      this.orderEqField = 'lt';
    }

    apply(): void {
      if (this.isValid) {
        const bound = Number.parseInt(this.boundField.value);
        if (Number.isFinite(bound)) {
          this.bound = bound;
          this.orderEq = this.orderEqField;
        }
      }
    }
  }
</script>

<script lang="ts">
  import Numeric, { NumericField } from '$lib/form/Numeric.svelte';
  import { m } from '$lib/paraglide/messages';
  import { tooltip } from '$lib/tooltip.svelte';
  import { BrushCleaning } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import type { OrderEq } from './OrderEqSelector.svelte';
  import OrderEqSelector from './OrderEqSelector.svelte';
  import type { Filter, Row } from './Table.svelte';

  interface Props {
    filter: NumericFilter<Row> & {
      orderEqField: OrderEq;
      orderEq: OrderEq;
      bound?: number;
      boundField: NumericField;
    };
    label: string;
  }

  let { filter, label }: Props = $props();

  onMount(() => {
    if (filter.orderEqField !== filter.orderEq) {
      filter.orderEqField = filter.orderEq;
    }
  });
</script>

<div class="row-spaced">
  <span>{label}</span>
  <div class="controls">
    <OrderEqSelector bind:orderEq={filter.orderEqField} />
    <Numeric field={filter.boundField} initialValue={filter.bound} style="flex-grow: 1" />
  </div>
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
  .controls {
    width: 50%;
    display: flex;
    gap: 0.4rem;
  }
  span {
    width: 20%;
  }
</style>
