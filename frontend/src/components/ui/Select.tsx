import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  creatable?: boolean;
}

/**
 * Select component matching Design_System.md (Kraken theme):
 * - bg white, text ink (#101114), border border-gray (#dedee5), radius 10px, focus primary (#7132f5)
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options = [], error, creatable = false, className = '', children, id, required, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-caption font-medium text-ink mb-1.5">
            {label} {required && <span className="text-accent-red">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            className={`w-full bg-white border ${
              error ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-border-gray hover:border-cool-gray/50 focus:border-primary focus:ring-primary/20'
            } text-ink text-body-sm rounded-[10px] px-4 py-2.5 pr-10 appearance-none transition-all focus:outline-none focus:ring-2 cursor-pointer ${className}`}
            {...props}
          >
            {children || (
              <>
                <option value="" disabled>Select option...</option>
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
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-silver-blue">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-accent-red">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
