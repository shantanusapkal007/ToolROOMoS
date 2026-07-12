'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Copy, Plus, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface EditableDataGridProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  onDataChange: (newData: TData[]) => void;
  getNewRow: (prevRow?: TData) => TData;
  enableDnd?: boolean;
  formulas?: Record<string, (row: TData) => any>;
  summary?: { accessorKey: string; label?: string; type: 'sum' | 'avg' | 'count'; format?: (val: number) => string }[];
  onRowFocus?: (row: TData) => void;
  readOnly?: boolean;
}

function SortableRow({ virtualRow, row, children, activeCell, setActiveCell, rowStatus, openContextMenu, onRowFocus, readOnly }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.original.id || row.id });

  const style = {
    display: 'flex',
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    transformOrigin: '0 0',
    translate: `0 ${virtualRow.start + 42}px`, // Offset by header height
    height: `${virtualRow.size}px`,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const statusColor = rowStatus === 'NEW' ? 'bg-[var(--color-success)]' : rowStatus === 'MODIFIED' ? 'bg-[var(--color-brand)]' : 'bg-transparent';

  return (
    <tr
      ref={setNodeRef}
      style={style}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu(e, virtualRow.index, row.original);
      }}
      className={`group h-[36px] transition-all duration-[var(--motion-hover)] border-b border-[var(--border-500)] hover:bg-[var(--hover-600)] hover:-translate-y-[1px] ${isDragging ? 'shadow-[var(--shadow-elevation)] bg-[var(--hover-600)]' : ''}`}
    >
      {/* Row Status Indicator */}
      <td className="w-1 shrink-0 p-0 m-0 border-none bg-transparent">
        <div className={`w-1 h-full ${statusColor}`} />
      </td>

      {/* Row Actions */}
      <td className="w-10 shrink-0 px-2 py-1 flex items-center justify-center gap-[var(--space-1)] opacity-0 group-hover:opacity-100 transition-opacity">
        {!readOnly && (
          <div {...attributes} {...listeners} className="cursor-grab text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <GripVertical size={14} />
          </div>
        )}
      </td>
      
      {row.getVisibleCells().map((cell: any) => (
        <td 
          key={cell.id} 
          className={`px-[var(--space-3)] py-[var(--space-1)] relative border-r border-transparent hover:border-[var(--color-brand)]/50 transition-colors`}
          style={{ width: cell.column.getSize() }}
          onClick={() => {
            setActiveCell({ rowId: row.id, columnId: cell.column.id });
            if (onRowFocus) onRowFocus(row.original);
          }}
        >
          {flexRender(cell.column.columnDef.cell, {
            ...cell.getContext(),
            isActive: activeCell?.rowId === row.id && activeCell?.columnId === cell.column.id
          } as any)}
        </td>
      ))}
    </tr>
  );
}

