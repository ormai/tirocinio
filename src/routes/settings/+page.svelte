<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Field } from '$lib/form/field.svelte';
  import Numeric, { NumericField } from '$lib/form/Numeric.svelte';
  import PasswordField from '$lib/form/PasswordField.svelte';
  import onSubmit, { sendForm } from '$lib/form/submit';
  import LoadingButton from '$lib/LoadingButton.svelte';
  import { m } from '$lib/paraglide/messages';
  import { error, success } from '$lib/toast/Toaster.svelte';
  import { Save } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { sineIn } from 'svelte/easing';
  import { fade, fly, slide } from 'svelte/transition';
  import TitleBar from '../TitleBar.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let loading = $state(false);
  let hydrated = $state(false);
  onMount(() => hydrated = true);

  const appName = new Field([
    (i) => i.validity.valueMissing && m.settings_app_name_missing(),
  ]);

  const submitterEmail = new Field([
    (i) => i.validity.valueMissing && m.settings_submitter_address_missing(),
    (i) => i.validity.typeMismatch && m.email_validity_type(),
  ]);
  const host = new Field([(i) => i.validity.valueMissing && m.settings_smtp_host_missing()]);
  const port = new NumericField([(i) => i.validity.valueMissing && m.settings_smtp_port_missing()]);
  const username = new Field([
    (i) => i.validity.valueMissing && m.settings_smtp_username_missing(),
  ]);
  const password = new Field();

  const emailFields = [submitterEmail, host, port, username, password];

  let emailSettingsChanged = $derived(
    submitterEmail.hasChanged(data.submitterEmail)
      || host.hasChanged(data.smtpHost)
      || port.hasChanged(data.smtpPort)
      || username.hasChanged(data.smtpUsername)
      || password.hasText,
  );

  let connectionState: { state: 'danger' | 'success'; message: string } | null = $state(null);

  async function onVerifyEmailConfig() {
    loading = true;
    await sendForm('?/verifyEmailConfiguration', {})
      .then(({ validity }) => {
        if (validity === true) {
          connectionState = { state: 'success', message: m.settings_email_connection_valid() };
        } else if (validity === 'configNull') {
          connectionState = { state: 'danger', message: m.settings_email_connection_config_null() };
        } else if (validity === 'EAUTH') {
          connectionState = { state: 'danger', message: m.settings_email_connection_eauth() };
        } else {
          connectionState = {
            state: 'danger',
            message: m.settings_email_connection_error({ err: String(validity) }),
          };
        }
      })
      .catch(() => error(m.error()))
      .finally(() => loading = false);
  }
</script>

