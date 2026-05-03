<script>
  import { m } from '$lib/paraglide/messages';
  import { getLocale, locales, setLocale } from '$lib/paraglide/runtime';

  let locale = $state(getLocale());
  $effect(() => {
    if (getLocale() !== locale) {
      setLocale(locale);
    }
  });
</script>

<label for="switcher">
  <select id="switcher" bind:value={locale}>
    {#each locales as locale (locale)}
      <option value={locale}>{m.language_name({}, { locale })}</option>
    {/each}
  </select>
</label>

<style>
  select {
    position: absolute;
    bottom: 1em;
    right: 1em;
    cursor: pointer;
    font-size: 0.8em;
  }
</style>
