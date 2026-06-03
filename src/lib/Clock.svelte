<!-- @component Animated clock icon, which happens to also tick. -->

<script lang="ts">
  import {
    Clock1,
    Clock10,
    Clock11,
    Clock12,
    Clock2,
    Clock3,
    Clock4,
    Clock5,
    Clock6,
    Clock7,
    Clock8,
    Clock9,
    type LucideProps,
  } from '@lucide/svelte';

  interface Props extends LucideProps {
    onTick: () => Promise<void>;
    intervalMs?: number;
  }

  let { onTick, intervalMs = 1000, ...props }: Props = $props();

  const clocks = [
    Clock1,
    Clock2,
    Clock3,
    Clock4,
    Clock5,
    Clock6,
    Clock7,
    Clock8,
    Clock9,
    Clock10,
    Clock11,
    Clock12,
  ];
  let currentClock = $state(0);
  let Clock = $derived(clocks[currentClock]);
  $effect(() => {
    const interval = setInterval(async () => {
      await onTick();
      currentClock = (currentClock + 1) % clocks.length;
    }, intervalMs);
    return () => clearInterval(interval);
  });
</script>

<Clock {...props} />
