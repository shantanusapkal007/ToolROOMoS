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
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-white/[0.02] backdrop-blur-xl border px-4 py-2.5 text-white placeholder-slate-500 rounded-xl
              shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_2px_10px_rgba(0,0,0,0.2)]
              focus:outline-none focus:ring-0 focus:bg-white/[0.04]
              focus:border-indigo-500/40 focus:shadow-[0_0_25px_rgba(79,70,229,0.2),_inset_0_1px_1px_rgba(255,255,255,0.1)]
              hover:bg-white/[0.03] hover:border-white/10 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]
              transition-all duration-300 ease-out
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.06]'}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${className}
            `}
            disabled={props.disabled}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
