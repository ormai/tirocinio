<script lang="ts">
  import '$lib/assets/styles/reset.css';
  import '$lib/assets/styles/app.css';
  import { page } from '$app/state';
  import Toaster from '$lib/toast/Toaster.svelte';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();

  /** Some routes are excluded from nav elements. */
  const excluded = ['sign-in'];
</script>

<Toaster />

{#if excluded.some((route) => page.url.pathname.endsWith(route))}
  {@render children()}
{:else}
  {#if page.data.userRole === 'admin'}
    <div class="host">
      <aside>
        <nav>
          <p>This is a sidebar</p>
          <form method="POST" action="/sign-in?/signout"><button>Sign Out</button></form>
        </nav>
      </aside>
      <main>
        {@render children()}
      </main>
    </div>
  {:else if page.data.userRole === 'student'}
    You are a student
    {@render children()}
  {:else}
    Error: role unknown
  {/if}
{/if}

<style>
  .host {
    display: flex;
    height: 100%;
  }

  aside {
    width: 300px;
    background: var(--body-light-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1em;
  }

  main {
    padding: 1em;
    flex: 1;
    height: 100%;
  }
</style>
