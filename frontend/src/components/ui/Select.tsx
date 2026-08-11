import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  helperText?: string;
  creatable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  containerClassName?: string;
}

/**
 * Select Component matching ToolRoomOS Design System:
 * - Shared height tokens (`sm`: 36px / `h-9`, `md`: 40px / `h-10`), `rounded-[10px]` border radius.
 * - Interactive states: hover, focus-visible, and animated rotating chevron indicator on focus/open.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options = [],
      error,
      helperText,
      creatable = false,
      size = 'sm',
      className = '',
      containerClassName = '',
      children,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const sizeStyles = {
      sm: 'h-9 text-body-sm px-3 pr-9',
      md: 'h-10 text-body-sm px-4 pr-10',
      lg: 'h-12 text-body-md px-4 pr-10',
    };

    return (
      <div className={`w-full flex flex-col ${containerClassName}`}>
        {label && (
          <label htmlFor={selectId} className="block text-caption font-medium text-ink mb-1.5">
            {label} {required && <span className="text-semantic-danger">*</span>}
          </label>
        )}

        <div className="relative flex items-center group">
          <select
            ref={ref}
            id={selectId}
            required={required}
            disabled={disabled}
            className={`peer w-full bg-white border ${
              error
                ? 'border-semantic-danger focus:border-semantic-danger focus:ring-semantic-danger/20'
                : 'border-border-gray hover:border-cool-gray/50 focus:border-primary focus:ring-primary/20'
            } text-ink rounded-[10px] appearance-none transition-all duration-150 focus:outline-none focus:ring-2 cursor-pointer shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed ${
              sizeStyles[size] || sizeStyles.sm
            } ${className}`}
            {...props}
          >
            {children || (
              <>
                <option value="" disabled>
                  Select option...
                </option>
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
                {creatable && (
                  <option value="CREATE_NEW" className="text-primary font-semibold">
                    + Add New Option...
                  </option>
                )}
              </>
            )}
          </select>

          {/* Rotating Chevron Icon Indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-silver-blue peer-hover:text-ink peer-focus:text-primary transition-colors">
            <ChevronDown className="w-4 h-4 transition-transform duration-200 ease-in-out peer-focus:rotate-180" />
          </div>
        </div>

        {error && <p className="mt-1 text-xs text-semantic-danger">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-silver-blue">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
