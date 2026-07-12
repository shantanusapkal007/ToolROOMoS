'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertCircle, ChevronDown } from 'lucide-react';

interface Option {
  label: string;
  value: string | number;
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  label: string;
  options: Option[];
  hint?: string;
  required?: boolean;
}

export function FormSelect({
  name,
  label,
  options,
  hint,
  required,
  className = '',
  ...rest
}: FormSelectProps) {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={name} className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
        <span>{label} {required && <span className="text-red-400">*</span>}</span>
        {error && (
          <span className="text-[10px] text-red-400 flex items-center gap-1">
            <AlertCircle size={10} /> {error.message as string}
          </span>
        )}
      </label>
      
      <div className="relative">
        <select
          id={name}
          {...register(name)}
          className={`
            w-full px-3 py-1.5 pr-8 bg-black/40 border rounded-md text-sm text-zinc-100 
            appearance-none focus:outline-none transition-all cursor-pointer
            ${error 
              ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
              : 'border-white/10 hover:border-white/20 focus:border-blue-500 focus:bg-black/60 focus:shadow-[0_0_10px_rgba(59,130,246,0.15)]'
            }
          `}
          {...rest}
        >
          <option value="" disabled className="bg-zinc-900 text-zinc-500">Select an option...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-100">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
      </div>
      
      {hint && !error && (
        <span className="text-[10px] text-zinc-500">{hint}</span>
      )}
    </div>
  );
}
