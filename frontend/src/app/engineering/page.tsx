"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SkeletonBox } from '@/components/ui/SkeletonLoader';

export default function EngineeringRoot() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/engineering/bom');
  }, [router]);

  return (
    <div className="p-6 space-y-4">
      <SkeletonBox className="h-8 w-48" />
      <SkeletonBox className="h-64 w-full" />
    </div>
  );
}
