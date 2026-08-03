import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  emptyText = "No results found.",
  className,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    } else {
      setSearch('');
    }
  }, [open]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white h-[var(--size-input)] px-3.5 text-sm font-medium text-zinc-900 shadow-2xs hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all",
            className
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-zinc-400")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0 ml-2" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-[100] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-zinc-200 bg-white shadow-md animate-in fade-in-0 zoom-in-95"
        >
          <div className="flex items-center border-b border-zinc-200 px-2.5 bg-zinc-50">
            <Search className="mr-2 h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              className="flex h-8 w-full bg-transparent py-1 text-caption text-zinc-900 outline-none placeholder:text-zinc-400"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="ml-1 text-zinc-400 hover:text-zinc-700">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <p className="p-3 text-center text-caption text-zinc-500">{emptyText}</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded px-2.5 py-1.5 text-caption transition-colors",
                    value === option.value 
                      ? "bg-zinc-900 text-white font-semibold" 
                      : "text-zinc-800 hover:bg-zinc-100"
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value && (
                    <span className="ml-auto pl-2 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
