<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { Field, passwordRegExp } from '$lib/form/field.svelte.js';
  import PasswordField from '$lib/form/PasswordField.svelte';
  import LanguageSwitcher from '$lib/LanguageSwitcher.svelte';
  import LoadingButton from '$lib/LoadingButton.svelte';
  import { m } from '$lib/paraglide/messages';
  import SegmentedButtons from '$lib/SegmentedButtons.svelte';
  import { untrack } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  let { form } = $props();
  let errors = $state<Partial<typeof form>>({});
  let signInType: 'student' | 'admin' = $state('student');

  $effect(() => {
    errors = { ...form };
    untrack(() => {
      email.validate();
      password.validate();
      if (errors?.incorrectRole) {
        signInType = signInType === 'student' ? 'admin' : 'student';
        errors.incorrectRole = false;
      }
    });
  });

  // reactivity makes my head ache
  const email = new Field(
    [
      (i) => i.validity.valueMissing && m.email_validity_missing(),
      (i) => i.validity.typeMismatch && m.email_validity_type(),
      () => errors?.incorrectCredentials === true && m.signin_incorrect_credentials(),
    ],
    () => {
      errors!.incorrectCredentials = false;
      password.validate();
    },
  );
  const password = new Field(
    [
      (i) => i.validity.valueMissing && m.password_validity_missing(),
      (i) =>
        i.validity.tooShort
        && m.password_validity_too_short({ min: i.minLength, current: i.value.length }),
      (i) => !passwordRegExp.test(i.value) && m.password_validity_pattern(),
      () => errors?.incorrectCredentials === true && m.signin_incorrect_credentials(),
    ],
    () => {
      errors!.incorrectCredentials = false;
      email.validate();
    },
  );

  const title = m.signin_title();
  let loading = $state(false);
</script>

<LanguageSwitcher />

<svelte:head><title>{title}</title></svelte:head>

<main>
  <h1>{title}</h1>
  <SegmentedButtons
    options={[{ label: m.signin_student(), value: 'student' }, { label: m.signin_admin(), value: 'admin' }]}
    bind:selected={signInType}
  />

  <form
    method="POST"
    action="?/{signInType}"
    novalidate
    use:enhance={({ cancel }) => {
      email.touch();
      password.touch();
      if (!email.valid || !password.valid) {
        cancel();
        return;
      }
      loading = true;
      return async ({ result }) => {
        await applyAction(result);
        loading = false;
      };
    }}
  >
    <div class="input-host">
      <label for="email">{m.email_input_label()}</label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autocomplete="email"
        placeholder={m.email_placeholder()}
        {@attach email.attach}
      />
      {#if email.dirty && email.error}
        <span transition:fade class="error">{email.error}</span>
      {/if}
    </div>

    {#if signInType === 'admin'}
      <div transition:fly={{ x: -800, duration: 250 }}>
        <PasswordField field={password} />
      </div>
    {/if}

    <LoadingButton style="margin-top: 1cm;" {loading}>
      {signInType === 'admin' ? m.signin_admin_submit() : m.signin_student_submit()}
    </LoadingButton>
  </form>
</main>

<style>
  main {
    width: min(100% - 2em, 360px);
  }

  h1 {
    text-align: center;
    margin-bottom: 1em;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 3mm;
    margin-top: 1cm;
  }
</style>
