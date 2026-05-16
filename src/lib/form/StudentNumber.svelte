<script lang="ts" module>
  export class NumberField extends Field {
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
  import { fade } from 'svelte/transition';
  import { Field, type Validator } from './field.svelte';

  interface Props {
    field: Field;
    initialValue?: any;
    placeholder?: string;
  }

  let { field, initialValue, placeholder }: Props = $props();
</script>

<div class="input-host">
  <label for="student-number">{m.profile_student_number()}</label>
  <input
    class="numeric"
    id="student-number"
    type="number"
    name="student-number"
    value={initialValue}
    {placeholder}
    min="0"
    max="2147483647"
    {@attach field.attach}
  >
  {#if field.dirty && field.error}
    <span transition:fade class="error">{field.error}</span>
  {/if}
</div>
