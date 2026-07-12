"use client";

import React from 'react';
import { ReportsModule } from '../../../../modules/reports/ReportsModule';

export default function ReportsTab({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const projectId = `PRJ-${resolvedParams.id.padStart(3, '0')}`;
  
  return <ReportsModule projectId={projectId} />;
}
