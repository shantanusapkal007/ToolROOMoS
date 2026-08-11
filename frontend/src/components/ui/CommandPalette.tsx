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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const { data: searchResults, isLoading } = useGlobalSearch(debouncedQuery);

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
        { icon: <Briefcase className="w-4 h-4 text-ink" />, label: 'Go to Projects Dashboard', path: '/projects' },
        { icon: <PlusCircle className="w-4 h-4 text-ink" />, label: 'Create New Project', path: '/projects' },
      ]
    },
    {
      title: 'Master Data',
      items: [
        { icon: <Users className="w-4 h-4 text-ink" />, label: 'Manage Customers', path: '/master-data/customers' },
        { icon: <Factory className="w-4 h-4 text-ink" />, label: 'Manage Vendors', path: '/master-data/vendors' },
        { icon: <Package className="w-4 h-4 text-ink" />, label: 'Manage Materials', path: '/master-data/materials' },
      ]
    },
    {
      title: 'System',
      items: [
        { icon: <Settings className="w-4 h-4 text-ink" />, label: 'Settings', path: '/settings' },
        { icon: <FileText className="w-4 h-4 text-ink" />, label: 'Form Builder', path: '/settings' },
      ]
    }
  ];

  const allItems = menuGroups.flatMap(group => group.items);
  const filteredStaticItems = query 
    ? allItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  const getDynamicIcon = (iconStr: string) => {
    switch (iconStr) {
      case 'Briefcase': return <Briefcase className="w-4 h-4 text-ink" />;
      case 'Package': return <Package className="w-4 h-4 text-ink" />;
      case 'Users': return <Users className="w-4 h-4 text-ink" />;
      case 'Factory': return <Factory className="w-4 h-4 text-ink" />;
      default: return <Database className="w-4 h-4 text-mute" />;
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
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          />

          {/* Palette Dialog */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[101] flex items-start justify-center pt-[12vh] pointer-events-none px-4"
          >
            <div className="w-full max-w-2xl bg-canvas border border-border-gray rounded-[12px] shadow-level-4 overflow-hidden pointer-events-auto flex flex-col">
              
              {/* Search Header */}
              <div className="relative flex items-center px-4 border-b border-border-gray shrink-0">
                <Search className="w-4.5 h-4.5 text-mute ml-2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="What do you need?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-ink text-body-md placeholder:text-mute py-4 px-3 focus:outline-none"
                />
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-[10px] text-mute hover:text-ink hover:bg-hairline/20 transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results Area */}
              <div className="max-h-[50vh] overflow-y-auto p-2 hide-scrollbar">
                {query ? (
                  <div className="py-2">
                    <div className="text-eyebrow-uppercase-sm font-medium text-mute uppercase px-3 mb-2">Search Results</div>
                    {isLoading && debouncedQuery.length >= 2 ? (
                      <div className="text-center py-8 text-mute text-body-sm animate-pulse">Searching global database...</div>
                    ) : (
                      <div className="space-y-3">
                        {/* Dynamic API Results */}
                        {searchResults && searchResults.length > 0 && (
                          <div className="space-y-0.5">
                            {searchResults.map((item, idx) => (
                              <CommandItem key={`dyn-${idx}`} item={{ ...item, icon: getDynamicIcon(item.icon) }} onSelect={() => handleSelect(item.path)} />
                            ))}
                          </div>
                        )}
                        
                        {/* Static Menu Results */}
                        {filteredStaticItems.length > 0 && (
                          <div>
                            <div className="text-eyebrow-uppercase-sm font-medium text-mute uppercase px-3 mb-2 mt-3">System Menu</div>
                            <div className="space-y-0.5">
                              {filteredStaticItems.map((item, idx) => (
                                <CommandItem key={`stat-${idx}`} item={item} onSelect={() => handleSelect(item.path)} />
                              ))}
                            </div>
                          </div>
                        )}

                        {(!searchResults || searchResults.length === 0) && filteredStaticItems.length === 0 && (
                          <div className="text-center py-10 text-mute text-body-sm">
                            No results found for "{query}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-2 space-y-4">
                    {menuGroups.map((group, gIdx) => (
                      <div key={gIdx}>
                        <div className="text-eyebrow-uppercase-sm font-medium text-mute uppercase px-3 mb-1.5">{group.title}</div>
                        <div className="space-y-0.5">
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
              <div className="border-t border-border-gray px-4 py-2.5 bg-canvas flex items-center justify-between shrink-0 text-caption text-mute">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center"><kbd className="bg-canvas border border-border-gray px-1.5 py-0.5 rounded-xs mr-1 text-caption-mono">↑↓</kbd> navigate</span>
                  <span className="flex items-center"><kbd className="bg-canvas border border-border-gray px-1.5 py-0.5 rounded-xs mr-1 text-caption-mono">↵</kbd> select</span>
                  <span className="flex items-center"><kbd className="bg-canvas border border-border-gray px-1.5 py-0.5 rounded-xs mr-1 text-caption-mono">esc</kbd> close</span>
                </div>
                <div className="text-eyebrow-uppercase-sm font-medium uppercase text-mute">
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
  );
}

function CommandItem({ item, onSelect }: { item: any, onSelect: () => void }) {
  return (
    <div 
      onClick={onSelect}
      className="flex items-center px-3 py-2 rounded-xs cursor-pointer transition-colors hover:bg-hairline/20 group"
    >
      <div className="w-6 h-6 rounded-xs bg-canvas border border-border-gray flex items-center justify-center mr-3 text-ink">
        {item.icon}
      </div>
      <span className="text-body-sm text-ink">{item.label}</span>
      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
        <kbd className="border border-border-gray text-mute text-caption-mono px-1.5 py-0.5 rounded-xs">↵</kbd>
      </div>
    </div>
  );
}
