"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  actions?: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  breadcrumbs, 
  actions,
  status = 'neutral'
}) => {
  
  const statusColors = {
    success: 'bg-emerald-500 shadow-elevation',
    warning: 'bg-amber-500 shadow-elevation',
    error: 'bg-red-500 shadow-elevation',
    info: 'bg-blue-500 shadow-elevation',
    neutral: 'bg-zinc-500 shadow-elevation',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel p-6 mb-6 flex flex-col md:flex-row md:items-end justify-between relative overflow-hidden group"
    >
      {/* Subtle Interactive Lighting */}
      <div className="absolute top-[-50%] left-[-10%] w-[50%] h-[200%] bg-blue-500/6 blur-[120px] pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />
      <div className="absolute bottom-[-50%] right-[-10%] w-[40%] h-[150%] bg-purple-500/6 blur-[120px] pointer-events-none transition-opacity duration-700 opacity-30 group-hover:opacity-80" />

      <div className="relative z-10 flex items-start gap-6">
        
        {/* Status Indicator */}
        <div className="mt-3 flex-shrink-0">
          <div className="relative flex h-3 w-3">
            {status !== 'neutral' && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusColors[status].split(' ')[0]}`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${statusColors[status]}`}></span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex items-center text-micro text-zinc-500 mb-1"
            >
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={idx}>
                  <motion.button 
                    whileHover={{ scale: 1.05, color: '#fff' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={bc.onClick}
                    className={`transition-colors duration-200 ${bc.onClick ? 'cursor-pointer hover:text-zinc-900' : 'text-blue-600 font-bold'}`}
                    disabled={!bc.onClick}
                  >
                    {bc.label}
                  </motion.button>
                  {idx < breadcrumbs.length - 1 && (
                    <ChevronRight className="w-3 h-3 mx-2 opacity-50" />
                  )}
                </React.Fragment>
              ))}
            </motion.div>
          )}
          
          {/* Typography */}
          <div className="flex flex-col">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 m-0"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="text-body text-zinc-500 mt-2 max-w-2xl"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      {actions && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-8 md:mt-0 flex items-center gap-4 relative z-10"
        >
          {actions}
        </motion.div>
      )}
    </motion.div>
  );
};
