"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Briefcase, Database, Package, Settings, Users, Factory, FileText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const router = useRouter();

  // Debounce the query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const { data: searchResults, isLoading } = useGlobalSearch(debouncedQuery);

  // Handle Hotkey (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (path: string) => {
    router.push(path);
    setIsOpen(false);
    setQuery('');
  };

  const menuGroups = [
    {
      title: 'Projects',
      items: [
        { icon: <Briefcase className="w-4 h-4 text-blue-400" />, label: 'Go to Projects Dashboard', path: '/projects' },
        { icon: <PlusCircle className="w-4 h-4 text-blue-400" />, label: 'Create New Project', path: '/projects' },
      ]
    },
    {
      title: 'Master Data',
      items: [
        { icon: <Users className="w-4 h-4 text-emerald-400" />, label: 'Manage Customers', path: '/master-data/customers' },
        { icon: <Factory className="w-4 h-4 text-emerald-400" />, label: 'Manage Vendors', path: '/master-data/vendors' },
        { icon: <Package className="w-4 h-4 text-emerald-400" />, label: 'Manage Materials', path: '/master-data/materials' },
      ]
    },
    {
      title: 'System',
      items: [
        { icon: <Settings className="w-4 h-4 text-purple-400" />, label: 'Settings', path: '/settings' },
        { icon: <FileText className="w-4 h-4 text-purple-400" />, label: 'Form Builder', path: '/settings' },
      ]
    }
  ];

  // Flat list for filtering static menu items
  const allItems = menuGroups.flatMap(group => group.items);
  const filteredStaticItems = query 
    ? allItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  const getDynamicIcon = (iconStr: string) => {
    switch (iconStr) {
      case 'Briefcase': return <Briefcase className="w-4 h-4 text-blue-400" />;
      case 'Package': return <Package className="w-4 h-4 text-emerald-400" />;
      case 'Users': return <Users className="w-4 h-4 text-orange-400" />;
      case 'Factory': return <Factory className="w-4 h-4 text-purple-400" />;
      default: return <Database className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Palette */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-start justify-center pt-[10vh] pointer-events-none"
          >
            <div className="w-full max-w-2xl bg-[#0B1018]/90 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8),_inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden pointer-events-auto flex flex-col">
              
              {/* Search Header */}
              <div className="relative flex items-center px-4 border-b border-white/10 shrink-0">
                <Search className="w-5 h-5 text-slate-400 ml-2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="What do you need?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-white text-lg placeholder-slate-500 py-5 px-4 focus:outline-none focus:ring-0"
                />
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md text-slate-500 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results Area */}
              <div className="max-h-[60vh] overflow-y-auto p-2 hide-scrollbar">
                {query ? (
                  <div className="py-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Search Results</div>
                    {isLoading && debouncedQuery.length >= 2 ? (
                      <div className="text-center py-8 text-slate-500 animate-pulse">Searching global database...</div>
                    ) : (
                      <div className="space-y-4">
                        {/* Dynamic API Results */}
                        {searchResults && searchResults.length > 0 && (
                          <div className="space-y-1">
                            {searchResults.map((item, idx) => (
                              <CommandItem key={`dyn-${idx}`} item={{ ...item, icon: getDynamicIcon(item.icon) }} onSelect={() => handleSelect(item.path)} />
                            ))}
                          </div>
                        )}
                        
                        {/* Static Menu Results */}
                        {filteredStaticItems.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4 mb-2 mt-4">System Menu</div>
                            <div className="space-y-1">
                              {filteredStaticItems.map((item, idx) => (
                                <CommandItem key={`stat-${idx}`} item={item} onSelect={() => handleSelect(item.path)} />
                              ))}
                            </div>
                          </div>
                        )}

                        {(!searchResults || searchResults.length === 0) && filteredStaticItems.length === 0 && (
                          <div className="text-center py-12 text-slate-500">
                            No results found for "{query}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-2 space-y-6">
                    {menuGroups.map((group, gIdx) => (
                      <div key={gIdx}>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">{group.title}</div>
                        <div className="space-y-1">
                          {group.items.map((item, idx) => (
                            <CommandItem key={idx} item={item} onSelect={() => handleSelect(item.path)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="border-t border-white/10 p-3 bg-black/20 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-4 text-[10px] font-medium text-slate-500">
                  <span className="flex items-center"><kbd className="bg-white/10 px-1.5 py-0.5 rounded mr-1">↑↓</kbd> to navigate</span>
                  <span className="flex items-center"><kbd className="bg-white/10 px-1.5 py-0.5 rounded mr-1">↵</kbd> to select</span>
                  <span className="flex items-center"><kbd className="bg-white/10 px-1.5 py-0.5 rounded mr-1">esc</kbd> to close</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  ToolRoom OS
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PlusCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="16"></line>
      <line x1="8" y1="12" x2="16" y2="12"></line>
    </svg>
  )
}

function CommandItem({ item, onSelect }: { item: any, onSelect: () => void }) {
  return (
    <div 
      onClick={onSelect}
      className="flex items-center px-4 py-3 mx-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/[0.08] hover:scale-[0.99] group"
    >
      <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 group-hover:border-white/10 transition-colors shadow-inner">
        {item.icon}
      </div>
      <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
        <kbd className="bg-white/10 text-slate-400 text-[10px] px-2 py-1 rounded">↵</kbd>
      </div>
    </div>
  );
}
