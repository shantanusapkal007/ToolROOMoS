'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
}

export function FormTextarea({
  name,
  label,
  hint,
  required,
  className = '',
  rows = 3,
  ...rest
}: FormTextareaProps) {
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
      
      <textarea
        id={name}
        rows={rows}
        {...register(name)}
        className={`
          w-full px-3 py-1.5 bg-black/40 border rounded-md text-sm text-zinc-100 
          placeholder:text-zinc-600 focus:outline-none transition-all resize-y custom-scrollbar
          ${error 
            ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
            : 'border-white/10 hover:border-white/20 focus:border-blue-500 focus:bg-black/60 focus:shadow-[0_0_10px_rgba(59,130,246,0.15)]'
          }
        `}
        {...rest}
      />
      
      {hint && !error && (
        <span className="text-[10px] text-zinc-500">{hint}</span>
      )}
    </div>
  );
}
