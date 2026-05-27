<script lang="ts">
  import { enhance } from '$app/forms';
  import { Field, passwordRegExp } from '$lib/form/field.svelte.js';
  import PasswordField from '$lib/form/PasswordField.svelte';
  import onSubmit from '$lib/form/submit';
  import LanguageSwitcher from '$lib/LanguageSwitcher.svelte';
  import LoadingButton from '$lib/LoadingButton.svelte';
  import { m } from '$lib/paraglide/messages';
  import SegmentedButtons from '$lib/SegmentedButtons.svelte';
  import { info, notify } from '$lib/toast/Toaster.svelte';
  import { tooltip } from '$lib/tooltip.svelte.js';
  import { ArrowLeft } from '@lucide/svelte';
  import { untrack } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import type { PageProps } from './$types';

  let { form }: PageProps = $props();
  let server = $state<Partial<typeof form>>({});
  let signInType: 'student' | 'admin' = $state('student');
  let otp = $state(false);

  $effect(() => {
    server = { ...form };
    untrack(() => {
      email.validate();
      password.validate();
      if (server?.verifyOtp) {
        otp = true;
        info(m.otp_sent_notification());
      }
      if (otp) code.validate();
      if (server?.incorrectRole) {
        const roles = [m.signin_admin(), m.signin_student()];
        const [current, other] = signInType === 'admin' ? roles : roles.toReversed();
        notify(m.signin_incorrect_role({ current, other }).toWellFormed());
        signInType = signInType === 'student' ? 'admin' : 'student';
        server.incorrectRole = false;
      }
    });
  });

  const email = new Field(
    [
      (i) => i.validity.valueMissing && m.email_validity_missing(),
      (i) => i.validity.typeMismatch && m.email_validity_type(),
      () => server?.incorrectCredentials === true && m.signin_incorrect_credentials(),
    ],
    () => {
      server!.incorrectCredentials = false;
      password.validate();
    },
  );
  const password = new Field(
    [
      (i) => i.validity.valueMissing && m.password_missing(),
      (i) => i.validity.tooShort && m.password_short({ min: i.minLength, current: i.value.length }),
      (i) => !passwordRegExp.test(i.value) && m.password_pattern(),
      () => server?.incorrectCredentials === true && m.signin_incorrect_credentials(),
    ],
    () => {
      server!.incorrectCredentials = false;
      email.validate();
    },
  );
  const code = new Field(
    [
      (i) => i.validity.valueMissing && m.otp_missing(),
      (i) => i.validity.badInput && m.otp_bad_input(),
      (i) =>
        (i.validity.rangeOverflow || i.validity.rangeUnderflow)
        && m.otp_length({ min: 6, current: i.value.length }),
      () => server?.otpInvalid === true && m.otp_invalid(),
    ],
    () => {
      server!.otpInvalid = false;
    },
  );

  const title = m.signin_title();
  let loading = $state(false);
</script>

<LanguageSwitcher
  spacing="calc(var(--spacing) * 2)"
  width="initial"
  style="position: absolute; bottom: 1rem; right: 1rem"
/>

<svelte:head>
  <title>{title}</title>
  <meta name="color-scheme" content="light dark">
</svelte:head>

<main>
  <h1>{title}</h1>

  {#if otp}
    <form
      method="POST"
      in:fly={{ x: 400, duration: 180 }}
      action="?/verifyOtp"
      novalidate
      use:enhance={({ cancel }) =>
      onSubmit(cancel, [code], () => (loading = true), async () => {
        loading = false;
      })}
    >
      <p style:text-align="center">{m.signin_verify_otp()}</p>
      <div class="input-host">
        <input type="hidden" name="email" value={server?.email}>
        <input
          class="code"
          name="otp"
          type="number"
          placeholder="000000"
          min="100000"
          max="999999"
          required
          autocomplete="one-time-code"
          {@attach code.attach}
        />
        {#if code.dirty && code.error}
          <span transition:fade class="error">{code.error}</span>
        {/if}
      </div>

      <div class="button-row">
        <button
          class="secondary icon-host"
          onclick={() => otp = false}
          {@attach tooltip(m.nav_back())}
        >
          <ArrowLeft />
        </button>
        <LoadingButton {loading}>
          {m.signin_submit()}
        </LoadingButton>
      </div>
    </form>
  {:else}
    <form
      method="POST"
      in:fly={{ x: -400, duration: 177 }}
      action="?/{signInType}"
      novalidate
      use:enhance={({ cancel }) =>
      onSubmit(cancel, [email, password], () => (loading = true), async () => {
        loading = false;
      })}
    >
      <SegmentedButtons
        options={[{ label: m.signin_student(), value: 'student' }, { label: m.signin_admin(), value: 'admin' }]}
        bind:selected={signInType}
        style="margin-bottom: 1cm"
      />

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

      <div class="button-row">
        <LoadingButton {loading}>
          {signInType === 'admin' ? m.signin_submit() : m.signin_send_code()}
        </LoadingButton>
      </div>
    </form>
  {/if}
</main>

<style>
  .button-row {
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin-top: 1cm;
  }

  input.code {
    text-align: center;
    padding-right: calc(var(--spacing) * 2);
  }

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
