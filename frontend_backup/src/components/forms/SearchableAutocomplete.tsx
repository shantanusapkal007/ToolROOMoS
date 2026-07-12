'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

interface SearchableAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string; [key: string]: any }[];
  placeholder?: string;
  isActive?: boolean;
  onSelect?: (option: any) => void;
}

export function SearchableAutocomplete({
  value,
  onChange,
  options,
  placeholder,
  isActive,
  onSelect,
}: SearchableAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // If there's an exact match or we just want to save the free text
      if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0]);
      } else {
        onChange(searchTerm);
        setIsOpen(false);
      }
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.stopPropagation(); // Prevent table navigation while in dropdown
    }
  };

  const handleSelect = (opt: any) => {
    setSearchTerm(opt.label);
    onChange(opt.label);
    if (onSelect) onSelect(opt);
    setIsOpen(false);
  };

  if (!isActive) {
    return (
      <div 
        className={`w-full h-full min-h-[30px] px-2 py-1.5 rounded-md border text-[13px] transition-colors flex items-center cursor-text 
          bg-black/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] truncate
          ${value ? 'border-white/5 text-zinc-300' : 'border-white/10 border-dashed text-zinc-600 hover:text-zinc-400'}
          hover:border-emerald-500/40 hover:bg-black/60
        `} 
        title={value}
      >
        {value || placeholder || 'Click to edit'}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" ref={wrapperRef}>
      <div className="flex items-center w-full h-full">
        <input
          ref={inputRef}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-full bg-black/60 border border-emerald-500/50 rounded-md px-2 py-1 text-[13px] text-white focus:outline-none focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] shadow-inner"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 max-h-48 overflow-y-auto z-50 bg-[#1A1A1E] border border-white/10 rounded-md shadow-2xl py-1 custom-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelect(opt)}
                className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
              >
                {opt.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-1.5 text-sm text-zinc-500 italic">
              Press Enter to use "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
