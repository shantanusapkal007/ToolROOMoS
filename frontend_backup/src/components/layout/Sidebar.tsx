"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, Briefcase, Database, Settings, LogOut, 
  User as UserIcon, Search
} from "lucide-react";
import { useAuth } from '../auth/AuthProvider';

const NAV_ITEMS = [
  { href: '/', icon: <Layers />, label: 'Mission Control', color: 'text-[var(--color-info)]' },
  { href: '/projects', icon: <Briefcase />, label: 'Projects', color: 'text-[var(--color-brand)]' },
];

const SYSTEM_ITEMS = [
  { href: '/master-data', icon: <Database />, label: 'Master Data', color: 'text-[var(--text-secondary)]' },
  { href: '/settings', icon: <Settings />, label: 'Settings', color: 'text-[var(--text-secondary)]' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: isHovered ? 240 : 64 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-50 bg-[var(--bg-primary)] flex flex-col shrink-0 h-full border-r border-[var(--border-500)]"
    >
      {/* Subtle ambient edge glow */}
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-[var(--color-brand)]/10 via-transparent to-[var(--color-info)]/10 pointer-events-none" />
      
      <div className="flex-1 flex flex-col h-full w-full py-4 px-2.5 overflow-y-auto hide-scrollbar relative z-10">
        
        {/* Logo */}
        <Link href="/" className="flex items-center w-full mb-8 cursor-pointer shrink-0 group px-1">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-brand)]/20 to-[var(--color-info)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20"
          >
            <Layers className="h-4.5 w-4.5" />
          </motion.div>

          <AnimatePresence>
            {isHovered && (
              <motion.div 
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="ml-3 whitespace-nowrap overflow-hidden"
              >
                <span className="text-h4 font-semibold tracking-tight text-[var(--text-primary)]">
                  ToolRoom<span className="text-[var(--color-brand)]">OS</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Search */}
        <div className="mb-4 px-0.5">
          <button 
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="w-full flex items-center px-2.5 py-2 rounded-lg bg-[var(--hover-600)] hover:bg-[var(--hover-600)] border border-[var(--border-500)] hover:border-[var(--color-brand)]/50 transition-all duration-200 group/search"
            aria-label="Search Command Palette"
          >
            <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover/search:text-[var(--text-primary)] shrink-0 transition-colors" />
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center justify-between flex-1 ml-2.5 overflow-hidden"
                >
                  <span className="text-body text-[var(--text-secondary)] font-medium whitespace-nowrap">Search...</span>
                  <kbd className="bg-[var(--bg-panel)] text-[var(--text-secondary)] text-micro px-1.5 py-0.5 rounded font-mono border border-[var(--border-500)] ml-4 shrink-0">⌘K</kbd>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Primary Nav */}
        <div className="flex flex-col gap-0.5 w-full flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <NavItem 
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                color={item.color}
                active={isActive}
                isExpanded={isHovered}
              />
            );
          })}

          {/* System section pushed to bottom */}
          <div className="mt-auto pt-4 border-t border-[var(--border-500)] flex flex-col gap-0.5">
            {SYSTEM_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <NavItem 
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  color={item.color}
                  active={isActive}
                  isExpanded={isHovered}
                />
              );
            })}
          </div>
        </div>

        {/* User Profile */}
        {user && (
          <div className="mt-4 pt-3 border-t border-[var(--border-500)] w-full flex items-center shrink-0 px-0.5">
            <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-500)] flex items-center justify-center overflow-hidden">
              <UserIcon className="h-4 w-4 text-[var(--text-secondary)]" />
            </div>
            
            <AnimatePresence>
              {isHovered && (
                <motion.div 
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="ml-2.5 flex-1 flex items-center justify-between overflow-hidden"
                >
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="text-body font-medium text-[var(--text-primary)] truncate">{user.name}</span>
                    <span className="text-caption text-[var(--text-tertiary)] truncate">{user.role}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={logout}
                    className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-md transition-colors"
                    aria-label="Log Out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
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
  href, icon, label, color, active, isExpanded 
}: { 
  href: string; icon: React.ReactNode; label: string; color: string; active: boolean; isExpanded: boolean;
}) {
  return (
    <Link href={href} className="w-full relative group block px-0.5">
      {/* Active glow background */}
      {active && (
        <motion.div 
          layoutId="sidebarActive"
          className="absolute inset-0 rounded-lg bg-[var(--hover-600)] pointer-events-none"
          initial={false}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      
      <div className={`relative z-10 flex items-center h-10 px-2.5 rounded-lg transition-all duration-200 ${
        active 
          ? 'text-[var(--text-primary)]' 
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-600)]'
      }`}>
        <div className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200 ${
          active ? `${color} bg-[var(--hover-600)]` : 'group-hover:bg-[var(--hover-600)]'
        }`}>
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4' })}
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="ml-2.5 whitespace-nowrap text-body font-medium"
            >
              {label}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Collapsed active dot */}
        {!isExpanded && active && (
          <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-[3px] h-3.5 rounded-full bg-[var(--color-brand)] shadow-[var(--shadow-glow)]" />
        )}
      </div>
    </Link>
  );
}
