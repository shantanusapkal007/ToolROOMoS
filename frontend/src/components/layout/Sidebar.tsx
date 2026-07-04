"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Briefcase, Database, Layers, PieChart, Settings, LogOut, User as UserIcon, Users, ChevronRight, Menu } from "lucide-react";
import { useAuth } from '../auth/AuthProvider';

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed left-4 top-4 bottom-4 flex flex-col z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-[32px] overflow-hidden ${
        isHovered ? 'w-72 bg-[#0A0F1C]/95' : 'w-[80px] bg-[#0A0F1C]/80'
      } backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]`}
    >
      <div className="flex-1 flex flex-col h-full w-full py-8 px-4 overflow-y-auto hide-scrollbar">
        {/* Logo Area */}
        <Link href="/" className="flex items-center w-full mb-10 overflow-hidden cursor-pointer px-1 shrink-0">
          <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 text-blue-400 border border-white/10 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
            <Layers className="h-6 w-6" />
          </div>
          <div className={`ml-4 flex items-center transition-all duration-300 whitespace-nowrap ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ToolRoom<span className="text-blue-400">OS</span>
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="flex flex-col space-y-2 w-full flex-1">
          <NavItem 
            href="/"
            icon={<Activity className="h-5 w-5" />} 
            label="Mission Control" 
            active={pathname === "/"} 
            activeColor="blue"
            isExpanded={isHovered}
          />
          <NavItem 
            href="/projects"
            icon={<Briefcase className="h-5 w-5" />} 
            label="Projects" 
            active={pathname.startsWith("/projects")} 
            activeColor="purple"
            isExpanded={isHovered}
          />
          <NavItem 
            href="/master-data"
            icon={<Database className="h-5 w-5" />} 
            label="Master Data" 
            active={pathname.startsWith("/master-data")} 
            activeColor="cyan"
            isExpanded={isHovered}
          />
          <NavItem 
            href="/hr"
            icon={<Users className="h-5 w-5" />} 
            label="HR & Resources" 
            active={pathname.startsWith("/hr")} 
            activeColor="orange"
            isExpanded={isHovered}
          />
          <NavItem 
            href="/reports"
            icon={<PieChart className="h-5 w-5" />} 
            label="Reports" 
            active={pathname.startsWith("/reports")} 
            activeColor="emerald"
            isExpanded={isHovered}
          />
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto w-full pt-4 shrink-0">
          <NavItem 
            href="/settings"
            icon={<Settings className="h-5 w-5" />} 
            label="Settings" 
            active={pathname === "/settings"} 
            activeColor="slate"
            isExpanded={isHovered}
          />
          
          <div className="border-t border-white/10 pt-4 mt-4 w-full">
            {user && (
              <div className={`flex items-center space-x-3 px-2 mb-4 overflow-hidden transition-all duration-300 ${isHovered ? 'opacity-100 h-auto' : 'opacity-0 h-0'}`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center p-[2px] flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <div className="w-full h-full bg-[#05070A] rounded-[10px] flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 whitespace-nowrap">
                  <p className="text-sm font-bold text-white tracking-wide truncate">{user.name}</p>
                  <p className="text-xs text-blue-400 font-medium tracking-wider truncate">{user.role?.replace('_', ' ')}</p>
                </div>
              </div>
            )}
            
            <button
              onClick={logout}
              className={`w-full flex items-center p-3 rounded-2xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all duration-300 group ${!isHovered && 'justify-center'}`}
              title="Sign Out"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className={`ml-3 font-semibold whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 hidden'}`}>
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, active, activeColor, isExpanded }: { href: string, icon: React.ReactNode, label: string, active: boolean, activeColor: string, isExpanded: boolean }) {
  const getActiveStyles = () => {
    switch (activeColor) {
      case 'blue': return 'bg-blue-600/15 text-blue-400 border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.15)]';
      case 'purple': return 'bg-purple-600/15 text-purple-400 border-purple-500/30 shadow-[0_0_20px_rgba(147,51,234,0.15)]';
      case 'cyan': return 'bg-cyan-600/15 text-cyan-400 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]';
      case 'emerald': return 'bg-emerald-600/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]';
      case 'orange': return 'bg-orange-600/15 text-orange-400 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)]';
      default: return 'bg-white/10 text-white border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]';
    }
  };

  const getGlowColor = () => {
    switch (activeColor) {
      case 'blue': return 'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,1)]';
      case 'purple': return 'bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,1)]';
      case 'cyan': return 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,1)]';
      case 'emerald': return 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]';
      case 'orange': return 'bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,1)]';
      default: return 'bg-white shadow-[0_0_12px_rgba(255,255,255,1)]';
    }
  };

  return (
    <Link
      href={href}
      title={!isExpanded ? label : undefined}
      className={`relative flex items-center w-full p-3 rounded-2xl transition-all duration-300 group overflow-hidden border ${
        active 
          ? getActiveStyles()
          : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
      } ${!isExpanded ? 'justify-center' : ''}`}
    >
      <div className={`flex-shrink-0 flex items-center justify-center z-10 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      <div className={`ml-3 flex-1 flex items-center justify-between whitespace-nowrap transition-all duration-300 z-10 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 hidden'}`}>
        <span className={`font-semibold ${active ? 'tracking-wide' : ''}`}>
          {label}
        </span>
        {active && (
          <ChevronRight className="h-4 w-4 opacity-70" />
        )}
      </div>
      
      {/* Active Indicator Line */}
      {active && (
        <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full transition-all duration-300 ${getGlowColor()}`}></div>
      )}

      {/* Hover Background Glow */}
      {!active && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-in-out z-0"></div>
      )}
    </Link>
  );
}
