<script>
  import { m } from '$lib/paraglide/messages';
  import { getLocale, locales, setLocale } from '$lib/paraglide/runtime';
  import { Languages } from '@lucide/svelte';
  import { tooltip } from './tooltip.svelte';

  let {
    width = '100%',
    spacing = 'var(--spacing)',
    containerStyle = '',
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
  <div class="icon-before" style:left={spacing}><Languages /></div>
  <select
    id="language-switcher"
    bind:value={locale}
    style:padding-left="calc({spacing} * 1.7 + 24px)"
    {...props}
  >
    {#each locales as locale (locale)}
      <option value={locale}>{m.language_name({}, { locale })}</option>
    {/each}
  </select>
</div>
