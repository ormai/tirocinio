<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import Banner from '$lib/Banner.svelte';
  import Numeric, { MAX_INT, MAX_SMALLINT, NumericField } from '$lib/form/Numeric.svelte';
  import onSubmit, { sendForm } from '$lib/form/submit';
  import LoadingButton from '$lib/LoadingButton.svelte';
  import Modal from '$lib/Modal.svelte';
  import { m } from '$lib/paraglide/messages';
  import type { ImportCapacity, StructureView } from '$lib/server/structure';
  import ImportModal, { isRequiredNumber } from '$lib/table/ImportModal.svelte';
  import { error, success } from '$lib/toast/Toaster.svelte';
  import { FileDown, FileUp } from '@lucide/svelte';
  import * as XLSX from 'xlsx';

  interface Props {
    yearCapacitiesExplicitlySet: boolean;
    yearCapacities: number;
    structures: StructureView[];
    open: boolean;
  }

  let { yearCapacitiesExplicitlySet, yearCapacities, structures, open = $bindable(false) }: Props =
    $props();

  const yearCapacitiesField = new NumericField();
  let yearCapacitiesChanged = $derived(
    (yearCapacitiesExplicitlySet && yearCapacitiesField.hasChanged(yearCapacities))
      || (!yearCapacitiesExplicitlySet && yearCapacitiesField.hasText),
  );
  let updateYearCapacitiesLoading = $state(false);
  let removeYearCapacitiesLoading = $state(false);

  let importModalOpen = $state(false);

  const nameLabel = m.structures_name();
  const capacityLabel = $derived(`${m.structures_capacity()} ${yearCapacities}`);

  function downloadTemplate() {
    const ward = m.structures_ward();
    const area = m.structures_area();
    const kind = m.structures_kind();
    const site = m.structures_site();
    const data = structures.map((structure) => {
      return {
        [nameLabel]: structure.name,
        [ward]: structure.ward,
        [area]: structure.area,
        [kind]: structure.kind,
        [site]: structure.site,
        [capacityLabel]: '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      m.year_capacities_template_sheetname({ year: yearCapacities }),
    );
    XLSX.writeFile(wb, m.year_capacities_template_filename({ year: yearCapacities }));
  }

  let validationData: Record<string, { structuresExists?: boolean; exists?: boolean }> | null =
    null;
</script>

<ImportModal
  bind:open={importModalOpen}
  title={m.year_capacities_import_title()}
  headers={{
    name: { label: nameLabel, numeric: false, required: true },
    capacity: { label: capacityLabel, numeric: true, required: true },
  }}
  preValidate={async (rows) => {
    await sendForm('?/capacitiesExist', { names: JSON.stringify(rows.map((row) => row.name)) })
      .then((data) => validationData = data as typeof validationData)
      .catch(() => error(m.error()));
  }}
  validators={{
    name: (name) => {
      if (!name) return m.import_validator_missing();
      if (validationData && validationData[name as string]?.structuresExists === false) {
        return m.import_capacity_structure_not_found();
      } else if (validationData && validationData[name as string]?.exists === true) {
        return m.import_capacity_duplicate({ year: yearCapacities });
      }
      return null;
    },
    capacity: isRequiredNumber(0, MAX_INT),
  }}
  onImport={async (rows: ImportCapacity[]) => {
    await sendForm('?/importCapacities', { rows: JSON.stringify(rows) })
      .then(async (data) => {
        importModalOpen = false;
        success(m.capacities_imported({ count: data.inserted as number, year: yearCapacities }));
        await invalidateAll();
      })
      .catch(() => error(m.error()));
  }}
/>

<Modal
  title={m.table_settings()}
  bind:open
  actions={[
    { label: m.modal_dismiss(), onClick: () => (open = false), role: 'secondary' },
  ]}
>
  <div class="column" style="gap: 0.7rem">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <Banner kind="info">{@html m.year_capacities_rationale()}</Banner>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <Banner kind="info">{@html m.year_capacities_semantics()}</Banner>

    <div class="row-spaced">
      {#if yearCapacitiesExplicitlySet}
        <form
          method="POST"
          action="?/unsetYearCapacities"
          use:enhance={({ cancel }) =>
          onSubmit(cancel, [], () => (removeYearCapacitiesLoading = true), async (result) => {
            if (result.type === 'success') {
              await invalidateAll();
              yearCapacitiesField.resetTo();
            } else {
              error(m.error());
            }
            removeYearCapacitiesLoading = false;
          })}
        >
          <LoadingButton loading={removeYearCapacitiesLoading} class="secondary">{
            m.year_capacities_remove()
          }</LoadingButton>
        </form>
      {/if}
      <form
        class="row-spaced"
        action="?/updateYearCapacities"
        style="flex-grow: 1"
        method="POST"
        use:enhance={({ cancel }) =>
        onSubmit(
          cancel,
          [yearCapacitiesField],
          () => {
            if (!yearCapacitiesChanged) cancel();
            else updateYearCapacitiesLoading = true;
          },
          async (result) => {
            if (result.type === 'success') {
              await invalidateAll();
              yearCapacitiesField.resetTo(yearCapacities);
            } else {
              error(m.error());
            }
            updateYearCapacitiesLoading = false;
          },
        )}
      >
        <Numeric
          field={yearCapacitiesField}
          initialValue={yearCapacitiesExplicitlySet ? yearCapacities : undefined}
          placeholder={yearCapacitiesExplicitlySet ? undefined : String(yearCapacities)}
          name="year"
          min={0}
          max={MAX_SMALLINT}
          style="flex-grow: 1"
        />
        {#if yearCapacitiesChanged && yearCapacitiesField.valid}
          <LoadingButton
            loading={updateYearCapacitiesLoading}
            grow={false}
            enabled={yearCapacitiesField.valid}
          >{m.modal_apply()}</LoadingButton>
        {/if}
      </form>
    </div>
    <hr>

    <span style="font-size: 0.8rem">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html m.year_capacities_hint({ nameKey: m.structures_name() })}
    </span>

    <button class="secondary long" onclick={downloadTemplate}>
      <div style="min-width: 14px"><FileDown size={14} /></div>
      {m.year_capacities_download_template({ year: yearCapacities })}
    </button>
    <button
      class="secondary long"
      onclick={() => {
        open = false;
        importModalOpen = true;
      }}
    >
      <div style="min-width: 14px"><FileUp size={14} /></div>
      {m.year_capacities_import({ year: yearCapacities })}
    </button>
  </div>
</Modal>

<style>
  button.long {
    font-size: 0.8rem;
    justify-content: start;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
</style>
