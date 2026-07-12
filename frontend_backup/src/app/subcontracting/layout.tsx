import React from 'react';
import Link from 'next/link';
import { Send, FileCheck, ArrowRightLeft } from 'lucide-react';

export default function SubcontractingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header / Top Navigation */}
      <header className="h-14 flex-none border-b border-white/[0.05] bg-black/40 flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/subcontracting" className="flex items-center gap-2 group">
            <ArrowRightLeft className="w-5 h-5 text-fuchsia-500 group-hover:scale-110 transition-transform" />
            <h1 className="text-sm font-bold text-white tracking-wide uppercase">Subcontracting</h1>
          </Link>
          <div className="h-4 w-px bg-white/[0.1]"></div>
          <nav className="flex items-center gap-4">
            <Link href="/subcontracting" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors">Active Orders</Link>
            <Link href="/subcontracting/receipts" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors">Receipts (GRN)</Link>
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
