"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Briefcase, Database, Layers, PieChart, Settings, LogOut, User as UserIcon, Package, Wrench, FileText, CreditCard, Sliders, ClipboardList, ShoppingCart, DollarSign } from "lucide-react";
import { useAuth } from '../auth/AuthProvider';
import { usePermissions } from '../auth/PermissionProvider';
import { useDensityStore } from '../../store/useDensityStore';


export function Sidebar() {
  const { user, logout } = useAuth();
  const { canViewModule, isAdmin } = usePermissions();
  const { density, cycleDensity } = useDensityStore();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  // Fast 100ms motion without spring bounce
  const motionConfig = { duration: 0.1, ease: "easeInOut" } as const;

  return (
    <motion.aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: isHovered ? "14rem" : "4rem" }}
      transition={motionConfig}
      className="fixed left-0 top-0 bottom-0 z-50 bg-white border-r border-zinc-200 flex flex-col hide-on-print shadow-[1px_0_3px_rgba(0,0,0,0.02)]"
    >
      <div className="flex-1 flex flex-col h-full w-full py-4 px-2 overflow-y-auto hide-scrollbar relative">
        
        {/* Logo Area */}
        <Link href="/" className="flex items-center w-full mb-6 cursor-pointer shrink-0 px-1 group">
          <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs">
            <Layers className="h-4 w-4" />
          </div>

          <AnimatePresence>
            {isHovered && (
              <motion.div 
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.1 }}
                className="ml-3 whitespace-nowrap overflow-hidden"
              >
                <span className="text-card-title tracking-tight text-zinc-900 font-bold">
                  ToolRoom<span className="text-blue-600">OS</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Nav Links */}
        <div className="flex flex-col gap-1 w-full flex-1">
          <NavItem 
            href="/"
            icon={<Command className="h-4 w-4 text-blue-600" />} 
            label="Dashboard" 
            active={pathname === "/"} 
            isExpanded={isHovered}
          />
          <NavItem 
            href="/projects"
            icon={<Briefcase className="h-4 w-4 text-zinc-600" />} 
            label="Projects" 
            active={pathname.startsWith("/projects")} 
            isExpanded={isHovered}
          />
          <NavItem 
            href="/employee-daily-report"
            icon={<ClipboardList className="h-4 w-4 text-indigo-600" />} 
            label="Daily Reports" 
            active={pathname.startsWith("/employee-daily-report")} 
            isExpanded={isHovered}
          />
          <NavItem 
            href="/master-data"
            icon={<Database className="h-4 w-4 text-zinc-600" />} 
            label="Master Data" 
            active={pathname.startsWith("/master-data")} 
            isExpanded={isHovered}
          />
          <NavItem 
            href="/assets"
            icon={<Package className="h-4 w-4 text-emerald-600" />} 
            label="Inventory" 
            active={pathname.startsWith("/assets") || pathname.startsWith("/inventory")} 
            isExpanded={isHovered}
          />
          <NavItem 
            href="/purchase-orders"
            icon={<ShoppingCart className="h-4 w-4 text-amber-500" />} 
            label="Purchase Orders" 
            active={pathname.startsWith("/purchase-orders")} 
            isExpanded={isHovered}
          />
          <NavItem 
            href="/maintenance"
            icon={<Wrench className="h-4 w-4 text-amber-600" />} 
            label="Maintenance" 
            active={pathname.startsWith("/maintenance")} 
            isExpanded={isHovered}
          />
          <NavItem 
            href="/reports"
            icon={<PieChart className="h-4 w-4 text-purple-600" />} 
            label="Reports" 
            active={pathname.startsWith("/reports")} 
            isExpanded={isHovered}
          />
          <NavItem 
            href="/finance"
            icon={<DollarSign className="h-4 w-4 text-emerald-600" />} 
            label="Finance & Payroll" 
            active={pathname.startsWith("/finance") || pathname.startsWith("/payroll")} 
            isExpanded={isHovered}
          />
          
          <div className="mt-auto mb-1 pt-3 border-t border-zinc-100 space-y-1">
            {/* Density Toggle Button */}
            <button
              onClick={cycleDensity}
              className="w-full flex items-center h-8 px-2 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors text-xs"
              title={`Density Mode: ${density.toUpperCase()}`}
            >
              <Sliders className="h-4 w-4 shrink-0 text-zinc-500" />
              {isHovered && (
                <span className="ml-3 text-caption font-medium capitalize truncate">
                  Density: {density}
                </span>
              )}
            </button>

            <NavItem 
              href="/activity-log"
              icon={<FileText className="h-4 w-4 text-zinc-600" />} 
              label="Activity Log" 
              active={pathname.startsWith("/activity-log")} 
              isExpanded={isHovered}
            />
            <NavItem 
              href="/settings"
              icon={<Settings className="h-4 w-4 text-zinc-600" />} 
              label="Settings" 
              active={pathname.startsWith("/settings")} 
              isExpanded={isHovered}
            />
          </div>
        </div>

        {/* User Profile */}
        {user && (
          <div className="mt-2 pt-3 border-t border-zinc-200 w-full flex items-center shrink-0">
            <div className="flex-shrink-0 h-8 w-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden">
              <UserIcon className="h-4 w-4 text-zinc-600" />
            </div>
            
            <AnimatePresence>
              {isHovered && (
                <motion.div 
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  className="ml-2 flex-1 flex items-center justify-between overflow-hidden"
                >
                  <div className="flex flex-col whitespace-nowrap overflow-hidden">
                    <span className="text-caption font-semibold text-zinc-900 truncate">{user.name}</span>
                    <span className="text-micro text-zinc-500 truncate">{user.role}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

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
    <Link href={href} className="w-full block">
      <div className={`flex items-center h-8 px-2 rounded-md transition-colors ${
        active 
          ? 'bg-zinc-900 text-white font-medium shadow-xs' 
          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
      }`}>
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { 
            className: active ? 'w-4 h-4 text-white' : 'w-4 h-4' 
          })}
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.1 }}
              className="ml-2.5 whitespace-nowrap flex-1 text-caption tracking-tight"
            >
              {label}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Link>
  );
}