export function EditableDataGrid<TData>({
  columns,
  data,
  onDataChange,
  getNewRow,
  enableDnd = false,
  formulas = {},
  summary = [],
  onRowFocus,
  readOnly = false,
}: EditableDataGridProps<TData>) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  const [activeCell, setActiveCell] = useState<{ rowId: string, columnId: string } | null>(null);
  const [rowStatuses, setRowStatuses] = useState<Record<string, string>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>(columns.map(c => c.id as string || (c as any).accessorKey as string));
  const [columnPinning, setColumnPinning] = useState({});
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, rowIndex: number, row: any } | null>(null);

  const applyFormulas = (row: any) => {
    let computedRow = { ...row };
    for (const [key, formula] of Object.entries(formulas)) {
      computedRow[key] = formula(computedRow);
    }
    return computedRow;
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      columnOrder,
      columnPinning,
    },
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    enableColumnPinning: true,
    columnResizeMode: 'onChange',
    meta: {
      updateData: (rowIndex: number, columnId: string, value: unknown) => {
        const newData = [...data];
        let updatedRow = { ...newData[rowIndex], [columnId]: value };
        updatedRow = applyFormulas(updatedRow);
        
        newData[rowIndex] = updatedRow;
        onDataChange(newData);
        
        // Mark as modified
        setRowStatuses(prev => ({ ...prev, [(updatedRow as any).id]: 'MODIFIED' }));
      },
    },
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('Text');
    if (!clipboardData) return;

    const parsedRows = clipboardData.split('\n').filter(r => r.trim() !== '');
    const newData = [...data];
    const newStatuses = { ...rowStatuses };
    
    parsedRows.forEach((rowStr) => {
      const cells = rowStr.split('\t');
      const prevRow = newData.length > 0 ? newData[newData.length - 1] : undefined;
      let newObj = getNewRow(prevRow);
      
      columns.forEach((col: any, index) => {
        if (cells[index] !== undefined && col.accessorKey) {
           // @ts-ignore
           newObj[col.accessorKey] = cells[index].trim();
        }
      });
      newObj = applyFormulas(newObj);
      newData.push(newObj);
      newStatuses[(newObj as any).id] = 'NEW';
    });

    onDataChange(newData);
    setRowStatuses(newStatuses);
  }, [data, columns, getNewRow, onDataChange, rowStatuses]);

  const addRow = (index?: number, templateRow?: any) => {
    const prevRow = templateRow || (data.length > 0 ? data[data.length - 1] : undefined);
    let newRow = getNewRow(prevRow);
    newRow = applyFormulas(newRow);
    
    const newData = [...data];
    const insertIdx = index !== undefined ? index : newData.length;
    newData.splice(insertIdx, 0, newRow);
    
    onDataChange(newData);
    setRowStatuses(prev => ({ ...prev, [(newRow as any).id]: 'NEW' }));
  };

  const duplicateRow = (index: number) => {
    const original = data[index];
    let newRow = { ...original, id: crypto.randomUUID() };
    const newData = [...data];
    newData.splice(index + 1, 0, newRow);
    onDataChange(newData);
    setRowStatuses(prev => ({ ...prev, [(newRow as any).id]: 'NEW' }));
  };

  const removeRow = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    onDataChange(newData);
    setContextMenu(null);
  };

  // Drag and Drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = data.findIndex((item: any) => item.id === active.id);
      const newIndex = data.findIndex((item: any) => item.id === over.id);
      
      const newData = [...data];
      const [movedItem] = newData.splice(oldIndex, 1);
      newData.splice(newIndex, 0, movedItem);
      
      onDataChange(newData);
    }
  };

  // Keyboard navigation & Undo/Redo history
  const [history, setHistory] = useState<TData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Push history on data change (only when user modifies, not on load)
  useEffect(() => {
    if (data.length > 0 && (history.length === 0 || history[historyIndex] !== data)) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(data);
      if (newHistory.length > 50) newHistory.shift(); // keep last 50 states
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [data]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global Undo/Redo for Grid
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          // Redo
          if (historyIndex < history.length - 1) {
            e.preventDefault();
            const nextIdx = historyIndex + 1;
            setHistoryIndex(nextIdx);
            onDataChange(history[nextIdx]);
          }
        } else {
          // Undo
          if (historyIndex > 0) {
            e.preventDefault();
            const prevIdx = historyIndex - 1;
            setHistoryIndex(prevIdx);
            onDataChange(history[prevIdx]);
          }
        }
        return;
      }

      if (!activeCell) return;
      
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      const rowIndex = rows.findIndex(r => r.id === activeCell.rowId);
      const colIndex = columns.findIndex((c: any) => c.accessorKey === activeCell.columnId || c.id === activeCell.columnId);

      if (e.key === 'Enter') {
        e.preventDefault();
        if (rowIndex < rows.length - 1) {
          setActiveCell({ rowId: rows[rowIndex + 1].id, columnId: activeCell.columnId });
        } else {
          addRow();
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab: Move Left
          if (colIndex > 0) {
            setActiveCell({ rowId: activeCell.rowId, columnId: columns[colIndex - 1].id || (columns[colIndex - 1] as any).accessorKey });
          } else if (rowIndex > 0) {
            const prevColId = columns[columns.length - 1].id || (columns[columns.length - 1] as any).accessorKey;
            setActiveCell({ rowId: rows[rowIndex - 1].id, columnId: prevColId });
          }
        } else {
          // Tab: Move Right
          if (colIndex < columns.length - 1) {
            setActiveCell({ rowId: activeCell.rowId, columnId: columns[colIndex + 1].id || (columns[colIndex + 1] as any).accessorKey });
          } else if (rowIndex < rows.length - 1) {
            const nextColId = columns[0].id || (columns[0] as any).accessorKey;
            setActiveCell({ rowId: rows[rowIndex + 1].id, columnId: nextColId });
          } else {
            addRow();
          }
        }
      } else if (e.key === 'ArrowUp') {
        if (!isInput) {
          e.preventDefault();
          if (rowIndex > 0) setActiveCell({ rowId: rows[rowIndex - 1].id, columnId: activeCell.columnId });
        }
      } else if (e.key === 'ArrowDown') {
        if (!isInput) {
          e.preventDefault();
          if (rowIndex < rows.length - 1) setActiveCell({ rowId: rows[rowIndex + 1].id, columnId: activeCell.columnId });
        }
      } else if (e.key === 'ArrowLeft') {
        if (!isInput) {
          e.preventDefault();
          if (colIndex > 0) setActiveCell({ rowId: activeCell.rowId, columnId: columns[colIndex - 1].id || (columns[colIndex - 1] as any).accessorKey });
        }
      } else if (e.key === 'ArrowRight') {
        if (!isInput) {
          e.preventDefault();
          if (colIndex < columns.length - 1) setActiveCell({ rowId: activeCell.rowId, columnId: columns[colIndex + 1].id || (columns[colIndex + 1] as any).accessorKey });
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isInput && !readOnly) {
          e.preventDefault();
          // Clear current cell value
          const newData = [...data];
          (newData[rowIndex] as any)[activeCell.columnId] = '';
          onDataChange(newData);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeCell, rows, columns, data, history, historyIndex, onDataChange, readOnly]);

  // Click outside context menu
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-canvas)] border border-[var(--border-500)] rounded-[var(--radius-xl)] overflow-hidden glass-panel relative">
      
      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[100] bg-[var(--bg-panel)] border border-[var(--border-500)] rounded-[var(--radius-md)] shadow-[var(--shadow-elevation)] py-[var(--space-1)] min-w-[160px] text-body"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { addRow(contextMenu.rowIndex); setContextMenu(null); }} className="w-full text-left px-[var(--space-4)] py-[var(--space-1-5)] hover:bg-[var(--hover-600)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Insert Above</button>
          <button onClick={() => { addRow(contextMenu.rowIndex + 1); setContextMenu(null); }} className="w-full text-left px-[var(--space-4)] py-[var(--space-1-5)] hover:bg-[var(--hover-600)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Insert Below</button>
          
          <div className="h-px bg-[var(--border-500)] my-[var(--space-1)]" />
          <button onClick={() => {
            const parentRow = data[contextMenu.rowIndex] as any;
            if (!parentRow.isAssembly) {
              const newData = [...data];
              newData[contextMenu.rowIndex] = { ...parentRow, isAssembly: true };
              onDataChange(newData);
            }
            const childRow = { ...getNewRow(), parentId: parentRow.id, indentLevel: (parentRow.indentLevel || 0) + 1 };
            const newData2 = [...data];
            newData2.splice(contextMenu.rowIndex + 1, 0, childRow as any);
            onDataChange(newData2);
            setContextMenu(null);
          }} className="w-full text-left px-[var(--space-4)] py-[var(--space-1-5)] hover:bg-[var(--hover-600)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Add Child Part</button>
          
          <button onClick={() => {
            const original = data[contextMenu.rowIndex] as any;
            const newData = [...data];
            newData[contextMenu.rowIndex] = { ...original, isAssembly: !original.isAssembly };
            onDataChange(newData);
            setContextMenu(null);
          }} className="w-full text-left px-[var(--space-4)] py-[var(--space-1-5)] hover:bg-[var(--hover-600)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Toggle Sub-Assembly</button>
          
          <div className="h-px bg-[var(--border-500)] my-[var(--space-1)]" />
          <button onClick={() => { duplicateRow(contextMenu.rowIndex); setContextMenu(null); }} className="w-full text-left px-[var(--space-4)] py-[var(--space-1-5)] hover:bg-[var(--hover-600)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Duplicate</button>
          <button onClick={() => removeRow(contextMenu.rowIndex)} className="w-full text-left px-[var(--space-4)] py-[var(--space-1-5)] hover:bg-[var(--color-error)]/20 text-[var(--color-error)] hover:text-[var(--color-error)]">Delete Row</button>
        </div>
      )}

      {/* Grid Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-[var(--space-2)] p-[var(--space-2)] border-b border-[var(--border-500)] bg-[var(--bg-surface)]">
          <button onClick={() => addRow()} className="flex items-center gap-[var(--space-1-5)] px-[var(--space-3)] py-[var(--space-1-5)] text-caption font-medium text-[var(--text-white)] bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] rounded-[var(--radius-md)] shadow-[var(--shadow-elevation)] transition-all">
            <Plus size={14} /> Add Row
          </button>
          <button onClick={() => navigator.clipboard.readText().then(text => handlePaste({ clipboardData: { getData: () => text }, preventDefault: () => {} } as any))} className="flex items-center gap-[var(--space-1-5)] px-[var(--space-3)] py-[var(--space-1-5)] text-caption font-medium text-[var(--text-secondary)] glass-button hover:text-[var(--text-primary)] rounded-[var(--radius-md)]">
            <Copy size={14} /> Paste Excel
          </button>
          <span className="text-caption text-[var(--text-tertiary)] ml-auto mr-[var(--space-2)]">Right-click a row for menu • Tab to move • Enter to save</span>
        </div>
      )}

      <div 
        ref={tableContainerRef} 
        className="flex-1 overflow-auto custom-scrollbar relative"
        onPaste={handlePaste}
        tabIndex={0}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div style={{ height: `${rowVirtualizer.getTotalSize() + 42}px`, width: '100%', position: 'relative' }}>
            <table className="w-full text-left border-collapse text-body absolute top-0 left-0 pb-[var(--space-5)]" style={{ width: table.getTotalSize() }}>
              <thead className="sticky top-0 z-20 bg-[var(--bg-surface)] shadow-[0_1px_0_var(--border-500)]">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="h-[42px] flex">
                    <th className="w-1 shrink-0 bg-[var(--bg-surface)]/60 backdrop-blur-md border-b border-[var(--border-500)]"></th>
                    <th className="w-10 shrink-0 px-[var(--space-2)] bg-[var(--bg-surface)]/60 backdrop-blur-md border-b border-[var(--border-500)]"></th>
                    {headerGroup.headers.map(header => (
                      <th 
                        key={header.id} 
                        className="px-[var(--space-3)] font-medium text-[var(--text-secondary)] border-b border-[var(--border-500)] whitespace-nowrap bg-[var(--bg-surface)]/60 backdrop-blur-md relative group flex items-center text-left"
                        style={{ width: header.getSize() }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        
                        {/* Resize Handle */}
                        <div
                          {...{
                            onMouseDown: header.getResizeHandler(),
                            onTouchStart: header.getResizeHandler(),
                            className: `absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-[var(--color-brand)]/50 ${header.column.getIsResizing() ? 'bg-[var(--color-brand)]' : ''}`,
                          }}
                        />
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              
              <SortableContext items={data.map((d: any) => d.id)} strategy={verticalListSortingStrategy}>
                <tbody className="stagger-rows">
                  {rowVirtualizer.getVirtualItems().map(virtualRow => {
                    const row = rows[virtualRow.index];
                    return (
                      <SortableRow
                        key={row.id}
                        virtualRow={virtualRow}
                        row={row}
                        activeCell={activeCell}
                        setActiveCell={setActiveCell}
                        rowStatus={rowStatuses[(row.original as any).id]}
                        openContextMenu={(e: any, index: number, rowOrig: any) => {
                          if (!readOnly) {
                            setContextMenu({ x: e.clientX, y: e.clientY, rowIndex: index, row: rowOrig });
                          }
                        }}
                        onRowFocus={onRowFocus}
                        readOnly={readOnly}
                      />
                    );
                  })}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </DndContext>
      </div>
      
      {/* Frozen Summary Footer */}
      {summary.length > 0 && (
        <div className="bg-[var(--bg-panel)] border-t border-[var(--border-500)] p-[var(--space-2)] text-body flex gap-[var(--space-6)] shrink-0 relative z-30">
          {summary.map((sumItem, idx) => {
            let val = 0;
            if (sumItem.type === 'sum') {
              val = data.reduce((acc, row) => acc + (Number((row as any)[sumItem.accessorKey]) || 0), 0);
            }
            if (sumItem.type === 'count') {
              val = data.length;
            }
            const displayVal = sumItem.format ? sumItem.format(val) : val.toString();
            return (
              <div key={idx} className="flex gap-[var(--space-2)]">
                <span className="text-[var(--text-tertiary)]">{sumItem.label || sumItem.accessorKey}:</span>
                <span className="text-[var(--text-primary)] font-medium">{displayVal}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
