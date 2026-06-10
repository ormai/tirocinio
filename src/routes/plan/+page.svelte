<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import Banner from '$lib/Banner.svelte';
  import Numeric, { NumericField } from '$lib/form/Numeric.svelte';
  import { sendForm } from '$lib/form/submit';
  import LoadingButton from '$lib/LoadingButton.svelte';
  import Modal from '$lib/Modal.svelte';
  import { m } from '$lib/paraglide/messages';
  import Switch from '$lib/Switch.svelte';
  import Pagination from '$lib/table/Pagination.svelte';
  import { fullDate } from '$lib/time';
  import { error, success } from '$lib/toast/Toaster.svelte';
  import { cubicOut, sineIn } from 'svelte/easing';
  import { slide } from 'svelte/transition';
  import TitleBar from '../TitleBar.svelte';
  import type { PageProps } from './$types';

  interface Assignment {
    id: number;
    email: string;
    number: number | null;
    name: string | null;
    surname: string | null;
    year: number | null;
    structureIds: (number | null)[];
  }

  // TODO: system to detect if the capacities are exceeded.
  // Is a capacity valid for a collection or for a single month? MONTH

  // TODO: factor out component to view/edit assignments.

  // TODO: setting: timeout del solver, in secondi

  let { data }: PageProps = $props();

  let collection = $derived(data.collections[0]);
  let loading = $state(false);
  let uncommittedAssignments: Assignment[] = $state([]);
  let structures: { id: number; name: string }[] = $state([]);

  const solverTimeout = new NumericField();

  /** Whether all students participating in the assignment are notified via email */
  let sendEmails = $state(true);

  async function onGenerateAssignment() {
    solverTimeout.validate();
    if (!solverTimeout.valid) return;

    loading = true;
    await sendForm('?/generateAssignments', {
      collectionId: String(collection.id),
      timeout: String(solverTimeout.value),
    })
      .then((data) => {
        uncommittedAssignments = data.assignments as Assignment[];
        structures = data.structures as { id: number; name: string }[];
      })
      .catch(() => error(m.error()))
      .finally(() => loading = false);
  }

  async function onConfirm() {
    loading = true;
    await sendForm('?/confirmAssignments', {
      year: String(collection.year),
      collectionId: String(collection.id),
      sendEmails: String(sendEmails),
      students: JSON.stringify(
        uncommittedAssignments.map(({ id, structureIds }) => ({ id, structureIds })),
      ),
    })
      .then(async () => {
        await invalidateAll();
        // uncommittedAssignments = []
        success(m.plan_save_confirm());
      })
      .catch(() => error(m.error()))
      .finally(() => loading = false);
  }

  let page = $state(0);
  const pageSize = 11;
  let paginated = $derived(uncommittedAssignments.slice(page * pageSize, (page + 1) * pageSize));
  let cancelConfirmOpen = $state(false);
</script>

<Modal
  bind:open={cancelConfirmOpen}
  title={m.plan_cancel_warn()}
  actions={[
    { label: m.modal_dismiss(), onClick: () => (cancelConfirmOpen = false), role: 'secondary' },
    {
      label: m.modal_confirm(),
      onClick: () => {
        cancelConfirmOpen = false;
        uncommittedAssignments = [];
      },
    },
  ]}
/>

<svelte:window
  onbeforeunload={(e) => {
    if (uncommittedAssignments.length > 0) {
      e.preventDefault();
      window.confirm();
    }
  }}
/>

<section class="container" style="padding-bottom: 0">
  <TitleBar title={m.sidebar_plan()} />
</section>

