<script module lang="ts">
  import { m } from '$lib/paraglide/messages';

  export type ColorScheme = 'light dark' | 'only light' | 'only dark';
</script>

<script lang="ts">
  import { COLOR_SCHEME } from '$lib/cookies';
  import { tooltip } from '$lib/tooltip.svelte';
  import type { LocalizedString } from '@inlang/paraglide-js';
  import { Moon, Sun, SunMoon } from '@lucide/svelte';
  import type { Component } from 'svelte';
  import type { HTMLSelectAttributes } from 'svelte/elements';

  const options: Record<ColorScheme, { label: LocalizedString; icon: Component }> = {
    'light dark': { label: m.color_scheme_auto(), icon: SunMoon },
    'only light': { label: m.color_scheme_light(), icon: Sun },
    'only dark': { label: m.color_scheme_dark(), icon: Moon },
  } as const;

  let { colorScheme = 'light dark', ...props }: {
    colorScheme: ColorScheme | undefined;
  } & HTMLSelectAttributes = $props();

  let Icon = $derived(options[colorScheme].icon);

  $effect(() => {
    document.cookie = `${COLOR_SCHEME}=${colorScheme}; path=/; max-age=${
      60 * 60 * 24 * 365
    }; SameSite=Lax`;
  });
</script>

<svelte:head>
  <meta name="color-scheme" content={colorScheme} />
</svelte:head>

<div class="select-host" {@attach tooltip(m.color_scheme_switcher_tooltip())}>
  <div class="icon-before"><Icon aria-hidden="true" /></div>
  <select name="color-scheme-switcher" bind:value={colorScheme} {...props}>
    {#each Object.entries(options) as [value, { label }] (value)}
      <option {value}>{label}</option>
    {/each}
  </select>
</div>
