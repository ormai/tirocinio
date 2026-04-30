<script lang="ts">
  import '$lib/assets/styles/reset.css';
  import '$lib/assets/styles/app.css';
  import { page } from '$app/state';
  import Toaster from '$lib/toast/Toaster.svelte';

  let { children } = $props();
</script>

<Toaster />

{#if !page.url.pathname.endsWith('sign-in')}
  <nav>
    <form method="POST" action="/sign-in?/signout"><button>Sign Out</button></form>
  </nav>
{/if}

{@render children()}
