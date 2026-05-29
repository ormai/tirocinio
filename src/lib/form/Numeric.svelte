<script lang="ts" module>
  /** Maximum value of a four-byte signed integer. Same as the `integer` type of PostgreSQL. */
  export const MAX_INT = 2147483647;

  /** Maximum value of a two-byte signed integer. Same as the `smallint` type of PostgreSQL. */
  export const MAX_SMALLINT = 32767;

  export class NumericField extends Field {
    constructor(validators: ReadonlyArray<Validator> = [], onClear: () => void = () => {}) {
      super(
        [
          (i) => i.validity.badInput && m.profile_number_bad_input(),
          (i) => i.validity.rangeUnderflow && m.number_underflow({ min: i.min }),
          (i) => i.validity.rangeOverflow && m.number_overflow({ max: i.max }),
          ...validators,
        ],
        onClear,
      );
    }
  }
</script>

<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import type { HTMLAttributes } from 'svelte/elements';
  import { fade } from 'svelte/transition';
  import { Field, type Validator } from './field.svelte';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    field: Field;
    initialValue?: string | number | null;
    placeholder?: string;
    min?: number;
    max?: number;
    name?: string;
    label?: string;
    required?: boolean;
  }

  let {
    field,
    name,
    initialValue,
    placeholder,
    min = 0,
    max = MAX_SMALLINT,
    label,
    required = false,
    ...props
  }: Props = $props();
</script>

<div class="input-host" {...props}>
  {#if label}
    <label for={name}>{label}</label>
  {/if}
  <input
    class="numeric"
    type="number"
    id={name}
    {name}
    value={initialValue}
    {placeholder}
    {min}
    {max}
    {required}
    {@attach field.attach}
  >
  {#if field.dirty && field.error}
    <span transition:fade class="error">{field.error}</span>
  {/if}
</div>
