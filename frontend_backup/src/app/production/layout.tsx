import React from 'react';
import Link from 'next/link';
import { PlayCircle, Factory, Clock, Settings } from 'lucide-react';

export default function ProductionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-black selection:bg-indigo-500/30">
      {/* Top Navigation for Shop Floor */}
      <header className="h-16 flex-none border-b border-white/[0.05] bg-black/80 flex items-center justify-between px-8 backdrop-blur-xl sticky top-0 z-10 shadow-lg shadow-black/50">
        <div className="flex items-center gap-8">
          <Link href="/production" className="flex items-center gap-3 group">
            <Factory className="w-6 h-6 text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] group-hover:scale-110 transition-transform duration-300" />
            <h1 className="text-lg font-black text-white tracking-widest uppercase">Shop Floor</h1>
          </Link>
          <div className="h-6 w-px bg-white/[0.1]"></div>
          <nav className="flex items-center gap-6">
            <Link href="/production" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-emerald-400" /> Active Jobs
            </Link>
            <Link href="/production/machines" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
              <Settings className="w-4 h-4 text-zinc-500" /> Machines
            </Link>
            <Link href="/production/wip" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> WIP Ledger
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black">
        {children}
      </main>
    </div>
  );
}
