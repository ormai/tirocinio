<!-- @component Pop-up menu used in the {@link TopBar} layout -->

<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import { tooltip } from '$lib/tooltip.svelte';
  import { type Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    tooltipOpen?: string;
    tooltipClosed?: string;
  }

  let { tooltipOpen = m.menu_close(), tooltipClosed = m.menu_open(), children }: Props = $props();

  let open = $state(false);
  let triggerEl: HTMLButtonElement;
  let menuEl: HTMLDivElement;

  let tooltipMessage = $derived(open ? tooltipOpen : tooltipClosed);

  function handleOutsideClick(e: PointerEvent) {
    if (open && !menuEl.contains(e.target as Node) && !triggerEl.contains(e.target as Node)) {
      open = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      open = false;
      triggerEl.focus();
    }
  }
</script>

<svelte:document onpointerdown={handleOutsideClick} onkeydown={handleKeydown} />

<div class="wrapper">
  <button
    bind:this={triggerEl}
    class="tertiary trigger"
    aria-expanded={open}
    aria-haspopup="true"
    onclick={() => (open = !open)}
    aria-label={tooltipMessage}
    {@attach tooltipMessage != null && tooltip(tooltipMessage)}
  >
    <span class="bar" class:open></span>
    <span class="bar" class:open></span>
    <span class="bar" class:open></span>
  </button>

  <div
    bind:this={menuEl}
    class="menu"
    class:open
    role="dialog"
    aria-hidden={!open}
  >
    {@render children()}
  </div>
</div>

<style>
  .wrapper {
    position: relative;
    display: inline-block;
  }

  .trigger {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: calc(26px + var(--spacing) * 2);
    height: calc(26px + var(--spacing) * 2);
  }

  .bar {
    width: 20px;
    height: 2px;
    border-radius: 4px;
    background: var(--body-light);
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .bar:nth-child(1).open {
    transform: translateY(8px) rotate(45deg);
  }

  .bar:nth-child(2).open {
    opacity: 0;
    transform: scaleX(0);
  }

  .bar:nth-child(3).open {
    transform: translateY(-8px) rotate(-45deg);
  }

  .menu {
    position: absolute;
    top: calc(100% + var(--spacing));
    right: 0;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) / 2);
    padding: var(--spacing);
    background: var(--body-light-bg);
    border: var(--border-thickness) solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 4px 16px hsl(0 0% 0% / 0.12);
    z-index: 3;
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease, transform 0.15s ease, visibility 0s linear 0.15s;
  }

  .menu.open {
    visibility: visible;
    opacity: 1;
    transform: none;
    pointer-events: auto;
    transition: opacity 0.15s ease, transform 0.15s ease;
  }
</style>
