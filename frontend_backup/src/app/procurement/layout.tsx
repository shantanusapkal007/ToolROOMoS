export default function ProcurementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-14 flex-none border-b border-white/[0.05] bg-black/40 flex items-center justify-between px-6">
        <h1 className="text-sm font-semibold text-white tracking-wide uppercase">Procurement OS</h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[#0a0a0a]">
        {children}
      </main>
    </div>
  );
}