{#if uncommittedAssignments.length === 0}
  <section
    class="container"
    transition:slide={{ easing: cubicOut, duration: 600 }}
    style="padding-top: 0"
  >
    <div class="column">
      <div class="input-host">
        <label for="collection">{m.collection_title()}</label>

        <select id="collection" bind:value={collection} disabled={loading}>
          {#each data.collections as coll (coll.id)}
            {@const [begin, end] = [fullDate(coll.startTime), fullDate(coll.endTime)]}
            <option value={coll}>
              {coll.year}, {begin === end ? begin : `${begin}–${end}`}, {coll.durationMonths} {
                m.preferences_month({ count: coll.durationMonths })
              }, {coll.numberOfPreferences} {
                m.preferences_per_month({ count: coll.numberOfPreferences })
              }, {coll.studentCount} {m.students({ count: coll.studentCount })}
            </option>
          {/each}
        </select>
      </div>

      {#if collection && collection.endTime > new Date()}
        <div transition:slide={{ easing: sineIn, duration: 250 }}>
          <Banner kind="warn">{m.plan_ongoing_collection_warn()}</Banner>
        </div>
      {/if}

      <Numeric
        label={m.plan_solver_timeout()}
        field={solverTimeout}
        max={Number.MAX_SAFE_INTEGER}
        name="timeout"
        initialValue="500"
      />

      <LoadingButton {loading} enabled={solverTimeout.valid} onclick={onGenerateAssignment}>{
        m.plan_generate()
      }</LoadingButton>
    </div>
  </section>
{:else}
  <div transition:slide={{ duration: 600 }}>
    <section class="container" style="padding-top: 0">
      <p>{m.plan_check()}</p>
    </section>

    <!-- TODO: sorting by enrollment year, search -->
    <!-- TODO: capacity for collection -->
    <!-- TODO: stats before confirm: how many students for each structure, for each month -->

    <div style="padding: 0 1rem">
      <div
        class="assignments"
        style:grid-template-columns="repeat({collection.durationMonths + 1}, max-content)"
        transition:slide={{ duration: 1000, axis: 'x' }}
      >
        {#each { length: collection.durationMonths }, c (c)}
          <span class="numeric" style:grid-area="1 / {c + 2}">{
            m.preferences_month_head({ n: c + 1 })
          }</span>
        {/each}
        {#each paginated as { id, email, number, name, surname, structureIds, year }, r (id)}
          <span style="grid-area: {r + 2} / 1">
            {#if number != null}<span class="numeric" style="margin-right: 0.7rem">{
                number
              }</span>{/if}<span class="truncate20">{name} {
                surname
              }</span>{#if [number, name, surname].filter(Boolean).length < 2}<span
                class="truncate30"
              >{email}</span>{/if}{#if year != null}<span
                style="margin-left: 0.7rem"
                class="numeric"
              >{year}/{year + 1}</span>{/if}
          </span>
          {#each { length: structureIds.length }, c (c)}
            <select
              bind:value={structureIds[c]}
              style="grid-area: {r + 2} / {c + 2}"
              disabled={loading}
            >
              <option value={null}>{m.plan_empty_assignment()}</option>
              {#each structures as { id, name } (id)}
                <option value={id}>{name}</option>
              {/each}
            </select>
          {/each}
        {/each}
      </div>
    </div>

    <section class="container column" style="padding-top: 0">
      <Pagination bind:page {pageSize} itemsLength={uncommittedAssignments.length} />

      <Switch
        name="send-emails"
        bind:checked={sendEmails}
        disabled={loading}
        label={m.plan_send_emails()}
      />

      <div class="row-spaced">
        <button disabled={loading} class="secondary" onclick={() => cancelConfirmOpen = true}>
          {m.modal_cancel()}
        </button>

        <LoadingButton {loading} onclick={onConfirm}>{m.plan_confirm()}</LoadingButton>
      </div>
    </section>
  </div>
{/if}

<style>
  .assignments {
    display: grid;
    gap: 0.7rem;
    align-items: center;
    padding: 1rem;
    background: hsl(from var(--body-light-bg) h s l / 0.6);
    border-radius: var(--radius);
    max-width: min-content;
    margin-inline: auto;
    border: var(--border-thickness) solid var(--border);
    overflow-x: auto;

    select {
      max-width: 300px;
    }
  }

  .row-spaced :global(button) {
    flex: 1;
  }

  @media (max-width: 530px) {
    .row-spaced {
      flex-direction: column-reverse !important;

      :global(button) {
        width: 100%;
      }
    }
  }

  .numeric {
    text-align: center;
  }
</style>
