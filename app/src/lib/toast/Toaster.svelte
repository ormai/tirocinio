<script module lang="ts">
  export interface ToastOpts {
    id?: number;
    title?: string;
    message: string;
    type?: 'default' | 'info' | 'warning' | 'danger' | 'success';
    duration?: number;
  }

  /* Doesn't make sense to have too many toasts at once. */
  const limit = 20;
  /** Serial id, only internal to the frontend */
  let id = 0;
  /** Single instance of all toasts in the app. */
  let toasts: ToastOpts[] = $state([]);

  /**
   * Add a toast to the stack to be shown.
   */
  export function add(toast: ToastOpts) {
    if (toasts.length <= limit) {
      toast.id = id += 1;
      toast.duration ??= 4000;
      toast.type ??= 'default';
      toasts.push(toast);
    } else {
      console.warn(`Attempt to add more than ${limit} toasts`);
    }
  }

  export function error(message: string, duration: number = 8000) {
    add({ message, duration, type: 'danger' });
  }
  export function warning(message: string, duration: number = 7000) {
    add({ message, duration, type: 'warning' });
  }
  export function info(message: string, duration: number = 6000) {
    add({ message, duration, type: 'info' });
  }
  export function success(message: string, duration: number = 5000) {
    add({ message, duration, type: 'success' });
  }
  export function notify(message: string, duration: number = 5000) {
    add({ message, duration, type: 'default' });
  }
</script>

<script lang="ts">
  import Toast from '$lib/toast/Toast.svelte';

  /** How many stacked toasts are shown at once. */
  const stackDepth = 6;

  $effect(() => {
    const front = toasts[0];
    if (front && front.duration! > 0) {
      const timer = setTimeout(() => toasts.shift(), front.duration);
      return () => clearTimeout(timer);
    }
  });
</script>

<div class="toaster">
  {#each toasts.slice(0, stackDepth) as toast, i (toast.id)}
    <div
      class="toast-host"
      style:pointer-events={i === 0 ? 'all' : 'none'}
      style:--offset={i}
      style:z-index={20 - i}
      style:transform={`translateY(${-i * 4}px) scaleX(${1 - i * 0.03})`}
      style:opacity={1 - i * 0.18}
    >
      <Toast {toast} visible={i === 0} ondismiss={() => toasts.shift()} />
    </div>
  {/each}
</div>

<style>
  .toaster {
    position: fixed;
    z-index: 100;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    width: 380px;
    height: 0;

    top: 2rem;
    left: 50%;
    transform: translateX(-50%);
  }
 
  .toast-host {
    position: absolute;
    width: 100%;
    top: 0;
    left: 0;
    transition: transform 0.4s cubic-bezier(0.22, 1, 0.38, 1) .1s;
  }
 
  @media (max-width: 480px) {
    .toaster {
      bottom: 1em;
      left: 1em;
      right: 1em;
      width: unset;
      transform: none;
      align-items: stretch;
    }

    .toast-host {
      width: 100%;
      right: auto;
    }
  }
</style>
