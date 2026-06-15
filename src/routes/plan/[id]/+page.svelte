<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import TitleBar from '../../TitleBar.svelte';
  import AssignmentGrid from '../AssignmentGrid.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<section class="container" style="padding-bottom: 0">
  <TitleBar title={m.plan_assignment_details()} backLocation="/plan" />
</section>

<AssignmentGrid structures={data.structures} assignments={data.assignments} viewOnly={true} />
