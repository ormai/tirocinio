<script lang="ts">
  import { enhance } from '$app/forms';
  import { Field, passwordRegExp } from '$lib/form/field.svelte';
  import PasswordField from '$lib/form/PasswordField.svelte';
  import onSubmit from '$lib/form/submit';
  import Modal from '$lib/Modal.svelte';
  import { error, m } from '$lib/paraglide/messages';
  import { success } from '$lib/toast/Toaster.svelte';
  import { fade } from 'svelte/transition';
  let { open = $bindable() } = $props();

  let loading = $state(false);
  let emailTaken = $state(false);

  const name = new Field([(i) => i.validity.valueMissing && m.settings_admin_name_required()]);
  const surname = new Field([
    (i) => i.validity.valueMissing && m.settings_admin_surname_required(),
  ]);
  const email = new Field([
    (i) => i.validity.valueMissing && m.settings_admin_email_required(),
    (i) => i.validity.typeMismatch && m.email_validity_type(),
    () => emailTaken && m.settings_admin_email_taken(),
  ], () => {
    emailTaken = false;
  });
  const password: Field = new Field([
    (i) => i.validity.valueMissing && m.profile_new_password_missing(),
    (i) => i.validity.tooShort && m.password_short({ min: i.minLength, current: i.value.length }),
    (i) => i.value.length > 0 && !passwordRegExp.test(i.value) && m.password_pattern(),
  ], () => {
    password.validate();
    passwordConfirm.validate();
  });
  const passwordConfirm: Field = new Field([
    (i) => i.validity.valueMissing && m.profile_new_password_confirm_missing(),
    (i) => i.value !== password.value && m.profile_password_mismatch(),
    () => (!password.valid && password.hasText) && m.profile_new_password_invalid(),
  ], () => {
    password.validate();
    passwordConfirm.validate();
  });

  const fields = [name, surname, email, password, passwordConfirm];
</script>

<Modal
  bind:open
  title={m.settings_email_admin_add()}
  dismissible={fields.every((f) => !f.hasText)}
  actions={[
    { label: m.modal_cancel(), onClick: () => (open = false), role: 'secondary' },
    {
      label: m.settings_admin_add(),
      form: 'add-admin',
      loading,
      disabled: fields.some((f) => !f.valid),
    },
  ]}
>
  <form
    id="add-admin"
    class="column"
    method="POST"
    action="?/addAdminAccount"
    novalidate
    use:enhance={({ cancel }) =>
    onSubmit(cancel, [], () => loading = true, async (result) => {
      if (result.type === 'success') {
        success(m.settings_admin_added_successfully());
        open = false;
      } else if (result.type === 'failure' && result.data?.emailTaken === true) {
        emailTaken = true;
        email.validate();
      } else {
        error(m.error());
      }
      loading = false;
    })}
  >
    <div class="input-host">
      <label for="name">{m.profile_name()}</label>
      <input
        name="admin-name"
        id="name"
        required
        {@attach name.attach}
      />
      {#if name.dirty && name.error}
        <span transition:fade class="error">{name.error}</span>
      {/if}
    </div>

    <div class="input-host">
      <label for="surname">{m.profile_surname()}</label>
      <input
        name="admin-surname"
        id="surname"
        required
        {@attach surname.attach}
      />
      {#if surname.dirty && surname.error}
        <span transition:fade class="error">{surname.error}</span>
      {/if}
    </div>

    <div class="input-host">
      <label for="email">{m.profile_email()}</label>
      <input
        id="email"
        type="email"
        name="admin-email"
        placeholder={m.email_placeholder()}
        required
        {@attach email.attach}
      >
      {#if email.dirty && email.error}
        <span transition:fade class="error">{email.error}</span>
      {/if}
    </div>

    <PasswordField
      name="admin-password"
      field={password}
      label={m.settings_admin_password()}
    />

    <PasswordField
      name={undefined}
      field={passwordConfirm}
      label={m.settings_admin_password_confirm()}
    />
  </form>
</Modal>
