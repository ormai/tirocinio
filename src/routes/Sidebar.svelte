<script module lang="ts">
  /** Viewport width under which the Sidebar switches to mobile mode. */
  export const BREAK_POINT: number = 767;

  export const sidebar = $state({
    /** @property {boolean} Wether the sidebar is currently collapsed or not. */
    collapsed: false,

    /** @property {boolean} Wether the sidebar is currently in mobile mode or not. */
    mobile: false,
  });

  /**
   * Hook for when an element of the sidebar is clicked, or pressed.
   */
  export function onclick() {
    if (sidebar.mobile) {
      sidebar.collapsed = true;
    }
  }
</script>

<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { setCookie, SIDEBAR_COLLAPSED } from '$lib/cookies';
  import LanguageSwitcher from '$lib/LanguageSwitcher.svelte';
  import { m } from '$lib/paraglide/messages';
  import { deLocalizeHref } from '$lib/paraglide/runtime';
  import { type AuthUser } from '$lib/server/user';
  import { tooltip } from '$lib/tooltip.svelte';
  import {
    CircleUserRound,
    Hospital,
    House,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    Tickets,
    Users,
    Waypoints,
  } from '@lucide/svelte';
  import { type Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import ColorSchemeSwitcher, { type ColorScheme } from './ColorSchemeSwitcher.svelte';
  import { onSignOut } from './SignOut.svelte';

  interface Props {
    collapsed: boolean | null;
    colorScheme: string | undefined;
    user: AuthUser | null;
    children: Snippet;
  }

  let { user, collapsed, colorScheme, children }: Props = $props();
  let toggleLabel = $derived(sidebar.collapsed ? m.sidebar_expand() : m.sidebar_collapse());

  const maxWidth = new MediaQuery(`max-width: ${BREAK_POINT}px`);
  $effect(() => {
    sidebar.mobile = maxWidth.current;
  });

  // svelte-ignore state_referenced_locally
  sidebar.collapsed = collapsed === null ? sidebar.mobile : collapsed;

  $effect(() => setCookie(SIDEBAR_COLLAPSED, sidebar.collapsed));

  const destinations = [
    { path: '/', label: m.sidebar_home(), icon: House },
    { path: '/structures', label: m.sidebar_structures(), icon: Hospital },
    { path: '/students', label: m.sidebar_students(), icon: Users },
    { path: '/preferences', label: m.sidebar_preferences(), icon: Tickets },
    { path: '/plan', label: m.sidebar_plan(), icon: Waypoints },
  ] as const;

  let asideWidth = $state(300);
  let dragDx = $state<number | null>(null);
  let start = { x: 0, y: 0 };

  function onTouchStart(e: TouchEvent) {
    if (sidebar.mobile) {
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  function onTouchMove(e: TouchEvent) {
    const [dx, dy] = [e.touches[0].clientX - start.x, e.touches[0].clientY - start.y];
    if ((Math.abs(dx) > 6 || Math.abs(dy) > 6) && (Math.abs(dx / dy) < 1.2)) {
      return; // Swipe is not horizontal
    }
    dragDx = sidebar.collapsed
      ? Math.min(0, dx - asideWidth)
      : Math.max(-asideWidth, Math.min(0, dx));
  }

  function onTouchEnd() {
    if (dragDx !== null) {
      sidebar.collapsed = sidebar.collapsed
        ? Math.abs(dragDx + asideWidth) < 60
        : Math.abs(dragDx) >= 60;
    }
    dragDx = null;
  }
</script>

{#if sidebar.mobile && sidebar.collapsed}
  <div
    class="swipe"
    role="presentation"
    ontouchstart={onTouchStart}
    ontouchmove={onTouchMove}
    ontouchend={onTouchEnd}
  >
  </div>
{/if}

<div
  class="overlay"
  class:visible={!sidebar.collapsed}
  role="presentation"
  onclick={() => (sidebar.collapsed = true)}
>
</div>

<div class="sidebar-layout">
  <aside
    tabindex="-1"
    bind:offsetWidth={asideWidth}
    class:collapsed={sidebar.collapsed}
    class:no-transition={dragDx !== null}
    style:transform={dragDx !== null ? `translateX(${dragDx}px)` : undefined}
    ontouchstart={onTouchStart}
    ontouchmove={onTouchMove}
    ontouchend={onTouchEnd}
    inert={sidebar.mobile && sidebar.collapsed}
  >
    <header>
      <span class="collapsible">Sidebar</span>

      <button
        class="tertiary"
        style="width: initial"
        onclick={() => sidebar.collapsed = !sidebar.collapsed}
        aria-label={toggleLabel}
        {@attach tooltip({ content: toggleLabel, placement: 'right' })}
      >
        {#if sidebar.collapsed}<PanelLeftOpen />{:else}<PanelLeftClose />{/if}
      </button>
    </header>

    <nav>
      {#each destinations as { path, label, icon: Icon } (path)}
        <a
          href={resolve(path)}
          class="row"
          class:active={deLocalizeHref(page.url.pathname).endsWith(path)}
          {onclick}
          {@attach sidebar.collapsed && tooltip({ content: label, placement: 'right' })}
        >
          <Icon /><span class="collapsible">{label}</span>
        </a>
      {/each}
    </nav>

    <div style="flex-grow: 1"></div>

    <footer>
      <div class="row collapsible switcher" inert={sidebar.collapsed}>
        <LanguageSwitcher border="none" />
      </div>

      <div class="row collapsible switcher" inert={sidebar.collapsed}>
        <ColorSchemeSwitcher
          colorScheme={colorScheme as (ColorScheme | undefined)}
          style="border: none; width: 100%"
        />
      </div>

      <button
        onclick={onSignOut}
        class="tertiary collapsible row"
        style="text-align: initial; justify-content: start; gap: 0"
        inert={sidebar.collapsed}
      >
        <LogOut /> <span class="signout-text">{m.signout()}</span>
      </button>

      <div style="height: 1rem"></div>

      <a
        href={resolve('/profile')}
        class="row"
        {onclick}
        class:active={page.url.pathname.endsWith('/profile')}
        {@attach sidebar.collapsed && tooltip({ content: m.sidebar_profile(), placement: 'right' })}
      >
        <CircleUserRound />
        <span class="collapsible">
          {#if user && (user.name || user.surname)}
            {[user.name, user.surname].filter(Boolean).join(' ')}
          {:else}
            {m.sidebar_profile()}
          {/if}
        </span>
      </a>
    </footer>
  </aside>
  <main inert={sidebar.mobile && !sidebar.collapsed} tabindex="-1">
    {@render children()}
  </main>
</div>

<style>
  div.sidebar-layout {
    display: flex;
    height: 100%;
    width: 100%;
  }

  main {
    flex: 1;
    min-width: 0;
    overflow: auto;
  }

  aside {
    overflow: hidden auto;
    border-right: 1px solid var(--border);
    background: var(--body-light-bg);
    display: flex;
    flex-direction: column;
    padding: 0.4rem;
    gap: 0.3rem;
    transition: transform 0.3s ease-in-out;
    touch-action: pan-y;

    nav, footer {
      display: flex;
      flex-direction: column;
      width: 100%;
      gap: 0.3rem;

      div {
        width: 100%;
      }
    }

    button {
      width: 100%;
    }
  }

  aside.collapsed {
    min-width: 0;
  }

  aside:not(.collapsed) header span.collapsible {
    margin-left: var(--spacing);
  }

  aside:not(.collapsed) .row span.collapsible, .signout-text {
    margin-left: 0.7rem; /* Let them breathe */
  }

  .collapsible {
    white-space: nowrap;
    max-width: 48rem;
    transition:
      max-width 0.15s cubic-bezier(0.785, 0.135, 0.15, 0.86),
      opacity 0.12s ease-in-out,
      margin-left 0.12s ease;
  }

  .collapsed .collapsible {
    max-width: 0;
    opacity: 0;
    pointer-events: none;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 3rem;

    .collapsible {
      width: 200px; /* This gives the more width to the sidebar */
    }
  }

  .row {
    display: flex;
    border-radius: var(--radius);
    width: 100%;
    padding: var(--spacing);
    align-items: center;

    &:hover {
      background: hsl(from var(--body-light-bg) h s calc(l + 5));
      transition: background 200ms ease-in-out;
    }

    &:active {
      background: hsl(from var(--body-light-bg) h calc(s + 5) calc(l + 10));
      transition: 80ms cubic-bezier(0.075, 0.82, 0.165, 1);
    }

    &.active {
      background: var(--primary);
    }
  }

  a {
    text-decoration: none;
    color: initial;
    user-select: none;
  }

  a, button, .switcher {
    border: 1px solid transparent !important;
    transition: border 0.16s ease-in-out;
  }

  .switcher {
    padding: 0;
  }

  @media (max-width: 767px) {
    a, button, .switcher {
      border: 1px solid var(--border) !important;
    }

    .sidebar-layout {
      display: block;
    }

    aside.no-transition {
      transition: none !important;
    }

    main {
      width: 100%;
    }

    /* Elements don't shrink on mobile, the whole aside slides out of the viewport */
    .collapsed {
      .collapsible {
        max-width: 16rem;
        opacity: 1;
      }
      span.collapsible {
        margin-left: var(--spacing);
      }
    }

    aside {
      position: fixed;
      z-index: 4;
      height: 100dvh;
      transform: translateX(0);

      .collapsible {
        max-width: 16rem;
        opacity: 1;
        transition: none;
      }

      &.collapsed {
        transform: translateX(-100%);
      }
    }

    .overlay {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 3;
      background: rgba(0, 0, 0, 0.45);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;

      &.visible {
        opacity: 1;
        pointer-events: auto;
      }
    }

    .swipe {
      position: fixed;
      inset-block: 0;
      inset-inline-start: 0;
      width: 20px;
      z-index: 201;
      touch-action: pan-y;
    }
  }
</style>
