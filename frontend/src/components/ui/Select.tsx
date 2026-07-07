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
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full bg-[#050A14]/95 backdrop-blur-md border rounded-xl px-4 py-2.5 text-white appearance-none
              shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),_0_1px_0_rgba(255,255,255,0.05)]
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3),_inset_0_2px_4px_rgba(0,0,0,0.3)]
              focus:bg-[#050A14]
              hover:bg-[#050A14]/90 transition-all duration-300 cursor-pointer pr-10
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500/50 hover:border-white/20'}
              ${className}
            `}
            disabled={props.disabled}
            {...props}
          >
            <option value="" disabled className="bg-[#0B1018] text-slate-500">
              Select an option...
            </option>
            {creatable && (
              <option value="CREATE_NEW" className="bg-blue-500/10 text-blue-400 font-bold">
                + Add New...
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0B1018] text-white">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
