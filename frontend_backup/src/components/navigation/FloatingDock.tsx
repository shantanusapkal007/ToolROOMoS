'use client';

import React from 'react';
import { useCommandStore } from '@/store/useCommandStore';
import { Home, Search } from 'lucide-react';

export function FloatingDock() {
  const toggleSearch = useCommandStore((state) => state.toggle);

  return (
    <nav className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 p-2 glass-sidebar z-50">
      <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-zinc-300 hover:text-white group relative">
        <Home size={18} />
        <span className="absolute left-14 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Dashboard
        </span>
      </button>
      
      <button 
        onClick={toggleSearch}
        className="w-10 h-10 rounded-full bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 hover:text-blue-300 flex items-center justify-center transition-all group relative border border-blue-500/30"
      >
        <Search size={18} />
        <span className="absolute left-14 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 flex items-center gap-2">
          Global Search <kbd className="text-[10px] bg-white/20 px-1 rounded">⌘K</kbd>
        </span>
      </button>
    </nav>
  );
}
