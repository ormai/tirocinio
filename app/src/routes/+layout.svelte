<script lang="ts">
  import '../reset.css';
  import '../app.css';

  import { page } from '$app/state';

  let { children } = $props();
</script>

{#if !page.url.pathname.endsWith('sign-in')}
  <nav>
    <form method="POST" action="/sign-in?/signout"><button>Sign Out</button></form>
  </nav>
{/if}

{@render children()}
