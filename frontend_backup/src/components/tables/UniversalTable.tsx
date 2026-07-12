'use client';

import React, { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Filter, Columns, Download, LayoutTemplate } from 'lucide-react';

interface UniversalTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowDoubleClick?: (row: TData) => void;
  onRowClick?: (row: TData) => void;
  onSelectionChange?: (selectedRows: TData[]) => void;
  isLoading?: boolean;
}

export function UniversalTable<TData, TValue>({
  columns,
  data,
  onRowDoubleClick,
  onRowClick,
  onSelectionChange,
  isLoading
}: UniversalTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [columnOrder, setColumnOrder] = useState<string[]>(columns.map(c => c.id as string || (c as any).accessorKey as string));
  const [columnPinning, setColumnPinning] = useState({});
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
      columnOrder,
      columnPinning,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    enableColumnResizing: true,
    enableColumnPinning: true,
    columnResizeMode: 'onChange',
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(table.getFilteredSelectedRowModel().rows.map(r => r.original));
    }
  }, [rowSelection, onSelectionChange, table]);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-canvas)] border border-[var(--border-500)] rounded-[var(--radius-xl)] overflow-hidden glass-panel">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between p-[var(--space-2)] border-b border-[var(--border-500)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-[var(--space-2)]">
          <div className="relative">
            <Search className="absolute left-[var(--space-2-5)] top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] w-4 h-4" />
            <input
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Quick Filter..."
              className="pl-[var(--space-8)] pr-[var(--space-3)] py-[var(--space-1-5)] bg-[var(--bg-panel)] border border-[var(--border-500)] rounded-[var(--radius-md)] text-body focus:outline-none focus:border-[var(--color-brand)] transition-colors w-64 text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
            />
          </div>
          <button className="p-[var(--space-1-5)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)] hover:bg-[var(--hover-600)] transition-colors" title="Saved Views">
            <LayoutTemplate className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-[var(--space-2)]">
          <button className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-1-5)] text-caption font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] glass-button">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          <button className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-1-5)] text-caption font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] glass-button">
            <Columns className="w-3.5 h-3.5" /> Columns
          </button>
          <button className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-1-5)] text-caption font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] glass-button">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Table Container (Scrollable) */}
      <div ref={tableContainerRef} className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse text-body" style={{ width: table.getTotalSize() }}>
          <thead className="sticky top-0 z-10 bg-[var(--bg-surface)] shadow-[0_1px_0_var(--border-500)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="h-[42px]">
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      className="px-[var(--space-4)] font-medium text-[var(--text-secondary)] border-b border-[var(--border-500)] whitespace-nowrap select-none bg-[var(--bg-surface)]/60 backdrop-blur-md relative group"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-[var(--space-2)] ${header.column.getCanSort() ? 'cursor-pointer hover:text-[var(--text-primary)]' : ''}`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <span className="text-[var(--color-brand)]">↑</span>,
                            desc: <span className="text-[var(--color-brand)]">↓</span>,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                      
                      {/* Resize Handle */}
                      <div
                        {...{
                          onMouseDown: header.getResizeHandler(),
                          onTouchStart: header.getResizeHandler(),
                          className: `absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-[var(--color-brand)]/50 ${header.column.getIsResizing() ? 'bg-[var(--color-brand)]' : ''}`,
                        }}
                      />
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-[var(--space-4)] py-[var(--space-8)] text-center text-[var(--text-tertiary)]">
                  Loading data...
                </td>
              </tr>
            ) : table.getRowModel().rows?.length ? (
              <>
                <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start || 0}px` }}></tr>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  return (
                    <tr
                      key={row.id}
                      className={`group h-[32px] transition-colors duration-[var(--motion-hover)] border-b border-[var(--border-500)] cursor-pointer ${row.getIsSelected() ? 'bg-[var(--color-brand)]/10 border-[var(--color-brand)]/30 shadow-[inset_2px_0_0_0_var(--color-brand)]' : 'hover:bg-[var(--hover-600)]'}`}
                      onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(row.original)}
                      onClick={() => {
                        row.toggleSelected();
                        if (onRowClick) onRowClick(row.original);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        row.toggleSelected(true);
                        if (onRowClick) onRowClick(row.original);
                        import('@/store/useContextMenuStore').then(mod => {
                          mod.useContextMenuStore.getState().openContextMenu(e as any, row.original);
                        });
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-[var(--space-4)] text-[var(--text-secondary)] whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr style={{ height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end || 0)}px` }}></tr>
              </>
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-[var(--space-4)] py-[var(--space-8)] text-center text-[var(--text-tertiary)]">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Table Footer / Pagination Placeholder */}
      <div className="flex items-center justify-between p-[var(--space-2)] border-t border-[var(--border-500)] bg-[var(--bg-surface)] text-micro text-[var(--text-tertiary)]">
        <div>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div>
          Scroll down for more results...
        </div>
      </div>
    </div>
  );
}
