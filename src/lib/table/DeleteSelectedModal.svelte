<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import onSubmit from '$lib/form/submit';
  import Modal from '$lib/Modal.svelte';
  import { error, type LocalizedString, m } from '$lib/paraglide/messages';
  import { success } from '$lib/toast/Toaster.svelte';

  interface Props {
    ids: Set<number>;
    open: boolean;
    label: ({ count }: { count: number }) => LocalizedString;
    confirmMessage: ({ count }: { count: number }) => LocalizedString;
  }

  let { ids, open = $bindable(false), label, confirmMessage }: Props = $props();

  let loading = $state(false);
</script>

<Modal
  title={m.table_delete_modal({ count: ids.size, entity: label({ count: ids.size }) })}
  bind:open
  actions={[
    { label: m.modal_cancel(), onClick: () => (open = false), role: 'secondary' },
    {
      label: m.modal_delete(),
      onClick: () => {},
      role: 'danger',
      form: 'delete-students',
      loading,
    },
  ]}
/>

<form
  id="delete-students"
  method="POST"
  action="?/delete"
  use:enhance={({ cancel }) =>
  onSubmit(cancel, [], () => (loading = true), async (result) => {
    if (result.type === 'success') {
      await invalidateAll();
      if (result.data?.count) {
        success(confirmMessage({ count: result.data.count as number }));
      }
      open = false;
    } else {
      error(m.error());
    }
    loading = false;
  })}
>
  {#each ids as id (id)}
    <input type="hidden" name="id" value={id} />
  {/each}
</form>
