import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'subtle' | 'gray' | 'white' | 'ghost' | 'danger' | 'text-arrow' | 'icon-circular';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Button component matching Design_System.md (Kraken theme):
 * - Primary Purple: bg #7132f5, text #ffffff, padding 13px 16px, radius 12px
 * - Purple Outlined: bg #ffffff, text #5741d8, border 1px solid #5741d8, radius 12px
 * - Purple Subtle: bg rgba(133,91,251,0.16), text #7132f5, padding 8px, radius 12px
 * - White Button: bg #ffffff, text #101114, radius 10px, shadow rgba(0,0,0,0.03) 0px 4px 24px
 * - Secondary Gray: bg rgba(148,151,169,0.08), text #101114, radius 12px
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    // Variant mapping
    const variantStyles: Record<string, string> = {
      // 1. Primary Purple
      primary: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-deep rounded-[12px]',
      
      // 2. Purple Outlined
      outlined: 'bg-white text-primary-dark border border-primary-dark hover:bg-primary-subtle/50 active:bg-primary-subtle rounded-[12px]',
      
      // 3. Purple Subtle
      subtle: 'bg-primary-subtle text-primary hover:bg-[rgba(133,91,251,0.24)] rounded-[12px]',
      
      // 4. White Button / Secondary Default
      white: 'bg-white text-ink border border-border-gray hover:border-cool-gray/40 rounded-[10px] shadow-subtle',
      secondary: 'bg-white text-ink border border-border-gray hover:border-cool-gray/40 rounded-[10px] shadow-subtle',
      
      // 5. Secondary Gray
      gray: 'bg-[rgba(148,151,169,0.08)] text-ink hover:bg-[rgba(148,151,169,0.16)] rounded-[12px]',
      
      // Supporting variants
      ghost: 'bg-transparent text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)] rounded-[12px]',
      danger: 'bg-accent-red text-white hover:bg-red-700 rounded-[12px]',
      'text-arrow': 'bg-transparent text-ink hover:text-primary p-0 border-0',
      'icon-circular': 'bg-white text-ink border border-border-gray hover:bg-[rgba(148,151,169,0.08)] rounded-full',
    };

    // Size mapping
    const sizeStyles: Record<string, string> = {
      sm: 'text-caption py-2 px-3 gap-1.5',
      md: 'text-body-medium py-[13px] px-4 gap-2',
      lg: 'text-body-lg py-4 px-6 gap-2.5',
      icon: 'p-2 aspect-square',
    };

    const appliedVariant = variantStyles[variant] || variantStyles.primary;
    const appliedSize = variant === 'text-arrow' ? 'py-2 px-0 gap-2' : sizeStyles[size] || sizeStyles.md;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${appliedVariant} ${appliedSize} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin text-current shrink-0" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
