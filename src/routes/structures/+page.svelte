<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<table>
  <caption><h1>Structures</h1></caption>
  <thead>
    <tr>
      <th>Name</th>
      <th>Ward</th>
      <th>Area</th>
      <th>Kind</th>
      <th>Site</th>
    </tr>
  </thead>
  <tbody>
    {#each data.structures as structure (structure.id)}
      <tr>
        <td>{structure.name}</td>
        <td>{structure.ward}</td>
        <td>{structure.area}</td>
        <td>{structure.kind}</td>
        <td>{structure.siteId}</td>
      </tr>
    {/each}
  </tbody>
</table>
