<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import { BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js';
  import { Bar } from 'svelte-chartjs';
  import type { Assignment } from './+page.svelte';

  let { assignments, structures }: {
    assignments: Assignment[];
    structures: { id: number; name: string }[];
  } = $props();

  let month = $state(0);

  let style = window.getComputedStyle(document.documentElement);

  let frequencies = $derived.by(() => {
    const map = new Map(structures.map(({ id, name }) => [id, { name, count: [] as number[] }]));

    for (const assignment of assignments) {
      for (const [month, structureId] of assignment.structureIds.entries()) {
        if (structureId != null) {
          const assignment = map.get(structureId);
          if (assignment) {
            if (assignment.count[month] != undefined) {
              assignment.count[month] += 1;
            } else {
              assignment.count[month] = 1;
            }
          }
        }
      }
    }
    return [...map.entries().map((e) => e[1])];
  });

  const months = $derived(Math.max(...frequencies.map(({ count }) => count.length)));

  Chart.register(BarElement, CategoryScale, LinearScale, Tooltip);

  const data = $derived({
    labels: frequencies.map((a) => a.name),
    datasets: [{
      label: m.plan_assignments(),
      data: frequencies.map((v) => v.count[month]),
      backgroundColor: style.getPropertyValue('--primary'),
      borderColor: style.getPropertyValue('--primary-border'),
      hoverBackgroundColor: style.getPropertyValue('--primary-text'),
      borderWidth: 1,
      borderRadius: 2,
    }],
  });

  const options = {
    scales: { x: { display: false } },
  };
</script>

<div>
  <select bind:value={month}>
    {#each { length: months }, o (o)}
      <option value={o}>{m.preferences_month_head({ n: o + 1 })}</option>
    {/each}
  </select>
</div>

<Bar {data} {options} />
