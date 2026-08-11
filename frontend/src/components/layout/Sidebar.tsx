"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Boxes, 
  Briefcase, 
  Database, 
  Package, 
  Wrench, 
  DollarSign, 
  ShoppingCart, 
  Calendar,
  PieChart,
  ChevronLeft,
} from 'lucide-react';
import { useSidebarStore } from '../../store/useSidebarStore';

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 68;

const sidebarVariants = {
  expanded: {
    width: EXPANDED_WIDTH,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30, mass: 0.8 },
  },
  collapsed: {
    width: COLLAPSED_WIDTH,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30, mass: 0.8 },
  },
};

const labelVariants = {
  visible: { opacity: 1, x: 0, transition: { duration: 0.15, delay: 0.05 } },
  hidden: { opacity: 0, x: -8, transition: { duration: 0.1 } },
};

export function Sidebar() {
  const pathname = usePathname();
  const { isExpanded, toggleSidebar } = useSidebarStore();

  return (
    <motion.aside 
      initial={false}
      animate={isExpanded ? 'expanded' : 'collapsed'}
      variants={sidebarVariants}
      className="fixed left-0 top-0 bottom-0 z-40 bg-white border-r border-border-gray shadow-subtle flex flex-col justify-between p-3 select-none will-change-[width]"
    >
      {/* Top Section: Logo & Navigation */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Logo */}
        <Link 
          href="/" 
          className="flex items-center h-12 mb-3.5 shrink-0 overflow-hidden cursor-pointer rounded-[10px] hover:bg-[rgba(148,151,169,0.06)] transition-colors px-1 justify-start"
          title="ToolRoomOS"
        >
          {/* Permanent Icon - Never unmounts, zero flicker */}
          <div className="w-9 h-10 shrink-0 flex items-center justify-center">
            <img 
              src="/short_logo.png" 
              alt="ToolRoomOS Icon" 
              className="w-10 h-10 object-contain"
            />
          </div>

          {/* Smooth Wordmark Text Reveal */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="ml-2 font-bold text-[20px] tracking-tight text-[#7d849b] whitespace-nowrap overflow-hidden flex items-center select-none"
              >
                ToolRoom<span className="text-primary">OS</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto hide-scrollbar space-y-1">
          <NavItem 
            href="/" 
            icon={<Boxes className="h-4 w-4" />} 
            label="Command Center" 
            active={pathname === "/"} 
            isExpanded={isExpanded}
          />
          <NavItem 
            href="/projects" 
            icon={<Briefcase className="h-4 w-4" />} 
            label="Projects" 
            active={pathname.startsWith("/projects")} 
            isExpanded={isExpanded}
          />
          <NavItem 
            href="/employee-daily-report"
            icon={<Calendar className="h-4 w-4" />} 
            label="Daily Reports" 
            active={pathname.startsWith("/employee-daily-report")} 
            isExpanded={isExpanded}
          />
          <NavItem 
            href="/master-data"
            icon={<Database className="h-4 w-4" />} 
            label="Master Data" 
            active={pathname.startsWith("/master-data")} 
            isExpanded={isExpanded}
          />
          <NavItem 
            href="/assets"
            icon={<Package className="h-4 w-4" />} 
            label="Inventory & Assets" 
            active={pathname.startsWith("/assets") || pathname.startsWith("/inventory")} 
            isExpanded={isExpanded}
          />
          <NavItem 
            href="/purchase-orders"
            icon={<ShoppingCart className="h-4 w-4" />} 
            label="Purchase Orders" 
            active={pathname.startsWith("/purchase-orders")} 
            isExpanded={isExpanded}
          />
          <NavItem 
            href="/maintenance"
            icon={<Wrench className="h-4 w-4" />} 
            label="Maintenance" 
            active={pathname.startsWith("/maintenance")} 
            isExpanded={isExpanded}
          />
          <NavItem 
            href="/reports"
            icon={<PieChart className="h-4 w-4" />} 
            label="Reports & BI" 
            active={pathname.startsWith("/reports")} 
            isExpanded={isExpanded}
          />
          <NavItem 
            href="/finance"
            icon={<DollarSign className="h-4 w-4" />} 
            label="Finance & Payroll" 
            active={pathname.startsWith("/finance") || pathname.startsWith("/payroll")} 
            isExpanded={isExpanded}
          />
        </nav>
      </div>

      {/* Footer: Toggle + Version */}
      <div className="pt-2 border-t border-border-gray shrink-0 overflow-hidden space-y-1">
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="flex items-center w-full h-9 rounded-[10px] text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)] transition-colors cursor-pointer px-1 justify-start"
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <div className="w-9 h-9 shrink-0 flex items-center justify-center">
            <motion.div 
              className="w-4 h-4 flex items-center justify-center"
              animate={{ rotate: isExpanded ? 0 : 180 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <ChevronLeft className="w-4 h-4 text-silver-blue" />
            </motion.div>
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                variants={labelVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="ml-2.5 whitespace-nowrap overflow-hidden text-caption font-medium tracking-tight"
              >
                Collapse
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Version */}
        <div className="flex items-center h-8 px-1 justify-start">
          <div className="w-9 h-8 shrink-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-accent-green shrink-0" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                variants={labelVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="ml-2.5 text-[11px] font-mono text-silver-blue truncate"
              >
                v2.4.0 • Enterprise
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  isExpanded: boolean; 
}) {
  return (
    <Link href={href} className="w-full block" title={!isExpanded ? label : undefined}>
      <div className={`flex items-center h-9 rounded-[10px] transition-colors px-1 ${
        active 
          ? 'bg-primary text-white font-medium shadow-subtle' 
          : 'text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)]'
      }`}>
        <div className="w-9 h-9 shrink-0 flex items-center justify-center">
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { 
            className: active ? 'w-4 h-4 text-white' : 'w-4 h-4 text-silver-blue' 
          })}
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              variants={labelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="ml-2.5 whitespace-nowrap overflow-hidden flex-1 text-caption font-medium tracking-tight pr-2"
            >
              {label}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Link>
  );
}
