<script lang="ts">
  import { BadgeInfo, CircleCheck, OctagonX, TriangleAlert } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    kind: 'ok' | 'warn' | 'error' | 'info';
  }

  let { kind, children }: Props = $props();
</script>

<div
  class="banner"
  class:ok={kind === 'ok'}
  class:warn={kind === 'warn'}
  class:error={kind === 'error'}
  class:info={kind === 'info'}
>
  {#if kind === 'ok'}
    <CircleCheck size={14} />
  {:else if kind === 'warn'}
    <TriangleAlert size={14} />
  {:else if kind === 'error'}
    <OctagonX size={14} />
  {:else if kind === 'info'}
    <BadgeInfo size={14} />
  {/if}
  {@render children()}
</div>

<style>
  .banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    border-radius: var(--radius);
    font-size: 0.85rem;

    &.ok {
      background: hsl(from var(--success-bg) h s l / 0.3);
      color: var(--success-text);
      border: 1px solid var(--success-border);
    }

    &.warn {
      background: hsl(from var(--warning-bg) h s l / 0.3);
      color: var(--warning-text);
      border: 1px solid var(--warning-border);
    }

    &.error {
      background: hsl(from var(--danger-bg) h s l / 0.3);
      color: var(--danger-text);
      border: 1px solid var(--danger-border);
    }

    &.info {
      background: hsl(from var(--info-bg) h s l / 0.3);
      color: var(--info-text);
      border: 1px solid var(--info-border);
    }
  }
</style>
