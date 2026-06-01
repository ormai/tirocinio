<script lang="ts">
  import { resolve } from '$app/paths';
  import Banner from '$lib/Banner.svelte';
  import { m } from '$lib/paraglide/messages';
  import type { PageProps } from './$types';
  import StudentPreference from './StudentPreference.svelte';
  import TitleBar from './TitleBar.svelte';

  let { data }: PageProps = $props();
</script>

<section class="container">
  <TitleBar title="Home" />

  {#if data.user.role === 'admin'}
    <p>
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Numquam ducimus distinctio debitis
      aliquam sunt molestiae non quaerat, in omnis praesentium rem qui delectus, sint nihil
      perspiciatis? Ullam sunt illum impedit.
    </p>
  {:else if data.user.role === 'student'}
    <div class="column">
      {#if !data.user.accepted}
        <Banner kind="info">{m.student_not_accepted_notice()}</Banner>
      {/if}
      {#if !data.user.name || !data.user.surname || data.user.number == null
  || data.user.enrollmentYear == null}
        <Banner kind="warn">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html m.student_profile_incomplete_notice({ href: resolve('/profile') })}
        </Banner>
        <hr>
      {/if}
      <StudentPreference />
    </div>
  {/if}
</section>
