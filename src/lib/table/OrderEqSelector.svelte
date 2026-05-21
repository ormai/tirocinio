<!-- @component A `<select>` element for choosing a type of equality/inequality -->

<script lang="ts" module>
  export type OrderEq = 'lt' | 'le' | 'gt' | 'ge' | 'eq';

  export function compareOrderEq(orderEq: OrderEq, a: number, b: number): boolean {
    switch (orderEq) {
      case 'lt':
        return a < b;
      case 'le':
        return a <= b;
      case 'gt':
        return a > b;
      case 'ge':
        return a >= b;
      case 'eq':
        return a == b;
    }
  }
</script>

<script lang="ts">
  let { orderEq = $bindable('lt') }: { orderEq: OrderEq } = $props();
</script>

<select bind:value={orderEq}>
  <option value="lt">&lt;</option>
  <option value="le">&le;</option>
  <option value="gt">&gt;</option>
  <option value="ge">&ge;</option>
  <option value="eq">=</option>
</select>
