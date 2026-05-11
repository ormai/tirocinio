<script>
  import { m } from '$lib/paraglide/messages';
  import { getLocale, locales, setLocale } from '$lib/paraglide/runtime';
  import { Languages } from '@lucide/svelte';

  let { width = '100%', spacing = 'var(--spacing)', border = '1px solid var(--border)', ...props } =
    $props();

  let locale = $state(getLocale());
  $effect(() => {
    if (getLocale() !== locale) {
      setLocale(locale);
    }
  });
</script>

<div style:width class="select-host" {...props}>
  <div class="icon-before" style:left={spacing}><Languages aria-hidden="true" /></div>
  <select id="language-switcher" bind:value={locale} style:width style:border>
    {#each locales as locale (locale)}
      <option value={locale}>{m.language_name({}, { locale })}</option>
    {/each}
  </select>
</div>
