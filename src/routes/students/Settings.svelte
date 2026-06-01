<!-- @component Additional settings for the 'students' table -->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { Field } from '$lib/form/field.svelte';
  import onSubmit from '$lib/form/submit';
  import Modal from '$lib/Modal.svelte';
  import { m } from '$lib/paraglide/messages';
  import Switch from '$lib/Switch.svelte';
  import { error } from '$lib/toast/Toaster.svelte';
  import { Info, Save } from '@lucide/svelte';

  let { open = $bindable(false), data } = $props();

  const emailSuffixRegExp = /^@[a-z\d-]+(?:\.[a-z\d-]+)*$/i;

  let server: Partial<typeof data> = $state({});
  $effect(() => {
    server = { ...data };
  });

  let updateSettingsLoading = $state(false);
  let autoAcceptAllStudents: boolean = $derived(
    server.autoAcceptAllStudents ?? data.autoAcceptAllStudents,
  );
  let autoAcceptEmailSuffix = new Field([
    (i) =>
      (i.value.length > 0 && !emailSuffixRegExp.test(i.value))
      && m.students_settings_email_suffix_invalid(),
  ]);
  let settingsHaveChanged = $derived(
    autoAcceptAllStudents !== server.autoAcceptAllStudents
      || autoAcceptEmailSuffix.hasChanged(server.autoAcceptEmailSuffix),
  );
</script>

<Modal
  title={m.table_settings()}
  bind:open
  onDismiss={() => autoAcceptAllStudents = server.autoAcceptAllStudents ?? data.autoAcceptAllStudents}
  dismissible={!settingsHaveChanged}
  actions={[
    { label: m.modal_dismiss(), onClick: () => (open = false), role: 'secondary' },
    {
      label: m.save_changes(),
      loading: updateSettingsLoading,
      disabled: !settingsHaveChanged || !autoAcceptEmailSuffix.valid,
      icon: Save,
      form: 'students-settings',
    },
  ]}
>
  <form
    id="students-settings"
    action="?/updateSettings"
    method="POST"
    class="column"
    use:enhance={({ cancel }) =>
    onSubmit(
      cancel,
      [autoAcceptEmailSuffix],
      () => (updateSettingsLoading = true),
      async (result) => {
        if (result.type === 'success') {
          server.autoAcceptAllStudents = autoAcceptAllStudents;
          server.autoAcceptEmailSuffix = autoAcceptEmailSuffix.value;
          updateSettingsLoading = false;
          open = false;
        } else {
          error(m.error());
        }
      },
    )}
    novalidate
  >
    <span class="secondary">{m.students_settings_hint()}</span>
    <Switch
      name="auto-accept"
      label={m.students_settings_auto_accept()}
      bind:checked={autoAcceptAllStudents}
      onchange={() => {
        if (autoAcceptAllStudents) {
          autoAcceptEmailSuffix.resetTo(server.autoAcceptEmailSuffix);
        }
      }}
    />
    <div class="input-host">
      <label for="email-suffix">{m.students_settings_email_suffix()}</label>
      <input
        disabled={autoAcceptAllStudents}
        name="email-suffix"
        id="email-suffix"
        value={server.autoAcceptEmailSuffix}
        {@attach autoAcceptEmailSuffix.attach}
      >
      {#if autoAcceptEmailSuffix.dirty && autoAcceptEmailSuffix.error}
        <span class="error">{m.students_settings_email_suffix_invalid()}</span>
      {/if}
      <span
        style="font-size: 0.75rem; color: var(--body-light); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.3rem"
      >
        <Info size={16} style="display: inline" /> {m.students_settings_email_suffix_info()}
      </span>
    </div>
  </form>
</Modal>
