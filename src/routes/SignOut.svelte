<script module lang="ts">
  let confirmModalOpen = $state(false);

  export function onSignOut() {
    confirmModalOpen = true;
  }
</script>

<script lang="ts">
  import { applyAction, enhance } from '$app/forms';

  import Modal from '$lib/Modal.svelte';
  import { m } from '$lib/paraglide/messages';
  import { error, success } from '$lib/toast/Toaster.svelte';

  interface Props {
    /** @props onDismiss Side effect to run when the action is executed, such as closing a popover. */
    onDismiss?: () => void;
  }
  let { onDismiss = () => {} }: Props = $props();

  let form: HTMLFormElement;
</script>

<form
  bind:this={form}
  method="POST"
  action="/sign-in?/signout"
  use:enhance={() => {
    return async ({ result }) => {
      if (result.status === 303 && result.type === 'redirect') {
        success(`${m.signout_success()} 👋`);
      } else {
        error(m.error());
      }
      await applyAction(result);
    };
  }}
>
</form>

<Modal
  bind:open={confirmModalOpen}
  title={m.signout_confirm()}
  actions={[
    { label: m.modal_cancel(), onClick: () => (confirmModalOpen = false), role: 'secondary' },
    {
      label: m.modal_confirm(),
      onClick: () => {
        form.requestSubmit();
        confirmModalOpen = false;
        onDismiss();
      },
    },
  ]}
/>
