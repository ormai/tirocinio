<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import { tooltip } from '$lib/tooltip.svelte';
  import type { LocalizedString } from '@inlang/paraglide-js';
  import { Eye, EyeOff } from '@lucide/svelte';
  import { fade } from 'svelte/transition';
  import type { Field } from '$lib/form/field.svelte';

  let {
    name = 'password',
    label = m.password_input_label(),
    field,
  }: { name?: string; label?: LocalizedString; field: Field } = $props();
  let visible = $state(false);
</script>

<div class="input-host">
  <label for={name}>{label}</label>
  <div>
    <input
      id={name}
      {name}
      type={visible ? 'text' : 'password'}
      autocomplete="current-password"
      required
      minlength="10"
      maxlength="200"
      {@attach field.attach}
    />
    <button
      type="button"
      class="secondary"
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
  div {
  	display: flex;
  }

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
