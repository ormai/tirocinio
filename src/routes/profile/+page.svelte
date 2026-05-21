<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, replaceState } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import AcademicYearField, { YearField } from '$lib/form/AcademicYear.svelte';
  import { Field, passwordRegExp } from '$lib/form/field.svelte';
  import PasswordField from '$lib/form/PasswordField.svelte';
  import StudentNumberField, { NumberField } from '$lib/form/StudentNumber.svelte';
  import onSubmit from '$lib/form/submit';
  import LoadingButton from '$lib/LoadingButton.svelte';
  import { m } from '$lib/paraglide/messages.js';
  import { add as showToast, error, success } from '$lib/toast/Toaster.svelte';
  import { Info } from '@lucide/svelte';
  import { onMount, tick, untrack } from 'svelte';
  import { fade } from 'svelte/transition';
  import TitleBar from '../TitleBar.svelte';
  import type { PageProps } from './$types.js';

  onMount(async () => {
    await tick();
    const verification = page.url.searchParams.get('verification');
    if (verification) {
      if (verification === 'success') {
        success(m.email_verification_successful());
      } else if (verification === 'fail') {
        error(m.email_verification_failed());
      } else {
        console.warn(`Unexpected value for verification search param: ${verification}`);
      }
      untrack(() => replaceState(resolve('/profile'), {}));
    }
  });

  let loading = $state(false);
  let { data, form }: PageProps = $props();
  let server = $state<Partial<typeof form>>({});

  const email = new Field([
    (i) => (i.value.length > 0 && i.validity.typeMismatch) && m.email_validity_type(),
    () => server?.emailTaken === true && m.profile_email_taken(),
  ], () => {
    if (server) server.emailTaken = false;
  });
  const name = new Field();
  const surname = new Field();

  const studentNumber = new NumberField(
    [() => server?.numberTaken === true && m.students_number_taken()],
    () => {
      if (server) server.numberTaken = false;
    },
  );
  const enrollmentYear = new YearField();

  const currentPassword: Field = new Field([
    (i) =>
      (newPassword.hasText || newPasswordConfirm.hasText) && i.validity.valueMissing
      && m.profile_current_password_missing(),
    (i) =>
      i.value.length > 0 && i.validity.tooShort
      && m.password_short({ min: i.minLength, current: i.value.length }),
    (i) => i.value.length > 0 && !passwordRegExp.test(i.value) && m.password_pattern(),
    () => server?.incorrectPassword === true && m.profile_password_incorrect(),
  ], () => {
    newPassword.validate();
    newPasswordConfirm.validate();
    if (server) server.incorrectPassword = false;
  });
  const newPassword: Field = new Field([
    (i) =>
      (currentPassword.hasText || newPasswordConfirm.hasText)
      && i.validity.valueMissing && m.profile_new_password_missing(),
    (i) =>
      i.validity.tooShort
      && m.password_short({ min: i.minLength, current: i.value.length }),
    (i) => i.value.length > 0 && !passwordRegExp.test(i.value) && m.password_pattern(),
  ], () => {
    currentPassword.validate();
    newPasswordConfirm.validate();
  });
  const newPasswordConfirm: Field = new Field([
    (i) =>
      (currentPassword.hasText || newPassword.hasText) && i.validity.valueMissing
      && m.profile_new_password_confirm_missing(),
    (i) => i.value !== newPassword.value && m.profile_password_mismatch(),
    () => (!newPassword.valid && newPassword.hasText) && m.profile_new_password_invalid(),
  ], () => {
    currentPassword.validate();
    newPassword.validate();
  });

  $effect(() => {
    server = { ...form };
    untrack(() => {
      email.validate();
      currentPassword.validate();
      studentNumber.validate();
    });
  });

  let formDirty = $derived(
    data.user !== null
      && (email.hasChanged(data.user.email) || name.hasChanged(data.user.name)
        || surname.hasChanged(data.user.surname)
        || (data.user.role === 'student' && studentNumber.hasChanged(data.user.number))
        || (data.user.role === 'student' && enrollmentYear.hasChanged(data.user.enrollmentYear))
        || currentPassword.hasText || newPassword.hasText || newPasswordConfirm.hasText),
  );

  const fields = [
    email,
    name,
    surname,
    studentNumber,
    enrollmentYear,
    currentPassword,
    newPassword,
    newPasswordConfirm,
  ];

  let formValid = $derived(fields.every((field) => field.valid));

  function clearForm() {
    email.resetTo(data.user?.email);
    name.resetTo(data.user?.name);
    surname.resetTo(data.user?.surname);
    studentNumber.resetTo(data.user?.number);
    enrollmentYear.resetTo(data.user?.enrollmentYear);
    currentPassword.resetTo();
    newPassword.resetTo();
    newPasswordConfirm.resetTo();
    if (server) {
      server.incorrectPassword = false;
      server.emailTaken = false;
      server.numberTaken = false;
    }
  }

  async function afterSubmit() {
    if (server?.success === true) {
      await invalidateAll();
      success(m.profile_update_notice());
      server.success = false;
      clearForm();
    }
    if (server?.emailVerificationSent === true) {
      showToast({
        title: m.profile_verify_email_title(),
        message: m.profile_verify_email_desc(),
        type: 'info',
        duration: 10000,
      });
      server.emailVerificationSent = false;
    }
    loading = false;
  }
