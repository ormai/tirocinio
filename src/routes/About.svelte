<!-- @component Modal dialog showing information about this app -->

<script lang="ts">
  import { page } from '$app/state';
  import Modal from '$lib/Modal.svelte';
  import { m } from '$lib/paraglide/messages';

  interface Props {
    open: boolean;
  }

  let { open = $bindable() }: Props = $props();
</script>

<Modal
  title={m.about()}
  bind:open
  actions={[{ label: m.modal_dismiss(), onClick: () => (open = false), role: 'secondary' }]}
>
  <div class="column">
    <h2>{page.data.appName}</h2>

    <p>© 2026 <a href="https://ormai.me">Mario D'Andrea</a></p>

    <p class="desc">{m.about_desc()}</p>

    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p class="desc">{@html m.about_license()}</p>
  </div>
</Modal>

<style>
  h2 {
    color: var(--primary-text);
  }

  div {
    text-align: center;
  }

  .desc {
    font-size: 0.85rem;
  }
</style>
