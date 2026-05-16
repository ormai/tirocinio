<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import AcademicYearField, { YearField } from '$lib/form/AcademicYear.svelte';
  import { Field } from '$lib/form/field.svelte';
  import StudentNumber, { NumberField } from '$lib/form/StudentNumber.svelte';
  import onSubmit from '$lib/form/submit';
  import Modal from '$lib/Modal.svelte';
  import { error, m } from '$lib/paraglide/messages';
  import type { StudentView } from '$lib/server/user.js';
  import { success } from '$lib/toast/Toaster.svelte';
  import { untrack } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { ActionData } from './$types';

  interface Props {
    editing: StudentView | null;
    addModalOpen: boolean;
    form: ActionData;
  }

  let { editing = $bindable(null), addModalOpen = $bindable(false), form }: Props = $props();

  let server = $state<Partial<ActionData>>({});

  const number = new NumberField(
    [() => server?.numberTaken === true && m.students_number_taken()],
    () => {
      if (server) server.numberTaken = false;
    },
  );
  const name = new Field();
  const surname = new Field();
  const email = new Field([
    (i) => i.validity.valueMissing && m.students_email_missing(),
    (i) => i.validity.typeMismatch && m.email_validity_type(),
    () => server?.emailTaken === true && m.students_email_taken(),
  ], () => {
    if (server) server.emailTaken = false;
  });
  const year = new YearField();
  const fields = [number, name, surname, email, year];

  $effect(() => {
    server = { ...form };
    untrack(() => {
      email.validate();
      number.validate();
    });
  });

  let formDirty: boolean = $derived.by(() =>
    editing !== null
      ? number.value !== (editing.number?.toString() ?? '')
        || name.value !== editing.name
        || surname.value !== editing.surname
        || email.value !== editing.email
        || year.value !== (editing.enrollmentYear?.toString() ?? '')
      : fields.some((field) => field.dirty)
  );
  let canSubmit: boolean = $derived(formDirty && fields.every((field) => field.valid));

  let loading = $state(false);

  async function afterSubmit() {
    if (server?.edited === true) {
      await invalidateAll();
      success(m.students_updated_confirm());
      server.edited = false;
      editing = null;
    } else if (server?.added === true) {
      await invalidateAll();
      success(m.students_added_confirm());
      server.added = false;
      addModalOpen = false;
    } else {
      error(m.error());
    }
    loading = false;
  }

  function onDismiss() {
    editing = null;
    addModalOpen = false;
    if (server) {
      server.emailTaken = false;
      server.numberTaken = false;
    }
  }
</script>

<Modal
  title={editing !== null ? m.students_edit() : m.students_add()}
  open={editing !== null || addModalOpen}
  dismissible={!formDirty}
  {onDismiss}
  actions={[
    {
      label: m.modal_cancel(),
      onClick: onDismiss,
      role: 'secondary',
    },
    {
      label: editing !== null ? m.students_edit_confirm() : m.students_add_confirm(),
      disabled: !canSubmit,
      form: 'add-edit-student',
      onClick: () => {},
      loading,
    },
  ]}
>
  <form
    id="add-edit-student"
    method="POST"
    action={editing !== null ? '?/edit' : '?/add'}
    use:enhance={({ cancel }) => onSubmit(cancel, fields, () => (loading = true), afterSubmit)}
    novalidate
  >
    <StudentNumber field={number} initialValue={editing?.number} />
    <input type="hidden" name="id" value={editing?.id} />

    <div class="input-host">
      <label for="name">{m.students_name()}</label>
      <input
        name="name"
        id="name"
        autocomplete="given-name"
        value={editing?.name}
        {@attach name.attach}
      />
    </div>

    <div class="input-host">
      <label for="surname">{m.students_surname()}</label>
      <input
        name="surname"
        id="surname"
        autocomplete="family-name"
        value={editing?.surname}
        {@attach surname.attach}
      />
    </div>

    <div class="input-host">
      <label for="email">{m.students_email()}</label>
      <input
        id="email"
        type="email"
        name="email"
        autocomplete="email"
        value={editing?.email}
        placeholder={m.email_placeholder()}
        required
        {@attach email.attach}
      >
      {#if email.dirty && email.error}
        <span transition:fade class="error">{email.error}</span>
      {/if}
    </div>

    <AcademicYearField
      field={year}
      label={m.students_year()}
      initialValue={editing?.enrollmentYear}
    />
  </form>
</Modal>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
</style>
