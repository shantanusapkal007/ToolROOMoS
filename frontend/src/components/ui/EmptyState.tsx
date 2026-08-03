import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = <PackageOpen className="h-10 w-10 text-blue-500" />, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-6 text-center w-full max-w-2xl mx-auto relative">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-gradient-to-tr from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-full blur-[80px] pointer-events-none z-0" />

      {/* Floating Icon Container */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative mb-10 z-10"
      >
        <motion.div 
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          {/* Outer Ring Glow */}
          <div className="absolute -inset-6 bg-gradient-to-b from-blue-400/20 to-transparent blur-xl rounded-full opacity-60" />
          
          {/* Glass Orb */}
          <div className="relative h-28 w-28 rounded-[2rem] bg-gradient-to-br from-white/80 to-white/30 border border-white/60 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08),inset_0_2px_4px_rgba(255,255,255,0.8)] backdrop-blur-xl flex items-center justify-center overflow-hidden">
            {/* Internal Highlight */}
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/60 rounded-full blur-xl opacity-50" />
            
            {/* The Icon */}
            {React.cloneElement(icon as React.ReactElement<{className?: string}>, { 
              className: 'h-12 w-12 text-blue-600 drop-shadow-sm z-10' 
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* Typography Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="z-10"
      >
        <h3 className="text-[2.25rem] font-bold text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 to-zinc-600 mb-4 tracking-tight drop-shadow-sm leading-tight">
          {title}
        </h3>
        <p className="text-lg text-zinc-500/90 max-w-md mx-auto mb-10 leading-relaxed font-medium">
          {description}
        </p>
      </motion.div>

      {/* Action Button */}
      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="z-10"
        >
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAction}
            className="group relative px-7 py-3.5 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-white font-bold text-base border border-zinc-700/80 shadow-[0_1px_3px_rgba(0,0,0,0.12),_inset_0_1px_0_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <span className="relative z-10">{actionLabel}</span>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};
