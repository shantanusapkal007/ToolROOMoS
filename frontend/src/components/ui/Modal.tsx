"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  footer, 
  maxWidth = 'md' 
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

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  // Apple Spring Configuration
  const spring = { type: "spring" as any, stiffness: 300, damping: 30 };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/40" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, y: 10, filter: "blur(4px)" }}
            transition={spring}
            className={`relative glass-modal w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] flex flex-col shadow-floating overflow-hidden`}
          >
            {/* Environmental Glow */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full" />
            
            <div className="flex justify-between items-start p-6 border-b border-white/5 shrink-0 relative z-10">
              <div>
                <h2 className="text-heading font-bold text-white tracking-tight">{title}</h2>
                {subtitle && <p className="text-body text-zinc-400 mt-1">{subtitle}</p>}
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-zinc-400 p-2 rounded-full transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 hide-scrollbar relative z-10">
              {children}
            </div>
            
            {footer && (
              <div className="p-6 border-t border-white/5 shrink-0 relative z-10 flex items-center justify-end gap-3 bg-black/20">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
