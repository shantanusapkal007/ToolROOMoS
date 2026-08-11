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
  ChevronRight,
} from 'lucide-react';
import { useSidebarStore } from '../../store/useSidebarStore';

export function Sidebar() {
  const pathname = usePathname();
  const { isExpanded, toggleSidebar } = useSidebarStore();

  return (
    <aside 
      className="fixed left-0 top-0 bottom-0 z-40 bg-white border-r border-border-gray transition-all duration-200 ease-out shadow-subtle flex flex-col justify-between p-3 select-none"
      style={{ width: isExpanded ? '240px' : '68px' }}
    >
      {/* Top Section: Logo & Navigation */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Wordmark */}
        <Link 
          href="/" 
          className={`flex items-center h-10 mb-4 shrink-0 overflow-hidden cursor-pointer rounded-[10px] hover:bg-[rgba(148,151,169,0.06)] transition-colors ${
            isExpanded ? 'px-2 justify-start' : 'px-0 justify-center'
          }`}
          title="ToolRoomOS"
        >
          <div className="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center text-white shrink-0 font-bold text-base shadow-subtle">
            T
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="ml-3 font-bold text-base tracking-tight text-ink whitespace-nowrap overflow-hidden"
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
          className={`flex items-center w-full h-9 rounded-[10px] text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)] transition-colors cursor-pointer ${
            isExpanded ? 'px-2.5 justify-start' : 'px-0 justify-center'
          }`}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {isExpanded 
              ? <ChevronLeft className="w-4 h-4 text-silver-blue" /> 
              : <ChevronRight className="w-4 h-4 text-silver-blue" />
            }
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.1 }}
                className="ml-3 whitespace-nowrap text-caption font-medium tracking-tight"
              >
                Collapse
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Version */}
        <div className={`flex items-center h-8 ${isExpanded ? 'px-2 justify-start' : 'px-0 justify-center'}`}>
          <div className="w-2 h-2 rounded-full bg-accent-green shrink-0" />
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                className="ml-3 text-[11px] font-mono text-silver-blue truncate"
              >
                v2.4.0 • Enterprise
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
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
      <div className={`flex items-center h-9 rounded-[10px] transition-colors ${
        isExpanded ? 'px-2.5 justify-start' : 'px-0 justify-center'
      } ${
        active 
          ? 'bg-primary text-white font-medium shadow-subtle' 
          : 'text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)]'
      }`}>
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { 
            className: active ? 'w-4 h-4 text-white' : 'w-4 h-4 text-silver-blue' 
          })}
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.1 }}
              className="ml-3 whitespace-nowrap flex-1 text-caption font-medium tracking-tight"
            >
              {label}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Link>
  );
}
