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

  // Apple-like Spring Config (Overdamped to prevent bounce)
  const springConfig = { damping: 25, stiffness: 200, mass: 0.1 };
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
  const baseClasses = "relative inline-flex items-center justify-center font-medium transition-all outline-none focus:ring-[var(--shadow-focus)] disabled:opacity-50 disabled:pointer-events-none group overflow-hidden cursor-pointer";
  
  const sizeClasses = {
    sm: "px-[var(--space-1-5)] py-[var(--space-1)] text-caption rounded-[var(--radius-md)] gap-[var(--space-1)]",
    md: "px-[var(--space-2)] py-[var(--space-1)] text-body rounded-[var(--radius-md)] gap-[var(--space-1-5)]",
    lg: "px-[var(--space-3)] py-[var(--space-1-5)] text-body-large rounded-[var(--radius-lg)] gap-[var(--space-2)]",
  };

  const variantClasses = {
    primary: "bg-[var(--color-brand)] text-[var(--text-white)] hover:bg-[var(--color-brand-hover)] border border-[var(--color-brand)]/30 shadow-[var(--shadow-elevation)]",
    secondary: "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-500)] hover:bg-[var(--hover-600)] hover:text-[var(--text-primary)] shadow-[var(--shadow-elevation)]",
    glass: "glass-button text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
    danger: "bg-[var(--color-error)]/10 text-[var(--color-error)] hover:bg-[var(--color-error)]/20 border border-[var(--color-error)]/20 hover:border-[var(--color-error)]/40",
    ghost: "bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-600)]",
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
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
