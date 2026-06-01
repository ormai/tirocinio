<!-- @component Interactive input field for passwords, with show/hide button. -->

<script lang="ts">
  import type { Field } from '$lib/form/field.svelte';
  import { m } from '$lib/paraglide/messages';
  import { tooltip } from '$lib/tooltip.svelte';
  import { Eye, EyeOff } from '@lucide/svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    field: Field;
    name?: string;
    label?: string;
    required?: boolean;
    autocomplete?: 'current-password' | 'new-password';
  }

  let {
    field,
    name = 'password',
    label = m.password_input_label(),
    required = true,
    autocomplete = 'current-password',
  }: Props = $props();
  let visible = $state(false);
</script>

<div class="input-host">
  <label for={name}>{label}</label>
  <div style="display: flex">
    <input
      id={name}
      {name}
      type={visible ? 'text' : 'password'}
      {autocomplete}
      {required}
      minlength="10"
      maxlength="200"
      {@attach field.attach}
    />
    <button
      type="button"
      class="secondary icon-host"
      onclick={() => (visible = !visible)}
      {@attach tooltip(visible ? m.password_hide() : m.password_show())}
    >
      {#if visible}
        <EyeOff />
      {:else}
        <Eye />
      {/if}
    </button>
  </div>
  {#if field.dirty && field.error}
    <span transition:fade class="error">{field.error}</span>
  {/if}
</div>

<style>
  label {
    width: 100%;
  }

  input {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    width: 100%;
  }

  button {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: none;
  }
</style>
