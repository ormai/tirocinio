<!-- @component The top-bar layout seen by the student -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import LanguageSwitcher from '$lib/LanguageSwitcher.svelte';
  import { m } from '$lib/paraglide/messages';
  import { deLocalizeHref } from '$lib/paraglide/runtime';
  import type { AuthUser } from '$lib/server/user';
  import { tooltip } from '$lib/tooltip.svelte';
  import { ArrowLeft, CircleUserRound, Info, LogOut } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { fly } from 'svelte/transition';
  import About from './About.svelte';
  import ColorSchemeSwitcher, { type ColorScheme } from './ColorSchemeSwitcher.svelte';
  import Hamburger from './Hamburger.svelte';
  import { onSignOut } from './SignOut.svelte';

  interface Props {
    children: Snippet;
    colorScheme?: string;
    user: AuthUser;
  }

  let { children, colorScheme, user }: Props = $props();

  let aboutModalOpen = $state(false);
</script>

<About bind:open={aboutModalOpen} />

<div class="top-bar-layout">
  <div class="nav-host">
    <nav>
      <div style="position: relative; width: 300px; height: 38px">
        {#if deLocalizeHref(page.url.pathname).endsWith('/')}
          <a
            class="button-link"
            href={resolve('/profile')}
            in:fly={{ x: -20, duration: 200 }}
            out:fly={{ x: 20, duration: 200 }}
          >
            <CircleUserRound />
            <span>
              {#if user && (user.name || user.surname)}
                {[user.name, user.surname].filter(Boolean).join(' ')}
              {:else}
                {m.sidebar_profile()}
              {/if}
            </span>
          </a>
        {:else}
          <a
            class="icon-host button-link"
            href={resolve('/')}
            {@attach tooltip(m.nav_back())}
            in:fly={{ x: 20, duration: 200 }}
            out:fly={{ x: -20, duration: 200 }}
          ><ArrowLeft /></a>
        {/if}
      </div>

      <Hamburger>
        <ColorSchemeSwitcher
          colorScheme={colorScheme as (ColorScheme | undefined)}
          style="border: none"
        />

        <LanguageSwitcher style="border: none" />

        <button class="tertiary" onclick={() => aboutModalOpen = true}>
          <Info />{m.about()}
        </button>

        <button onclick={onSignOut} class="tertiary"><LogOut />{m.signout()}</button>
      </Hamburger>
    </nav>
  </div>

  <main>
    {@render children()}
  </main>
</div>

<style>
  .top-bar-layout {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;

    :global(section.container) {
      max-width: min(70ch, 100% - 1.5rem);
      margin-inline: auto;
      padding: 1.5rem 0;
    }

    .nav-host {
      background: var(--body-light-bg);
      border-bottom: var(--border-thickness) solid var(--border);
      padding: 0.5rem 0;
    }

    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.6rem;
    }

    main {
      width: 100%;
      flex-grow: 1;
      overflow-y: auto;
    }

    nav {
      max-width: min(70ch, 100% - 1.5rem);
      margin-inline: auto;
    }
  }

  button.tertiary {
    justify-content: start;
    padding-left: calc(var(--spacing) * 2);
  }

  .button-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    padding: var(--spacing) calc(var(--spacing) * 1.3);
    text-decoration: none;
    color: currentColor;
    border: var(--border-thickness) solid var(--border);
    position: absolute;

    &:hover {
      background: hsl(from var(--body-light-bg) h s calc(l + 5));
      transition: background 200ms ease-in-out;
    }

    &:active {
      background: hsl(from var(--body-light-bg) h calc(s + 5) calc(l + 10));
      transition: 80ms cubic-bezier(0.075, 0.82, 0.165, 1);
    }
  }
</style>
