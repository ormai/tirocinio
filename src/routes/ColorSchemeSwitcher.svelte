<script module lang="ts">
  const options = [
    { value: 'light dark', label: 'Auto' },
    { value: 'only light', label: 'Light' },
    { value: 'only dark', label: 'Dark' },
  ] as const;

  export type ColorScheme = typeof options[number]['value'];
</script>

<script lang="ts">
  import { COLOR_SCHEME } from '$lib/cookies';
  import type { HTMLSelectAttributes } from 'svelte/elements';

  let { colorScheme = options[0].value, ...props }: {
    colorScheme: ColorScheme | undefined;
  } & HTMLSelectAttributes = $props();

  $effect(() => {
    document.cookie = `${COLOR_SCHEME}=${colorScheme}; path=/; max-age=${
      60 * 60 * 24 * 365
    }; SameSite=Lax`;
  });
</script>

<svelte:head>
  <meta name="color-scheme" content={colorScheme}>
</svelte:head>

<select bind:value={colorScheme} {...props}>
  {#each options as { value, label } (value)}
    <option {value}>{label}</option>
  {/each}
</select>
