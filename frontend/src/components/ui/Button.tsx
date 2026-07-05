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
    primary: "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] border border-blue-500/50",
    secondary: "bg-zinc-800 text-white border border-white/10 hover:bg-zinc-700 shadow-elevation",
    glass: "glass-button text-white",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
    ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5",
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
      <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <span className="relative z-10 flex items-center gap-2">
        {isLoading ? (
          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
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
