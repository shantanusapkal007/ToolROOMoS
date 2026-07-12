import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full relative group/input">
        {label && (
          <label className="block text-caption font-medium text-[var(--text-secondary)] mb-[var(--space-1)] tracking-wide group-focus-within/input:text-[var(--color-brand)] transition-colors">
            {label} {props.required && <span className="text-[var(--color-brand)]">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-[var(--space-1-5)] flex items-center pointer-events-none text-[var(--text-tertiary)] group-focus-within/input:text-[var(--color-brand)] transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border-500)] rounded-[var(--radius-md)] px-[var(--space-1-5)] py-[var(--space-1)] text-body font-medium text-[var(--text-primary)] placeholder-[var(--text-tertiary)]
              shadow-[var(--shadow-elevation)]
              focus:outline-none focus:bg-[var(--bg-panel)] focus:ring-1 focus:ring-[var(--shadow-focus)] focus:border-[var(--color-brand)]
              hover:bg-[var(--hover-600)] hover:border-[var(--color-brand)]/50 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]/50' : ''}
              ${leftIcon ? 'pl-[var(--space-4)]' : ''}
              ${rightIcon ? 'pr-[var(--space-4)]' : ''}
              ${className}
            `}
            disabled={props.disabled}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-[var(--space-1-5)] flex items-center pointer-events-none text-[var(--text-tertiary)] group-focus-within/input:text-[var(--color-brand)] transition-colors">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-[var(--space-05)] text-micro font-medium text-[var(--color-error)] tracking-wide">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
