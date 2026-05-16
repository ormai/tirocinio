<script lang="ts">
  import spinner from '$lib/assets/spinner.svg?raw';
  import { fade } from 'svelte/transition';

  let { loading = false, enabled = true, children, grow = true, ...rest } = $props();
</script>
<button
  {...rest}
  disabled={!enabled || loading}
  class:loading
  style:width={grow ? '100%' : 'initial'}
>
  {#if loading}
    <div class="icon" transition:fade={{ duration: 100 }}>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html spinner}
    </div>
  {/if}
  <span
    style:translate={loading ? '0.6rem' : '0'}
    style:transition="translate 100ms ease {loading ? '0ms' : '50ms'}"
  >
    {@render children()}
  </span>
</button>

<style>
  button {
    display: flex;
    justify-content: center;
  }
</style>
