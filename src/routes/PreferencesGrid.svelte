<!-- @component Grid of preferences used for editing and creating preferences -->

<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import type { Site } from '$lib/server/structure';
  import { sineIn } from 'svelte/easing';
  import { fly, slide } from 'svelte/transition';

  interface Props {
    preferences: (number | null)[][];
    existingPrefs: ReadonlyArray<ReadonlyArray<number | null>> | null;
    numberOfPreferences: number;
    durationMonths: number;
    editMode: boolean;
    sites: Site[];
    userAccepted: boolean;
  }

  let {
    preferences = $bindable(),
    existingPrefs,
    numberOfPreferences,
    editMode,
    sites,
    userAccepted,
  }: Props = $props();

  let lastNonEmptyRow = $derived.by(() => {
    const index = preferences[0].findIndex((_, j) =>
      preferences.every((month) => month[j] == null)
    );
    return index === -1 ? numberOfPreferences : index;
  });

  $effect(() => {
    for (const month of preferences) {
      let clear = false;
      for (let i = 0; i < month.length; i++) {
        if (clear) month[i] = null;
        if (month[i] == null) clear = true;
      }
    }
  });
</script>

<div
  class="preferences"
  tabindex="-1"
  style:grid-template-columns="repeat({preferences.length}, max-content)"
>
  {#each preferences as month, i (i)}
    <span style:grid-column={i + 2} style:grid-row={1} class="numeric">
      {m.preferences_month_head({ n: i + 1 })}
    </span>
    {#each month as pref, j (j)}
      {#if i === 0 && j < (editMode ? lastNonEmptyRow + 1 : lastNonEmptyRow)}
        <span
          class="row-num numeric"
          transition:fly={{ y: -10, duration: 120 }}
          style="grid-area: {j + 2} / 1"
        >{j + 1}</span>
      {/if}
      {#if (existingPrefs != null && !editMode) ? (pref != null) : (j === 0 || month[j - 1] != null)}
        <select
          transition:slide={{ easing: sineIn, duration: 100 }}
          style:grid-area="{j + 2} / {i + 2}"
          bind:value={month[j]}
          class:missing={j === 0 && pref == null}
          class:present={pref != null}
          disabled={!userAccepted || (existingPrefs != null && !editMode)}
          style:--priority={j + 1}
        >
          <option value={null}>{m.filter_choose()}</option>
          {#each sites.filter(({ id }: Site) => id === pref || !month.includes(id)) as { id, name } (id)}
            <option value={id}>{name}</option>
          {/each}
        </select>
      {/if}
    {/each}
  {/each}
</div>

<style>
  .preferences {
    display: grid;
    text-align: center;
    align-items: center;
    overflow-x: auto;
    gap: 0.5rem;
    padding: 0.7rem;
    max-width: min-content;
    width: 100%;
    margin-inline: auto;
  }

  :global(strong.danger) {
    color: var(--danger-text);
  }

  select:not(:disabled).missing {
    transition: background 1600ms cubic-bezier(0.075, 0.82, 0.165, 1);
    border: var(--border-thickness) solid var(--danger-border);
    background: hsl(from var(--danger-bg) h s l / 0.4) !important;

    &:hover {
      background: hsl(from var(--danger-bg) h s calc(l + 5) / 0.6) !important;
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px rgb(from var(--danger) r g b / 0.5);
    }
  }

  select:not(:disabled).present {
    transition: background 1600ms cubic-bezier(0.075, 0.82, 0.165, 1);
    border: var(--border-thickness) solid var(--success-border);
    background: hsl(from var(--success-bg) h s l / calc(1 / var(--priority))) !important;

    &:hover {
      background: hsl(from var(--success-bg) h s calc(l + 5)) !important;
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px rgb(from var(--success) r g b / 0.5);
    }
  }

  select:disabled {
    pointer-events: none;
  }

  .row-num {
    text-align: end;
  }
</style>
