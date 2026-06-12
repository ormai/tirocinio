<script lang="ts">
  import { resolve } from '$app/paths';
  import { sendForm } from '$lib/form/submit';
  import Modal from '$lib/Modal.svelte';
  import { m } from '$lib/paraglide/messages';
  import { type Collection } from '$lib/server/preference';
  import { dateTimeMedium } from '$lib/time';
  import { error, success } from '$lib/toast/Toaster.svelte';
  import { tooltip } from '$lib/tooltip.svelte';
  import { CirclePlus, Pencil, Save, Trash } from '@lucide/svelte';
  import { cubicInOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';
  import TitleBar from '../TitleBar.svelte';
  import type { PageProps } from './$types';
  import AddEditCollection from './AddEditCollection.svelte';
  import '$lib/assets/styles/boxed-list.css';

  let { data }: PageProps = $props();

  let collections = $derived(data.collections);

  let [ongoing, pasts] = $derived.by(() => {
    const first = collections[0];
    const now = new Date();
    if (first?.endTime > now || first?.startTime > now) {
      return [first, collections.slice(1)];
    }
    return [null, collections];
  });

  let selected: Collection | null = $state(null);
  let deleteModalOpen = $state(false);
  let editModalOpen = $state(false);
  let loading = $state(false);
  let creating = $state(false);
  let editDirty = $state(false);
</script>

<Modal
  title={m.preferences_edit_collection()}
  bind:open={editModalOpen}
  onDismiss={() => selected = null}
  dismissible={!editDirty}
  actions={[
    {
      label: m.modal_cancel(),
      onClick: () => {
        editModalOpen = false;
        selected = null;
      },
      role: 'secondary',
    },
    {
      label: m.save_changes(),
      form: 'add-edit-collection',
      loading,
      disabled: !editDirty,
      icon: Save,
    },
  ]}
>
  <AddEditCollection bind:creating bind:selected bind:loading bind:editDirty bind:editModalOpen />
</Modal>

<Modal
  title={m.preferences_delete_collection()}
  bind:open={deleteModalOpen}
  onDismiss={() => selected = null}
  actions={[
    { label: m.modal_cancel(), onClick: () => (deleteModalOpen = false), role: 'secondary' },
    {
      label: m.modal_delete(),
      role: 'danger',
      onClick: async () => {
        if (!selected) return;
        loading = true;
        await sendForm('?/deleteCollection', { id: String(selected.id) })
          .then(() => {
            collections = collections.filter((c) => c.id !== selected?.id);
            deleteModalOpen = false;
            success(m.preferences_collection_delete_successfully());
          })
          .catch(() => error(m.error()))
          .finally(() => loading = false);
      },
      loading,
    },
  ]}
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html m.preferences_delete_warning()}
</Modal>

{#snippet collection(
  collection: Collection,
  active: boolean = false,
  index?: number,
)}
  <a
    class="boxed-list row-spaced link-button"
    class:first={index === 0 && pasts.length > 1}
    class:last={index === pasts.length - 1 && pasts.length > 1}
    class:middle={index && index > 0 && index < pasts.length - 1}
    class:active
    href={resolve(`/preferences/${collection.id}`)}
  >
    <span class="numeric">{collection.year}</span>
    <div class="column">
      <span>{m.preferences_from()} <span class="value">{dateTimeMedium(collection.startTime)}</span>
        {m.preferences_to()} <span class="value">{dateTimeMedium(collection.endTime)}</span>.</span>
      <span><span class="value">{collection.numberOfPreferences}</span> {
          m.preferences_per_month({ count: collection.numberOfPreferences })
        }</span>
    </div>
    <div class="trailing">
      <button
        class="tertiary icon-host"
        onclick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          selected = collection;
          deleteModalOpen = true;
        }}
        {@attach tooltip(m.preferences_delete_collection())}
      >
        <Trash />
      </button>
      <button
        class="tertiary icon-host"
        onclick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          selected = collection;
          editModalOpen = true;
        }}
        {@attach tooltip(m.preferences_edit_collection())}
      >
        <Pencil />
      </button>
    </div>
  </a>
{/snippet}

<section class="container">
  <TitleBar title={m.preferences_title()} />

  {#if ongoing}
    <div style="margin-bottom: 0.4rem">{m.preferences_active_collection()}</div>

    {@render collection(ongoing, true)}
  {:else}
    {#if creating}
      <div transition:slide={{ duration: 500, easing: cubicInOut }}>
        <div style="margin-bottom: 0.5rem">{m.preferences_create()}</div>
        <AddEditCollection
          bind:creating
          bind:loading
          bind:editModalOpen
        />
      </div>
    {:else}
      <div transition:slide={{ duration: 500, easing: cubicInOut }}>
        <div class="notice">{m.preferences_no_active_collection()}</div>
        <button
          class="create"
          onclick={() => creating = true}
        >
          <CirclePlus />{m.preferences_create()}
        </button>
      </div>
    {/if}
  {/if}

  <div style="height: 1rem"></div>

  {#if pasts.length > 0}
    <h2>{m.preferences_past_title()}</h2>

    {#each pasts as past, i (past.id)}
      {@render collection(past, false, i)}
    {/each}
  {/if}
</section>

<style>
  .create {
    width: 100%;
    height: 3rem;
  }

  h2 {
    margin-bottom: 0.6rem;
    margin-top: 1rem;
  }

  :global(strong.danger) {
    color: var(--danger-text);
  }
</style>
