<script lang="ts" module>
  export class YearField extends Field {
    constructor() {
      super([
        (i) => i.validity.badInput && m.profile_enrollment_year_bad_input(),
        (i) => i.validity.rangeUnderflow && m.number_underflow({ min: i.min }),
        (i) => i.validity.rangeOverflow && m.number_overflow({ max: i.max }),
      ]);
    }
  }
</script>

<script lang="ts">
  import { fade } from 'svelte/transition';
  import { nextFromStart } from './academic-year';
  import { Field } from './field.svelte';
    import { m } from '$lib/paraglide/messages';

  interface Props {
    field: Field;
    initialValue?: any;
    placeholder?: string;
    label?: string;
    maxWidth?: number;
  }

  let { field, initialValue, placeholder, label, maxWidth }: Props = $props();
</script>

<div class="input-host academic-year" style:max-width={`${maxWidth}px`}>
  {#if label}
    <label for="enrollment-year">{label}</label>
  {/if}
  <div>
    <input
      class="numeric"
      id="enrollment-year"
      type="number"
      name="enrollment-year"
      value={initialValue}
      {placeholder}
      min="0"
      max="32767"
      {@attach field.attach}
    >
    <input class="numeric" value={nextFromStart(field.value)} disabled>
  </div>
  {#if field.dirty && field.error}
    <span transition:fade class="error">{field.error}</span>
  {/if}
</div>

<style>
  .academic-year {
    input:first-of-type {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    input:last-of-type {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      border-left: none;
        pointer-events: none;
    }

    div {
      display: flex;
      input {
        width: 50%;
      }
    }
  }
</style>
