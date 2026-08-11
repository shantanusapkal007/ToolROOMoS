"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useSidebarStore } from '../../store/useSidebarStore';

interface AppLayoutProps {
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  noPadding?: boolean;
}

export function AppLayout({ 
  children, 
  maxWidth = 'max-w-[1440px]', 
  className = '', 
  noPadding = false 
}: AppLayoutProps) {
  const { isExpanded } = useSidebarStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden text-ink font-sans bg-canvas">
      <Sidebar />
      <motion.div 
        className="flex-1 h-full flex flex-col relative min-w-0 overflow-hidden"
        animate={{ paddingLeft: isExpanded ? 240 : 68 }}
        transition={{ type: 'spring' as const, stiffness: 300, damping: 30, mass: 0.8 }}
      >
        <TopBar />
        <main className={`flex-1 h-full overflow-y-auto min-h-0 ${noPadding ? '' : 'p-6'} ${className}`}>
          <div className={`w-full ${maxWidth} mx-auto h-full flex flex-col`}>
            {children}
          </div>
        </main>
      </motion.div>
    </div>
  );
}

