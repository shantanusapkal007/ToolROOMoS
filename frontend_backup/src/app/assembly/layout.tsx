import React from 'react';
import Link from 'next/link';
import { Layers, Combine } from 'lucide-react';

export default function AssemblyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header / Top Navigation */}
      <header className="h-14 flex-none border-b border-white/[0.05] bg-black/40 flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/assembly" className="flex items-center gap-2 group">
            <Combine className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
            <h1 className="text-sm font-bold text-white tracking-wide uppercase">Assembly Line</h1>
          </Link>
          <div className="h-4 w-px bg-white/[0.1]"></div>
          <nav className="flex items-center gap-4">
            <Link href="/assembly" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-zinc-500" /> Pending Builds</Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[#0a0a0a]">
        {children}
      </main>
    </div>
  );
}
