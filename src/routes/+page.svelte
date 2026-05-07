<script lang="ts">
  import { sidebar } from './Sidebar.svelte';
</script>

{#if sidebar.mobile}
  <button onclick={() => (sidebar.collapsed = !sidebar.collapsed)}>Toggle</button>
{/if}

<p>
  Lorem ipsum dolor sit amet consectetur adipisicing elit. Numquam ducimus distinctio debitis
  aliquam sunt molestiae non quaerat, in omnis praesentium rem qui delectus, sint nihil
  perspiciatis? Ullam sunt illum impedit.
</p>
