import React from 'react';

export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-zinc-200/70 rounded-md animate-pulse-subtle ${className}`} />
  );
}

export function HeaderSkeleton() {
  return (
    <div className="h-[var(--size-header)] flex items-center justify-between px-6 border-b border-zinc-200 bg-white">
      <div className="flex items-center space-x-3">
        <SkeletonBox className="w-8 h-8 rounded-lg" />
        <div className="space-y-1.5">
          <SkeletonBox className="w-48 h-5" />
          <SkeletonBox className="w-32 h-3" />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <SkeletonBox className="w-24 h-[var(--size-button-secondary)]" />
        <SkeletonBox className="w-28 h-[var(--size-button-primary)]" />
      </div>
    </div>
  );
}

export function ToolbarSkeleton() {
  return (
    <div className="h-[var(--size-toolbar)] flex items-center justify-between px-4 bg-zinc-50 border-b border-zinc-200">
      <div className="flex items-center space-x-2">
        <SkeletonBox className="w-20 h-7" />
        <SkeletonBox className="w-20 h-7" />
        <SkeletonBox className="w-20 h-7" />
      </div>
      <SkeletonBox className="w-48 h-7" />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="w-full bg-white border border-zinc-200 rounded-lg overflow-hidden">
      <div className="h-9 bg-zinc-100 border-b border-zinc-200 flex items-center px-4 space-x-4">
        <SkeletonBox className="w-6 h-4" />
        <SkeletonBox className="w-32 h-4" />
        <SkeletonBox className="w-48 h-4" />
        <SkeletonBox className="w-24 h-4" />
        <SkeletonBox className="w-20 h-4" />
      </div>
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-9 flex items-center px-4 space-x-4">
            <SkeletonBox className="w-6 h-3" />
            <SkeletonBox className="w-32 h-3" />
            <SkeletonBox className="w-48 h-3" />
            <SkeletonBox className="w-24 h-3" />
            <SkeletonBox className="w-20 h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="enterprise-card p-4 space-y-2">
          <SkeletonBox className="w-24 h-3" />
          <SkeletonBox className="w-36 h-7" />
          <SkeletonBox className="w-28 h-3" />
        </div>
      ))}
    </div>
  );
}

export const SkeletonLoader = TableSkeleton;
