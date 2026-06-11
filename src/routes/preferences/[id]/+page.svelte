<script lang="ts">
  import Modal from '$lib/Modal.svelte';
  import { m } from '$lib/paraglide/messages';
  import { fullDate } from '$lib/time';
  import { Save, Search, Trash } from '@lucide/svelte';
  import PreferencesGrid from '../../PreferencesGrid.svelte';
  import TitleBar from '../../TitleBar.svelte';
  import type { PageProps } from './$types';
  import '$lib/assets/styles/boxed-list.css';
  import { sendForm } from '$lib/form/submit';
  import Pagination from '$lib/table/Pagination.svelte';
  import { error, success } from '$lib/toast/Toaster.svelte';
  import { flip } from 'svelte/animate';
  import { cubicOut } from 'svelte/easing';

  type Student = typeof data.students[number];

  let { data }: PageProps = $props();

  // svelte-ignore state_referenced_locally
  let students = $state(JSON.parse(JSON.stringify(data.students))) as Student[];

  let [begin, end] = $derived([
    fullDate(data.collection.startTime),
    fullDate(data.collection.endTime),
  ]);

  let loading = $state(false);
  let selected: Student & { index: number } | null = $state(null);
  let toDeleteStudentId: number | null = $state(null);
  let studentDetails = $state('');
  let existingPrefs: (number | null)[][] = $state([]);
  let preferences: (number | null)[][] = $state([]);
  let search = $state('');

  let isValid = $derived(preferences.every((month) => month[0] != null));
  let hasChanged = $derived(
    preferences.some((month, i) =>
      month.some((pref, j) => pref !== (existingPrefs![i][j] ?? null))
    ),
  );

  function onSelect(student: Student & { index: number }) {
    let fields = [student.name, student.surname].filter(Boolean);
    studentDetails = fields.join(' ');
    if (fields.length < 1) {
      studentDetails += ', ' + student.email;
    }
    if (student.number != null) studentDetails += ` (${student.number})`;
    existingPrefs = student.preferences.map((month: (number | null)[]) => {
      month.length = data.collection.numberOfPreferences;
      return month.fill(null, month.length, data.collection?.numberOfPreferences);
    });
    preferences = existingPrefs.map((prefs) => [...prefs]);
    selected = student;
  }

  async function savePreferences() {
    loading = true;
    await sendForm('/?/savePreferences', {
      preferences: JSON.stringify(preferences.map((month) => month.filter((pref) => pref != null))),
      collectionId: String(data.collection.id),
      editing: String(true),
      studentId: String(selected?.id),
    })
      .then(() => {
        success(m.preferences_updated_successfully({ student: studentDetails }));
        if (selected?.index != null) {
          students[selected.index].preferences = JSON.parse(JSON.stringify(preferences));
        }
        selected = null;
      })
      .catch(() => error(m.error()))
      .finally(() => loading = false);
  }
  let processedStudents = $derived.by(() => {
    const numbered = students.map((pref, i) => ({ index: i, ...pref }));

    const searchCaseInsensitive = search ? search.toLowerCase() : '';
    return numbered.filter((student) =>
      !search
      || [student.name, student.surname, student.number, student.email].some((val) =>
        String(val ?? '').toLowerCase().includes(searchCaseInsensitive)
      )
    );
  });

  let page = $state(0);
  const pageSize = 15;
  let paginated = $derived(processedStudents.slice(page * pageSize, (page + 1) * pageSize));
</script>

<Modal
  title={m.preferences_delete_title()}
  open={toDeleteStudentId != null}
  onDismiss={() => toDeleteStudentId = null}
  actions={[
    { label: m.modal_cancel(), onClick: () => (toDeleteStudentId = null), role: 'secondary' },
    {
      label: m.modal_delete(),
      onClick: async () => {
        loading = true;
        await sendForm('/?/deletePreferences', {
          collectionId: String(data.collection.id),
          studentId: String(toDeleteStudentId),
        }).then(() => {
          students = students.filter((student) => student.id !== toDeleteStudentId);
          success(m.preferences_delete_successfully({ student: studentDetails }));
          toDeleteStudentId = null;
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
  {@html m.preferences_deletion_desc({ student: studentDetails })}
</Modal>

<Modal
  title={m.preferences_edit_title({ student: studentDetails })}
  open={selected != null}
  onDismiss={() => selected = null}
  maxWidth={800}
  dismissible={!hasChanged}
  actions={[
    { label: m.modal_cancel(), onClick: () => (selected = null), role: 'secondary' },
    {
      label: m.modal_delete(),
      onClick: () => {
        if (selected != null) {
          toDeleteStudentId = selected.id;
          selected = null;
        }
      },
      role: 'danger',
      icon: Trash,
    },
    {
      label: m.save_changes(),
      onClick: savePreferences,
      icon: Save,
      disabled: !hasChanged || !isValid,
      loading,
    },
  ]}
>
  <PreferencesGrid
    {preferences}
    {existingPrefs}
    numberOfPreferences={data.collection.numberOfPreferences}
    durationMonths={data.collection.durationMonths}
    editMode={true}
    userAccepted={true}
    sites={data.sites}
  />
</Modal>

<section class="container">
  <TitleBar
    backLocation="/preferences"
    title="{m.collection_title()} {begin === end ? begin : `${begin}–${end}`}"
  />

  {#if students.length > 0}
    <div class="input-icon">
      <div class="icon-box icon-host"><Search /></div>
      <input type="search" placeholder={m.table_search_placeholder()} bind:value={search} />
    </div>
  {/if}

  {#each paginated as student, i (student.id)}
    <button
      class="secondary boxed-list row-spaced text-small"
      onclick={() => onSelect(student)}
      class:first={paginated.length > 1 && i === 0}
      class:last={paginated.length > 1 && i === paginated.length - 1}
      class:middle={paginated.length > 1 && i > 0 && i < paginated.length - 1}
      animate:flip={{ duration: 400, easing: cubicOut }}
    >
      {#if student.number != null}<span class="numeric">{student.number}</span>{/if}
      <div>
        {#if student.name || student.surname}<span class="truncate20">{student.name} {
              student.surname
            }</span>{/if}
        {#if [student.number, student.name, student.surname].filter(Boolean).length < 2}<span
            class="truncate30"
          >{student.email}</span>{/if}
      </div>
    </button>
  {:else}
    <span class="notice">{m.preferences_empty()}</span>
  {/each}

  <Pagination itemsLength={processedStudents.length} bind:page {pageSize} />
</section>

<style>
  .row-spaced {
    justify-content: start;
    gap: 0.8rem;

    white-space: no-wrap;
    overflow: hidden;
    overflow: ellipsis;
    text-align: start;
  }

  .input-icon {
    margin-bottom: 1rem;

    display: flex;
    .icon-box {
      display: flex;
      align-items: center;
      border: var(--border-thickness) solid var(--border);
      border-right: none;
      border-top-left-radius: var(--radius);
      border-bottom-left-radius: var(--radius);
    }
    input {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      flex: 1;
    }
  }
</style>
