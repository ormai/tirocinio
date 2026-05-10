<script lang="ts">
  import { page } from '$app/state';
  import { m } from '$lib/paraglide/messages';

  // Assign a color to each range of HTTP status codes, for fun.
  const httpStatusColors = [
    '--body-light',
    '--success',
    '--info',
    '--danger',
    '--warning',
  ] as const;

  const statusColor = httpStatusColors[Math.trunc(page.status / 100) - 1]
    ?? '--body';
</script>

<section>
  <p>{m.error_server_desc()} ☹️</p>

  <h1>
    <span style:color={`var(${statusColor})`}>{page.status}</span>
    {page?.error?.message ?? '🤷'}
  </h1>

  <button onclick={() => window.location.reload()}>{m.error_reload()}</button>
</section>

<style>
  section {
  	display: flex;
  	flex-direction: column;
  	align-items: center;
  	justify-content: center;
  	text-align: center;
  	gap: 2rem;
  	width: 100%;
  	height: 100%;
  }

  button {
    display: flex;
    gap: 0.6rem;
    align-items: center;
  }
</style>
