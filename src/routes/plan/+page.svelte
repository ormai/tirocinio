<script module lang="ts">
  export interface Assignment {
    id: number;
    email: string;
    number: number | null;
    name: string | null;
    surname: string | null;
    year: number | null;
    months: number;
    structureIds: (number | null)[];
  }
</script>

<script lang="ts">
  import { beforeNavigate, goto, invalidateAll } from '$app/navigation';
  import Banner from '$lib/Banner.svelte';
  import Numeric, { NumericField } from '$lib/form/Numeric.svelte';
  import { sendForm } from '$lib/form/submit';
  import LoadingButton from '$lib/LoadingButton.svelte';
  import Modal from '$lib/Modal.svelte';
  import { m } from '$lib/paraglide/messages';
  import Switch from '$lib/Switch.svelte';
  import { dateTimeMedium, fullDate } from '$lib/time';
  import { error, success, warning } from '$lib/toast/Toaster.svelte';
  import { tooltip } from '$lib/tooltip.svelte';
  import { Trash } from '@lucide/svelte';
  import { cubicOut, sineIn } from 'svelte/easing';
  import { slide } from 'svelte/transition';
  import TitleBar from '../TitleBar.svelte';
  import type { PageProps } from './$types';
  import Histogram from './Histogram.svelte';
  import '$lib/assets/styles/boxed-list.css';
  import { resolve } from '$app/paths';
  import { flip } from 'svelte/animate';
  import AssignmentGrid from './AssignmentGrid.svelte';

  let cancelConfirmOpen = $state(false);
  let navigateTo: URL | undefined = $state();

  beforeNavigate(({ cancel, to, willUnload }) => {
    if (uncommittedAssignments.length === 0) return;
    cancel();
    if (!willUnload) {
      navigateTo = to?.url;
      cancelConfirmOpen = true;
    }
  });

  let { data }: PageProps = $props();
  let collection = $derived(data.collections[0]);
  let loading = $state(false);
  let uncommittedAssignments: Assignment[] = $state([]);
  let structures: { id: number; name: string; capacity: number }[] = $state([]);

  let structureMap = $derived(
    new Map(structures.map(({ id, name, capacity }) => [id, { name, capacity }])),
  );

  /** Maps each month to the set of structures that exceed the capacity for that specific month */
  const structuresExceedingCapacity = $derived.by(() => {
    // We check that the capacities are not exceeded in any given month
    const frequencies = new Map<number, number[]>();
    for (const ids of uncommittedAssignments.map((a) => a.structureIds)) {
      for (const [month, id] of ids.entries()) {
        if (id != null) {
          const frequenciesByMonth = frequencies.getOrInsert(id, []);
          if (frequenciesByMonth[month]) {
            frequenciesByMonth[month] += 1;
          } else {
            frequenciesByMonth[month] = 1;
          }
        }
      }
    }
    const memory = new Map<number, Set<number>>();
    for (const [id, monthFrequencies] of frequencies) {
      const struct = structureMap.get(id);
      if (struct) {
        for (const [month, monthFrequency] of monthFrequencies.entries()) {
          if (monthFrequency != undefined && monthFrequency > struct.capacity) {
            memory.getOrInsert(month, new Set()).add(id);
          }
        }
      }
    }
    return memory;
  });

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
        uncommittedAssignments = (data.assignments as Assignment[]).map((a) => (
          { ...a, structureIds: [...Array(a.months).keys()].map((i) => a.structureIds[i] ?? null) }
        ));
        structures = data.structures as { id: number; name: string; capacity: number }[];
      })
      .catch((err) => {
        if (err.timeout === true) {
          warning(m.plan_timeout({ seconds: err.seconds }));
        } else {
          error(m.error());
        }
      })
      .finally(() => loading = false);
  }

  async function onConfirm() {
    loading = true;
    await sendForm('?/confirmAssignments', {
      year: String(collection.year),
      collectionId: String(collection.id),
      sendEmails: String(sendEmails),
      students: JSON.stringify(
        uncommittedAssignments.map(({ id, structureIds, email }) =>
          sendEmails ? ({ id, structureIds, email }) : ({ id, structureIds })
        ),
      ),
    })
      .then(async () => {
        await invalidateAll();
        uncommittedAssignments = [];
        success(m.plan_save_confirm());
      })
      .catch((err) => {
        if (err.data?.assignmentsExists === true) {
          warning(m.plan_assignment_conflict());
        } else {
          error(m.error());
        }
      })
      .finally(() => loading = false);
  }

  let collectionIdToDelete: number | null = $state(null);
  let deleteModalOpen = $state(false);
</script>

