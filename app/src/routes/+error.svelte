<script lang="ts">
import { page } from "$app/state";
import { m } from "$lib/paraglide/messages";

// Assign a color to each range of HTTP status codes, for fun.
const httpStatusColors = [
  "--body-light",
  "--success",
  "--info",
  "--danger",
  "--warning",
];

const statusColor = httpStatusColors[Math.trunc(page.status / 100) - 1]
  ?? "--body";
</script>

<main>
  <p>{m.error_server_desc()}</p>

  <h1>
    <span style:color={`var(${statusColor})`}>{page.status}</span>
    {page?.error?.message ?? "🤷"}
  </h1>
</main>

<style>
main {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 5mm;
	text-align: center;
}
</style>
