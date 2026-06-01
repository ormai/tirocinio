<!-- @component A selector for the app color-scheme -->

<script module lang="ts">
  import { m } from '$lib/paraglide/messages';

  export type ColorScheme = 'light dark' | 'only light' | 'only dark';
</script>

<script lang="ts">
  import { COLOR_SCHEME, setCookie } from '$lib/cookies';
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

  let {
    colorScheme = 'light dark',
    spacingLeft = 'calc(var(--spacing) * 2)',
    spacingRight = 'calc(var(--spacing) * 3 + 24px)',
    ...props
  }: {
    colorScheme: ColorScheme | undefined;
    spacingLeft?: string;
    spacingRight?: string;
  } & HTMLSelectAttributes = $props();

  let Icon = $derived(options[colorScheme].icon);

  $effect(() => setCookie(COLOR_SCHEME, colorScheme));
</script>

<svelte:head>
  <meta name="color-scheme" content={colorScheme} />
</svelte:head>

<div class="select-host" {@attach tooltip(m.color_scheme_switcher_tooltip())}>
  <div class="icon-before" style:left={spacingLeft}><Icon /></div>
  <select
    name="color-scheme-switcher"
    bind:value={colorScheme}
    style:padding-left={spacingRight}
    {...props}
  >
    {#each Object.entries(options) as [value, { label }] (value)}
      <option {value}>{label}</option>
    {/each}
  </select>
</div>
