'use client';

import React from 'react';
import { useForm, UseFormReturn, SubmitHandler, FieldValues, UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';

interface UniversalFormProps<T extends FieldValues> {
  schema: z.ZodType<any, any, any>;
  defaultValues?: UseFormProps<T>['defaultValues'];
  onSubmit: SubmitHandler<T>;
  children: (methods: UseFormReturn<T>) => React.ReactNode;
  className?: string;
}

export function UniversalForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className = '',
}: UniversalFormProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema) as any,
    defaultValues,
    mode: 'onBlur',
  });

  const { formState: { errors } } = methods;
  const errorCount = Object.keys(errors).length;

  return (
    <form onSubmit={methods.handleSubmit(onSubmit as any)} className={`flex flex-col gap-6 ${className}`}>
      {/* Validation Summary */}
      {errorCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
            <AlertCircle size={16} />
            Please fix the following {errorCount} error(s):
          </div>
          <ul className="text-red-300 text-xs list-disc pl-5">
            {Object.entries(errors).map(([key, error]: any) => (
              <li key={key}>{error?.message || 'Invalid field'}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {children(methods)}
      </div>
    </form>
  );
}
