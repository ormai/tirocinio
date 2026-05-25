<script lang="ts">
  import Modal from '$lib/Modal.svelte';
  import { m } from '$lib/paraglide/messages';
  import type { StructureView } from '$lib/server/structure';
  import Choice, { ChoiceFilter } from '$lib/table/ChoiceFilter.svelte';
  import Numeric, { NumericFilter } from '$lib/table/NumericFilter.svelte';
  import { compareOrderEq } from '$lib/table/OrderEqSelector.svelte';
  import { type Filter } from '$lib/table/Table.svelte';
  import { onMount } from 'svelte';

  // FIXME: choice filters don't update after import

  interface Props {
    filters: ReadonlyArray<Filter<StructureView>>;
    open: boolean;
    data: ReadonlyArray<StructureView>;
  }

  let { open = $bindable(false), filters = $bindable(), data }: Props = $props();

  class CapacityFilter extends NumericFilter<StructureView> {
    isSatisfied(row: StructureView): boolean {
      if (row.capacity && this.bound) {
        return compareOrderEq(this.orderEq, row.capacity, this.bound);
      }
      if (!row.capacity && this.bound) return false;
      return true;
    }
  }

  class AreaFilter extends ChoiceFilter<StructureView> {
    isSatisfied(row: StructureView): boolean {
      return this.isActive ? row.area === this.selected : true;
    }
  }

  class WardFilter extends ChoiceFilter<StructureView> {
    isSatisfied(row: StructureView): boolean {
      return this.isActive ? row.ward === this.selected : true;
    }
  }

  class KindFilter extends ChoiceFilter<StructureView> {
    isSatisfied(row: StructureView): boolean {
      return this.isActive ? row.kind === this.selected : true;
    }
  }

  class SiteFilter extends ChoiceFilter<StructureView> {
    isSatisfied(row: StructureView): boolean {
      return this.isActive ? row.site === this.selected : true;
    }
  }

  const disabled = $derived.by(() => {
    return !filters.some((f) => f.hasChanged) || !filters.every((f) => f.isValid);
  });

  const capacity = new CapacityFilter();
  const area = new AreaFilter(() => data.map((s) => s.area).filter((area) => area !== null));
  const ward = new WardFilter(() => data.map((s) => s.ward).filter((ward) => ward !== null));
  const kind = new KindFilter(() => data.map((s) => s.kind).filter((kind) => kind !== null));
  const site = new SiteFilter(() => data.map((s) => s.site).filter((site) => site !== null));
  filters = [capacity, area, ward, kind, site];

  onMount(() => {
    const saved = window.localStorage.getItem('structures-filters');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.capacityBound) capacity.bound = data.capacityBound;
      if (data.capacityOrderEq) capacity.orderEq = data.capacityOrderEq;
      if (data.areaSelected && area.options.has(data.areaSelected)) {
        area.selected = data.areaSelected;
      }
      if (data.wardSelected && ward.options.has(data.wardSelected)) {
        ward.selected = data.wardSelected;
      }
      if (data.kindSelected && kind.options.has(data.kindSelected)) {
        kind.selected = data.kindSelected;
      }
      if (data.siteSelected && site.options.has(data.siteSelected)) {
        site.selected = data.siteSelected;
      }
    }
  });
  $effect(() => {
    window.localStorage.setItem(
      'structures-filters',
      JSON.stringify({
        capacityBound: capacity.bound,
        capacityOrderEq: capacity.orderEq,
        areaSelected: area.selected,
        wardSelected: ward.selected,
        kindSelected: kind.selected,
        siteSelected: site.selected,
      }),
    );
  });
</script>

<Modal
  bind:open
  title={m.table_filters()}
  onDismiss={() => {
    capacity.boundField.resetTo();
    capacity.orderEqField = 'lt';
    area.selectedField = undefined;
    ward.selectedField = undefined;
    kind.selectedField = undefined;
    site.selectedField = undefined;
  }}
  actions={[
    { label: m.modal_dismiss(), onClick: () => (open = false), role: 'secondary' },
    {
      label: m.modal_apply(),
      disabled,
      onClick: () => {
        for (const filter of filters) filter.apply();
        open = false;
      },
    },
  ]}
>
  <Numeric filter={capacity} label={m.structures_capacity()} />
  <hr>
  <Choice filter={area} label={m.column_filter({ column: m.structures_area() })} />
  <hr>
  <Choice filter={ward} label={m.column_filter({ column: m.structures_ward() })} />
  <hr>
  <Choice filter={kind} label={m.column_filter({ column: m.structures_kind() })} />
  <hr>
  <Choice filter={site} label={m.column_filter({ column: m.structures_site() })} />
</Modal>

<style>
  hr {
    width: 350px;
  }
</style>
