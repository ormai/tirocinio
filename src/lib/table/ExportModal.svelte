<script lang="ts" generics="T extends Record<string, unknown>">
  import Modal from '$lib/Modal.svelte';
  import { m } from '$lib/paraglide/messages';
  import type { LocalizedString } from '@inlang/paraglide-js';
  import { FileDown } from '@lucide/svelte';
  import * as XLSX from 'xlsx';

  interface Props {
    open: boolean;
    title: LocalizedString;
    data: () => ReadonlyArray<T>;
    headers: Partial<Record<keyof T, string>>;
    filename: string;
  }

  let { open = $bindable(false), title, data, headers, filename }: Props = $props();

  function toRows(): Record<string, unknown>[] {
    const keys = Object.keys(headers) as Array<keyof T>;
    return data().map((item) => Object.fromEntries(keys.map((key) => [headers[key], item[key]])));
  }

  function exportXLSX() {
    const worksheet = XLSX.utils.json_to_sheet(toRows());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  function exportCSV() {
    const headerRow = Object.values(headers).join(',');
    const dataRows = toRows().map((r) =>
      Object.values(r).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headerRow, ...dataRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  let format: 'xlsx' | 'csv' = $state('xlsx');
</script>

<Modal
  {title}
  bind:open
  actions={[{ label: m.modal_cancel(), onClick: () => (open = false), role: 'secondary' }, {
    label: m.table_export(),
    onClick: () => {
      if (format === 'xlsx') {
        exportXLSX();
      } else if (format === 'csv') {
        exportCSV();
      }
      open = false;
    },
    icon: FileDown,
  }]}
>
  <div class="row-spaced">
    <label for="export-format">{m.export_choose_format()}</label>
    <select id="export-format" bind:value={format}>
      <option value="xlsx">{m.export_format_xlsx()}</option>
      <option value="csv">{m.export_format_csv()}</option>
    </select>
  </div>
</Modal>
