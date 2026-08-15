import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'icon-only'
  | 'iconOnly'
  | 'outlined'
  | 'subtle'
  | 'gray'
  | 'white'
  | 'ghost'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  'aria-label'?: string;
}

/**
 * Button Component — Formalized 3-tier hierarchy matching ToolRoomOS Design System:
 *
 * 1. Button/Primary (`primary`):
 *    - Solid purple fill (`bg-primary`), white text.
 *    - Reserved for the single most important action per view (e.g. "Open Daily Report Sheet").
 *    - Explicit states: hover (darker purple), active/pressed (deep purple + slight scale),
 *      focus-visible (2px purple offset ring), disabled (50% opacity), loading (spinner).
 *
 * 2. Button/Secondary (`secondary` | `outlined` | `white`):
 *    - Clean white surface, subtle border, dark ink text.
 *    - Used for all supporting actions (e.g. "Export CSV", "Inter-Section Transfer", "Reset Filters").
 *    - Explicit states: hover (neutral surface + border shift), active/pressed (scale),
 *      focus-visible (2px purple offset ring), disabled, loading.
 *
 * 3. Button/IconOnly (`icon-only` | `iconOnly`):
 *    - Square aspect ratio for universal, non-page-specific actions (e.g. notification bell, settings).
 *    - Enforces visible focus ring, hover feedback, active press feedback, and accessible `aria-label`.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      'aria-label': ariaLabel,
      title,
      ...props
    },
    ref
  ) => {
    // Base styles: 8pt alignment, robust focus-visible ring, disabled states
    const baseStyles =
      'inline-flex items-center justify-center font-medium whitespace-nowrap shrink-0 transition-all duration-150 ease-in-out ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none cursor-pointer rounded-[10px]';

    // Normalized variant
    const isIconOnly = variant === 'icon-only' || variant === 'iconOnly' || size === 'icon';

    // Variant mapping
    const variantStyles: Record<string, string> = {
      // 1. Primary Purple Fill
      primary:
        'bg-primary text-white hover:bg-primary-hover active:bg-primary-deep active:scale-[0.98] border border-transparent shadow-subtle',

      // 2. Secondary Outlined
      secondary:
        'bg-white text-ink border border-border-gray hover:border-cool-gray/50 hover:bg-[rgba(148,151,169,0.08)] active:bg-[rgba(148,151,169,0.16)] active:scale-[0.98] shadow-subtle',
      outlined:
        'bg-white text-primary border border-primary hover:bg-primary-subtle active:scale-[0.98] shadow-subtle',
      white:
        'bg-white text-ink border border-border-gray hover:border-cool-gray/50 hover:bg-[rgba(148,151,169,0.08)] active:bg-[rgba(148,151,169,0.16)] active:scale-[0.98] shadow-subtle',

      // 3. Icon Only
      'icon-only':
        'bg-white text-cool-gray hover:text-ink border border-border-gray hover:border-cool-gray/50 hover:bg-[rgba(148,151,169,0.08)] active:bg-[rgba(148,151,169,0.16)] active:scale-95 shadow-subtle aspect-square',
      iconOnly:
        'bg-white text-cool-gray hover:text-ink border border-border-gray hover:border-cool-gray/50 hover:bg-[rgba(148,151,169,0.08)] active:bg-[rgba(148,151,169,0.16)] active:scale-95 shadow-subtle aspect-square',

      // Supporting variants
      subtle:
        'bg-primary-subtle text-primary hover:bg-primary-subtle/80 active:bg-primary/20 active:scale-[0.98]',
      gray:
        'bg-[rgba(148,151,169,0.08)] text-ink hover:bg-[rgba(148,151,169,0.16)] active:scale-[0.98]',
      ghost:
        'bg-transparent text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)] active:scale-[0.98]',
      danger:
        'bg-semantic-danger text-white hover:bg-red-700 active:scale-[0.98] shadow-subtle',
    };

    // Size mapping (height aligned to 36px/40px/48px standard scale)
    const sizeStyles: Record<string, string> = {
      sm: isIconOnly ? 'h-9 w-9 p-0 text-caption' : 'h-9 px-3 text-caption gap-1.5',
      md: isIconOnly ? 'h-10 w-10 p-0 text-body-sm' : 'h-10 px-4 text-body-sm font-medium gap-2',
      lg: isIconOnly ? 'h-12 w-12 p-0 text-body-md' : 'h-12 px-6 text-body-md font-medium gap-2.5',
      icon: 'h-9 w-9 p-0 text-caption',
    };

    const appliedVariant = variantStyles[variant] || variantStyles.secondary;
    const appliedSize = sizeStyles[size] || sizeStyles.md;

    // Accessibility label
    const effectiveAriaLabel = ariaLabel || title || (typeof children === 'string' ? children : undefined);

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-label={effectiveAriaLabel}
        title={title || ariaLabel}
        className={`${baseStyles} ${appliedVariant} ${appliedSize} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
            {!isIconOnly && <span className="opacity-90">{children || 'Loading...'}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
