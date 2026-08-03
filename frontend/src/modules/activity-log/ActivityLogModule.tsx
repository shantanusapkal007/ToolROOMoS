"use client";

import React from 'react';
import { TraceabilityMatrix } from './TraceabilityMatrix';

export function ActivityLogModule() {
  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
      <TraceabilityMatrix />
    </main>
  );
}

