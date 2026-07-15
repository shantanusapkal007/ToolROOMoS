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
          <label className="block text-[11px] font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full bg-white/70 backdrop-blur-xl border px-4 py-2.5 text-zinc-900 appearance-none rounded-xl
              shadow-[0_2px_4px_rgba(15,15,20,0.02)]
              focus:outline-none focus:ring-0 focus:bg-white
              focus:border-blue-500/40 focus:shadow-elevation
              hover:bg-white/90 hover:border-black/20 hover:shadow-elevation
              transition-all duration-300 ease-out cursor-pointer pr-10
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-500/50 focus:border-red-500' : 'border-black/10'}
              ${className}
            `}
            disabled={props.disabled}
            style={{ colorScheme: 'light' }}
            {...props}
          >
            {!props.children && (
              <option value="" disabled className="bg-[#F4F4F6] text-slate-500">
                Select an option...
              </option>
            )}
            {creatable && (
              <option value="CREATE_NEW" className="bg-blue-500/10 text-blue-400 font-bold">
                + Add New...
              </option>
            )}
            {props.children ? (
              props.children
            ) : options ? (
              options.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-[#FBFBFC] text-zinc-900">
                  {opt.label}
                </option>
              ))
            ) : null}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
