"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Briefcase, Database, Layers, PieChart, Settings, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from '../auth/AuthProvider';

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  // Apple Spring Physics
  const springConfig = { type: "spring", stiffness: 300, damping: 30 } as const;

  return (
    <motion.div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: isHovered ? 240 : 64 }}
      transition={springConfig}
      className="fixed left-3 top-3 bottom-3 z-50 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#050A14]/70 backdrop-blur-3xl overflow-hidden flex flex-col group/sidebar transition-colors hover:border-white/20 hover:bg-[#050A14]/80"
    >
      {/* Ambient Inner Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-screen" />
      <div className="flex-1 flex flex-col h-full w-full py-5 px-3 overflow-y-auto hide-scrollbar relative z-10">
        
        {/* Logo Area */}
        <Link href="/" className="flex items-center w-full mb-10 cursor-pointer shrink-0 group">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/20 text-blue-400 border border-white/10 shadow-[0_0_20px_rgba(37,99,235,0.3)] group-hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-shadow duration-300 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Layers className="h-5 w-5 relative z-10" />
          </motion.div>

          <AnimatePresence>
            {isHovered && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="ml-4 whitespace-nowrap overflow-hidden"
              >
                <span className="text-title tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  ToolRoom<span className="text-blue-400">OS</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Nav Links */}
        <div className="flex flex-col gap-2 w-full flex-1">
          <NavItem 
            href="/"
            icon={<Command className="h-5 w-5 text-blue-400" />} 
            label="Mission Control" 
            active={pathname === "/"} 
            isExpanded={isHovered}
          />
          <NavItem 
            href="/projects"
            icon={<Briefcase className="h-5 w-5" />} 
            label="Projects" 
            active={pathname.startsWith("/projects")} 
            isExpanded={isHovered}
          />
          <NavItem 
            href="/master-data"
            icon={<Database className="h-5 w-5" />} 
            label="Master Data" 
            active={pathname.startsWith("/master-data")} 
            isExpanded={isHovered}
          />
          <NavItem 
            href="/reports"
            icon={<PieChart className="h-5 w-5" />} 
            label="Reports" 
            active={pathname.startsWith("/reports")} 
            isExpanded={isHovered}
          />
          
          <div className="mt-auto mb-2 pt-6 border-t border-white/5">
            <NavItem 
              href="/settings"
              icon={<Settings className="h-5 w-5" />} 
              label="Settings" 
              active={pathname.startsWith("/settings")} 
              isExpanded={isHovered}
            />
          </div>
        </div>

        {/* User Profile Area */}
        {user && (
          <div className="mt-4 pt-4 border-t border-white/5 w-full flex items-center shrink-0">
            <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-zinc-800/50 border border-white/10 flex items-center justify-center overflow-hidden">
              <UserIcon className="h-5 w-5 text-zinc-400" />
            </div>
            
            <AnimatePresence>
              {isHovered && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="ml-3 flex-1 flex items-center justify-between overflow-hidden"
                >
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="text-body font-medium text-white truncate">{user.name}</span>
                    <span className="text-micro text-zinc-500 truncate">{user.role}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, color: '#ef4444' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={logout}
                    className="p-2 text-zinc-400 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --- NavItem Component ---

function NavItem({ 
  href, 
  icon, 
  label, 
  active, 
  isExpanded 
}: { 
  href: string, 
  icon: React.ReactNode, 
  label: string, 
  active: boolean, 
  isExpanded: boolean 
}) {
  return (
    <Link href={href} className="w-full relative group block">
      {/* Active Indicator Glow */}
      {active && (
        <motion.div 
          layoutId="activeNav"
          className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent border-l-2 border-blue-400 rounded-r-xl pointer-events-none shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-blue-500/10 to-transparent opacity-50 blur-lg"></div>
        </motion.div>
      )}
      
      <div className={`relative z-10 flex items-center h-12 px-3 rounded-xl transition-all duration-300 group-hover:scale-[1.02] ${
        active 
          ? 'text-white drop-shadow-md' 
          : 'text-zinc-400 hover:text-white hover:bg-white/5'
      }`}>
        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ${active ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 shadow-inner' : 'group-hover:bg-white/5'}`}>
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4' })}
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="ml-4 whitespace-nowrap flex-1 text-body font-medium"
            >
              {label}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Subtle Indicator dot for collapsed active state */}
        {!isExpanded && active && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        )}
      </div>
    </Link>
  );
}
