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
    md: 'max-w-[500px]',
    lg: 'max-w-[700px]',
    xl: 'max-w-[900px]',
    '2xl': 'max-w-[1100px]',
    '3xl': 'max-w-[1300px]',
    full: 'max-w-[95vw]',
  };

  // Apple-like Spring Configuration for Modal pop-in
  const spring = { type: "spring" as any, stiffness: 400, damping: 30 };

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          {/* Modal Container */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={spring}
            className={`relative w-full ${widthClasses[width]} max-h-[90vh] bg-[#0f1117] border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.1)] z-10`}
          >
            {/* Top Header matching MSDR */}
            <div className="flex-shrink-0 p-6 border-b border-white/5 bg-white/[0.01] flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-50"></div>
              <div className="relative">
                <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
                  {title}
                </h2>
                {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
              </div>
              
              <div className="flex items-center gap-4 ml-4 relative z-10">
                {showToolbar && <UniversalToolbar />}
                
                {showToolbar && <div className="w-px h-5 bg-white/10" />}
                
                <motion.button 
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors focus:outline-none"
                  title="Close (Esc)"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 bg-transparent p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(drawerContent, document.body);
};
