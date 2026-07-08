<!-- @component A search input field -->

<script lang="ts">
  import { Search } from '@lucide/svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { m } from './paraglide/messages';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    value: string;
    maxWidth?: number;
  }

  let { value = $bindable(), maxWidth, ...props }: Props = $props();
</script>

<div class="input-icon" {...props}>
  <div class="icon-box icon-host"><Search /></div>
  <input
    type="search"
    placeholder={m.table_search_placeholder()}
    bind:value
    style:max-width={maxWidth}
  />
</div>

<style>
  .input-icon {
    display: flex;
    .icon-box {
      display: flex;
      align-items: center;
      border: var(--border-thickness) solid var(--border);
      border-right: none;
      border-top-left-radius: var(--radius);
      border-bottom-left-radius: var(--radius);
    }
    input {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      flex: 1 1 200px;
      width: calc(100% - calc(2 * var(--spacing)));
    }
  }
</style>
