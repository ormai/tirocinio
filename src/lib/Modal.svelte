<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import { tooltip } from '$lib/tooltip.svelte';
  import { X } from '@lucide/svelte';
  import type { Component, Snippet } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { MediaQuery } from 'svelte/reactivity';
  import { fade, fly } from 'svelte/transition';
  import LoadingButton from './LoadingButton.svelte';

  // FIXME: when modal is open it should not be possible to keyboard select other elements.

  type Action = {
    /** @prop label Text that describes the action. It is required because we have no tooltips for actions. */
    label: string;

    /** @prop onClick Side effect of the action. */
    onClick: () => void;

    /** @prop icon Optional icon to prepend to the label. */
    icon?: Component;

    /** @prop role Dictates the style of the action. If absent 'primary' is assumed. */
    role?: 'secondary' | 'tertiary' | 'danger';

    /** @prop Whether the button is disabled or not */
    disabled?: boolean;

    /** @prop The id of the form the button submits */
    form?: string;

    /** @prop Whether the action button is showing a loading progress */
    loading?: boolean;
  };

  interface Props {
    /** @prop title Text in the header of the modal. Explains what the modal is for. */
    title: string;

    /** @prop open Bindable. Exposes the open/closed state of the modal. */
    open?: boolean;

    /** @prop actions A set of actions represented as buttons at the bottom of the modal. */
    actions?: ReadonlyArray<Action>;

    /** @prop dismissible If true the modal can be dismissed only by an explicit action */
    dismissible?: boolean;

    /** @prop children Body of the modal, can be anything. */
    children?: Snippet;

    /** @prop Called right after the button was internally dismissed */
    onDismiss?: () => void;
  }

  /**
   * How much do transitions last for this component. In milliseconds.
   */
  const TRANSITION_DURATION = 220;

  let {
    open = $bindable(false),
    title,
    actions = [],
    dismissible = true,
    children,
    onDismiss = () => {},
  }: Props = $props();

  const mobile = new MediaQuery('(max-width: 480px)');

  function dialogTransition(node: Element) {
    if (mobile.current) {
      return fly(node, { y: 48, duration: TRANSITION_DURATION, easing: cubicOut });
    }
    return {
      duration: TRANSITION_DURATION,
      easing: cubicOut,
      css: (t: number) => `opacity: ${t}; transform: scale(${0.96 + 0.04 * t});`,
    };
  }

  function dismiss() {
    open = false;
    onDismiss();
  }
</script>

<svelte:window
  onkeydown={(e: KeyboardEvent) => {
    if (open && dismissible && e.key === 'Escape') {
      dismiss();
    }
  }}
/>

{#if open}
  <div
    class="backdrop"
    onclick={() => {
      if (dismissible) dismiss();
    }}
    role="presentation"
    transition:fade={{ duration: TRANSITION_DURATION, easing: cubicOut }}
  >
    <dialog
      open
      onclick={(e) => e.stopPropagation()}
      aria-modal="true"
      aria-labelledby="modal-title"
      transition:dialogTransition
    >
      <header>
        <h2 id="modal-title">{title}</h2>
        <button
          class="tertiary"
          onclick={() => dismiss()}
          aria-label={m.modal_dismiss()}
          {@attach tooltip(m.modal_dismiss())}
        >
          <X />
        </button>
      </header>

      {#if children}
        <main>{@render children()}</main>
      {/if}

      {#if actions.length > 0}
        <footer>
          {#each actions as { role, icon: Icon, label, onClick: onclick, disabled, form, loading } (label)}
            <LoadingButton
              type={form ? 'submit' : 'button'}
              class={role}
              {onclick}
              enabled={!disabled}
              {form}
              {loading}
              grow={false}
            >
              <div class="button-inner">
                {#if Icon}<div style="min-width: 24px"><Icon /></div> {/if}{label}
              </div>
            </LoadingButton>
          {/each}
        </footer>
      {/if}
    </dialog>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.52);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  dialog {
    position: relative;
    background: var(--body-light-bg);
    color: var(--body-light);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0;
    width: 100%;
    max-width: 480px;
    max-height: 90dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.38);
    will-change: transform, opacity;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    gap: 1rem;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border);
    h2 {
      font-size: 1.08rem;
    }
  }

  main {
    padding: 1.25rem 1rem;
    overflow-y: auto;
    flex: 1;
    font-size: 0.96rem;
    border-bottom: 1px solid var(--border);
  }

  footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 1.25rem 1rem;
    flex-shrink: 0;
  }

  .button-inner {
    display: flex;
    gap: 0.5rem;
    text-align: center;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 480px) {
    dialog {
      max-height: 85dvh;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      margin-top: auto;
      margin-bottom: 0;
    }

    .backdrop {
      align-items: flex-end;
      padding: 0;
    }

    footer {
      flex-direction: column-reverse;
    }
  }
</style>
