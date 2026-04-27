<script lang="ts">
import { enhance } from "$app/forms";
import LanguageSwitcher from "$lib/LanguageSwitcher.svelte";
import { m } from "$lib/paraglide/messages";
import PasswordField from "$lib/PasswordField.svelte";
import SegmentedButtons from "$lib/SegmentedButtons.svelte";
import { emailValidator, validation } from "$lib/validation.svelte";
import { fade, fly } from "svelte/transition";

const title = m.signin_title();
let signInType: "student" | "admin" = $state("student");
let emailError = $state({ value: "" });

function submit(
  { formElement, cancel }: { formElement: HTMLFormElement; cancel: () => void },
) {
  if (!formElement.checkValidity()) {
    cancel();
  }
}
</script>

<LanguageSwitcher />

<svelte:head><title>{title}</title></svelte:head>

<main>
  <h1>{title}</h1>
  <SegmentedButtons
    options={[
      { label: m.signin_student(), value: "student" },
      { label: m.signin_admin(), value: "admin" },
    ]}
    bind:selected={signInType}
  />

  <form method="POST" use:enhance={submit} novalidate>
    <div class="input-host">
      <label for="email">{m.email_input_label()}</label>
      <input
        id="email"
        name="email"
        type="email"
        autocomplete="email"
        placeholder={m.email_placeholder()}
        required
        {@attach (input) => validation(input, emailValidator, emailError)}
      />
      {#if emailError.value}
        <span transition:fade class="error">{emailError.value}</span>
      {/if}
    </div>

    {#if signInType === "admin"}
      <div transition:fly={{ x: -800, duration: 250 }}>
        <PasswordField />
      </div>
    {/if}

    <button>
      {
        signInType === "admin"
        ? m.signin_admin_submit()
        : m.signin_student_submit()
      }
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
  margin-top: 7mm;

  button {
    width: 100%;
    margin-top: 5mm;
  }
}
</style>
