<script>
  import { m } from '$lib/paraglide/messages';
  import { getLocale, locales, setLocale } from '$lib/paraglide/runtime';

  let { ...props } = $props();

  let locale = $state(getLocale());
  $effect(() => {
    if (getLocale() !== locale) {
      setLocale(locale);
    }
  });
</script>

<select id="switcher" bind:value={locale} {...props}>
  {#each locales as locale (locale)}
    <option value={locale}>{m.language_name({}, { locale })}</option>
  {/each}
</select>

<style>
  select {
    cursor: pointer;
    position: relative;
    padding: var(--spacing) calc(var(--spacing) * 2);
  }
</style>
