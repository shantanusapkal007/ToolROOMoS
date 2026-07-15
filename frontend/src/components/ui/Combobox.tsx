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
            "flex w-full items-center justify-between rounded-lg border border-black/10 bg-black/5 px-3 py-2.5 text-sm text-zinc-900 shadow-sm hover:bg-black/5 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-zinc-500")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-[100] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg border border-black/10 bg-zinc-50 shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95"
        >
          <div className="flex items-center border-b border-black/10 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-zinc-900" />
            <input
              ref={inputRef}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="ml-2">
                <X className="h-4 w-4 opacity-50 hover:opacity-100 text-zinc-900" />
              </button>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <p className="p-4 text-center text-sm text-zinc-500">{emptyText}</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-3 pr-9 text-sm text-white outline-none hover:bg-blue-600 hover:text-white transition-colors",
                    value === option.value ? "bg-black/10" : ""
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value && (
                    <span className="absolute right-3 flex items-center justify-center">
                      <Check className="h-4 w-4" />
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
