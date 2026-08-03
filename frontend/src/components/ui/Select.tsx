import React from 'react';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  creatable?: boolean;
  children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, creatable = false, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full h-[var(--size-input)] bg-white border border-zinc-200 px-3.5 text-sm font-medium text-zinc-900 appearance-none rounded-lg shadow-2xs
              focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900
              hover:border-zinc-300
              transition-all cursor-pointer pr-9
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
              ${className}
            `}
            disabled={props.disabled}
            style={{ colorScheme: 'light' }}
            {...props}
          >
            {!props.children && (
              <option value="" disabled className="text-zinc-400">
                Select an option...
              </option>
            )}
            {creatable && (
              <option value="CREATE_NEW" className="text-blue-600 font-bold">
                + Add New...
              </option>
            )}
            {props.children ? (
              props.children
            ) : options ? (
              options.map(opt => (
                <option key={opt.value} value={opt.value} className="text-zinc-900">
                  {opt.label}
                </option>
              ))
            ) : null}
          </select>
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        {error && <p className="mt-1 text-micro font-semibold text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
