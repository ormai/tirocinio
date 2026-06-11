<!-- @component Control that enables the student to cast their preference -->

<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import Banner from '$lib/Banner.svelte';
  import Clock from '$lib/Clock.svelte';
  import { sendForm } from '$lib/form/submit';
  import LoadingButton from '$lib/LoadingButton.svelte';
  import { m } from '$lib/paraglide/messages';
  import type { Collection } from '$lib/server/preference';
  import { duration } from '$lib/time';
  import { error, success } from '$lib/toast/Toaster.svelte';
  import { Pencil, Save } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import PreferencesGrid from './PreferencesGrid.svelte';

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

  let countDown = $derived(duration(new Date(), collection?.endTime ?? new Date(0), 'danger'));

  async function onTick() {
    if (collection == null) return;
    const now = new Date();
    if (now > collection.endTime) {
      await invalidateAll();
    }
    countDown = duration(now, collection.endTime, 'danger');
  }

  async function savePreferences() {
    loading = true;
    await sendForm('?/savePreferences', {
      preferences: JSON.stringify(preferences.map((month) => month.filter((pref) => pref != null))),
      collectionId: String(collection?.id),
      editing: String(existingPrefs != null && editMode),
      studentId: String(page.data.user.id),
    })
      .then(() => {
        success(m.preferences_save_successful());
        editMode = false;
        existingPrefs = JSON.parse(JSON.stringify(preferences));
      })
      .catch(async (err) => {
        if (err.data.collectionNotActive === true) {
          error(m.preferences_collection_not_ongoing_error());
          await invalidateAll();
        } else {
          error(m.error());
        }
      })
      .finally(() => loading = false);
  }
</script>

<div class="column preference-host">
  {#if collection}
    <h3 class="row-spaced">{m.preferences_cast_title()}</h3>

    <p class="text-small" style="padding: 0 0.7rem">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html m.preferences_cast_hint({
        number: collection.numberOfPreferences,
        months: collection.durationMonths,
      })}
    </p>

    <p class="row-spaced numeric" style="gap: 0.3rem">
      <Clock {onTick} size={16} />{m.preferences_collection_ends()}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html countDown}
    </p>

    <PreferencesGrid
      bind:preferences
      {existingPrefs}
      numberOfPreferences={prefNum}
      durationMonths={collection?.durationMonths ?? 0}
      sites={page.data.sites}
      userAccepted={page.data.user.accepted === true}
      {editMode}
    />

    {#if existingPrefs != null && !editMode}
      <div class="still" in:fly={{ y: 20 }}>
        <Banner kind="ok">
          <div class="row-spaced">
            {m.preferences_registered_hint()}
            <button
              class="secondary"
              onclick={() => editMode = true}
              disabled={page.data.user.accepted !== true}
            >
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
</style>
