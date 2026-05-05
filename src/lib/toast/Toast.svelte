<script lang="ts">
  import { BadgeCheck, Bell, CircleX, Info, TriangleAlert, X } from '@lucide/svelte';
  import type { Component } from 'svelte';
  import { circOut, sineIn } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import type { ToastOpts } from './Toaster.svelte';

  let { toast, ondismiss, visible }: { toast: ToastOpts; ondismiss: () => void; visible: boolean } =
    $props();

  let swipeStart = 0;
  let swipePosition = $state(0);

  const icons: Record<string, Component> = {
    default: Bell,
    danger: CircleX,
    warning: TriangleAlert,
    info: Info,
    success: BadgeCheck,
  } as const;

  const Icon = $derived(icons[toast.type ?? ''] ?? icons.default);
</script>

<div
  class="toast"
  style:--background={`var(--${toast.type === 'default' ? 'body-light' : toast.type}-bg)`}
  style:--border-color={toast.type === 'default' ? 'var(--border)' : `var(--${toast.type}-border)`}
  style:--color={`var(--${toast.type === 'default' ? 'body' : toast.type + '-color'})`}
  style:transform={`translateX(${swipePosition}px)`}
  role="alert"
  in:fly={{ y: -50, duration: 280, easing: sineIn }}
  out:fly={{ x: 200, duration: 380, easing: circOut }}
  ontouchstart={(e) => swipeStart = e.touches[0].clientX}
  ontouchmove={(e) => swipePosition = e.touches[0].clientX - swipeStart}
  ontouchend={() => Math.abs(swipePosition) >= 100 ? ondismiss() : swipePosition = 0}
>
  <Icon color={`var(--${toast.type === 'default' ? 'body-light' : toast.type})`} size={24} />

  <div class="body">
    {#if toast.title}<p class="title">{toast.title}</p>{/if}
    <p class="message">{toast.message}</p>
  </div>

  <button class="close" onclick={ondismiss}><X /></button>

  {#if visible && toast.duration! > 0}
    <div
      class="progress"
      style:background={toast.type === 'default' ? 'var(--body-lighter)' : `var(--${toast.type}-text)`}
      style="animation-duration: {toast.duration}ms"
    >
    </div>
  {/if}
</div>

<style>
  .toast {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
    max-width: 380px;
    padding: 1em;
    overflow: hidden;
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.09),
      0 1px 3px rgba(0, 0, 0, 0.06);
    touch-action: pan-y;

    background: var(--background);
    color: var(--color);
    border: 1px solid var(--border-color); 
    border-radius: var(--radius);
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .body {
    flex: 1;
  }

  .title {
    font-size:.9em;
    font-weight: 600;
    letter-spacing: -0.01em;
    height: 24px;
    display: flex;
    align-items: center;
  }

  .message {
    margin-top: .2em;
    font-size: .8em;
    opacity: 0.88;
  }

  button.close {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: inherit;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease-in-out;
    padding: 0;

    &:hover {
      background: rgba(64, 64, 64, 0.8);
    }

    &:active {
      background: rgba(128, 128, 128, 0.6);
    }
  }

  @media (hover: none) and (pointer: coarse) {
    button.close {
      display: none;
    }

    .toast {
      user-select: none;
      cursor: grab;

      &:active {
        cursor: grabbing;
      }
    }
  }

  .progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: 100%;
    opacity: 0.7;
    border-radius: var(--radius);
    transform-origin: left;
    animation: shrink linear forwards;
  }

  @keyframes shrink {
    from { transform: scaleX(1); }
    to   { transform: scaleX(0); }
  }
</style>
