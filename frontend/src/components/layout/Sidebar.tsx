"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Briefcase, Database, Layers, PieChart, Settings, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from '../auth/AuthProvider';

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="fixed left-6 top-6 bottom-6 w-[80px] hover:w-72 bg-[#05070A]/80 hover:bg-[#05070A]/95 backdrop-blur-3xl border border-white/10 hover:border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col items-center hover:items-start group transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] z-50 overflow-hidden px-4 py-8 rounded-[32px]">
      
      {/* Logo Area */}
      <Link href="/" className="flex items-center w-full mb-12 overflow-hidden cursor-pointer px-1">
        <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 text-blue-400 border border-white/10 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
          <Layers className="h-6 w-6" />
        </div>
        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent ml-4 opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-[400ms] whitespace-nowrap">
          ToolRoom<span className="text-blue-400">OS</span>
        </span>
      </Link>

      {/* Nav Links */}
      <div className="flex flex-col space-y-3 w-full">
        <NavItem 
          href="/"
          icon={<Activity className="h-5 w-5" />} 
          label="Mission Control" 
          active={pathname === "/"} 
          activeColor="blue"
        />
        <NavItem 
          href="/projects"
          icon={<Briefcase className="h-5 w-5" />} 
          label="Projects" 
          active={pathname.startsWith("/projects")} 
          activeColor="purple"
        />
        <NavItem 
          href="/master-data"
          icon={<Database className="h-5 w-5" />} 
          label="Master Data" 
          active={pathname.startsWith("/master-data")} 
          activeColor="cyan"
        />
        <NavItem 
          href="/reports"
          icon={<PieChart className="h-5 w-5" />} 
          label="Reports" 
          active={pathname.startsWith("/reports")} 
          activeColor="emerald"
        />
      </div>

      <div className="mt-auto w-full space-y-4">
        <NavItem 
          href="/settings"
          icon={<Settings className="h-5 w-5" />} 
          label="Settings" 
          active={pathname === "/settings"} 
          activeColor="slate"
        />
        
        {/* User Info & Logout */}
        <div className="border-t border-white/10 pt-6 mt-4 relative">
          <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          {user && (
            <div className="flex items-center space-x-3 px-2 mb-6 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center p-[2px] flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <div className="w-full h-full bg-[#05070A] rounded-[10px] flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-[400ms] whitespace-nowrap">
                <p className="text-sm font-bold text-white tracking-wide">{user.name}</p>
                <p className="text-xs text-blue-400 font-medium tracking-wider">{user.role?.replace('_', ' ')}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 border border-transparent transition-all duration-300 group/item"
          >
            <div className="flex-shrink-0 flex items-center justify-center w-10">
              <LogOut className="h-5 w-5 group-hover/item:text-red-400 transition-colors" />
            </div>
            <span className="ml-2 font-semibold opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-[400ms] whitespace-nowrap group-hover/item:text-red-400">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, active, activeColor }: { href: string, icon: React.ReactNode, label: string, active: boolean, activeColor: string }) {
  
  const getActiveStyles = () => {
    switch (activeColor) {
      case 'blue': return 'bg-blue-600/15 text-blue-400 border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.15)]';
      case 'purple': return 'bg-purple-600/15 text-purple-400 border-purple-500/30 shadow-[0_0_20px_rgba(147,51,234,0.15)]';
      case 'cyan': return 'bg-cyan-600/15 text-cyan-400 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]';
      case 'emerald': return 'bg-emerald-600/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]';
      default: return 'bg-white/10 text-white border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]';
    }
  };

  const getGlowColor = () => {
    switch (activeColor) {
      case 'blue': return 'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,1)]';
      case 'purple': return 'bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,1)]';
      case 'cyan': return 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,1)]';
      case 'emerald': return 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]';
      default: return 'bg-white shadow-[0_0_12px_rgba(255,255,255,1)]';
    }
  };

  return (
    <Link
      href={href}
      className={`relative flex items-center w-full px-1 py-3 rounded-2xl transition-all duration-300 group/item overflow-hidden border ${
        active 
          ? getActiveStyles()
          : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <div className="flex-shrink-0 flex items-center justify-center w-10">
        {icon}
      </div>
      <span className={`ml-2 font-semibold opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-[400ms] whitespace-nowrap ${active ? 'tracking-wide' : ''}`}>
        {label}
      </span>
      {active && (
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full ${getGlowColor()}`}></div>
      )}
    </Link>
  );
}
