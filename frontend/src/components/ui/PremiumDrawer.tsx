'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UniversalToolbar } from '../layout/UniversalToolbar';

export interface PremiumDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  showToolbar?: boolean;
}

export const PremiumDrawer: React.FC<PremiumDrawerProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children,
  width = '3xl',
  showToolbar = true
}) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const widthClasses = {
    md: 'w-[500px]',
    lg: 'w-[700px]',
    xl: 'w-[900px]',
    '2xl': 'w-[1100px]',
    '3xl': 'w-[1300px]',
    full: 'w-[95vw]',
  };

  // Apple-like Spring Configuration
  const spring = { type: "spring" as any, stiffness: 350, damping: 35 };

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/50" 
            onClick={onClose} 
          />
          
          {/* Drawer Container */}
          <motion.div 
            initial={{ x: '100%', opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.8 }}
            transition={spring}
            className={`relative h-full ${widthClasses[width]} bg-black/40 backdrop-blur-3xl shadow-[-20px_0_40px_rgba(0,0,0,0.8)] border-l border-white/[0.08] flex flex-col`}
          >
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-full h-[500px] bg-indigo-500/10 blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[150px] pointer-events-none" />

            {/* Header / Fixed Toolbar Area */}
            <div className="flex flex-col shrink-0 border-b border-white/[0.06] bg-black/40 backdrop-blur-xl relative z-20">
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white tracking-tight truncate">{title}</h2>
                  {subtitle && <p className="text-sm text-zinc-400 mt-0.5 truncate">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-4 ml-4">
                  {showToolbar && <UniversalToolbar />}
                  
                  <div className="w-px h-5 bg-white/10" />
                  
                  <motion.button 
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="text-zinc-400 hover:text-white p-2 rounded-full transition-colors focus:outline-none"
                    title="Close (Esc)"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 bg-transparent">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(drawerContent, document.body);
};
