<!-- @component Reusable selector control to set the app language -->

<script>
  import { m } from '$lib/paraglide/messages';
  import { getLocale, locales, setLocale } from '$lib/paraglide/runtime';
  import { Languages } from '@lucide/svelte';
  import { tooltip } from './tooltip.svelte';

  let {
    width = '100%',
    containerStyle = '',
    spacingLeft = 'calc(var(--spacing) * 2)',
    spacingRight = 'calc(var(--spacing) * 3 + 24px)',
    ...props
  } = $props();

  let locale = $state(getLocale());
  $effect(() => {
    if (getLocale() !== locale) {
      void setLocale(locale);
    }
  });
</script>

<div
  style:width
  class="select-host"
  style={containerStyle}
  {@attach tooltip(m.language_switcher_tooltip())}
>
  <div class="icon-before" style:left={spacingLeft}><Languages /></div>
  <select
    id="language-switcher"
    bind:value={locale}
    style:padding-left={spacingRight}
    {...props}
  >
    {#each locales as locale (locale)}
      <option value={locale}>{m.language_name({}, { locale })}</option>
    {/each}
  </select>
</div>