</script>

<section class="container">
  <TitleBar title={m.profile_title()} />

  {#if data.user}
    <form
      method="POST"
      action="?/update"
      novalidate
      use:enhance={({ cancel }) => onSubmit(cancel, fields, () => (loading = true), afterSubmit)}
    >
      <div class="row">
        <div class="input-host">
          <label for="name">{m.profile_name()}</label>
          <input
            name="name"
            id="name"
            autocomplete="given-name"
            value={data.user.name}
            placeholder={m.profile_missing()}
            {@attach name.attach}
          />
        </div>

        <div class="input-host">
          <label for="surname">{m.profile_surname()}</label>
          <input
            name="surname"
            id="surname"
            autocomplete="family-name"
            value={data.user.surname}
            placeholder={m.profile_missing()}
            {@attach surname.attach}
          />
        </div>
      </div>

      {#if data.user.role === 'student'}
        <StudentNumberField
          field={studentNumber}
          placeholder={m.profile_missing()}
          initialValue={data.user.number}
        />

        <AcademicYearField
          field={enrollmentYear}
          label={m.profile_enrollment_year()}
          placeholder={m.profile_missing()}
          initialValue={data.user.enrollmentYear}
        />
      {/if}

      <div class="input-host">
        <label for="email">{m.profile_email()}</label>
        <input
          id="email"
          type="email"
          name="email"
          autocomplete="email"
          value={data.user.email}
          placeholder={m.email_placeholder()}
          required
          {@attach email.attach}
        >
        {#if email.dirty && email.error}
          <span transition:fade class="error">{email.error}</span>
        {/if}
        <span
          style="font-size: 0.75rem; color: var(--body-light); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.3rem"
        >
          <Info size={16} style="display: inline" /> {m.profile_email_info()}
        </span>
      </div>

      <PasswordField
        name="current-password"
        field={currentPassword}
        label={m.profile_current_password()}
      />

      <div class="row">
        <div>
          <PasswordField
            name="new-password"
            field={newPassword}
            label={m.profile_new_password()}
          />
        </div>

        <div>
          <PasswordField
            field={newPasswordConfirm}
            label={m.profile_confirm_new_password()}
          />
        </div>
      </div>

      <div class="button-row" style:margin-top="2rem">
        <button
          class="secondary button"
          type="button"
          onclick={clearForm}
        >
          {m.profile_clear()}
        </button>
        <div class="button">
          <LoadingButton enabled={formDirty && formValid} {loading}>{
            m.profile_update()
          }</LoadingButton>
        </div>
      </div>
    </form>
  {/if}
</section>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .row, .button-row {
    display: flex;
    gap: 1rem;

    div, .button {
      flex: 1 1 50%;
    }
  }

  @media (max-width: 800px) {
    .row {
      flex-wrap: wrap;
    }
  }
  @media (max-width: 370px) {
    .button-row {
      flex-wrap: wrap;
    }
  }
</style>