<section class="container">
  <TitleBar title={m.sidebar_settings()} />

  <form
    class="column"
    method="POST"
    action="?/updateGeneralSettings"
    use:enhance={({ cancel }) =>
    onSubmit(cancel, [appName], () => loading = true, async (result) => {
      if (result.type === 'success') {
        await invalidateAll();
        appName.resetTo(data.appName);
      }
      loading = false;
    })}
    novalidate
  >
    <div class="input-host">
      <label for="app-name">{m.settings_app_name_label()}</label>
      <input
        name="app-name"
        id="app-name"
        value={data.appName}
        required
        maxlength="30"
        {@attach appName.attach}
      >
      {#if appName.dirty && appName.error}
        <span class="error" transition:fade>{appName.error}</span>
      {/if}
    </div>

    {#if hydrated && appName.hasChanged(data.appName)}
      <div class="row-spaced" transition:slide={{ easing: sineIn, duration: 160 }}>
        <button class="secondary" type="button" onclick={() => appName.resetTo(data.appName)}>
          {m.modal_cancel()}
        </button>
        <LoadingButton {loading} enabled={appName.valid}><div style="display: flex; gap: 0.8rem">
            <Save /> {m.save_changes()}
          </div></LoadingButton>
      </div>
    {/if}
  </form>

  <h2 style="margin: 1.5rem 0 0.4rem 0">{m.settings_email_section_title()}</h2>

  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  <p class="text-small" style="margin-bottom: 0.8rem">{@html m.settings_email_section_desc()}</p>

  <form
    method="POST"
    action="?/updateEmailSettings"
    class="column"
    novalidate
    use:enhance={({ cancel }) =>
    onSubmit(cancel, emailFields, () => loading = true, async (result) => {
      if (result.type === 'success') {
        await invalidateAll();
        submitterEmail.resetTo(data.submitterEmail);
        host.resetTo(data.smtpHost);
        port.resetTo(data.smtpPort);
        username.resetTo(data.smtpUsername);
        password.resetTo('');
        success(m.settings_update_successful());
      } else {
        error(m.error());
      }
      connectionState = null;
      loading = false;
    })}
  >
    <div class="input-host">
      <label for="submitter-email">{m.settings_submitter_address_label()}</label>
      <input
        type="email"
        id="submitter-email"
        name="submitter-email"
        placeholder="{data.appName.toLowerCase().replace(' ', '-')}@example.com"
        value={data.submitterEmail}
        required
        {@attach submitterEmail.attach}
      >
      {#if submitterEmail.dirty && submitterEmail.error}
        <span class="error" transition:fade>{submitterEmail.error}</span>
      {/if}
    </div>

    <div class="row-spaced">
      <div class="input-host">
        <label for="smtp-host">{m.settings_email_host()}</label>
        <input
          name="smtp-host"
          id="smtp-host"
          placeholder="smtp.example.com"
          value={data.smtpHost}
          required
          {@attach host.attach}
        >
        {#if host.dirty && host.error}
          <span class="error" transition:fade>{host.error}</span>
        {/if}
      </div>

      <Numeric
        name="smtp-port"
        field={port}
        max={65535}
        placeholder="587"
        required={true}
        initialValue={data.smtpPort}
        label={m.settings_email_port()}
      />
    </div>

    <div class="row-spaced">
      <div class="input-host">
        <label for="smtp-username">{m.settings_email_username()}</label>
        <input
          name="smtp-username"
          id="smtp-username"
          required
          value={data.smtpUsername}
          {@attach username.attach}
        >
        {#if username.dirty && username.error}
          <span class="error" transition:fade>{username.error}</span>
        {/if}
      </div>

      <PasswordField field={password} name="smtp-password" required={false} />
    </div>

    {#if hydrated && emailSettingsChanged}
      <div
        class="row-spaced"
        transition:slide={{ easing: sineIn, duration: 160 }}
        style="margin-top: 1rem"
      >
        <button
          class="secondary"
          type="button"
          onclick={() => {
            submitterEmail.resetTo(data.submitterEmail);
            host.resetTo(data.smtpHost);
            port.resetTo(data.smtpPort);
            username.resetTo(data.smtpUsername);
            password.resetTo('');
          }}
        >
          {m.modal_cancel()}
        </button>
        <LoadingButton
          {loading}
          enabled={emailFields.every((f) => f.valid)}
        ><div style="display: flex; gap: 0.6rem">
            <Save /> {m.save_changes()}
          </div></LoadingButton>
      </div>
    {:else if data.smtpHost && data.smtpPort && data.smtpUsername}
      <div
        class="small email"
        style="display: flex; align-items: center; gap: 0.8rem; margin-top: 1rem"
      >
        <LoadingButton
          {loading}
          class="secondary"
          type="button"
          grow={false}
          onclick={onVerifyEmailConfig}
        >
          {m.settings_email_verify()}
        </LoadingButton>

        {#if connectionState}
          <span
            in:fly={{ y: -20 }}
            style="color: var(--{connectionState.state}); font-weight: bold"
          >{connectionState.message}</span>
        {/if}
      </div>
    {/if}
  </form>
</section>

<style>
  .row-spaced :global(:is(button, .input-host)) {
    flex: 1;
  }

  @media (max-width: 630px) {
    .row-spaced {
      flex-direction: column;

      & :global(:is(.input-host, button)) {
        width: 100%;
      }
    }
  }

  .column {
    gap: 0.8rem;
  }
</style>
