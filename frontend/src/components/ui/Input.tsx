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
          <label className="block text-[11px] font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-white/70 backdrop-blur-xl border px-4 py-2.5 text-zinc-900 placeholder-zinc-500 rounded-xl
              shadow-[0_2px_4px_rgba(15,15,20,0.02)]
              focus:outline-none focus:ring-0 focus:bg-white
              focus:border-blue-500/40 focus:shadow-elevation
              hover:bg-white/90 hover:border-black/20 hover:shadow-elevation
              transition-all duration-300 ease-out
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-500/50 focus:border-red-500' : 'border-black/10'}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${className}
            `}
            disabled={props.disabled}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
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
