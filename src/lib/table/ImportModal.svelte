<!-- @component Wizard to import a spreadsheet as a JSON-like object -->

<script lang="ts" generics="T extends Record<string, unknown>">
  import Modal, { type Action } from '$lib/Modal.svelte';
  import { m } from '$lib/paraglide/messages';
  import { add as showToast } from '$lib/toast/Toaster.svelte';
  import type { LocalizedString } from '@inlang/paraglide-js';
  import {
    ChevronDown,
    ChevronUp,
    CircleCheck,
    Download,
    FileSpreadsheet,
    FileUp,
    TriangleAlert,
  } from '@lucide/svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import * as XLSX from 'xlsx';

  type Key = keyof T;

  /** Takes the value and the number of a row and validates it. */
  type Validator<V = unknown> = (value: V, row: number) => string | null;

  /** Report of an error on a row. */
  interface RowError {
    row: number;
    field: string;
    key: Key;
    value: unknown;
    message: string;
  }

  /**
   * Steps of the wizard:
   * - `'idle'`: the user chooses a file to import, this is loaded and checked. If valid go to next step
   * - `'sheet'`: if (and only if) the imported file is an XLSX with multiple sheets, make the user choose one
   * - `'map'`: establish a mapping between the columns of the sheet and that of the schema
   * - `'review'`: if there are errors in the data they are reported. The possibility of partial import is
   *               supported.
   */
  type Step = 'idle' | 'sheet' | 'map' | 'review';

  interface Props {
    open: boolean;
    title: LocalizedString;

    /**
     * Defines the _schema_ of the data, i.e. which columns are to be imported and additional
     * info about them.
     */
    headers: Record<
      Exclude<Key, 'id'>,
      { label: LocalizedString; numeric: boolean; required?: boolean }
    >;

    /** Optional mapping of each key to a custom validator function. */
    validators?: Partial<Record<Key, Validator>>;
    onImport: (rows: T[]) => Promise<void>;
  }

  let { open = $bindable(false), title, headers, validators = {}, onImport }: Props = $props();

  const schemaKeys: Key[] = $derived(Object.keys(headers));

  let step: Step = $state('idle');
  let schemaOpen = $state(false);
  let isDragging: 'ok' | 'bad' | false = $state(false);

  let fileName = $state('');
  let sheetNames: string[] = $state([]);
  let selectedSheet = $state('');
  let rawFileRows: Record<string, unknown>[] = $state([]);
  let fileColumns: string[] = $state([]);
  let importWorkbook: XLSX.WorkBook | null = null;
  let importLoading = $state(false);

  // svelte-ignore state_referenced_locally
  let schemaFileMapping = $state(
    Object.fromEntries(schemaKeys.map((k) => [k, ''])) as Record<Key, string>,
  );

  // Review
  let validRows: T[] = $state([]);
  let errors: RowError[] = $state([]);

  function reset() {
    step = 'idle';
    schemaOpen = false;
    isDragging = false;
    fileName = '';
    sheetNames = [];
    selectedSheet = '';
    rawFileRows = [];
    fileColumns = [];
    schemaFileMapping = Object.fromEntries(schemaKeys.map((k) => [k, ''])) as Record<Key, string>;
    validRows = [];
    errors = [];
  }

  $effect(() => {
    if (!open) reset();
  });

  function processFile(file: File) {
    fileName = file.name;
    const ext = fileName.slice(-5).toLowerCase();
    const isCSV = ext.endsWith('.csv');
    if (!isCSV && !ext.endsWith('.xlsx')) {
      showToast({
        title: m.import_bad_file_ext(),
        message: m.import_bad_file_ext_desc({ fileName }),
        duration: 18000,
        type: 'warning',
      });
      open = false;
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: isCSV ? 'string' : 'binary' });
      sheetNames = workbook.SheetNames;
      if (sheetNames.length === 1) {
        loadSheet(workbook, sheetNames[0]);
      } else {
        selectedSheet = sheetNames[0];
        importWorkbook = workbook;
        step = 'sheet';
      }
    };
    if (isCSV) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  function loadSheet(workbook: XLSX.WorkBook, sheetName: string) {
    selectedSheet = sheetName;
    const sheet = workbook.Sheets[sheetName];
    rawFileRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    fileColumns = rawFileRows.length > 0 ? Object.keys(rawFileRows[0]) : [];
    autoMap();
    step = 'map';
  }

  function autoMap() {
    const normalize = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, '');
    for (const key of schemaKeys) {
      const label = headers[key as string]?.label ?? key;
      const normalLabel = normalize(label);
      const normalKey = normalize(key as string);
      const match = fileColumns.find((col) => {
        const normalizedCol = normalize(col);
        return normalizedCol === normalLabel || normalizedCol === normalKey;
      });
      schemaFileMapping[key] = match ?? '';
    }
  }

  function validate() {
    const good: T[] = [];
    const bad: RowError[] = [];

    rawFileRows.forEach((raw, idx) => {
      const rowNum = idx + 1;
      const rowErrors: RowError[] = [];
      const parsed: Record<string, unknown> = {};

      for (const key of schemaKeys) {
        const col = schemaFileMapping[key];
        const rawVal = col ? raw[col] : undefined;
        if (validators[key]) {
          const msg = validators[key](rawVal, rowNum);
          if (msg) {
            rowErrors.push({
              row: rowNum,
              field: headers[key as string]?.label ?? key,
              key,
              value: rawVal,
              message: msg,
            });
          }
        }
        parsed[key as string] = rawVal ?? '';
      }

      if (rowErrors.length === 0) {
        good.push(parsed as T);
      } else {
        bad.push(...rowErrors);
      }
    });

    validRows = good;
    errors = bad;
    step = 'review';
  }

  function downloadErrorReport() {
    const byRow = new SvelteMap<number, RowError[]>();
    for (const e of errors) {
      const list = byRow.get(e.row) ?? [];
      list.push(e);
      byRow.set(e.row, list);
    }

    const errorRows = Array.from(byRow.entries()).map(([row, errs]) => {
      const raw = rawFileRows[row - 1];
      const errorMsg = errs.map((e) => `${e.field}: ${e.message}`).join('; ');
      return { ...raw, __errors: errorMsg };
    });

    const ws = XLSX.utils.json_to_sheet(errorRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errors');
    XLSX.writeFile(wb, 'import-errors.xlsx');
  }

  const unmappedRequired = $derived(
    schemaKeys.filter((k) => headers[k as string].required && !schemaFileMapping[k]),
  );
  const errorRowCount = $derived(new Set(errors.map((e) => e.row)).size);

  function getModalActions(step: Step): Action[] {
    switch (step) {
      case 'idle':
        return [{ label: m.modal_cancel(), onClick: () => (open = false), role: 'secondary' }];
      case 'sheet':
        return [
          { label: m.modal_cancel(), onClick: () => (open = false), role: 'secondary' },
          {
            label: m.import_confirm_sheet(),
            // SAFETY: if we are on this step the workbook was imported
            onClick: () => loadSheet(importWorkbook!, selectedSheet),
          },
        ];
      case 'map':
        return [
          { label: m.modal_back(), onClick: reset, role: 'secondary' },
          {
            label: m.import_confirm_mapping(),
            onClick: validate,
            disabled: unmappedRequired.length !== 0,
          },
        ];
      case 'review':
        return [
          { label: m.modal_back(), onClick: reset, role: 'secondary' },
          {
            label: validRows.length > 0
              ? m.import_confirm({ count: validRows.length })
              : m.import_no_valid_rows(),
            loading: importLoading,
            onClick: async () => {
              importLoading = true;
              try {
                await onImport(validRows);
              } finally {
                importLoading = false;
              }
            },
            disabled: validRows.length === 0,
            icon: FileUp,
          },
        ];
    }
  }
</script>

<Modal {title} bind:open actions={getModalActions(step)} dismissible={step === 'idle'}>
  <div class="column">
    {#if step === 'idle'}
      <div class="schema-hint">
        <button
          class="schema-toggle secondary"
          type="button"
          onclick={() => (schemaOpen = !schemaOpen)}
          aria-expanded={schemaOpen}
        >
          <FileSpreadsheet size={14} />
          {m.import_expected_format()}
          {#if schemaOpen}<ChevronUp size={14} />{:else}<ChevronDown size={14} />{/if}
        </button>

        {#if schemaOpen}
          <table class="schema-table">
            <thead>
              <tr>
                <th>{m.import_col_name()}</th>
                <th>{m.import_col_type()}</th>
                <th>{m.import_col_required()}</th>
              </tr>
            </thead>
            <tbody>
              {#each Object.entries(headers) as [key, { label, numeric, required }] (key)}
                <tr>
                  <td><code>{label}</code></td>
                  <td>{numeric ? m.import_col_numeric() : m.import_col_textual()}</td>
                  <td>{required ? m.import_col_required_yes() : m.import_col_required_no()}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>

      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex-->
      <div
        class="drop-area"
        role="region"
        class:dragging={isDragging === 'ok'}
        class:invalid={isDragging === 'bad'}
        ondragover={(e) => {
          e.preventDefault();
          const item = e.dataTransfer?.items[0];
          const valid = item?.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            || item?.type === 'text/csv';
          isDragging = valid ? 'ok' : 'bad';
        }}
        ondragleave={() => (isDragging = false)}
        ondrop={(e: DragEvent) => {
          e.preventDefault();
          isDragging = false;
          const file = e.dataTransfer?.files[0];
          if (file) processFile(file);
        }}
        tabindex="0"
        onkeydown={(e) => e.key === 'Enter' && e.currentTarget.querySelector('input')?.click()}
      >
        <FileUp size={36} />
        <p class="no-select">{m.import_drop_hint()}</p>
        <label class="no-select">
          {m.import_browse()}
          <input
            type="file"
            accept=".xlsx, .csv"
            style="display: none"
            class="no-select"
            onchange={(e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) processFile(file);
            }}
          />
        </label>
      </div>
    {:else if step === 'sheet'}
      <p style="font-size: 0.9rem">{m.import_sheet_hint({ fileName })}</p>
      <div class="column" style="gap: 0.4rem">
        {#each sheetNames as name (name)}
          <label class="sheet-option">
            <input type="radio" bind:group={selectedSheet} value={name} />
            <FileSpreadsheet size={14} />
            {name}
          </label>
        {/each}
      </div>
    {:else if step === 'map'}
      <p style="font-size: 0.9rem">{m.import_map_hint({ fileName })}</p>

      {#if unmappedRequired.length > 0}
        <div class="banner warn">
          <TriangleAlert size={14} />
          {m.import_map_warn({ count: unmappedRequired.length })}
        </div>
      {/if}

      <table class="map-table">
        <thead>
          <tr>
            <th>{m.import_map_expected()}</th>
            <th>{m.import_map_source()}</th>
          </tr>
        </thead>
        <tbody>
          {#each Object.entries(headers) as [key, { label }] (key)}
            <tr>
              <td><code>{label}</code></td>
              <td>
                <select
                  bind:value={schemaFileMapping[key]}
                  class:unmapped={headers[key as string].required && !schemaFileMapping[key]}
                >
                  <option value="">{m.import_map_skip()}</option>
                  {#each fileColumns as col (col)}
                    <option value={col}>{col}</option>
                  {/each}
                </select>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else if step === 'review'}
      {#if errors.length === 0}
        <div class="banner ok">
          <CircleCheck size={14} /> {m.import_all_valid({ count: validRows.length })}
        </div>
      {:else}
        <div class="banner warn">
          <TriangleAlert size={14} />
          {m.import_partial({ valid: validRows.length, invalid: errorRowCount })}
        </div>

        <div class="error-scroll">
          <table class="error-table">
            <thead>
              <tr>
                <th>{m.import_err_row()}</th>
                <th>{m.import_err_col()}</th>
                <th>{m.import_err_value()}</th>
                <th>{m.import_err_msg()}</th>
              </tr>
            </thead>
            <tbody>
              <!-- eslint-disable-next-line svelte/require-each-key -->
              {#each errors as err}
                <tr>
                  <td class="numeric">{err.row}</td>
                  <td><code>{err.field}</code></td>
                  <td>{String(err.value)}</td>
                  <td class="err-msg">{err.message}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <button class="download-errors secondary" onclick={downloadErrorReport}>
          <Download size={14} />
          {m.import_download_errors()}
        </button>
      {/if}
    {/if}
  </div>
</Modal>

<style>
  .column {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .schema-hint, .schema-toggle, .schema-table {
    font-size: 0.8rem;
    color: var(--body-lighter) !important;
  }

  .schema-hint {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .schema-toggle {
    width: 100%;
    border: none;
    font-size: 0.8rem;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.8rem;

    th {
      letter-spacing: 0.04rem;
      font-size: 0.72rem;
      font-variant-caps: all-small-caps;
      font-weight: 600;
    }

    td, &.schema-table th {
      border-top: 1px solid var(--border);
    }

    td, th {
      padding: 0.3rem 1rem;
      text-align: left;
    }
  }

  .drop-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 2.5rem 1rem;
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    text-align: center;
    color: var(--body-light);
    transition: border-color 0.15s, background 0.15s cubic-bezier(0.445, 0.05, 0.55, 0.95);

    &.dragging {
      border-color: var(--success-border);
      background: var(--success-bg);
      color: var(--success-text);
    }

    &.invalid {
      border-color: var(--danger);
      background: hsl(from var(--danger-bg) h s l / 0.2);
      color: var(--danger-text);
    }
  }

  .sheet-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background 0.12s;

    &:has(input:checked) {
      border-color: var(--primary);
      background: var(--primary-bg);
    }
  }

  .map-table select {
    width: 100%;
    font-size: 0.83rem;
  }

  .map-table select.unmapped {
    border-color: var(--warning-border);
    background: hsl(from var(--warning-bg) h s l / 0.3);
    color: var(--body-lighter);
  }

  .banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    border-radius: var(--radius);
    font-size: 0.85rem;

    &.ok {
      background: hsl(from var(--success-bg) h s l / 0.3);
      color: var(--success-text);
      border: 1px solid var(--success-border);
    }

    &.warn {
      background: hsl(from var(--warning-bg) h s l / 0.3);
      color: var(--warning-text);
      border: 1px solid var(--warning-border);
    }
  }

  .error-scroll {
    max-height: 220px;
    overflow-y: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .error-table th,
  .error-table td {
    white-space: nowrap;
  }

  .error-table th {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--body-lighter);
    background: var(--body-light-bg);
    position: sticky;
    top: 0;
  }

  .err-msg {
    color: var(--danger);
  }

  .download-errors {
    font-size: 0.8rem;
  }
</style>
