import React from 'react';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white appearance-none
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer
            ${error ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-blue-500'}
            ${className}
          `}
          {...props}
        >
          <option value="" disabled className="bg-[#0B1018] text-slate-500">
            Select an option...
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#0B1018] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
