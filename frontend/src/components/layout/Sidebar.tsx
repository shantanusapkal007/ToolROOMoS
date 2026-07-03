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
    <div className="fixed left-6 top-6 bottom-6 w-[72px] hover:w-64 bg-[#0B1018]/60 hover:bg-[#0B1018]/90 backdrop-blur-xl border border-white/10 hover:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col items-center hover:items-start group transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] z-50 overflow-hidden px-3 py-6 rounded-3xl">
      {/* Logo Area */}
      <Link href="/" className="flex items-center w-full mb-10 overflow-hidden cursor-pointer">
        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <Layers className="h-5 w-5" />
        </div>
        <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent ml-4 opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] whitespace-nowrap">
          ToolRoomOS
        </span>
      </Link>

      {/* Nav Links */}
      <div className="flex flex-col space-y-4 w-full">
        <NavItem 
          href="/"
          icon={<Activity className="h-5 w-5" />} 
          label="Mission Control" 
          active={pathname === "/"} 
        />
        <NavItem 
          href="/projects"
          icon={<Briefcase className="h-5 w-5" />} 
          label="Projects" 
          active={pathname.startsWith("/projects")} 
        />
        <NavItem 
          href="/master-data"
          icon={<Database className="h-5 w-5" />} 
          label="Master Data" 
          active={pathname.startsWith("/master-data")} 
        />
        <NavItem 
          href="/reports"
          icon={<PieChart className="h-5 w-5" />} 
          label="Reports" 
          active={pathname.startsWith("/reports")} 
        />
      </div>

      <div className="mt-auto w-full space-y-4">
        <NavItem 
          href="/settings"
          icon={<Settings className="h-5 w-5" />} 
          label="Settings" 
          active={pathname === "/settings"} 
        />
        
        {/* User Info & Logout */}
        <div className="border-t border-white/5 pt-4">
          {user && (
            <div className="flex items-center space-x-3 px-2 mb-4 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center p-px flex-shrink-0">
                <div className="w-full h-full bg-[#0B1120] rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div className="flex-1 opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] whitespace-nowrap">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.role?.replace('_', ' ')}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center px-2.5 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors group/item"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="ml-4 font-medium opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] whitespace-nowrap">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link
      href={href}
      className={`relative flex items-center w-full p-2.5 rounded-xl transition-all duration-200 group/item overflow-hidden ${
        active 
          ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <div className="flex-shrink-0 flex items-center justify-center">
        {icon}
      </div>
      <span className="ml-4 font-medium opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] whitespace-nowrap">
        {label}
      </span>
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
      )}
    </Link>
  );
}
