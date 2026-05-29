<script lang="ts">
  import { resolve } from '$app/paths';
  import { sendForm } from '$lib/form/submit';
  import Modal from '$lib/Modal.svelte';
  import { m } from '$lib/paraglide/messages';
  import { type Collection } from '$lib/server/preference';
  import { error } from '$lib/toast/Toaster.svelte';
  import { tooltip } from '$lib/tooltip.svelte';
  import { CirclePlus, Pencil, Save, Trash } from '@lucide/svelte';
  import { cubicInOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';
  import TitleBar from '../TitleBar.svelte';
  import type { PageProps } from './$types';
  import AddEditCollection from './AddEditCollection.svelte';

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

  /** Display date limiting the precision to minutes. */
  function displayDate(date: Date): string {
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  }
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
    class="collection row-spaced link-button"
    class:first={index === 0 && pasts.length > 1}
    class:last={index === pasts.length - 1 && pasts.length > 1}
    class:middle={index && index > 0 && index < pasts.length - 1}
    class:active
    // <!-- href={resolve(`/preferences/${collection.id}`)} -->
    href={resolve('/preferences')}
  >
    <span class="numeric">{collection.year}</span>
    <div class="column">
      <span>{m.preferences_from()} <span class="value">{displayDate(collection.startTime)}</span> {
          m.preferences_to()
        } <span class="value">{displayDate(collection.endTime)}</span>.</span>
      <span><span class="value">{collection.durationMonths}</span> {
          m.preferences_month({ count: collection.durationMonths })
        }, <span class="value">{collection.numberOfPreferences}</span> {
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
          bind:selected
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
  .collection {
    background: var(--body-light-bg);
    padding: 0.8rem 1.2rem;
    border: var(--border-thickness) solid var(--border);
    justify-content: start;
    gap: 1.2rem;
    border-radius: var(--radius);

    .column {
      gap: 0;
      font-size: 0.9rem;
      flex-grow: 1;
    }

    &.first {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }

    &.middle, &.last {
      border-top: none;
    }

    &.last {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }

    &.middle {
      border-radius: 0;
    }

    span {
      color: var(--body-light);

      &.value {
        font-variant-numeric: tabular-nums slashed-zero;
        font-weight: 700;
        color: var(--body);
      }
    }

    &.active {
      border-color: var(--primary-border);
      span {
        color: hsl(from var(--on-primary) h s l / 0.8);

        &.value {
          color: var(--on-primary);
        }
      }

      & button.tertiary:hover {
        background: var(--primary) !important;
      }

      .icon-host :global(svg) {
        color: var(--on-primary);
      }
    }

    .trailing {
      display: flex;
      gap: 0.3rem;
    }
  }

  @media (max-width: 600px) {
    .trailing {
      flex-direction: column-reverse;
    }
  }

  .create {
    width: 100%;
    height: 3rem;
  }

  .notice {
    color: var(--body-lighter);
    font-style: italic;
    margin-bottom: 0.6rem;
  }

  h2 {
    font-size: 1.2rem;
    margin-bottom: 0.6rem;
    margin-top: 1rem;
  }

  :global(strong.danger) {
    color: var(--danger-text);
  }
</style>
