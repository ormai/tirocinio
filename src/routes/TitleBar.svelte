<!-- @component title bar at the top of the page. Integrates with the {@link SideBar}. -->

<script lang="ts">
  import { page } from '$app/state';
  import { m } from '$lib/paraglide/messages';
  import { tooltip } from '$lib/tooltip.svelte.js';
  import { Menu } from '@lucide/svelte';
  import { sideBar } from './SideBar.svelte';

  let { title }: { title: string } = $props();
</script>

<svelte:head><title>Tirocinio · {title}</title></svelte:head>

<header>
  {#if sideBar.mobile && page.data.user.role === 'admin'}
    <button
      class="tertiary"
      style="width: initial"
      onclick={() => sideBar.collapsed = !sideBar.collapsed}
      aria-label={m.sidebar_expand()}
      {@attach tooltip({ content: m.sidebar_expand(), placement: 'right' })}
    >
      <Menu />
    </button>
  {/if}
  <h1>{title}</h1>
</header>

<style>
  header {
    display: flex;
    gap: 0.8rem;
    align-items: center;
    margin-bottom: 1.5rem; /* Spacing with the following content */

    button {
      min-width: max-content;
    }
  }

  h1 {
    font-size: 1.4rem;
  }
</style>
