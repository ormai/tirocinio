<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import LanguageSwitcher from '$lib/LanguageSwitcher.svelte';
  import { m } from '$lib/paraglide/messages';
  import PasswordField from '$lib/PasswordField.svelte';
  import SegmentedButtons from '$lib/SegmentedButtons.svelte';
  import { untrack } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  interface ServerErrors {
    incorrectCredentials?: boolean;
    emailMissing?: boolean;
  }

  let { form } = $props();
  let serverErrors: ServerErrors = $state({});
  let serverErrorConsumed = $state(false);

  const title = m.signin_title();
  let signInType: 'student' | 'admin' = $state('student');

  let passwordError = $state({ value: '' });
  let loading = $state(false);

  let email = $state<HTMLInputElement>();
  let emailError = $state({ value: '' });
  let emailDirty = $state(false);

  $effect(() => {
    const newErrors = {
      emailMissing: form?.emailMissing,
      incorrectCredentials: form?.incorrectCredentials,
    };
    untrack(() => {
      serverErrors = newErrors;
      serverErrorConsumed = false;
      if (email) validateEmail();
    });
  });

  function validateEmail() {
    if (!email) return;
    let error = '';
    if (email.validity.valueMissing || serverErrors?.emailMissing) {
      error = m.email_validity_missing();
    } else if (email.validity.typeMismatch) {
      error = m.email_validity_type();
    } else if (serverErrors?.incorrectCredentials) {
      error = m.signin_incorrect_credentials();
    }
    emailError.value = error;
    if (emailDirty) {
      email.dataset.valid = error ? 'false' : 'true';
    }
  }
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
    use:enhance={({ formElement, cancel }) => {
      emailDirty = true;
      validateEmail();
      if (!formElement.checkValidity() || emailError.value || passwordError.value) {
        cancel();
        return;
      }
      loading = true;
      return async ({ result }) => {
        await applyAction(result);
        loading = false;
      };
    }}
    novalidate
  >
    <div class="input-host">
      <label for="email">{m.email_input_label()}</label>
      <input
        bind:this={email}
        id="email"
        name="email"
        type="email"
        autocomplete="email"
        placeholder={m.email_placeholder()}
        oninput={() => {
          serverErrors.incorrectCredentials = false;
          serverErrors.emailMissing = false;
          serverErrorConsumed = true;
          if (emailDirty) validateEmail();
        }}
        onblur={() => {
          emailDirty = true;
          const hadServerError = serverErrors?.incorrectCredentials && !serverErrorConsumed;
          if (!hadServerError) validateEmail();
        }}
        required
      />
      {#if emailDirty && emailError.value}
        <span transition:fade class="error">{emailError.value}</span>
      {/if}
    </div>

    {#if signInType === 'admin'}
      <div transition:fly={{ x: -800, duration: 250 }}>
        <PasswordField error={passwordError} />
      </div>
    {/if}

    <button disabled={loading}>
      {signInType === 'admin' ? m.signin_admin_submit() : m.signin_student_submit()}
    </button>
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

    button {
      width: 100%;
      margin-top: 5mm;
    }
  }
</style>
