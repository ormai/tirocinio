<!-- @component Represents a boolean state. It's build on the HTML checkbox, but it's not intended
    for multiple choice. -->

<script lang="ts">
  import spinner from '$lib/assets/spinner.svg?raw';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { tooltip } from './tooltip.svelte';

  interface Props extends HTMLInputAttributes {
    checked: boolean;
    name: string;
    disabled?: boolean;
    loading?: boolean;
    label?: string;
    width?: string;
    height?: string;
    onTooltip?: string;
    offTooltip?: string;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    loading = false,
    label = '',
    name,
    width = '3.5rem',
    height = '2rem',
    onTooltip,
    offTooltip,
    ...props
  }: Props = $props();

  let tooltipMessage = $derived(checked ? onTooltip : offTooltip);
</script>

<label
  class="switch-label"
  class:disabled={disabled || loading}
  class:loading
  for={name}
  style:--width={width}
  style:--height={height}
>
  <input
    {name}
    id={name}
    type="checkbox"
    role="switch"
    bind:checked
    disabled={disabled || loading}
    {...props}
  />

  <span
    class="track"
    aria-hidden="true"
    {@attach tooltipMessage != null && tooltip(tooltipMessage)}
  >
    <span class="thumb">
      {#if loading}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <div style="color: var(--primary-text)">{@html spinner}</div>
      {/if}
    </span>
  </span>

  {#if label}
    <span>{label}</span>
  {/if}
</label>

<style>
  .switch-label {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing) * 1.3);
    cursor: pointer;
    user-select: none;
  }

  .switch-label.disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .switch-label.loading {
    cursor: wait;
  }

  input[type="checkbox"] {
    position: absolute;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .track {
    position: relative;
    display: flex;
    align-items: center;
    width: var(--width);
    height: var(--height);
    border-radius: 9999px;
    background: var(--body-lighter-bg);
    border: var(--border-thickness) solid var(--border);
    transition: background 240ms ease, border-color 240ms ease, box-shadow 180ms ease;
  }

  input:checked + .track {
    background: var(--primary);
    border-color: var(--primary);
  }

  input:focus-visible + .track {
    outline: none;
    box-shadow: var(--focus-shadow);
  }

  .thumb {
    position: absolute;
    left: 3px;

    display: flex;
    align-items: center;
    justify-content: center;

    width: calc(var(--height) - 8px);
    height: calc(var(--height) - 8px);
    border-radius: 50%;

    background: var(--body-bg);
    box-shadow: 0 1px 4px rgb(0 0 0 / 0.25);

    transition:
      translate 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
      scale 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
      background 200ms ease;

    transform-origin: left center;
  }

  input:checked + .track .thumb {
    translate: calc(var(--width) - (var(--height) - 8px) - 6px - 2px) 0;
  }

  input:active + .track .thumb {
    scale: 1.1 0.85;
  }

  input:checked + .track .thumb {
    background: GhostWhite;
  }

  label {
    margin: 0;
  }
</style>
