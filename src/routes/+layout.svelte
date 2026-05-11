<script lang="ts">
  import '$lib/assets/styles/reset.css';
  import '$lib/assets/styles/app.css';
  import { page } from '$app/state';
  import Toaster from '$lib/toast/Toaster.svelte';
  import type { LayoutProps } from './$types';
  import Sidebar, { onclick as onSidebarDismiss } from './Sidebar.svelte';
  import SignOut, { onSignOut } from './SignOut.svelte';

  let { data, children }: LayoutProps = $props();

  /** Some routes are excluded from nav elements. */
  const excluded = ['sign-in'];
</script>

<Toaster />

<SignOut onDismiss={onSidebarDismiss} />

{#if excluded.some((route) => page.url.pathname.endsWith(route))}
  {@render children()}
{:else}
  {#if data.user?.role === 'admin'}
    <Sidebar
      user={data.user}
      collapsed={data.sidebarCollapsed}
      colorScheme={data.colorScheme}
    >{@render children()}</Sidebar>
  {:else if data.user?.role === 'student'}
    You are a student
    {@render children()}
    <button onclick={onSignOut}>Sign Out</button>
  {:else}
    Error: role unknown
  {/if}
{/if}
