import React from 'react';
import Link from 'next/link';
import { Calculator, TrendingUp, BarChart3 } from 'lucide-react';

export default function CostEngineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header / Top Navigation */}
      <header className="h-14 flex-none border-b border-white/[0.05] bg-black/40 flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/cost-engine" className="flex items-center gap-2 group">
            <Calculator className="w-5 h-5 text-violet-500 group-hover:scale-110 transition-transform" />
            <h1 className="text-sm font-bold text-white tracking-wide uppercase">Cost Engine</h1>
          </Link>
          <div className="h-4 w-px bg-white/[0.1]"></div>
          <nav className="flex items-center gap-4">
            <Link href="/cost-engine" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-zinc-500" /> Project Cost Summary</Link>
            <Link href="/cost-engine/variance" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-amber-500" /> Variance Analysis</Link>
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
