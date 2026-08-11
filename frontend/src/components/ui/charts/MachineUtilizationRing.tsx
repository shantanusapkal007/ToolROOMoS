"use client";

import React, { useState } from 'react';
import { Pie } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleOrdinal } from '@visx/scale';
import { useMasterData } from '../../../hooks/useMasterData';
import { colors } from '@/lib/tokens';

interface MachineData {
  status: string;
  count: number;
  glowHex: string;
}

interface Props {
  width: number;
  height: number;
}

export function MachineUtilizationRing({ width, height }: Props) {
  const { data: machines = [] } = useMasterData('machines');
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const runningCount = machines.filter((m: any) => m.status === 'RUNNING' || m.status === 'ACTIVE' || !m.status).length;
  const idleCount = machines.filter((m: any) => m.status === 'IDLE').length;
  const maintCount = machines.filter((m: any) => m.status === 'MAINTENANCE' || m.status === 'PM').length;
  const breakdownCount = machines.filter((m: any) => m.status === 'BREAKDOWN' || m.status === 'DOWN').length;

  const data: MachineData[] = [
    { status: 'Running', count: Math.max(runningCount, machines.length > 0 ? runningCount : 0), glowHex: colors['accent-green'] },
    { status: 'Idle', count: idleCount, glowHex: colors.mute },
    { status: 'Maintenance', count: maintCount, glowHex: colors['accent-orange'] },
    { status: 'Breakdown', count: breakdownCount, glowHex: colors['accent-red'] },
  ];

  const total = machines.length || data.reduce((acc, curr) => acc + curr.count, 0);

  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const radius = Math.min(innerWidth, innerHeight) / 2;
  const centerY = innerHeight / 2;
  const centerX = innerWidth / 2;

  const colorScale = scaleOrdinal<string, string>({
    domain: data.map(d => d.status),
    range: data.map(d => d.glowHex),
  });

  return (
    <div className="relative flex items-center justify-center">
      <svg width={width} height={height} className="relative z-10 overflow-visible">
        <Group top={centerY + margin.top} left={centerX + margin.left}>
          <Pie
            data={data}
            pieValue={d => d.count}
            outerRadius={radius}
            innerRadius={radius - 20}
            padAngle={0.04}
          >
            {pie => {
              return pie.arcs.map((arc, index) => {
                const { status } = arc.data;
                const isHovered = activeSegment === status;
                const arcPath = pie.path(arc) || '';

                return (
                  <g 
                    key={`arc-${status}-${index}`}
                    onMouseEnter={() => setActiveSegment(status)}
                    onMouseLeave={() => setActiveSegment(null)}
                    className="cursor-pointer transition-opacity duration-200"
                  >
                    <path
                      d={arcPath}
                      fill={colorScale(status)}
                      fillOpacity={isHovered ? 1 : 0.85}
                      stroke={colors.canvas}
                      strokeWidth={2}
                    />
                  </g>
                );
              });
            }}
          </Pie>
        </Group>
      </svg>

      {/* Center KPI Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
        <span className="text-display-md font-semibold tracking-tight text-ink">
          {activeSegment ? data.find(d => d.status === activeSegment)?.count : total}
        </span>
        <span className="text-eyebrow-uppercase-sm font-medium text-mute uppercase">
          {activeSegment || 'Total Machines'}
        </span>
      </div>
    </div>
  );
}
