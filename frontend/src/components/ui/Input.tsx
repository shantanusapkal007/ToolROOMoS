import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Input component matching Design_System.md (Kraken theme):
 * - bg white, text ink (#101114), border border-gray (#dedee5), radius 10px, focus primary (#7132f5)
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-caption font-medium text-ink mb-1.5">
            {label} {required && <span className="text-accent-red">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-silver-blue">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={`w-full bg-white border ${
              error ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-border-gray hover:border-cool-gray/50 focus:border-primary focus:ring-primary/20'
            } text-ink placeholder:text-silver-blue text-body-sm rounded-[10px] px-4 py-2.5 transition-all focus:outline-none focus:ring-2 ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-silver-blue">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-accent-red">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-silver-blue">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
