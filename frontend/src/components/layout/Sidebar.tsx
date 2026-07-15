"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Briefcase, Database, Layers, PieChart, Settings, LogOut, User as UserIcon, Package, Wrench } from "lucide-react";
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
      animate={{ width: isHovered ? "17rem" : "4.5rem" }}
      transition={springConfig}
      className="fixed left-3 top-3 bottom-3 z-50 glass-sidebar flex flex-col group/sidebar transition-colors hover:border-black/20 hide-on-print"
    >
      {/* Ambient Inner Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="flex-1 flex flex-col h-full w-full py-5 px-3 overflow-y-auto hide-scrollbar relative z-10">
        
        {/* Logo Area */}
        <Link href="/" className="flex items-center w-full mb-10 cursor-pointer shrink-0 group">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 text-blue-600 border border-black/5 shadow-elevation group-hover:shadow-elevation transition-shadow duration-300 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
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
                <span className="text-title tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 bg-clip-text text-transparent">
                  ToolRoom<span className="text-blue-600">OS</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Nav Links */}
        <div className="flex flex-col gap-2 w-full flex-1">
          <NavItem 
            href="/"
            icon={<Command className="h-5 w-5 text-blue-600" />} 
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
          <NavItem 
            href="/inventory"
            icon={<Package className="h-5 w-5" />} 
            label="Inventory Ledger" 
            active={pathname.startsWith("/inventory")} 
            isExpanded={isHovered}
          />
          <NavItem 
            href="/maintenance"
            icon={<Wrench className="h-5 w-5" />} 
            label="Maintenance" 
            active={pathname.startsWith("/maintenance")} 
            isExpanded={isHovered}
          />
          
          <div className="mt-auto mb-2 pt-6 border-t border-black/5">
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
          <div className="mt-4 pt-4 border-t border-black/5 w-full flex items-center shrink-0">
            <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-zinc-100 border border-black/5 flex items-center justify-center overflow-hidden">
              <UserIcon className="h-5 w-5 text-zinc-500" />
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
                    <span className="text-body font-medium text-zinc-900 truncate">{user.name}</span>
                    <span className="text-micro text-zinc-500 truncate">{user.role}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, color: '#ef4444' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={logout}
                    className="p-2 text-zinc-500 hover:bg-black/5 rounded-lg transition-colors"
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
          className="absolute inset-0 bg-black/[0.04] border border-black/[0.05] rounded-xl pointer-events-none shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-black/[0.02] to-transparent opacity-50 blur-lg"></div>
        </motion.div>
      )}
      
      <div className={`relative z-10 flex items-center h-12 px-3 rounded-xl transition-all duration-300 group-hover:scale-[1.02] ${
        active 
          ? 'text-zinc-900' 
          : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.02]'
      }`}>
        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ${active ? 'bg-black/5 text-zinc-900 shadow-elevation' : 'group-hover:bg-black/5'}`}>
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
          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-zinc-50 rounded-full shadow-elevation" />
        )}
      </div>
    </Link>
  );
}
