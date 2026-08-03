"use client";

import React, { useRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: 'primary' | 'secondary' | 'glass' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
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
  icon,
  leftIcon,
  rightIcon,
  isLoading,
  ...props
}, ref) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

  const baseClasses = "relative inline-flex items-center justify-center font-semibold tracking-tight transition-all outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer rounded-lg border shrink-0 shadow-2xs";
  
  const sizeClasses = {
    sm: "h-8 px-3 text-xs font-semibold",
    md: "h-[var(--size-button-secondary)] px-4 text-xs font-bold uppercase tracking-wider",
    lg: "h-[var(--size-button-primary)] px-5 text-sm font-bold uppercase tracking-wider",
  };

  const variantClasses = {
    primary: "bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900 shadow-xs",
    secondary: "bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-200 shadow-xs",
    glass: "bg-white hover:bg-zinc-50 text-zinc-900 border-zinc-200 shadow-xs",
    danger: "bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-xs",
    ghost: "bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent",
  };

  return (
    <motion.button
      ref={buttonRef}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      <span className="flex items-center gap-1.5">
        {isLoading ? (
          <div className="w-3.5 h-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin" />
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
