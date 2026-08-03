'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PremiumDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
}

export const PremiumDrawer: React.FC<PremiumDrawerProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children,
  width = '3xl'
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

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 print:static print:p-0 print:block print:w-full print:min-h-0 print:h-auto print:overflow-visible">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-xs print:hidden" 
            onClick={onClose} 
          />
          
          {/* Modal / Drawer Container */}
          <motion.div 
            initial={{ scale: 0.98, opacity: 0, y: 4 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`relative w-full ${widthClasses[width]} max-h-[90vh] bg-white border border-zinc-200 rounded-lg flex flex-col overflow-hidden z-10 shadow-modal print:static print:max-h-none print:h-auto print:w-full print:max-w-none print:shadow-none print:border-none print:bg-white print:text-black print:overflow-visible print:rounded-none`}
          >
            {/* Top Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-200 flex justify-between items-center bg-white hide-on-print print:hidden">
              <div>
                <h2 className="text-section-title font-bold text-zinc-900 tracking-tight flex items-center gap-3">
                  {title}
                </h2>
                {subtitle && <p className="text-caption text-zinc-500 mt-0.5">{subtitle}</p>}
              </div>
              
              <button 
                onClick={onClose}
                className="w-7 h-7 rounded-md hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto hide-scrollbar bg-white p-6 print:overflow-visible print:h-auto print:min-h-0 print:static print:p-0">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(drawerContent, document.body);
};
