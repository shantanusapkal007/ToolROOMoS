import React from 'react';

export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-hairline/60 rounded-xs animate-pulse ${className}`} />
  );
}

export function HeaderSkeleton() {
  return (
    <div className="h-[var(--size-header)] flex items-center justify-between px-8 border border-border-gray bg-canvas rounded-[12px] mb-6 shadow-subtle">
      <div className="flex items-center space-x-4">
        <SkeletonBox className="w-9 h-9 rounded-[10px]" />
        <div className="space-y-2">
          <SkeletonBox className="w-48 h-5" />
          <SkeletonBox className="w-32 h-3" />
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <SkeletonBox className="w-24 h-9 rounded-[10px]" />
        <SkeletonBox className="w-28 h-9 rounded-[10px]" />
      </div>
    </div>
  );
}

export function ToolbarSkeleton() {
  return (
    <div className="h-[var(--size-toolbar)] flex items-center justify-between px-4 bg-canvas border border-border-gray rounded-[10px] mb-6">
      <div className="flex items-center space-x-2">
        <SkeletonBox className="w-20 h-8 rounded-[10px]" />
        <SkeletonBox className="w-20 h-8 rounded-[10px]" />
        <SkeletonBox className="w-20 h-8 rounded-[10px]" />
      </div>
      <SkeletonBox className="w-48 h-8 rounded-[10px]" />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="w-full bg-canvas border border-border-gray rounded-[12px] overflow-hidden shadow-subtle">
      <div className="h-10 bg-canvas border-b border-border-gray flex items-center px-4 space-x-4">
        <SkeletonBox className="w-6 h-4" />
        <SkeletonBox className="w-32 h-4" />
        <SkeletonBox className="w-48 h-4" />
        <SkeletonBox className="w-24 h-4" />
        <SkeletonBox className="w-20 h-4" />
      </div>
      <div className="divide-y divide-hairline/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 flex items-center px-4 space-x-4">
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
        <div key={i} className="card-feature p-6 space-y-2">
          <SkeletonBox className="w-24 h-3" />
          <SkeletonBox className="w-36 h-7" />
          <SkeletonBox className="w-28 h-3" />
        </div>
      ))}
    </div>
  );
}

export const SkeletonLoader = TableSkeleton;
