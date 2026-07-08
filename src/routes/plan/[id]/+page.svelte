<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { sendForm } from '$lib/form/submit';
  import LoadingButton from '$lib/LoadingButton.svelte';
  import { m } from '$lib/paraglide/messages';
  import type { Assignment } from '$lib/server/assignment.server';
  import { error, success } from '$lib/toast/Toaster.svelte';
  import { Save } from '@lucide/svelte';
  import TitleBar from '../../TitleBar.svelte';
  import AssignmentGrid from '../AssignmentGrid.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  // Declaring this with $derived doesn't make it reactive and bind won't work.
  let assignments: Assignment[] = $state([]);
  $effect(() => assignments = JSON.parse(JSON.stringify(data.assignments)));

  let hasChanged = $derived.by(() => {
    const a = data.assignments.flatMap((v) => v.structureIds);
    const b = assignments.flatMap((v) => v.structureIds);
    // https://www.freecodecamp.org/news/how-to-compare-arrays-in-javascript/#heading-method-1-using-every
    return a.length !== b.length || a.some((item, index) => item !== b[index]);
  });

  let loading = $state(false);
  async function onEdit() {
    loading = true;
    await sendForm('?/edit', {
      assignments: JSON.stringify(
        assignments.map(({ id, structureIds }) => ({ id, structureIds })),
      ),
      collectionId: String(page.params.id ?? null),
    })
      .then(async () => {
        await invalidateAll();
        success(m.plan_edit_successful());
      })
      .catch(() => error(m.error()))
      .finally(() => loading = false);
  }
</script>

<section class="container" style="padding-bottom: 0">
  <TitleBar title={m.plan_assignment_details()} backLocation="/plan" />
</section>

<AssignmentGrid structures={data.structures} bind:assignments />

<section class="container">
  <div class="row-spaced button-row">
    <button
      class="secondary"
      disabled={!hasChanged}
      onclick={() => assignments = JSON.parse(JSON.stringify(data.assignments))}
    >
      {m.modal_cancel()}
    </button>
    <LoadingButton {loading} onclick={onEdit} enabled={hasChanged}><div class="row-spaced">
        <Save />{m.save_changes()}
      </div></LoadingButton>
  </div>
</section>

<style>
  .button-row button {
    width: 100%;
  }
  @media (max-width: 600px) {
    .button-row {
      flex-direction: column-reverse;
    }
  }
</style>
