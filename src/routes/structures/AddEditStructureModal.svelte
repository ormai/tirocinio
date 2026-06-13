<!-- @component Interactive form to add and edit a structure row -->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Field } from '$lib/form/field.svelte';
  import Numeric, { MAX_INT, NumericField } from '$lib/form/Numeric.svelte';
  import onSubmit from '$lib/form/submit';
  import Modal from '$lib/Modal.svelte';
  import { error, m } from '$lib/paraglide/messages';
  import type { StructureView } from '$lib/server/structure';
  import { success } from '$lib/toast/Toaster.svelte';
  import { Save } from '@lucide/svelte';
  import { fade } from 'svelte/transition';
  import type { ActionData } from './$types';

  interface Props {
    editing: StructureView | null;
    open: boolean;
    form: ActionData;
  }

  let { editing = $bindable(null), open = $bindable(false), form }: Props = $props();

  let server = $state<Partial<ActionData>>({});
  let loading = $state(false);

  $effect(() => {
    server = { ...form };
  });

  const name = new Field([
    (i) => i.validity.valueMissing && m.structure_name_missing(),
    () => server?.nameTaken === true && m.structure_name_taken(),
  ], () => {
    if (server) server.nameTaken = false;
  });
  const ward = new Field();
  const area = new Field();
  const kind = new Field();
  const site = new Field();
  const capacity = new NumericField();
  const yearOfCourse = new NumericField();

  const fields = [name, ward, area, kind, site, capacity, yearOfCourse];

  let formDirty: boolean = $derived.by(() =>
    editing !== null
      ? name.hasChanged(editing.name) || ward.hasChanged(editing.ward)
        || area.hasChanged(editing.area) || kind.hasChanged(editing.kind)
        || site.hasChanged(editing.site) || capacity.hasChanged(editing.capacity)
        || yearOfCourse.hasChanged(editing.yearOfCourse)
      : fields.some((field) => field.dirty)
  );
  let canSubmit: boolean = $derived(formDirty && fields.every((field) => field.valid));

  function onDismiss() {
    editing = null;
    open = false;
  }

  async function afterSubmit() {
    if (server?.edited === true) {
      await invalidateAll();
      success(m.structures_updated_confirm());
      server.edited = false;
      editing = null;
    } else if (server?.added === true) {
      await invalidateAll();
      success(m.structures_added_confirm());
      server.added = false;
      open = false;
    } else if (server?.nameTaken === true) {
      name.validate();
    } else {
      error(m.error());
    }
    loading = false;
  }
</script>

<Modal
  title={editing !== null
  ? m.table_edit({ entity: m.structures({ count: 1 }) })
  : m.table_add({ entity: m.structures({ count: 1 }) })}
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
      form: 'add-edit-structure',
      loading,
      icon: Save,
    },
  ]}
>
  <form
    id="add-edit-structure"
    method="POST"
    action={editing !== null ? '?/edit' : '?/add'}
    use:enhance={({ cancel }) => onSubmit(cancel, fields, () => (loading = true), afterSubmit)}
    novalidate
  >
    <input type="hidden" name="id" value={editing?.id}>

    <div class="input-host">
      <label for="name">{m.structures_name()}</label>
      <input id="name" name="name" value={editing?.name} {@attach name.attach} required />
      {#if name.dirty && name.error}
        <span class="error" transition:fade>{name.error}</span>
      {/if}
    </div>

    <div class="input-host">
      <label for="ward">{m.structures_ward()}</label>
      <input id="ward" name="ward" value={editing?.ward} {@attach ward.attach} />
    </div>

    <div class="input-host">
      <label for="area">{m.structures_area()}</label>
      <input id="area" name="area" value={editing?.area} {@attach area.attach} />
    </div>

    <div class="input-host">
      <label for="kind">{m.structures_kind()}</label>
      <input id="kind" name="kind" value={editing?.kind} {@attach kind.attach} />
    </div>

    <div class="input-host">
      <label for="site">{m.structures_site()}</label>
      <input id="site" name="site" value={editing?.site} {@attach site.attach} />
    </div>

    <Numeric
      name="year-of-course"
      label={m.structures_year_long()}
      initialValue={editing?.yearOfCourse}
      field={yearOfCourse}
    />

    <Numeric
      name="capacity"
      max={MAX_INT}
      label={m.structures_capacity()}
      initialValue={editing?.capacity}
      field={capacity}
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
