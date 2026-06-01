<!-- @component Modal containing the form that adds and edits a student row -->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import AcademicYearField, { YearField } from '$lib/form/AcademicYear.svelte';
  import { Field } from '$lib/form/field.svelte';
  import Numeric, { NumericField } from '$lib/form/Numeric.svelte';
  import { MAX_INT } from '$lib/form/Numeric.svelte';
  import onSubmit from '$lib/form/submit';
  import Modal from '$lib/Modal.svelte';
  import { error, m } from '$lib/paraglide/messages';
  import type { StudentView } from '$lib/server/user.js';
  import { success } from '$lib/toast/Toaster.svelte';
  import { Save } from '@lucide/svelte';
  import { untrack } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { ActionData } from './$types';

  interface Props {
    editing: StudentView | null;
    open: boolean;
    form: ActionData;
  }

  let { editing = $bindable(null), open = $bindable(false), form }: Props = $props();

  let server = $state<Partial<ActionData>>({});

  const number = new NumericField(
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
      ? number.hasChanged(editing.number)
        || name.hasChanged(editing.name)
        || surname.hasChanged(editing.surname)
        || email.hasChanged(editing.email)
        || year.hasChanged(editing.enrollmentYear)
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
      open = false;
    } else {
      error(m.error());
    }
    loading = false;
  }

  function onDismiss() {
    editing = null;
    open = false;
    if (server) {
      server.emailTaken = false;
      server.numberTaken = false;
    }
  }
</script>

<Modal
  title={editing !== null
  ? m.table_edit({ entity: m.students({ count: 1 }) })
  : m.table_add({ entity: m.students({ count: 1 }) })}
  open={editing !== null || open}
  dismissible={!formDirty}
  {onDismiss}
  actions={[
    {
      label: m.modal_cancel(),
      onClick: onDismiss,
      role: 'secondary',
    },
    {
      label: editing !== null ? m.save_changes() : m.students_add_confirm(),
      disabled: !canSubmit,
      form: 'add-edit-student',
      loading,
      icon: Save,
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
    <input type="hidden" name="id" value={editing?.id} />
    <Numeric
      field={number}
      initialValue={editing?.number}
      name="student-number"
      max={MAX_INT}
      label={m.profile_student_number()}
    />

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
      value={editing?.enrollmentYear}
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
