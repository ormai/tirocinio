<!-- @component Form for creating and editing a {@link Collection} -->

<script lang="ts">
  import { browser } from '$app/environment';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import AcademicYear, { YearField } from '$lib/form/AcademicYear.svelte';
  import { Field } from '$lib/form/field.svelte';
  import Numeric, { NumericField } from '$lib/form/Numeric.svelte';
  import onSubmit from '$lib/form/submit';
  import LoadingButton from '$lib/LoadingButton.svelte';
  import { m } from '$lib/paraglide/messages';
  import type { Collection } from '$lib/server/preference';
  import { error, success } from '$lib/toast/Toaster.svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    creating: boolean;
    selected?: Collection | null;
    loading: boolean;
    editModalOpen: boolean;
    editDirty?: boolean;
  }

  let intervalOverlapError = $state(false);

  const year = new YearField([
    (i) => i.validity.valueMissing && m.preferences_year_missing(),
  ]);
  const start = new Field([
    (i) => i.validity.valueMissing && m.preferences_start_missing(),
    (i) => creating && i.validity.rangeUnderflow && m.preferences_start_min(),
    (i) => i.validity.rangeOverflow && m.preferences_start_max(),
    () => intervalOverlapError && m.preferences_collection_interval_overlap(),
  ], () => {
    intervalOverlapError = false;
    start.validate();
    end.validate();
  });
  const end = new Field([
    (i) => i.validity.valueMissing && m.preferences_end_missing(),
    (i) => i.validity.rangeUnderflow && m.preferences_end_min(),
    () => intervalOverlapError && m.preferences_collection_interval_overlap(),
  ], () => {
    intervalOverlapError = false;
    start.validate();
    end.validate();
  });
  const numberOfPreferences = new NumericField([
    (i) => i.validity.valueMissing && m.preferences_prefs_per_month_missing(),
  ]);

  const fields = [year, start, end, numberOfPreferences];
  const canSubmit = $derived(fields.every((f) => f.valid));

  let {
    creating = $bindable(false),
    selected = $bindable(null),
    loading = $bindable(),
    // eslint-disable-next-line no-useless-assignment
    editDirty = $bindable(false),
    // eslint-disable-next-line no-useless-assignment
    editModalOpen = $bindable(),
  }: Props = $props();

  $effect(() => {
    editDirty = !creating
      && (year.hasChanged(selected?.year)
        || start.hasChanged(inputValueDateTime(selected?.startTime))
        || end.hasChanged(inputValueDateTime(selected?.endTime))
        || numberOfPreferences.hasChanged(selected?.numberOfPreferences));
  });

  function inputValueDateTime(date = new Date()): string {
    return date.toLocaleString('sv').replace(' ', 'T').slice(0, 16);
  }

  const now = browser ? inputValueDateTime() : '';
</script>

<form
  id="add-edit-collection"
  class="column"
  action={creating ? '?/createCollection' : '?/editCollection'}
  method="POST"
  class:edit={!creating}
  use:enhance={({ cancel }) =>
  onSubmit(
    cancel,
    fields,
    () => (loading = true),
    async (result) => {
      if (result.type === 'success') {
        await invalidateAll();
        if (creating) {
          success(m.preferences_collection_created_successfully());
        } else {
          success(m.preferences_collection_update_successfully());
        }
        creating = false;
        selected = null;
        editModalOpen = false;
      } else if (result.type === 'failure' && result.data?.intervalOverlap === true) {
        intervalOverlapError = true;
        start.validate();
        end.validate();
      } else {
        error(m.error());
      }
      loading = false;
    },
  )}
  novalidate
>
  <input type="hidden" name="id" value={selected?.id} />

  <input type="hidden" name="timezone-offset" value={new Date().getTimezoneOffset()} />

  <div class="row-spaced">
    <div class="input-host">
      <label for="start-time">{m.preferences_start()}</label>
      <input
        name="start-time"
        id="start-time"
        type="datetime-local"
        value={inputValueDateTime(selected?.startTime)}
        min={now}
        max={end.value}
        required
        {@attach start.attach}
      />
      {#if start.dirty && start.error}
        <span transition:fade class="error">{start.error}</span>
      {/if}
    </div>

    <div class="input-host">
      <label for="end-time">{m.preferences_end()}</label>
      <input
        name="end-time"
        id="end-time"
        type="datetime-local"
        min={start.value}
        required
        value={selected?.endTime != null
        ? inputValueDateTime(selected.endTime)
        : null}
        {@attach end.attach}
      />
      {#if end.dirty && end.error}
        <span transition:fade class="error">{end.error}</span>
      {/if}
    </div>
  </div>

  <AcademicYear
    field={year}
    name="year"
    label={m.preferences_year()}
    value={selected?.year ?? now.slice(0, 4)}
    required
  />

  <div class="row-spaced">
    <Numeric
      field={numberOfPreferences}
      name="number-of-prefs"
      label={m.preferences_prefs_per_month()}
      required={true}
      initialValue={selected?.numberOfPreferences ?? 3}
      min={1}
    />
  </div>

  {#if creating}
    <div class="row-spaced" style="margin-top: 1.2rem">
      <button
        class="secondary"
        onclick={() => {
          creating = false;
          selected = null;
        }}
        type="button"
      >
        {m.modal_cancel()}
      </button>
      <LoadingButton {loading} enabled={canSubmit}>{m.modal_create()}</LoadingButton>
    </div>
  {/if}
</form>

<style>
  @media (max-width: 920px) {
    .row-spaced:has(:global(.input-host)) {
      flex-wrap: wrap;
    }
  }

  .edit .row-spaced {
    flex-wrap: wrap;
  }

  .row-spaced {
    :global(button, .input-host) {
      flex: 1 1 50%;
    }
    align-items: start;
  }
</style>