<Modal
  bind:open={deleteModalOpen}
  title={m.plan_delete_tooltip()}
  actions={[
    { label: m.modal_dismiss(), onClick: () => (deleteModalOpen = false), role: 'secondary' },
    {
      label: m.modal_delete(),
      onClick: async () => {
        loading = true;
        await sendForm('?/deleteByCollection', { id: String(collectionIdToDelete) })
          .then(async (data) => {
            await invalidateAll();
            success(m.plan_delete_successful({ count: String(data.deleted) }));
            deleteModalOpen = false;
          })
          .catch(() => error(m.error()))
          .finally(() => loading = false);
      },
      role: 'danger',
      icon: Trash,
      loading,
    },
  ]}
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html m.plan_delete_desc({
    count: data.previousAssignments.find((a) => a.id === collectionIdToDelete)?.assignmentCount ?? -1,
  })}
</Modal>

<Modal
  bind:open={cancelConfirmOpen}
  title={m.plan_cancel_warn()}
  actions={[
    { label: m.modal_dismiss(), onClick: () => (cancelConfirmOpen = false), role: 'secondary' },
    {
      label: m.modal_confirm(),
      onClick: async () => {
        cancelConfirmOpen = false;
        uncommittedAssignments = [];
        if (navigateTo) {
          // eslint-disable-next-line svelte/no-navigation-without-resolve
          await goto(navigateTo);
        }
      },
    },
  ]}
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
              {coll.year}, {begin === end ? begin : `${begin}–${end}`}, {coll.numberOfPreferences} {
                m.preferences_per_month({ count: coll.numberOfPreferences })
              }, {coll?.studentCount ?? 0} {m.students({ count: coll.studentCount })}
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

      <LoadingButton
        {loading}
        enabled={(collection?.studentCount ?? 0) > 0 && solverTimeout.valid}
        onclick={onGenerateAssignment}
      >{m.plan_generate()}</LoadingButton>
    </div>

    {#if data.previousAssignments.length > 0}
      <h2 style="margin-top: 2rem; margin-bottom: 1rem">{m.plan_previous_assignments()}</h2>

      {#each data.previousAssignments as { id, year, startTime, endTime, assignmentCount }, i (id)}
        <a
          animate:flip
          href={resolve(`/plan/${id}`)}
          class="boxed-list row-spaced link-button"
          class:first={data.previousAssignments.length > 1 && i === 0}
          class:last={data.previousAssignments.length > 1 && i === data.previousAssignments.length - 1}
          class:middle={data.previousAssignments.length > 1 && i > 0 && i < data.previousAssignments.length - 1}
        >
          <span class="numeric" style="margin-right: 1rem">{year}</span>
          <span class="column"><span>{m.preferences_from()} <span class="value">{
                dateTimeMedium(startTime)
              }</span> {m.preferences_to()} <span class="value">{
                dateTimeMedium(endTime)
              }</span>.</span>
            <span>{m.plan_assignments_label({ count: assignmentCount })}</span>
          </span>
          <div class="trailing">
            <button
              class="tertiary icon-host"
              {@attach tooltip(m.plan_delete_tooltip())}
              onclick={(e: Event) => {
                e.preventDefault();
                collectionIdToDelete = id;
                deleteModalOpen = true;
              }}
            >
              <Trash />
            </button>
          </div>
        </a>
      {/each}
    {/if}
  </section>
{:else}
  <div transition:slide={{ duration: 600 }}>
    <section class="container" style="padding-top: 0; padding-bottom: 0">
      <p>{m.plan_check()}</p>

      {#if structuresExceedingCapacity.size > 0}
        <div style="margin-top: 1rem" transition:slide>
          <Banner kind="warn">{m.plan_capacity_exceeded()}</Banner>
        </div>
      {/if}
    </section>

    <div transition:slide={{ duration: 1000, axis: 'x' }}>
      <AssignmentGrid
        bind:assignments={uncommittedAssignments}
        {structures}
        bind:loading
        {structuresExceedingCapacity}
      />
    </div>

    <section class="container column" style="padding-top: 0">
      <Histogram assignments={uncommittedAssignments} {structures} />

      <Switch
        name="send-emails"
        bind:checked={sendEmails}
        disabled={loading}
        label={m.plan_send_emails()}
      />

      <div class="row-spaced button-row">
        <button disabled={loading} class="secondary" onclick={() => cancelConfirmOpen = true}>
          {m.modal_cancel()}
        </button>

        <LoadingButton {loading} onclick={onConfirm}>{m.plan_confirm()}</LoadingButton>
      </div>
    </section>
  </div>
{/if}

<style>
  .row-spaced :global(button) {
    flex: 1;
  }

  @media (max-width: 530px) {
    .button-row {
      flex-direction: column-reverse !important;

      :global(button) {
        width: 100%;
      }
    }
  }

  .numeric {
    text-align: center;
  }

  :global(strong.danger) {
    color: var(--danger-text);
  }
</style>
