<!-- @component The home page seen by administrators. Contains some general info -->

<script lang="ts">
  import { Hospital, Tickets, Users } from '@lucide/svelte';

  import { invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import Clock from '$lib/Clock.svelte';
  import { duration } from '$lib/time';
  import { m } from '$lib/paraglide/messages';

  let collectionCountDown = $state(
    page.data.activeCollection ? duration(page.data.activeCollection.endTime) : null,
  );
  let lastStudentRegistration = $state(
    page.data.latestStudentRegistration ? duration(page.data.latestStudentRegistration) : null,
  );

  async function onTick() {
    collectionCountDown = duration(page.data.activeCollection.endTime);
    lastStudentRegistration = duration(page.data.latestStudentRegistration);
    if (new Date() > page.data.activeCollection.endTime) {
      await invalidateAll();
    }
  }
</script>

<div class="fluid">
  <a href={resolve('/structures')} class="card">
    <Hospital size={48} /> <p>
      <span class="admin-home-interpolated">{page.data.structsCount}</span> {
        m.admin_home_structures_1({ count: page.data.structsCount })
      } <span class="admin-home-interpolated">{page.data.totalCapacity}</span> {
        m.admin_home_structures_2({ count: page.data.totalCapacity })
      } <span class="admin-home-interpolated">{page.data.yearCapacities}</span>.
    </p>
  </a>
  <!-- markup-fmt-ignore -->
  <a href={resolve('/students')} class="card">
    <Users size={48} /> <p>
      <span class="admin-home-interpolated">{page.data.totalStudents}</span>
      {m.students({ count: page.data.totalStudents })}{#if page.data.totalStudents > 0}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html m.admin_home_students_1({ count: page.data.notAcceptedStudents })}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {/if}{#if lastStudentRegistration != null}{@html
          m.admin_home_students_2({ duration: lastStudentRegistration })
        }{/if}.
    </p>
  </a>
  <!-- markup-fmt-ignore -->
  <a href={resolve('/preferences')} class="card">
    <Tickets size={48} /> {#if page.data.activeCollection}
      <p>
        {m.preferences_collection_ends()}
        <Clock {onTick} style="display: inline; vertical-align: sub" size={18} /> <span class="admin-home-interpolated">{collectionCountDown}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        </span>{@html m.admin_home_collection_1({ count: page.data.totalPreferences })}{#if page.data.popularSites?.length > 0}{m.admin_home_collection_2()} {@html
            page.data.popularSites.map((name: string) => `<span class="admin-home-interpolated">${name}</span>`).join(', ')
          }{/if}.
      </p>
    {:else}
      <p class="notice">{m.preferences_no_active_collection()}</p>
    {/if}
  </a>
</div>

<style>
  .fluid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .card {
    min-width: 300px;
    background: var(--primary-bg);
    border: var(--border-thickness) solid var(--primary-border);
    border-radius: var(--radius);
    padding: 1rem;

    color: var(--primary-text);

    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    text-decoration: none;
    transition: background 0.2s cubic-bezier(0.77, 0, 0.175, 1);

    &:hover {
      background: hsl(from var(--primary-bg) h s calc(l + 15));
    }

    &:active {
      background: hsl(from var(--primary-bg) h s calc(l + 30));
    }
  }

  :global(.admin-home-interpolated) {
    font-weight: bold;
    font-variant-numeric: tabular-nums slashed-zero;
  }

  .notice {
    margin-bottom: 0;
  }
</style>
