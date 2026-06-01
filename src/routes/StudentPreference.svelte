<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import Banner from '$lib/Banner.svelte';
  import { sendForm } from '$lib/form/submit';
  import LoadingButton from '$lib/LoadingButton.svelte';
  import { m } from '$lib/paraglide/messages';
  import type { Collection } from '$lib/server/preference';
  import { type Site } from '$lib/server/structure';
  import { error, success } from '$lib/toast/Toaster.svelte';
  import {
    Clock1,
    Clock10,
    Clock11,
    Clock12,
    Clock2,
    Clock3,
    Clock4,
    Clock5,
    Clock6,
    Clock7,
    Clock8,
    Clock9,
    Pencil,
    Save,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { sineIn } from 'svelte/easing';
  import { fly, slide } from 'svelte/transition';

  let loading = $state(false);
  let editMode = $state(false);
  let collection: Collection | null = $derived(page.data.activeCollection);

  let prefNum = $derived(collection?.numberOfPreferences ?? 0);
  let existingPrefs: (number | null)[][] | null = $derived(
    page.data.existingPrefs.length > 0
      ? page.data.existingPrefs.map((month: (number | null)[]) => {
        month.length = prefNum;
        return month.fill(null, month.length, prefNum);
      })
      : null,
  );
  // svelte-ignore state_referenced_locally
  let preferences: (number | null)[][] = $state(
    existingPrefs ?? Array.from(
      { length: collection?.durationMonths ?? 0 },
      () => Array.from({ length: prefNum }, () => null),
    ),
  );

  let isValid = $derived(preferences.every((month) => month[0] != null));
  let hasChanged = $derived(
    existingPrefs != null
      && preferences.some((month, i) =>
        month.some((pref, j) => pref !== (existingPrefs![i][j] ?? null))
      ),
  );

  $effect(() => {
    for (const month of preferences) {
      let clear = false;
      for (let i = 0; i < month.length; i++) {
        if (clear) month[i] = null;
        if (month[i] == null) clear = true;
      }
    }
  });

  onMount(() => {
    if (collection == null || existingPrefs != null) return;
    const saved = window.localStorage.getItem(`collection${collection.id}`);
    if (saved) {
      const data = JSON.parse(saved);
      if (
        data.preferences && data.preferences.length === collection.durationMonths
        && data.preferences[0]?.length === collection.numberOfPreferences
      ) {
        preferences = data.preferences;
      }
    }
  });
  $effect(() => {
    if (collection == null) return;
    window.localStorage.setItem(`collection${collection.id}`, JSON.stringify({ preferences }));
  });

  function duration(date1: Date, date2: Date): string {
    let interval = Math.abs(date1.getTime() - date2.getTime());
    const hours = Math.floor(interval / 3_600_000);
    interval -= hours * 3_600_000;
    const minutes = Math.floor(interval / 60_000);
    interval -= minutes * 60_000;
    const seconds = Math.floor(interval / 1_000);
    let format = hours === 0 ? '<strong class="danger">' : '';
    if (hours > 0) {
      format += m.hours({ count: hours });
    }
    if (hours < 3) {
      if (hours > 0) format += ', ';
      format += m.minutes({ count: minutes });
    }
    if (hours === 0) {
      format += ', ' + m.seconds({ count: seconds }) + '</strong>';
    }
    return format;
  }

  let countDown = $derived(duration(new Date(), collection?.endTime ?? new Date(0)));
  const clocks = [
    Clock1,
    Clock2,
    Clock3,
    Clock4,
    Clock5,
    Clock6,
    Clock7,
    Clock8,
    Clock9,
    Clock10,
    Clock11,
    Clock12,
  ];
  let currentClock = $state(0);
  let Clock = $derived(clocks[currentClock]);
  $effect(() => {
    if (collection == null) return;
    const interval = setInterval(async () => {
      const now = new Date();
      if (now > collection.endTime) {
        await invalidateAll();
      }
      countDown = duration(now, collection.endTime);
      currentClock = (currentClock + 1) % clocks.length;
    }, 1000);
    return () => clearInterval(interval);
  });

  async function savePreferences() {
    loading = true;
    await sendForm('?/savePreferences', {
      preferences: JSON.stringify(preferences.map((month) => month.filter((pref) => pref != null))),
      collectionId: String(collection?.id),
      editing: String(existingPrefs != null && editMode),
    })
      .then(() => {
        success(m.preferences_save_successful());
        editMode = false;
        existingPrefs = JSON.parse(JSON.stringify(preferences));
      })
      .catch(() => error(m.error()))
      .finally(() => loading = false);
  }
</script>

<div class="column preference-host">
  {#if collection}
    <h3 class="row-spaced">{m.preferences_cast_title()}</h3>

    <p class="small" style="padding: 0 0.7rem">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html m.preferences_cast_hint({
        number: collection.numberOfPreferences,
        months: collection.durationMonths,
      })}
    </p>

    <p class="row-spaced numeric" style="gap: 0.3rem">
      <Clock size={16} />{m.preferences_collection_ends()}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html countDown}
    </p>

    <div
      class="preferences"
      tabindex="-1"
      style:grid-template-columns="repeat({preferences.length}, max-content)"
    >
      {#each preferences as month, i (i)}
        <span style:grid-column={i + 1} style:grid-row={1}>
          {m.preferences_month_head({ n: i + 1 })}
        </span>
        {#each month as pref, j (j)}
          {#if (existingPrefs != null && !editMode) ? (pref != null) : (j === 0 || month[j - 1] != null)}
            <select
              transition:slide={{ easing: sineIn, duration: 100 }}
              style:grid-column={i + 1}
              style:grid-row={j + 2}
              bind:value={month[j]}
              class:missing={j === 0 && pref == null}
              class:present={pref != null}
              disabled={page.data.user.accepted !== true || (existingPrefs != null && !editMode)}
              style:--priority={j + 1}
            >
              <option value={null}>{m.filter_choose()}</option>
              {#each page.data.sites.filter(({ id }: Site) => id === pref || !month.includes(id)) as { id, name } (id)}
                <option value={id}>{name}</option>
              {/each}
            </select>
          {/if}
        {/each}
      {/each}
    </div>

    {#if existingPrefs != null && !editMode}
      <div class="still" in:fly={{ y: 20 }}>
        <Banner kind="ok">
          <div class="row-spaced">
            {m.preferences_registered_hint()}
            <button class="secondary" onclick={() => editMode = true}>
              <Pencil size={16} />{m.preferences_edit()}
            </button>
          </div>
        </Banner>
      </div>
    {:else}
      {#if editMode}
        <p class="small" style="text-align: center">
          {m.preferences_editing_hint()}
        </p>
      {/if}
      <div class="row-spaced" style="gap: 0.2rem" in:fly={{ y: -20 }}>
        {#if editMode}
          <button
            class="secondary"
            onclick={() => {
              editMode = false;
              preferences = JSON.parse(JSON.stringify(existingPrefs));
            }}
          >
            {m.modal_cancel()}
          </button>
        {/if}
        <LoadingButton
          style="margin: 0 0.7rem"
          grow={false}
          enabled={isValid && (existingPrefs != null ? hasChanged : true)}
          {loading}
          onclick={savePreferences}
        >
          <div style="display: flex; gap: 0.5rem">
            <Save />{editMode ? m.preferences_update() : m.preferences_save()}
          </div>
        </LoadingButton>
      </div>
    {/if}
  {:else}
    <div class="small" style="text-align: center">{m.preferences_no_active_collection()}</div>
  {/if}
</div>

<style>
  .preferences {
    display: grid;
    text-align: center;
    overflow-x: auto;
    gap: 0.5rem;
    padding: 0.7rem;
    max-width: min-content;
    width: 100%;
    margin-inline: auto;
  }

  .preference-host {
    width: 100%;
    background: hsl(from var(--primary-bg) h s l / 0.06);
    border: var(--border-thickness) solid var(--primary-border);
    border-radius: var(--radius);
    padding: 0.7rem 0;

    .still {
      padding: 0 0.7rem;
    }
  }

  :global(strong.danger) {
    color: var(--danger-text);
  }

  select:not(:disabled).missing {
    transition: background 1600ms cubic-bezier(0.075, 0.82, 0.165, 1);
    border: var(--border-thickness) solid var(--danger-border);
    background: var(--danger-bg) !important;

    &:hover {
      background: hsl(from var(--danger-bg) h s calc(l + 5)) !important;
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

  .small {
    font-size: 0.86rem;
  }

  h3 {
    font-size: 1.1rem;
    font-weight: 600;
  }
</style>
