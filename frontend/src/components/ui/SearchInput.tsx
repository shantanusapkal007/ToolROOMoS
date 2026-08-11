"use client";

import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export type SearchContext = 'global' | 'local';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Search context:
   * - 'global': Shows ⌘K shortcut chip, triggers command palette on click / shortcut.
   * - 'local': Scoped table/panel search without shortcut chip.
   */
  context?: SearchContext;
  /**
   * Optional shortcut badge override (default: '⌘K')
   */
  shortcutKey?: string;
  /**
   * Callback when global search is triggered (if custom handler provided)
   */
  onGlobalTrigger?: () => void;
  /**
   * Callback when clear button is clicked (for local search)
   */
  onClear?: () => void;
  /**
   * Additional wrapper class name
   */
  containerClassName?: string;
}

/**
 * Unified SearchInput Component matching ToolRoomOS Design System:
 * - Shared 36px height (`h-9`), `rounded-[10px]` border-radius, left icon alignment, and focus rings.
 * - Context-driven behavior: 'global' (top-bar / header with ⌘K badge) or 'local' (filter panels).
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      context = 'local',
      shortcutKey = '⌘K',
      onGlobalTrigger,
      onClear,
      placeholder,
      value,
      onChange,
      className = '',
      containerClassName = '',
      disabled = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const resolvedRef = (ref || inputRef) as React.RefObject<HTMLInputElement>;

    const defaultPlaceholder =
      context === 'global'
        ? 'Search projects, machines, tools...'
        : 'Search logs, tools, drawing #, operator...';

    const handleGlobalTrigger = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
      if (onClick) {
        onClick(e as any);
      }
      if (context === 'global') {
        if (onGlobalTrigger) {
          onGlobalTrigger();
        } else {
          window.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
          );
        }
      }
    };

    // Listen for Cmd+K / Ctrl+K keyboard shortcut if global
    useEffect(() => {
      if (context !== 'global') return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          if (onGlobalTrigger) {
            onGlobalTrigger();
          } else {
            window.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
            );
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [context, onGlobalTrigger]);

    // If context is global and used as a clickable bar (like TopBar)
    if (context === 'global' && !onChange && !value) {
      return (
        <button
          type="button"
          onClick={handleGlobalTrigger}
          disabled={disabled}
          className={`h-9 px-3 rounded-[10px] bg-white hover:bg-[rgba(148,151,169,0.08)] border border-border-gray hover:border-cool-gray/50 text-caption text-silver-blue hover:text-ink flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${containerClassName} ${className}`}
          title="Search anything (Cmd+K)"
          aria-label="Global search command palette"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-silver-blue shrink-0" />
            <span className="truncate text-body-sm text-silver-blue">
              {placeholder || defaultPlaceholder}
            </span>
          </div>
          <kbd className="font-mono text-[10px] bg-white border border-border-gray px-1.5 py-0.5 rounded shadow-subtle text-cool-gray shrink-0 select-none">
            {shortcutKey}
          </kbd>
        </button>
      );
    }

    // Interactive Input mode (for both local search and live global search)
    return (
      <div
        className={`relative flex items-center h-9 group rounded-[10px] ${containerClassName}`}
      >
        {/* Left Search Icon */}
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-silver-blue group-focus-within:text-primary transition-colors pointer-events-none shrink-0" />

        {/* Search Input Field */}
        <input
          ref={resolvedRef}
          type="text"
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder || defaultPlaceholder}
          className={`w-full h-9 pl-9 pr-8 bg-white border border-border-gray hover:border-cool-gray/50 focus:border-primary rounded-[10px] text-body-sm text-ink placeholder:text-silver-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-150 shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed ${
            context === 'global' ? 'pr-12' : ''
          } ${className}`}
          {...props}
        />

        {/* Clear Button (Local) or Shortcut Chip (Global) */}
        {context === 'global' ? (
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] bg-white border border-border-gray px-1.5 py-0.5 rounded shadow-subtle text-cool-gray pointer-events-none select-none">
            {shortcutKey}
          </kbd>
        ) : (
          value &&
          String(value).length > 0 &&
          onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-silver-blue hover:text-ink p-0.5 rounded transition-colors"
              title="Clear search"
              aria-label="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
