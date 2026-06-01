<script lang="ts">
  import '$lib/assets/styles/reset.css';
  import '$lib/assets/styles/app.css';
  import { page } from '$app/state';
  import Toaster from '$lib/toast/Toaster.svelte';
  import type { LayoutProps } from './$types';
  import SideBar, { onclick as onSideBarDismiss } from './SideBar.svelte';
  import SignOut from './SignOut.svelte';
  import TopBar from './TopBar.svelte';

  let { data, children }: LayoutProps = $props();
</script>

<Toaster />

<SignOut onDismiss={onSideBarDismiss} />

{#if page.url.pathname.endsWith('sign-in')}
  {@render children()}
{:else}
  {#if data.user?.role === 'admin'}
    <SideBar user={data.user} collapsed={data.sidebarCollapsed} colorScheme={data.colorScheme}>
      {@render children()}
    </SideBar>
  {:else if data.user?.role === 'student'}
    <TopBar user={data.user} colorScheme={data.colorScheme}>{@render children()}</TopBar>
  {:else}
    Error: unknown role
  {/if}
{/if}
