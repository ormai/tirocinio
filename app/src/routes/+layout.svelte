<script lang="ts">
  import '$lib/assets/styles/reset.css';
  import '$lib/assets/styles/app.css';
  import { page } from '$app/state';
  import Toaster from '$lib/toast/Toaster.svelte';

  let { children } = $props();

  /** Some routes are excluded from nav elements. */
  const excluded = ['sign-in'];
</script>

<Toaster />

{#if excluded.some((route) => page.url.pathname.endsWith(route))}
  {@render children()}
{:else}
  <nav>
    <form method="POST" action="/sign-in?/signout"><button>Sign Out</button></form>
  </nav>
{/if}
