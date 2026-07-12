'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommandStore } from '@/store/useCommandStore';
import { Search, FileText, User, Box, Settings, Cpu, Briefcase, Package, Factory, ShoppingCart, ArrowRight, Keyboard, HelpCircle } from 'lucide-react';
import axios from 'axios';

interface SearchResult {
  id: string;
  type: string;
  label: string;
  path: string;
  icon: string;
  exactMatch?: boolean; // We'll infer this on the frontend
}

const STATIC_COMMANDS: SearchResult[] = [
  { id: 'cmd-1', type: 'Command', label: 'Open Settings', path: '/settings', icon: 'Settings' },
  { id: 'cmd-2', type: 'Command', label: 'Keyboard Shortcuts', path: '/help/shortcuts', icon: 'Keyboard' },
  { id: 'cmd-3', type: 'Command', label: 'Contact Support', path: '/support', icon: 'HelpCircle' },
];

export function CommandPalette() {
  const { isOpen, setOpen, toggle } = useCommandStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, setOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:4000/api/v1/search?q=${encodeURIComponent(query)}`);
        
        // Infer exact matches
        const backendResults: SearchResult[] = response.data.map((r: any) => ({
          ...r,
          exactMatch: r.label.toLowerCase().includes(query.toLowerCase()),
        }));

        // Filter static commands
        const staticMatches = STATIC_COMMANDS.filter(cmd => 
          cmd.label.toLowerCase().includes(query.toLowerCase())
        );

        // Sort: Exact Document Number matches first
        const sorted = [...backendResults, ...staticMatches].sort((a, b) => {
          if (a.exactMatch && !b.exactMatch) return -1;
          if (!a.exactMatch && b.exactMatch) return 1;
          return 0;
        });

        setResults(sorted);
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const getIcon = (iconStr: string) => {
    switch (iconStr) {
      case 'Briefcase': return <Briefcase size={16} className="text-blue-400" />;
      case 'Package': return <Package size={16} className="text-emerald-400" />;
      case 'Users': return <User size={16} className="text-zinc-400" />;
      case 'Factory': return <Factory size={16} className="text-orange-400" />;
      case 'Box': return <Box size={16} className="text-amber-400" />;
      case 'FileText': return <FileText size={16} className="text-zinc-400" />;
      case 'ShoppingCart': return <ShoppingCart size={16} className="text-green-400" />;
      case 'ArrowRight': return <ArrowRight size={16} className="text-red-400" />;
      case 'Settings': return <Settings size={16} className="text-purple-400" />;
      case 'Keyboard': return <Keyboard size={16} className="text-zinc-300" />;
      case 'HelpCircle': return <HelpCircle size={16} className="text-blue-300" />;
      default: return <FileText size={16} className="text-zinc-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-[#121214] border border-white/10 rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
          >
            <div className="flex items-center px-4 py-3 border-b border-white/5 relative">
              <Search className="text-zinc-400 w-5 h-5 mr-3 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents, customers, materials (Cmd+K)"
                className="flex-1 bg-transparent border-none text-zinc-100 text-lg placeholder:text-zinc-600 focus:outline-none"
              />
              {isLoading && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
              )}
              <div className="absolute right-4 text-[10px] font-medium text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                ESC
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2">
              {!query ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  <p className="mb-4">Type to search across the entire Toolroom OS.</p>
                  <div className="flex justify-center gap-4 text-xs">
                    <span className="bg-white/5 px-2 py-1 rounded">PO-2026-001</span>
                    <span className="bg-white/5 px-2 py-1 rounded">Tata Motors</span>
                    <span className="bg-white/5 px-2 py-1 rounded">CNC Machine A</span>
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {results.map((res) => (
                    <button
                      key={res.id}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-black/40 border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-black/60">
                          {getIcon(res.icon)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-200">
                            {res.exactMatch && <span className="text-blue-400 mr-1">•</span>}
                            {res.label}
                          </span>
                          <span className="text-xs text-zinc-500">{res.type}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  {!isLoading && "No results found."}
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-white/5 bg-black/20 text-[10px] text-zinc-500 flex items-center justify-between">
              <span>Exact document numbers are prioritized.</span>
              <div className="flex gap-4">
                <span><kbd className="font-sans px-1 rounded bg-white/10">↑↓</kbd> to navigate</span>
                <span><kbd className="font-sans px-1 rounded bg-white/10">↵</kbd> to select</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
