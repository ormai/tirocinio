<!-- @component Interactive input field for an academic year. With validation. -->

<script lang="ts" module>
  export class YearField extends Field {
    constructor(validators: Validator[] = []) {
      super([
        (i) => i.validity.badInput && m.profile_enrollment_year_bad_input(),
        (i) => i.validity.rangeUnderflow && m.number_underflow({ min: i.min }),
        (i) => i.validity.rangeOverflow && m.number_overflow({ max: i.max }),
        ...validators,
      ]);
    }
  }
</script>

<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { fade } from 'svelte/transition';
  import { nextFromStart } from './academic-year';
  import { Field, type Validator } from './field.svelte';

  interface Props extends HTMLInputAttributes {
    field: Field;
    placeholder?: string;
    label?: string;
    maxWidth?: number;
    name?: string;
  }

  let { field, placeholder, label, maxWidth, name = 'enrollment-year', ...props }: Props = $props();
</script>

<div class="input-host academic-year" style:max-width={`${maxWidth}px`}>
  {#if label}
    <label for={name}>{label}</label>
  {/if}
  <div>
    <input
      class="numeric"
      id={name}
      type="number"
      {name}
      {placeholder}
      min="0"
      max="32767"
      {@attach field.attach}
      {...props}
    >
    <input class="numeric" value={nextFromStart(field.value)} disabled>
  </div>
  {#if field.dirty && field.error}
    <span transition:fade class="error">{field.error}</span>
  {/if}
</div>

<style>
  .academic-year {
    opacity: 1 !important;

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
