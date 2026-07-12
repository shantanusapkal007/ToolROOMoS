import React from 'react';
import Link from 'next/link';
import { SearchCheck, CheckCircle2, FlaskConical } from 'lucide-react';

export default function QualityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header / Top Navigation */}
      <header className="h-14 flex-none border-b border-white/[0.05] bg-black/40 flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/quality" className="flex items-center gap-2 group">
            <SearchCheck className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
            <h1 className="text-sm font-bold text-white tracking-wide uppercase">Quality Assurance</h1>
          </Link>
          <div className="h-4 w-px bg-white/[0.1]"></div>
          <nav className="flex items-center gap-4">
            <Link href="/quality" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5 text-amber-500" /> Pending Inspections</Link>
            <Link href="/quality/completed" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Cleared</Link>
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
