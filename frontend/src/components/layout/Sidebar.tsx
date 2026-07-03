"use client";

import { Activity, Briefcase, Database, Layers, PieChart, Settings } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: "dashboard" | "projects" | "master-data" | "reports") => void;
  setSelectedProject: (proj: any) => void;
}

export function Sidebar({ activeTab, setActiveTab, setSelectedProject }: SidebarProps) {
  const handleNav = (tab: any) => {
    setActiveTab(tab);
    setSelectedProject(null);
  };

  return (
    <div className="fixed left-6 top-6 bottom-6 w-[72px] hover:w-64 glass-panel flex flex-col items-center hover:items-start group transition-all duration-300 z-50 overflow-hidden px-3 py-6">
      {/* Logo Area */}
      <div className="flex items-center w-full mb-10 overflow-hidden cursor-pointer">
        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <Layers className="h-5 w-5" />
        </div>
        <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          ToolRoomOS
        </span>
      </div>

      {/* Nav Links */}
      <div className="flex flex-col space-y-4 w-full">
        <NavItem 
          icon={<Activity className="h-5 w-5" />} 
          label="Mission Control" 
          active={activeTab === "dashboard"} 
          onClick={() => handleNav("dashboard")} 
        />
        <NavItem 
          icon={<Briefcase className="h-5 w-5" />} 
          label="Projects" 
          active={activeTab === "projects"} 
          onClick={() => handleNav("projects")} 
        />
        <NavItem 
          icon={<Database className="h-5 w-5" />} 
          label="Master Data" 
          active={activeTab === "master-data"} 
          onClick={() => handleNav("master-data")} 
        />
        <NavItem 
          icon={<PieChart className="h-5 w-5" />} 
          label="Reports" 
          active={activeTab === "reports"} 
          onClick={() => handleNav("reports")} 
        />
      </div>

      <div className="mt-auto w-full">
        <NavItem 
          icon={<Settings className="h-5 w-5" />} 
          label="Settings" 
          active={false} 
          onClick={() => {}} 
        />
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center w-full p-2.5 rounded-xl transition-all duration-200 group/item overflow-hidden ${
        active 
          ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <div className="flex-shrink-0 flex items-center justify-center">
        {icon}
      </div>
      <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        {label}
      </span>
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
      )}
    </button>
  );
}
