/**
 * Table component
 */

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => string;
  class?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  class?: string;
}

export function renderTable<T extends Record<string, unknown>>(
  props: TableProps<T>
): string {
  const { columns, data, emptyMessage = "No data available", class: className = "" } = props;

  if (data.length === 0) {
    return `
<div class="text-center py-12 ${className}">
  <p class="text-gray-400">${emptyMessage}</p>
</div>`.trim();
  }

  const headerCells = columns.map(col => `
    <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider ${col.class || ""}">
      ${col.header}
    </th>
  `).join("");

  const rows = data.map(row => {
    const cells = columns.map(col => {
      const value = col.render 
        ? col.render(row) 
        : String(row[col.key as keyof T] ?? "");
      return `<td class="px-4 py-3 text-sm text-gray-300 ${col.class || ""}">${value}</td>`;
    }).join("");
    return `<tr class="border-t border-gray-800 hover:bg-white/5 transition-colors">${cells}</tr>`;
  }).join("");

  return `
<div class="overflow-x-auto rounded-lg ${className}" style="background: var(--color-surface); border: 1px solid var(--color-border);">
  <table class="min-w-full">
    <thead style="background: var(--color-surface-elevated);">
      <tr>${headerCells}</tr>
    </thead>
    <tbody class="divide-y" style="border-color: var(--color-border);">
      ${rows}
    </tbody>
  </table>
</div>`.trim();
}
