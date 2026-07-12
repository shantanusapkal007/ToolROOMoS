import React from 'react';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  creatable?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, creatable = false, ...props }, ref) => {
    return (
      <div className="w-full relative group/input">
        {label && (
          <label className="block text-caption font-medium text-[var(--text-secondary)] mb-[var(--space-1)] tracking-wide group-focus-within/input:text-[var(--color-brand)] transition-colors">
            {label} {props.required && <span className="text-[var(--color-brand)]">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border-500)] rounded-[var(--radius-md)] px-[var(--space-1-5)] py-[var(--space-1)] text-body font-medium text-[var(--text-primary)] appearance-none
              shadow-[var(--shadow-elevation)]
              focus:outline-none focus:bg-[var(--bg-panel)] focus:ring-[var(--shadow-focus)] focus:border-[var(--color-brand)]
              hover:bg-[var(--hover-600)] hover:border-[var(--color-brand)]/50 transition-all duration-[var(--motion-hover)] cursor-pointer pr-[var(--space-4)]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]/50' : ''}
              ${className}
            `}
            disabled={props.disabled}
            {...props}
          >
            <option value="" disabled className="bg-[var(--bg-surface)] text-[var(--text-tertiary)]">
              Select an option...
            </option>
            {creatable && (
              <option value="CREATE_NEW" className="bg-[var(--color-success)]/10 text-[var(--color-success)] font-bold">
                + Add New...
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-[var(--space-1-5)] flex items-center pointer-events-none text-[var(--text-tertiary)] group-focus-within/input:text-[var(--color-brand)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        {error && <p className="mt-[var(--space-05)] text-micro font-medium text-[var(--color-error)] tracking-wide">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
