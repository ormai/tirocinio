<!-- @component title bar at the top of the page. Integrates with the {@link SideBar}. -->

<script lang="ts">
  /* eslint-disable  @typescript-eslint/no-explicit-any */

  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import type { RouteId } from '$app/types';
  import { m } from '$lib/paraglide/messages';
  import { tooltip } from '$lib/tooltip.svelte.js';
  import { ArrowLeft, Menu } from '@lucide/svelte';
  import { sideBar } from './SideBar.svelte';

  let { title, backLocation }: { title: string; backLocation?: RouteId } = $props();
</script>

<svelte:head><title>{title} - {page.data.appName}</title></svelte:head>

<header>
  {#if backLocation != null}
    <a
      // https://github.com/sveltejs/kit/issues/15536
      href={resolve(backLocation as any)}
      class="button"
      {@attach tooltip({ content: m.nav_back(), placement: 'right' })}
    >
      <ArrowLeft />
    </a>
  {:else}
    {#if sideBar.mobile && page.data.user.role === 'admin'}
      <button
        class="tertiary"
        onclick={() => sideBar.collapsed = !sideBar.collapsed}
        {@attach tooltip({ content: m.sidebar_expand(), placement: 'right' })}
      >
        <Menu />
      </button>
    {/if}
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
</style>
