"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: 'primary' | 'secondary' | 'glass' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  magnetic?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  magnetic = true,
  icon,
  leftIcon,
  rightIcon,
  isLoading,
  ...props
}, ref) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Combine forwarded ref and local ref
  React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

  // Magnetic Effect State
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Apple-like Spring Config
  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!magnetic || !buttonRef.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    x.set((clientX - centerX) * 0.2);
    y.set((clientY - centerY) * 0.2);
  };

  const handleMouseLeave = () => {
    if (!magnetic) return;
    x.set(0);
    y.set(0);
  };

  // Base Class Mapping
  const baseClasses = "relative inline-flex items-center justify-center font-medium transition-all outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:pointer-events-none group overflow-hidden cursor-pointer";
  
  const sizeClasses = {
    sm: "px-4 py-2 text-micro rounded-lg",
    md: "px-6 py-3 text-caption rounded-xl",
    lg: "px-8 py-4 text-body rounded-2xl",
  };

  const variantClasses = {
    primary: "bg-[#0A0A0C] text-white shadow-[0_4px_14px_rgba(10,10,12,0.18)] hover:shadow-[0_6px_20px_rgba(10,10,12,0.26)] border border-[#0A0A0C]/90",
    secondary: "bg-white text-[#0A0A0C] border border-zinc-900/10 hover:bg-zinc-50 shadow-elevation",
    glass: "glass-button text-[#0A0A0C]",
    danger: "bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20",
    ghost: "bg-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50/5",
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {/* Interactive Hover Glow (Apple Style) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <span className="relative z-10 flex items-center gap-2">
        {isLoading ? (
          <div className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin"></div>
        ) : (icon || leftIcon) ? (
          <span className="flex-shrink-0">{icon || leftIcon}</span>
        ) : null}
        {children as React.ReactNode}
        {rightIcon && !isLoading && <span className="flex-shrink-0">{rightIcon}</span>}
      </span>
    </motion.button>
  );
});

Button.displayName = 'Button';
